import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyRestaurants, addRestaurant, updateRestaurant, toggleRestaurantStatus, uploadRestaurantImage, getMyRestaurantById, completeRegistration, deleteRestaurantImage } from '../api/restaurants';
import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability, uploadMenuItemImage, uploadTempMenuItemImage, deleteTempMenuImage } from '../api/menu';

const CUISINE_OPTIONS = ['North Indian', 'South Indian', 'Chinese', 'Italian', 'Fast Food', 'Desserts', 'Beverages', 'Continental', 'Mexican', 'Japanese'];

function parseTime(str) {
  if (!str) return { hour: 10, minute: '00', ampm: 'AM' };
  const m = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  return m ? { hour: parseInt(m[1]), minute: m[2], ampm: m[3].toUpperCase() } : { hour: 10, minute: '00', ampm: 'AM' };
}
function formatTime({ hour, minute, ampm }) {
  return `${String(hour).padStart(2, '0')}:${minute} ${ampm}`;
}

function TimePicker({ value, onChange, id }) {
  const t = parseTime(value);
  const set = (part) => (e) => onChange(formatTime({ ...t, [part]: e.target.value }));
  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
      <select value={t.hour} onChange={set('hour')} id={id} style={{ padding: '0.5rem 0.4rem', borderRadius: '6px', border: '1px solid var(--border)', fontWeight: 500, fontSize: '0.9rem', background: '#fff', width: '68px' }}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
      </select>
      <span style={{ fontWeight: 600, color: '#94a3b8' }}>:</span>
      <select value={t.minute} onChange={set('minute')} style={{ padding: '0.5rem 0.4rem', borderRadius: '6px', border: '1px solid var(--border)', fontWeight: 500, fontSize: '0.9rem', background: '#fff', width: '68px' }}>
        {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={t.ampm} onChange={set('ampm')} style={{ padding: '0.5rem 0.4rem', borderRadius: '6px', border: '1px solid var(--border)', fontWeight: 600, fontSize: '0.9rem', background: '#fff', width: '70px' }}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

// ── Owner Dashboard Layout ──────────────────────────────────────────────────
export function OwnerLayout() {
  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }}>
      <aside className="sidebar" style={{ width: '260px', padding: '2rem 1.5rem', background: '#ffffff', borderRight: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--primary)' }}>
          🏪 Partner Dashboard
        </div>
        <div className="sidebar-title" style={{ fontSize: '0.75rem', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>Management</div>
        <NavLink to="/owner/dashboard" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ display: 'block', padding: '0.75rem 1rem', borderRadius: '8px', color: 'var(--text)', textDecoration: 'none', marginBottom: '0.5rem', fontWeight: 500 }}>📊 My Restaurants</NavLink>
        <NavLink to="/owner/restaurants/add" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ display: 'block', padding: '0.75rem 1rem', borderRadius: '8px', color: 'var(--text)', textDecoration: 'none', marginBottom: '0.5rem', fontWeight: 500 }}>➕ Register Restaurant</NavLink>
      </aside>
      <main className="dashboard-content" style={{ flex: 1, padding: '2.5rem', backgroundColor: '#fafafa' }}>
        <Outlet />
      </main>
    </div>
  );
}

