import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { listRestaurants } from '../api/restaurants';
import { getPopularItems } from '../api/menu';

const CATEGORY_ICONS = {
  PIZZA: '🍕', BURGER: '🍔', BIRIYANI: '🍚', RICE: '🍚',
  NOODLES: '🍝', PASTA: '🍝', DESSERT: '🍰', SWEETS: '🍰',
  DRINKS: '🥤', BEVERAGES: '🥤', SOUTH_INDIAN: '🥞', DOSA: '🥞',
  NORTH_INDIAN: '🍛', CURRY: '🍛', CHINESE: '🥟',
  SNACKS: '🍿', STARTERS: '🍿',
};

const categoryEmoji = (cat) => CATEGORY_ICONS[cat] || '🍽️';

export default function HomePage() {
  const { token, getRole } = useAuthStore();
  const role = getRole();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const [restaurants, setRestaurants] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, itemsRes] = await Promise.all([
          listRestaurants(0, 6),
          getPopularItems(),
        ]);
        setRestaurants(res.data.content || res.data);
        setPopularItems(itemsRes.data?.content || itemsRes.data || []);
      } catch (err) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const searchResults = (() => {
    if (!search.trim()) return { restaurants: [], items: [] };
    const q = search.toLowerCase();
    return {
      restaurants: restaurants.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.cuisineType?.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q)
      ),
      items: popularItems.filter(i =>
        i.name?.toLowerCase().includes(q) ||
        i.restaurantName?.toLowerCase().includes(q)
      ),
    };
  })();

  const hasResults = searchResults.restaurants.length > 0 || searchResults.items.length > 0;

  return (
    <div className="page" style={{ paddingTop: '76px' }}>
      {/* Hero Section */}
      <section style={{
        minHeight: '420px',
        background: '#13111c',
        display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden',
        padding: '3rem 0',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 90% 50%, rgba(255, 107, 53, 0.35) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div className="container" style={{ maxWidth: '1000px', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '620px' }}>
            <h1 style={{
              color: '#fff', fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
              fontWeight: 900, marginBottom: '0.75rem', lineHeight: 1.12,
              letterSpacing: '-0.03em',
            }}>
              Your favorite food,<br />
              <span style={{
                background: 'linear-gradient(135deg, #fb923c, #fbbf24)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>delivered fast</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', marginBottom: '1.75rem', lineHeight: 1.7, maxWidth: '480px' }}>
              Order from the best local restaurants with easy tracking — hot & fresh, right at your door.
            </p>
            {!token && (
              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                <Link to="/register" className="btn btn-primary btn-lg" style={{ borderRadius: '30px', fontSize: '0.95rem', padding: '0.7rem 1.8rem' }}>
                  Get Started
                </Link>
                <Link to="/restaurants" className="btn btn-lg" style={{
                  borderRadius: '30px', fontSize: '0.95rem', padding: '0.7rem 1.8rem',
                  border: '1.5px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#e2e8f0',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}>
                  Explore Restaurants →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section style={{ padding: '0', marginTop: '-28px', position: 'relative', zIndex: 10 }}>
        <div className="container" style={{ maxWidth: '700px', padding: '0 1.5rem' }} ref={searchRef}>
          <div style={{
            background: '#fff', borderRadius: '20px', boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
            padding: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            border: '2px solid transparent',
            transition: 'border-color 0.2s',
            borderColor: search ? 'var(--primary)' : 'transparent',
          }}>
            <span style={{ padding: '0 0.5rem 0 1.2rem', fontSize: '1.2rem', opacity: 0.4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ stroke: search ? 'var(--primary)' : '#94a3b8' }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search for restaurants or dishes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: '1rem',
                padding: '1rem 0', background: 'transparent', fontWeight: 500,
                color: '#0f172a', minWidth: 0,
              }}
            />
            {search && (
              <button onClick={() => { setSearch(''); setShowSearch(false); }} style={{
                background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer',
                width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: '0.5rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 700,
              }}>✕</button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearch && search && (
            <div style={{
              background: '#fff', borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
              marginTop: '0.5rem', maxHeight: '420px', overflowY: 'auto', border: '1px solid #f1f5f9',
            }}>
              {!hasResults ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontWeight: 500, fontSize: '0.9rem' }}>
                  No results found for "{search}"
                </div>
              ) : (
                <>
                  {searchResults.restaurants.length > 0 && (
                    <div>
                      <div style={{ padding: '0.75rem 1.25rem 0.35rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Restaurants
                      </div>
                      {searchResults.restaurants.map(r => (
                        <div key={`sr-${r.id}`} onClick={() => { setShowSearch(false); setSearch(''); navigate(`/restaurants/${r.id}`); }} style={{
                          padding: '0.75rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.85rem',
                          transition: 'background 0.15s',
                        }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontSize: '1.5rem' }}>🏪</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>{r.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>{r.cuisineType?.split(',')[0]?.trim() || 'Food'} · {r.city || ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.items.length > 0 && (
                    <div>
                      <div style={{ padding: '0.75rem 1.25rem 0.35rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', borderTop: '1px solid #f1f5f9' }}>
                        Dishes
                      </div>
                      {searchResults.items.map(item => (
                        <div key={`si-${item.id}`} onClick={() => { setShowSearch(false); setSearch(''); navigate(`/restaurants/${item.restaurantId}`); }} style={{
                          padding: '0.75rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.85rem',
                          transition: 'background 0.15s',
                        }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontSize: '1.5rem', width: '40px', textAlign: 'center' }}>{categoryEmoji(item.category)}</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>{item.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>₹{item.price?.toFixed(2)} · {item.restaurantName}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Popular Dishes */}
      {popularItems.length > 0 && (
        <section style={{ padding: '3rem 0 1.5rem' }}>
          <div className="container" style={{ maxWidth: '1000px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>What's on your mind?</h2>
              <p style={{ margin: '0.15rem 0 0', color: '#94a3b8', fontSize: '0.88rem', fontWeight: 500 }}>Popular dishes from top restaurants</p>
            </div>
            <div style={{
              display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '0.75rem',
              scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}>
              {popularItems.map((item) => (
                <div key={item.id} onClick={() => navigate(`/restaurants/${item.restaurantId}`)} style={{
                  flex: '0 0 140px', cursor: 'pointer', scrollSnapAlign: 'start',
                  transition: 'transform 0.2s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    width: '140px', height: '140px', borderRadius: '50%',
                    background: 'linear-gradient(145deg, #fef3c7, #fce7f3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '3rem', marginBottom: '0.65rem',
                    border: '3px solid #fff', boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                  }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : categoryEmoji(item.category)}
                  </div>
                  <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#1f2937', lineHeight: 1.25 }}>{item.name}</div>
                  <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{item.restaurantName}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quick Categories */}
      <section style={{ padding: '1.5rem 0' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.25rem', color: '#0f172a' }}>Order by Category</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {['Pizza', 'Burger', 'Chinese', 'South Indian', 'North Indian', 'Desserts', 'Beverages', 'Biryani'].map(cat => (
              <Link key={cat} to={`/restaurants?category=${cat}`} style={{
                padding: '0.6rem 1.4rem', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem',
                background: '#f8fafc', color: '#334155', border: '1.5px solid #e2e8f0',
                textDecoration: 'none', transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Restaurants */}
      <section style={{ padding: '2rem 0 4rem', background: '#f8fafc' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Popular Restaurants</h2>
              <p style={{ margin: '0.1rem 0 0', color: '#94a3b8', fontSize: '0.88rem', fontWeight: 500 }}>Handpicked favorites for you</p>
            </div>
            <Link to="/restaurants" style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="spinner" />
          ) : restaurants.length === 0 ? (
            <div className="empty-state" style={{ background: '#fff', borderRadius: '20px', padding: '3rem' }}>
              <div className="empty-icon" style={{ fontSize: '3rem' }}>🍽️</div>
              <h3>No Restaurants Available</h3>
              <p>We are expanding fast! Check back shortly.</p>
            </div>
          ) : (
            <div className="grid grid-3" style={{ gap: '1.25rem' }}>
              {restaurants.map((r) => (
                <div key={r.id} className="restaurant-card" onClick={() => navigate(`/restaurants/${r.id}`)} style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)'; }}
                >
                  <div className="restaurant-card-img" style={{ height: '180px' }}>
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt={r.name} />
                    ) : (
                      <div className="media-square-placeholder" style={{ background: 'linear-gradient(135deg, #fef3c7, #fee2e2)', fontSize: '3rem' }}>🏪</div>
                    )}
                    <span style={{
                      position: 'absolute', top: '12px', right: '12px',
                      background: 'rgba(34,197,94,0.9)', color: '#fff',
                      padding: '0.2rem 0.75rem', borderRadius: '30px', fontSize: '0.7rem', fontWeight: 800,
                      backdropFilter: 'blur(4px)', letterSpacing: '0.02em',
                    }}>OPEN</span>
                  </div>
                  <div className="restaurant-card-body" style={{ padding: '1rem 1.15rem 1.15rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{r.name}</h3>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#d97706', fontSize: '0.8rem', fontWeight: 700, background: '#fef3c7', padding: '0.1rem 0.45rem', borderRadius: '10px' }}>
                        ⭐ {r.rating?.toFixed(1) || '4.0'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.75rem' }}>
                      {r.cuisineType?.split(',')[0]?.trim() || 'Food'} · {r.city || ''}
                    </div>
                    <div style={{ borderTop: '1.5px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                        25-35 min
                      </span>
                      <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/restaurants/${r.id}`); }} style={{ borderRadius: '20px', fontSize: '0.78rem', padding: '0.35rem 1rem' }}>
                        View Menu
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '3.5rem 0', background: '#fff' }}>
        <div className="container" style={{ maxWidth: '900px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.15rem', color: '#0f172a' }}>How it works</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', fontWeight: 500, marginBottom: '2.5rem' }}>Three simple steps to satisfy your cravings</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            {[
              { icon: '🍽️', title: 'Choose a Restaurant', desc: 'Browse through our curated list of top restaurants near you.' },
              { icon: '📱', title: 'Place Your Order', desc: 'Select your favorite dishes, customize, and pay securely.' },
              { icon: '🛵', title: 'Fast Delivery', desc: 'Sit back and track your order live until it arrives at your door.' },
            ].map((s, i) => (
              <div key={s.title} style={{ padding: '2rem 1.5rem', borderRadius: '16px', background: '#f8fafc' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.4rem', color: '#0f172a' }}>{s.title}</div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', padding: '3.5rem 0 2.5rem', color: '#94a3b8' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '2rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Food<span style={{ color: 'var(--primary)' }}>Rush</span></span>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              <Link to="/restaurants" style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>Restaurants</Link>
              <Link to="/orders" style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>My Orders</Link>
              <Link to="/cart" style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>Cart</Link>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem' }}>© 2026 FoodRush. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
