import { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import { getMyProfile } from '../api/users';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { token, logout, getRole } = useAuthStore();
  const { count, fetchCount } = useCartStore();
  const navigate = useNavigate();
  const role = getRole();
  const dropdownRef = useRef(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (token && role === 'CUSTOMER') {
      fetchCount();
      getMyProfile()
        .then((res) => setProfile(res.data))
        .catch(() => {});
    }
  }, [token, role]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getInitials = () => {
    const name = profile?.name || '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.[0] || 'U').toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--primary)', fill: 'rgba(255, 107, 53, 0.1)', marginRight: '2px' }}>
            <path d="M2 17h20M12 4a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8zM12 2v2" />
          </svg>
          Food<span>Rush</span>
        </Link>

        <div className="nav-links">
          {(!token || role === 'CUSTOMER') && (
            <NavLink to="/restaurants" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
              <span className="hide-on-mobile">Restaurants</span>
            </NavLink>
          )}

          {!token && (
            <>
              <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Sign In</NavLink>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}

          {token && role === 'CUSTOMER' && (
            <>
              <NavLink to="/cart" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span className="hide-on-mobile">Cart</span>{count > 0 && <span className="cart-badge">{count}</span>}
              </NavLink>
              <NavLink to="/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span className="hide-on-mobile">My Orders</span>
              </NavLink>

              {/* Profile Avatar + Dropdown */}
              <div ref={dropdownRef} style={{ position: 'relative', marginLeft: '0.25rem' }}>
                <button
                  onClick={() => setShowDropdown((v) => !v)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '2px solid var(--border)',
                    background: profile?.profileImageUrl ? 'transparent' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    fontFamily: "'Outfit', sans-serif",
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    transition: 'var(--transition)',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {profile?.profileImageUrl ? (
                    <img
                      src={profile.profileImageUrl}
                      alt="Profile"
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    getInitials()
                  )}
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: 0,
                      width: '240px',
                      background: '#ffffff',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.12)',
                      zIndex: 150,
                      overflow: 'hidden',
                      animation: 'fadeIn 0.2s ease',
                    }}
                  >
                    {/* User Info Header */}
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', lineHeight: 1.3 }}>
                        {profile?.name || 'User'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {profile?.email || ''}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div style={{ padding: '0.4rem' }}>
                      <button
                        onClick={() => { setShowDropdown(false); navigate('/profile'); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          background: 'transparent',
                          color: '#334155',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          transition: 'var(--transition)',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 107, 53, 0.05)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155'; }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        My Profile
                      </button>

                      <button
                        onClick={() => { setShowDropdown(false); navigate('/orders'); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          background: 'transparent',
                          color: '#334155',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          transition: 'var(--transition)',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 107, 53, 0.05)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155'; }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        My Orders
                      </button>


                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', background: 'var(--border)', margin: '0 0.65rem' }} />

                    {/* Logout */}
                    <div style={{ padding: '0.4rem' }}>
                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          background: 'transparent',
                          color: 'var(--danger)',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          transition: 'var(--transition)',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {token && role === 'OWNER' && (
            <>
              <NavLink to="/owner/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 17V9l7 4-7 4z" />
                </svg>
                <span className="hide-on-mobile">Dashboard</span>
              </NavLink>
            </>
          )}

          {token && role === 'ADMIN' && (
            <>
              <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="hide-on-mobile">Admin</span>
              </NavLink>
            </>
          )}

          {/* Owner/Admin keep existing logout button */}
          {token && role !== 'CUSTOMER' && (
            <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ marginLeft: '0.25rem' }}>
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
