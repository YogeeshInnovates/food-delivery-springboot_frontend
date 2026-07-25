import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getDashboardStats, getAdminUsers, toggleUserBlock,
  getAdminRestaurants, approveRestaurant, toggleRestaurantApproval, getAdminOrders,
  createAdmin,
} from '../api/admin';
import { getMenu } from '../api/menu';

export function AdminLayout() {
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--secondary)' }}>
          🛡️ Admin Panel
        </div>
        <div className="sidebar-title">Overview</div>
        <NavLink to="/admin/dashboard" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>📊 Dashboard</NavLink>
        <div className="sidebar-title">Management</div>
        <NavLink to="/admin/restaurants" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>🏪 Restaurants</NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>👥 Users</NavLink>
        <NavLink to="/admin/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>📦 Orders</NavLink>
        <div className="sidebar-title">System</div>
        <NavLink to="/admin/create-admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>➕ Create Admin</NavLink>
      </aside>
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((r) => setStats(r.data)).catch((err) => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h2>Platform Dashboard</h2>
        <p>Overview of all activity on FoodRush</p>
      </div>
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{stats?.totalOrders ?? 0}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats?.pendingOrders ?? 0}</div>
          <div className="stat-label">Pending Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">₹{(stats?.totalRevenue ?? 0).toFixed(0)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p className="text-muted">Use the sidebar to manage restaurants, users, and orders.</p>
      </div>
    </div>
  );
}