// ── Owner Dashboard (list restaurants) ──────────────────────────────────────
export function OwnerDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRes, setEditingRes] = useState(null);
  const [uploadingResId, setUploadingResId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await getMyRestaurants();
      setRestaurants(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleRestaurantStatus(id);
      toast.success('Status updated');
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateRestaurant(editingRes.id, {
        name: editingRes.name,
        cuisineType: editingRes.cuisineType,
        description: editingRes.description,
        address: editingRes.address,
        phoneNumber: editingRes.phoneNumber,
        openingTime: editingRes.openingTime,
        closingTime: editingRes.closingTime
      });
      toast.success('Restaurant updated successfully!');
      setEditingRes(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to update restaurant');
    }
  };

  const handleImageUpload = async (id, file) => {
    if (!file) return;
    setUploadingResId(id);
    const loadingToast = toast.loading('Uploading image to Cloudinary...');
    try {
      await uploadRestaurantImage(id, file);
      toast.success('Image uploaded successfully!', { id: loadingToast });
      load();
    } catch (err) {
      toast.error(err.message || 'Upload failed', { id: loadingToast });
    } finally {
      setUploadingResId(null);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ paddingTop: '1rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>My Restaurant</h2>
        <p style={{ color: 'var(--text-muted)' }}>Your registered restaurant — complete your profile and add menu items</p>
      </div>

      {restaurants.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 2rem', background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div className="empty-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏪</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No restaurants yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Register your restaurant to get started.</p>
          <button className="btn btn-primary" onClick={() => navigate('/owner/restaurants/add')}>Register Restaurant</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
          {restaurants.map((r) => (
            <div key={r.id} className="card" style={{
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: r.status === 'PENDING' ? 'pointer' : 'default',
              transition: 'box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column'
            }}
              onClick={() => {
                if (r.status === 'PENDING') {
                  navigate(`/owner/restaurants/${r.id}/complete-registration`);
                }
              }}>
              {r.imageUrl ? (
                <div style={{ height: '200px', width: '100%', backgroundColor: '#e5e7eb', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={r.imageUrl} alt={r.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  <label className="btn btn-sm" style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: '#1f2937',
                    border: '1px solid #d1d5db',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    display: 'inline-block'
                  }} onClick={(e) => e.stopPropagation()}>
                    {uploadingResId === r.id ? 'Uploading...' : '📷 Change Cover'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={uploadingResId === r.id}
                      onChange={(e) => handleImageUpload(r.id, e.target.files[0])}
                    />
                  </label>
                </div>
              ) : (
                <div style={{
                  height: '160px',
                  width: '100%',
                  backgroundColor: '#f9fafb',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'var(--text-muted)',
                  flexDirection: 'column',
                  position: 'relative'
                }}>
                  <span style={{ fontSize: '3.5rem', opacity: 0.4 }}>🏪</span>
                  <span style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Upload Cover Image</span>
                  <label className="btn btn-sm" style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: '#1f2937',
                    border: '1px solid #d1d5db',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    display: 'inline-block'
                  }} onClick={(e) => e.stopPropagation()}>
                    {uploadingResId === r.id ? 'Uploading...' : '📷 Upload Cover'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={uploadingResId === r.id}
                      onChange={(e) => handleImageUpload(r.id, e.target.files[0])}
                    />
                  </label>
                </div>
              )}

              <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{r.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div>
                        {r.status === 'OPEN' || r.status === 'ACTIVE' ? (
                          <span className="badge badge-success" style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>ACTIVE</span>
                        ) : r.status === 'CLOSED' ? (
                          <span className="badge badge-danger" style={{ backgroundColor: '#fde8e8', color: '#9b1c1c', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>CLOSED</span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>PENDING</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {r.description && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description}</p>}

                {r.status !== 'PENDING' && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'grid', gap: '0.3rem', marginBottom: '1.25rem' }}>
                    <div>📍 {r.city || r.address || 'N/A'}</div>
                    <div>🍴 {r.cuisineType?.replace(/,/g, ', ')}</div>
                    {r.phoneNumber && <div>📞 {r.phoneNumber}</div>}
                    {(r.openingTime && r.closingTime) && <div>🕒 {r.openingTime} - {r.closingTime}</div>}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: r.status !== 'PENDING' ? '1px solid var(--border)' : 'none', paddingTop: r.status !== 'PENDING' ? '1rem' : '0' }}>
                  {r.status === 'PENDING' ? (
                    <button className="btn btn-primary" style={{ flex: 1, padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 600 }} onClick={() => navigate(`/owner/restaurants/${r.id}/complete-registration`)}>
                      📝 Fill Details
                    </button>
                  ) : (
                    <>
                      <button className="btn btn-primary" style={{ flex: 1, padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 600 }} onClick={() => navigate(`/restaurants/${r.id}`)}>
                        👀 View Menu
                      </button>
                      <button className="btn btn-outline" style={{ flex: 1, padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 600, background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }} onClick={() => navigate(`/owner/restaurants/${r.id}/menu`)}>
                        📋 Manage Menu
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 600, background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setEditingRes(r)}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 600, background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }} onClick={() => handleToggle(r.id)}>
                        {r.status === 'OPEN' || r.status === 'ACTIVE' ? '🔴 Close' : '🟢 Open'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Restaurant Modal */}
      {editingRes && (
        <div className="modal-overlay" onClick={() => setEditingRes(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Edit Restaurant Details</h3>
              <button className="modal-close" onClick={() => setEditingRes(null)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Restaurant Name</label>
                <input className="form-input" value={editingRes.name} onChange={(e) => setEditingRes({ ...editingRes, name: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Cuisine Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                  {CUISINE_OPTIONS.map((c) => {
                    const selected = (editingRes.cuisineType || '').split(',').map(s => s.trim()).includes(c);
                    return (
                      <label key={c} style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.4rem 0.9rem', borderRadius: '8px',
                        border: selected ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: selected ? '#eef2ff' : '#ffffff',
                        cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
                        transition: 'all 0.15s'
                      }}>
                        <input type="checkbox" checked={selected}
                          onChange={(e) => {
                            const current = (editingRes.cuisineType || '').split(',').map(s => s.trim()).filter(Boolean);
                            const next = e.target.checked ? [...current, c] : current.filter(x => x !== c);
                            setEditingRes({ ...editingRes, cuisineType: next.join(', ') });
                          }}
                          style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        {c}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Description</label>
                <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} value={editingRes.description || ''} onChange={(e) => setEditingRes({ ...editingRes, description: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Address</label>
                <input className="form-input" value={editingRes.address} onChange={(e) => setEditingRes({ ...editingRes, address: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Phone Number</label>
                <input className="form-input" value={editingRes.phoneNumber || ''} onChange={(e) => setEditingRes({ ...editingRes, phoneNumber: e.target.value })} />
              </div>
              <div className="grid grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Opening Time</label>
                  <TimePicker value={editingRes.openingTime} onChange={(v) => setEditingRes({ ...editingRes, openingTime: v })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Closing Time</label>
                  <TimePicker value={editingRes.closingTime} onChange={(v) => setEditingRes({ ...editingRes, closingTime: v })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingRes(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Restaurant ───────────────────────────────────────────────────────────
export function AddRestaurantPage() {
  const [form, setForm] = useState({
    name: '',
    cuisineType: '',
    description: '',
    address: '',
    phoneNumber: '',
    openingTime: '10:00 AM',
    closingTime: '11:00 PM'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addRestaurant(form);
      toast.success('Restaurant registered successfully! Ready for your menu.');
      navigate('/owner/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: '1rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Register Restaurant</h2>
        <p style={{ color: 'var(--text-muted)' }}>Enter your restaurant specifications to get listed</p>
      </div>
      <div style={{ maxWidth: '650px' }}>
        <div className="card" style={{ background: '#ffffff', padding: '2rem', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Restaurant Name *</label>
              <input className="form-input" placeholder="e.g. Gourmet Palace" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Cuisine Type *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                {CUISINE_OPTIONS.map((c) => {
                  const selected = (form.cuisineType || '').split(',').map(s => s.trim()).includes(c);
                  return (
                    <label key={c} style={{
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.4rem 0.9rem', borderRadius: '8px',
                      border: selected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: selected ? '#eef2ff' : '#ffffff',
                      cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
                      transition: 'all 0.15s'
                    }}>
                      <input type="checkbox" checked={selected}
                        onChange={(e) => {
                          const current = (form.cuisineType || '').split(',').map(s => s.trim()).filter(Boolean);
                          const next = e.target.checked ? [...current, c] : current.filter(x => x !== c);
                          if (next.length === 0) return; // prevent empty selection
                          setForm({ ...form, cuisineType: next.join(', ') });
                        }}
                        style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                      />
                      {c}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Description</label>
              <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Tell customers about your kitchen specialty, vibe, etc." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Street Address *</label>
              <input className="form-input" placeholder="e.g. Shop 42, Galleria Mall, Sector 5" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Contact Phone Number</label>
              <input className="form-input" placeholder="e.g. +91 9876543210" value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
            </div>
            <div className="grid grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Opening Time</label>
                <TimePicker value={form.openingTime} onChange={(v) => setForm({ ...form, openingTime: v })} />
              </div>
              <div className="form-group">
                <label className="form-label">Closing Time</label>
                <TimePicker value={form.closingTime} onChange={(v) => setForm({ ...form, closingTime: v })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/owner/dashboard')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Register Restaurant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Complete Restaurant Registration ─────────────────────────────────────────
export function CompleteRegistrationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingItemIndex, setUploadingItemIndex] = useState(null);
  const [details, setDetails] = useState({
    name: '',
    cuisineTypes: [],
    licenseNumber: '',
    description: '',
    address: '',
    city: '',
    phoneNumber: '',
    openingTime: '10:00 AM',
    closingTime: '11:00 PM',
    restaurantImageUrl: ''
  });
  const [menuItems, setMenuItems] = useState([
    { name: '', description: '', price: '', category: 'MAIN_COURSE', isVeg: false, isAvailable: true, imageUrl: '' }
  ]);

  const STORAGE_KEY = `completeRegistration_${id}`;

  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ details, menuItems }));
    } catch { /* ignore */ }
  };

  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  };

  const clearStorage = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  useEffect(() => { loadRestaurant();   }, [id]);

  useEffect(() => { if (!loading) saveToStorage(); }, [details, menuItems, loading]);

  const loadRestaurant = async () => {
    try {
      const res = await getMyRestaurantById(id);
      const data = res.data;
      const saved = loadFromStorage();
      setDetails((prev) => ({
        ...prev,
        name: saved?.details?.name || data.name || prev.name,
        cuisineTypes: saved?.details?.cuisineTypes || (data.cuisineType ? data.cuisineType.split(',').map((item) => item.trim()).filter(Boolean) : []),
        licenseNumber: saved?.details?.licenseNumber || data.licenseNumber || '',
        description: saved?.details?.description || data.description || '',
        address: saved?.details?.address || data.address || '',
        city: saved?.details?.city || data.city || '',
        phoneNumber: saved?.details?.phoneNumber || data.phoneNumber || '',
        openingTime: saved?.details?.openingTime || data.openingTime || prev.openingTime,
        closingTime: saved?.details?.closingTime || data.closingTime || prev.closingTime,
        restaurantImageUrl: saved?.details?.restaurantImageUrl || data.imageUrl || ''
      }));
      if (saved?.menuItems) setMenuItems(saved.menuItems);
    } catch (err) {
      toast.error(err.message || 'Failed to load restaurant');
      navigate('/owner/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const uploadCover = async (file) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const res = await uploadRestaurantImage(id, file);
      setDetails((prev) => ({ ...prev, restaurantImageUrl: res.data.imageUrl }));
      toast.success('Cover image uploaded successfully');
    } catch (err) {
      toast.error(err.message || 'Cover upload failed');
    } finally {
      setUploadingCover(false);
    }
  };

  const removeCoverImage = async () => {
    const url = details.restaurantImageUrl;
    if (url) {
      try { await deleteRestaurantImage(id, url); } catch { /* ignore if already gone */ }
    }
    setDetails((prev) => ({ ...prev, restaurantImageUrl: '' }));
  };

  const setMenuItem = (index, field, value) => {
    setMenuItems((prev) => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const addMenuItemRow = () => {
    setMenuItems((prev) => [...prev, { name: '', description: '', price: '', category: 'MAIN_COURSE', isVeg: false, isAvailable: true, imageUrl: '' }]);
  };

  const removeMenuItemRow = (index) => {
    if (menuItems.length === 1) return;
    setMenuItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const removeMenuImage = async (index) => {
    const url = menuItems[index]?.imageUrl;
    if (url) {
      try { await deleteTempMenuImage(id, url); } catch { /* ignore if already gone */ }
    }
    setMenuItem(index, 'imageUrl', '');
  };

  const uploadMenuImage = async (index, file) => {
    if (!file) return;
    setUploadingItemIndex(index);
    try {
      const res = await uploadTempMenuItemImage(id, file);
      setMenuItem(index, 'imageUrl', res.data.imageUrl);
      toast.success('Menu item image uploaded');
    } catch (err) {
      toast.error(err.message || 'Menu image upload failed');
    } finally {
      setUploadingItemIndex(null);
    }
  };

  const isSubmitDisabled = !details.name || details.cuisineTypes.length === 0 || !details.licenseNumber || !details.address || !details.city || !details.restaurantImageUrl || menuItems.length === 0 || menuItems.some((item) => !item.name || !item.price || !item.category || !item.imageUrl);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitDisabled) {
      toast.error('Please complete all required restaurant and menu fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: details.name,
        cuisineType: details.cuisineTypes.join(', '),
        licenseNumber: details.licenseNumber,
        description: details.description,
        address: details.address,
        city: details.city,
        phoneNumber: details.phoneNumber,
        openingTime: details.openingTime,
        closingTime: details.closingTime,
        restaurantImageUrl: details.restaurantImageUrl,
        menuItems: menuItems.map((item) => ({
          name: item.name,
          description: item.description,
          price: parseFloat(item.price),
          category: item.category,
          isVeg: item.isVeg,
          isAvailable: item.isAvailable,
          imageUrl: item.imageUrl
        }))
      };

      await completeRegistration(id, payload);
      clearStorage();
      toast.success('Restaurant activated successfully');
      navigate('/owner/dashboard');
    } catch (err) {
      toast.error(err.message || 'Activation failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ paddingTop: '1rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Fill Details</h2>
        <p style={{ color: 'var(--text-muted)' }}>Complete your restaurant details and add menu items to go live.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ background: '#ffffff', padding: '2rem', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 700 }}>A. Restaurant Details</h3>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Restaurant Name *</label>
            <input className="form-input" value={details.name} onChange={(e) => setDetails((prev) => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">License Number *</label>
            <input className="form-input" value={details.licenseNumber} onChange={(e) => setDetails((prev) => ({ ...prev, licenseNumber: e.target.value }))} required />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Cuisine Type *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.4rem' }}>
              {CUISINE_OPTIONS.map((c) => (
                <label key={c} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: details.cuisineTypes.includes(c) ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: details.cuisineTypes.includes(c) ? '#eef2ff' : '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.15s'
                }}>
                  <input
                    type="checkbox"
                    checked={details.cuisineTypes.includes(c)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setDetails((prev) => ({ ...prev, cuisineTypes: [...prev.cuisineTypes, c] }));
                      } else {
                        setDetails((prev) => ({ ...prev, cuisineTypes: prev.cuisineTypes.filter((x) => x !== c) }));
                      }
                    }}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  {c}
                </label>
              ))}
            </div>
            {details.cuisineTypes.length === 0 && (
              <small style={{ color: 'var(--text-muted)' }}>Select at least one cuisine type</small>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Full Address *</label>
            <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Street, area, landmark, pincode" value={details.address} onChange={(e) => setDetails((prev) => ({ ...prev, address: e.target.value }))} required />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">City *</label>
            <input className="form-input" placeholder="e.g. Mumbai, Delhi, Bangalore" value={details.city} onChange={(e) => setDetails((prev) => ({ ...prev, city: e.target.value }))} required />
          </div>
          <div className="grid grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Contact Phone Number</label>
              <input className="form-input" value={details.phoneNumber} onChange={(e) => setDetails((prev) => ({ ...prev, phoneNumber: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Opening Time</label>
              <TimePicker value={details.openingTime} onChange={(v) => setDetails((prev) => ({ ...prev, openingTime: v }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Closing Time</label>
              <TimePicker value={details.closingTime} onChange={(v) => setDetails((prev) => ({ ...prev, closingTime: v }))} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Description</label>
            <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} value={details.description} onChange={(e) => setDetails((prev) => ({ ...prev, description: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Restaurant Cover Image *</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {details.restaurantImageUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ width: '200px', height: '120px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                    <img src={details.restaurantImageUrl} alt="Cover" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <span style={{ color: 'var(--success)', fontSize: '0.95rem', fontWeight: 600 }}>✓ Uploaded</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={removeCoverImage}>Remove</button>
                </div>
              ) : (
                <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                  {uploadingCover ? 'Uploading...' : 'Upload Cover Image'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingCover} onChange={(e) => uploadCover(e.target.files[0])} />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ background: '#ffffff', padding: '2rem', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>B. Menu Items</h3>
            <button type="button" className="btn btn-primary btn-sm" onClick={addMenuItemRow}>+ Add Another Item</button>
          </div>

          {menuItems.map((item, index) => (
            <div key={index} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700 }}>Item {index + 1}</div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeMenuItemRow(index)} disabled={menuItems.length === 1}>Remove</button>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Item Name *</label>
                <input className="form-input" value={item.name} onChange={(e) => setMenuItem(index, 'name', e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Description</label>
                <textarea className="form-input" style={{ minHeight: '70px', resize: 'vertical' }} value={item.description} onChange={(e) => setMenuItem(index, 'description', e.target.value)} />
              </div>
              <div className="grid grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price *</label>
                  <input type="number" step="0.01" min="0" className="form-input" value={item.price} onChange={(e) => setMenuItem(index, 'price', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-input" value={item.category} onChange={(e) => setMenuItem(index, 'category', e.target.value)} required style={{ height: '38px' }}>
                    <option value="PIZZA">Pizza</option>
                    <option value="BIRYANI">Biryani</option>
                    <option value="BURGER">Burger</option>
                    <option value="SOUTH_INDIAN">South Indian</option>
                    <option value="CHINESE">Chinese</option>
                    <option value="DESSERTS">Desserts</option>
                    <option value="ROLLS">Rolls</option>
                    <option value="NORTH_INDIAN">North Indian</option>
                    <option value="ITALIAN">Italian</option>
                    <option value="MEXICAN">Mexican</option>
                    <option value="STARTERS">Starters</option>
                    <option value="MAIN_COURSE">Main Course</option>
                    <option value="BEVERAGES">Beverages</option>
                  </select>
                </div>
                <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <input type="checkbox" checked={item.isVeg} onChange={(e) => setMenuItem(index, 'isVeg', e.target.checked)} />
                      Veg
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <input type="checkbox" checked={item.isAvailable} onChange={(e) => setMenuItem(index, 'isAvailable', e.target.checked)} />
                      Available
                    </label>
                  </div>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">Item Image *</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {item.imageUrl ? (
                    <>
                      <span style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600 }}>✓ Image uploaded</span>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeMenuImage(index)}>Remove</button>
                    </>
                  ) : (
                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                      {uploadingItemIndex === index ? 'Uploading...' : 'Upload Item Image'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingItemIndex === index} onChange={(e) => uploadMenuImage(index, e.target.files[0])} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ background: '#ffffff', padding: '2rem', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 700 }}>C. Confirm & Submit</h3>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Review all details and activate your restaurant.</p>
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/owner/dashboard')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || isSubmitDisabled}>
              {saving ? 'Activating...' : 'Confirm & Activate Restaurant'}
            </button>
          </div>
          {isSubmitDisabled && (
            <p style={{ marginTop: '1rem', color: '#b91c1c' }}>All required fields and at least one menu item with image are needed before activation.</p>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Manage Menu ──────────────────────────────────────────────────────────────
export function ManageMenuPage() {
  const { id } = { id: window.location.pathname.split('/')[3] };
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // Menu item currently being edited
  const [uploadingItemId, setUploadingItemId] = useState(null); // Menu item getting image uploaded
  const [form, setForm] = useState({ name: '', price: '', category: 'MAIN_COURSE', description: '', isVeg: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadMenu(); }, []);

  const loadMenu = async () => {
    try {
      const res = await getMenu(id, undefined, 0, 100);
      setMenu(res.data.content || res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        // Edit flow
        await updateMenuItem(editingItem.id, {
          name: form.name,
          price: parseFloat(form.price),
          category: form.category,
          description: form.description,
          isVeg: form.isVeg
        });
        toast.success('Menu item updated!');
      } else {
        // Add flow
        await addMenuItem(id, {
          name: form.name,
          price: parseFloat(form.price),
          category: form.category,
          description: form.description,
          isVeg: form.isVeg
        });
        toast.success('Menu item added!');
      }
      setForm({ name: '', price: '', category: 'MAIN_COURSE', description: '', isVeg: false });
      setEditingItem(null);
      setShowModal(false);
      loadMenu();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvail = async (itemId) => {
    try {
      await toggleAvailability(itemId);
      toast.success('Availability updated');
      loadMenu();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await deleteMenuItem(itemId);
      toast.success('Item deleted');
      loadMenu();
    } catch (err) { toast.error(err.message); }
  };

  const handleItemImageUpload = async (itemId, file) => {
    if (!file) return;
    setUploadingItemId(itemId);
    const loadingToast = toast.loading('Uploading item photo to Cloudinary...');
    try {
      await uploadMenuItemImage(itemId, file);
      toast.success('Item image updated!', { id: loadingToast });
      loadMenu();
    } catch (err) {
      toast.error(err.message || 'Upload failed', { id: loadingToast });
    } finally {
      setUploadingItemId(null);
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      price: item.price.toString(),
      category: item.category || 'MAIN_COURSE',
      description: item.description || '',
      isVeg: item.isVeg || false
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setForm({ name: '', price: '', category: 'MAIN_COURSE', description: '', isVeg: false });
    setShowModal(true);
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button className="btn btn-secondary btn-sm" style={{ marginBottom: '0.75rem', padding: '0.4rem 0.8rem' }} onClick={() => window.history.back()}>← Back</button>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Manage Menu</h2>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>+ Add Menu Item</button>
      </div>

      {menu.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 2rem', background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div className="empty-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No menu items yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Create food items for your menu to start taking orders.</p>
          <button className="btn btn-primary" onClick={openAddModal}>Add Menu Item</button>
        </div>
      ) : (
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {menu.map((item) => (
            <div key={item.id} className="menu-item-card" style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '8px', backgroundColor: '#f3f4f6', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '1.5rem' }}>🍔</div>
                )}
                <label style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '0.65rem',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  cursor: 'pointer',
                  borderRadius: '8px'
                }} className="hover-overlay-btn" onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                  {uploadingItemId === item.id ? '...' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={uploadingItemId === item.id}
                    onChange={(e) => handleItemImageUpload(item.id, e.target.files[0])}
                  />
                </label>
              </div>

              <div className="menu-item-info" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.9rem', color: item.isVeg ? '#10b981' : '#ef4444', border: `1px solid ${item.isVeg ? '#10b981' : '#ef4444'}`, padding: '1px 4px', borderRadius: '4px', lineHeight: 1, fontWeight: 700 }}>
                    {item.isVeg ? 'VEG' : 'NON-VEG'}
                  </span>
                  <span className="menu-item-name" style={{ fontSize: '1.1rem', fontWeight: 600 }}>{item.name}</span>
                </div>
                {item.description && <div className="menu-item-desc" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{item.description}</div>}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {item.category && <span className="badge badge-muted" style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>{item.category.replace('_', ' ')}</span>}
                  <span className={`badge ${item.isAvailable ? 'badge-success' : 'badge-danger'}`} style={{
                    backgroundColor: item.isAvailable ? '#def7ec' : '#fde8e8',
                    color: item.isAvailable ? '#03543f' : '#9b1c1c',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 600
                  }}>
                    {item.isAvailable ? 'AVAILABLE' : 'OUT OF STOCK'}
                  </span>
                </div>
              </div>

              <div className="menu-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="menu-item-price" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>₹{item.price?.toFixed(2)}</span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleToggleAvail(item.id)}>
                    {item.isAvailable ? '🔴 Disable' : '🟢 Enable'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(item)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Menu Item Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAddOrUpdate}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Item Name *</label>
                <input className="form-input" placeholder="e.g. Margherita Pizza" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Price (₹) *</label>
                <input type="number" step="0.01" min="0" className="form-input" placeholder="e.g. 299.00" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Category *</label>
                <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required style={{ width: '100%', height: '38px', padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <option value="PIZZA">Pizza</option>
                  <option value="BIRYANI">Biryani</option>
                  <option value="BURGER">Burger</option>
                  <option value="SOUTH_INDIAN">South Indian</option>
                  <option value="CHINESE">Chinese</option>
                  <option value="DESSERTS">Desserts</option>
                  <option value="ROLLS">Rolls</option>
                  <option value="NORTH_INDIAN">North Indian</option>
                  <option value="ITALIAN">Italian</option>
                  <option value="MEXICAN">Mexican</option>
                  <option value="STARTERS">Starters</option>
                  <option value="MAIN_COURSE">Main Course</option>
                  <option value="BEVERAGES">Beverages</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Short description of ingredients/portions..." value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="isVeg" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <label htmlFor="isVeg" style={{ fontWeight: 500, cursor: 'pointer', fontSize: '0.9rem' }}>🟢 This item is Vegetarian</label>
              </div>
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