export function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRes, setSelectedRes] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  useEffect(() => {
    getAdminRestaurants().then((r) => setRestaurants(r.data)).catch((err) => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  const handleToggle = async (id, currentStatus) => {
    try {
      if (currentStatus === 'ACTIVE' || currentStatus === 'OPEN') {
        await toggleRestaurantApproval(id);
        const newStatus = currentStatus === 'OPEN' ? 'ACTIVE' : 'OPEN';
        setRestaurants((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
        toast.success(newStatus === 'OPEN' ? 'Restaurant approved and visible to users' : 'Approval revoked');
      } else if (currentStatus === 'PENDING') {
        await toggleRestaurantApproval(id);
        setRestaurants((prev) => prev.map((r) => r.id === id ? { ...r, status: 'OPEN' } : r));
        toast.success('Restaurant approved and visible to users');
      } else {
        toast('Cannot change status of CLOSED restaurants');
      }
    } catch (err) { toast.error(err.message); }
  };

  const handleSelect = async (r) => {
    if (selectedRes?.id === r.id) {
      setSelectedRes(null);
      setMenuItems([]);
      return;
    }
    setSelectedRes(r);
    setMenuLoading(true);
    try {
      const res = await getMenu(r.id);
      setMenuItems(res.data.content || res.data || []);
    } catch {
      setMenuItems([]);
    } finally {
      setMenuLoading(false);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header"><h2>All Restaurants</h2><p>{restaurants.length} restaurant(s) registered</p></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {restaurants.map((r) => {
          const isApproved = r.status === 'OPEN';
          const canToggle = r.status === 'ACTIVE' || r.status === 'OPEN' || r.status === 'PENDING';
          const isOpen = selectedRes?.id === r.id;
          return (
            <div key={r.id} className="card" style={{ background: '#ffffff', border: isOpen ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => handleSelect(r)}>
              <div style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem' }}>
                {r.imageUrl ? (
                  <img src={r.imageUrl} alt={r.name} style={{ width: '140px', height: '120px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '140px', height: '120px', borderRadius: '8px', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', flexShrink: 0 }}>🏪</div>
                )}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 1.5rem', fontSize: '0.88rem' }}>
                  <div><span className="text-muted">ID:</span> #{r.id}</div>
                  <div><span className="text-muted">Name:</span> <strong>{r.name}</strong></div>
                  <div><span className="text-muted">Owner:</span> {r.ownerName}</div>
                  <div><span className="text-muted">Phone:</span> {r.phoneNumber || '—'}</div>
                  <div><span className="text-muted">License:</span> {r.licenseNumber || '—'}</div>
                  <div><span className="text-muted">City:</span> {r.city || 'N/A'}</div>
                  <div><span className="text-muted">Address:</span> {r.address || '—'}</div>
                  <div><span className="text-muted">Cuisine:</span> {r.cuisineType?.replace(/,/g, ', ')}</div>
                  <div><span className="text-muted">Email:</span> {r.ownerEmail || '—'}</div>
                  <div><span className="text-muted">Hours:</span> {r.openingTime || '—'} - {r.closingTime || '—'}</div>
                  <div><span className="text-muted">Submitted:</span> {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</div>
                  <div><span className="text-muted">Status:</span> {
                    r.status === 'OPEN' ? <span className="badge badge-success">OPEN</span> :
                    r.status === 'CLOSED' ? <span className="badge badge-danger">CLOSED</span> :
                    r.status === 'PENDING' ? <span className="badge badge-warning">PENDING</span> :
                    r.status === 'ACTIVE' ? <span className="badge badge-primary">ACTIVE</span> :
                    <span className="badge badge-muted">{r.status}</span>
                  }</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minWidth: '90px' }} onClick={(e) => e.stopPropagation()}>
                  {canToggle ? (
                    <>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isApproved ? 'var(--success)' : 'var(--text-muted)' }}>
                        {isApproved ? 'Approved' : 'Not Approved'}
                      </span>
                      <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                        <input type="checkbox" checked={isApproved} onChange={() => handleToggle(r.id, r.status)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{
                          position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: isApproved ? '#10b981' : '#d1d5db', borderRadius: '24px', transition: '0.3s'
                        }}>
                          <span style={{
                            position: 'absolute', content: '', height: '18px', width: '18px', left: isApproved ? '22px' : '3px', bottom: '3px',
                            backgroundColor: '#ffffff', borderRadius: '50%', transition: '0.3s'
                          }} />
                        </span>
                      </label>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click to toggle</span>
                    </>
                  ) : (
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>—</span>
                  )}
                </div>
              </div>
              {r.description && <div style={{ padding: '0 1.25rem 1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0' }}>📝 {r.description}</div>}

              {/* Expanded menu items */}
              {isOpen && (
                <div style={{ borderTop: '2px solid var(--primary)', background: '#f8fafc' }}>
                  <div style={{ padding: '1rem 1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>🍽️ Menu Items ({menuItems.length})</h4>
                    {menuLoading ? (
                      <div className="spinner" style={{ height: '40px' }} />
                    ) : menuItems.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: '0.88rem' }}>No menu items found.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {menuItems.map((item) => (
                          <div key={item.id} style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.6rem 0.8rem', borderRadius: '8px',
                            background: '#ffffff', border: '1px solid var(--border)'
                          }}>
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🍽️</div>
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>{item.name}</div>
                              {item.description && <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.1rem' }}>{item.description}</div>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)' }}>₹{item.price?.toFixed(2)}</div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{item.category?.replace(/_/g, ' ')}</div>
                            </div>
                            <span className={`badge ${item.isAvailable !== false ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                              {item.isAvailable !== false ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {restaurants.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', background: '#ffffff' }}>
            <p className="text-muted">No restaurants registered yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminUsers(0, 50).then((r) => setUsers(r.data.content || r.data)).catch((err) => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  const handleBlock = async (id) => {
    try {
      await toggleUserBlock(id);
      toast.success('User status updated');
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: !u.isActive } : u));
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header"><h2>All Users</h2><p>{users.length} registered users</p></div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Registered</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="text-muted">#{u.id}</td>
                <td className="fw-700">{u.name}</td>
                <td>{u.email || '—'}</td>
                <td>{u.phoneNumber || '—'}</td>
                <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-primary' : u.role === 'OWNER' ? 'badge-warning' : 'badge-muted'}`}>{u.role}</span></td>
                <td className="text-muted" style={{ fontSize: '0.8rem' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                <td><span className={`badge ${u.isActive !== false ? 'badge-success' : 'badge-danger'}`}>{u.isActive !== false ? 'Active' : 'Blocked'}</span></td>
                <td>
                  <button className={`btn btn-sm ${u.isActive !== false ? 'btn-danger' : 'btn-success'}`} onClick={() => handleBlock(u.id)}>
                    {u.isActive !== false ? 'Block' : 'Unblock'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const STATUS_BADGE = {
  PLACED: 'badge-primary',
  ACCEPTED: 'badge-info',
  PREPARING: 'badge-warning',
  OUT_FOR_DELIVERY: 'badge-warning',
  DELIVERED: 'badge-success',
  CANCELLED: 'badge-danger',
};

export function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminOrders(0, 50).then((r) => {
      const list = r.data.content || r.data;
      list.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
      setOrders(list);
    }).catch((err) => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header"><h2>All Orders</h2><p>{orders.length} orders total</p></div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Customer</th><th>Restaurant</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="text-muted">#{o.id}</td>
                <td>{o.customerName || '—'}</td>
                <td className="fw-700">{o.restaurantName}</td>
                <td style={{ fontSize: '0.8rem' }}>{(o.items || []).map((i) => i.name).join(', ')}</td>
                <td className="text-primary fw-700">₹{o.totalAmount?.toFixed(2)}</td>
                <td><span className={`badge ${STATUS_BADGE[o.status] || 'badge-muted'}`}>{o.status}</span></td>
                <td className="text-muted" style={{ fontSize: '0.8rem' }}>{o.placedAt ? new Date(o.placedAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminCreateAdminPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phoneNumber: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.phoneNumber) {
      return toast.error('Please fill in all fields');
    }
    setLoading(true);
    try {
      await createAdmin(form);
      toast.success(`Admin "${form.name}" created successfully`);
      setForm({ name: '', email: '', password: '', phoneNumber: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header"><h2>Create Admin</h2><p>Add a new administrator account</p></div>
      <div className="card" style={{ maxWidth: 500 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Admin name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="admin@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="+91 98765 43210" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Creating…' : 'Create Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
