import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getRestaurant } from '../api/restaurants';
import { getMenu } from '../api/menu';
import { addToCart } from '../api/cart';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, getRole } = useAuthStore();
  const { incrementCount } = useCartStore();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [category, setCategory] = useState('');

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const [restRes, menuRes] = await Promise.all([
        getRestaurant(id),
        getMenu(id, undefined, 0, 50),
      ]);
      setRestaurant(restRes.data);
      setMenu(menuRes.data.content || menuRes.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (item) => {
    if (!token) { toast.error('Please login to add items to cart'); navigate('/login'); return; }
    if (getRole() !== 'CUSTOMER') { toast.error('Only customers can add to cart'); return; }
    setAddingId(item.id);
    try {
      await addToCart({ menuItemId: item.id, quantity: 1 });
      incrementCount();
      toast.success(`${item.name} added to cart! 🛒`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAddingId(null);
    }
  };

  const categories = [...new Set(menu.map((m) => m.category).filter(Boolean))];
  const filtered = category ? menu.filter((m) => m.category === category) : menu;

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!restaurant) return <div className="page flex-center"><p>Restaurant not found</p></div>;

  return (
    <div className="page" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingTop: '76px' }}>
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* Modern Split Header Info Block */}
        <div className="restaurant-detail-header">
          {/* Small image at left */}
          <div className="restaurant-detail-img-wrapper">
            {restaurant.imageUrl ? (
              <img src={restaurant.imageUrl} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at 70% 30%, rgba(255, 107, 53, 0.15) 0%, transparent 60%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
              }}>
                🏪
              </div>
            )}
          </div>

          {/* Restaurant details at right */}
          <div className="restaurant-detail-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge badge-success" style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', fontWeight: 800 }}>OPEN</span>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                color: '#d97706',
                fontSize: '0.9rem',
                fontWeight: 700,
                background: '#fef3c7',
                padding: '0.2rem 0.65rem',
                borderRadius: '12px',
              }}>
                ⭐ {restaurant.rating?.toFixed(1) || '4.0'}
              </span>
              {restaurant.cuisineType ? (
                restaurant.cuisineType.split(',').map(t => t.trim()).filter(Boolean).map(cuisine => (
                  <span key={cuisine} style={{
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                  }}>
                    {cuisine}
                  </span>
                ))
              ) : (
                <span style={{
                  fontSize: '0.85rem',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                }}>
                  Various
                </span>
              )}
            </div>

            <h1 style={{ color: '#0f172a', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', margin: '0 0 0.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
              {restaurant.name}
            </h1>

            {restaurant.description && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
                {restaurant.description}
              </p>
            )}

            <div className="restaurant-detail-grid">
              {[
                { label: 'DELIVERY AREA', value: restaurant.city || 'Local', icon: '📍' },
                { label: 'CUISINE TYPE', value: restaurant.cuisineType?.split(',').map(t => t.trim()).join(', ') || 'Various', icon: '🍴' },
                { label: 'OPENING HOURS', value: `${restaurant.openingTime || '—'} - ${restaurant.closingTime || '—'}`, icon: '🕒' },
              ].map((info) => (
                <div key={info.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.1rem', marginTop: '0.1rem' }}>{info.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {info.label}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', marginTop: '0.05rem', wordBreak: 'break-word' }}>
                      {info.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Pill Filters */}
        {categories.length > 0 && (
          <div className="restaurant-category-container">
            {['', ...categories].map((c) => (
              <button
                key={c || 'all'}
                onClick={() => setCategory(c)}
                style={{
                  padding: '0.6rem 1.5rem',
                  borderRadius: '30px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  transition: 'var(--transition)',
                  backgroundColor: (c === '' && !category) || c === category ? 'var(--primary)' : 'transparent',
                  color: (c === '' && !category) || c === category ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: (c === '' && !category) || c === category ? '0 6px 15px rgba(255,107,53,0.3)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (c !== category) e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  if (c !== category) e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                {c || 'All Menu'}
              </button>
            ))}
          </div>
        )}

        {/* Menu Title Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: '#0f172a' }}>
            🍽️ Menu Selection
          </h3>
          <span className="badge badge-primary" style={{ padding: '0.2rem 0.65rem' }}>
            {filtered.length} items
          </span>
          <div style={{ flex: 1, height: '1.5px', backgroundColor: 'var(--border)' }} />
        </div>

        {/* Menu Items List */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <h3>Menu Empty</h3>
            <p>There are no items added under this category yet. Check back soon!</p>
          </div>
        ) : (
          <div className="restaurant-menu-list">
            {filtered.map((item) => (
              <div key={item.id} className="menu-item-responsive-card">
                {/* Product image block or circle/square placeholder */}
                {item.imageUrl ? (
                  <div className="menu-item-responsive-img-wrapper">
                    <img src={item.imageUrl} alt={item.name} />
                  </div>
                ) : (
                  <div
                    className="menu-item-responsive-placeholder"
                    style={{ backgroundColor: item.isVeg ? '#f0fdf4' : '#fef2f2' }}
                  >
                    {/* Circle Veg/Non-Veg visual design inside placeholder */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: item.isVeg ? '#dcfce7' : '#fee2e2',
                      border: `2.5px dashed ${item.isVeg ? '#22c55e' : '#ef4444'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                    }}>
                      {item.isVeg ? '🥗' : '🍖'}
                    </div>
                  </div>
                )}

                {/* Details pane */}
                <div className="menu-item-responsive-details">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    {/* Circle indicator badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
                      border: `1.5px solid ${item.isVeg ? '#22c55e' : '#ef4444'}`,
                      padding: '2px',
                      borderRadius: '4px',
                      flexShrink: 0,
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: item.isVeg ? '#22c55e' : '#ef4444',
                      }} />
                    </span>
                    
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.01em' }}>
                      {item.name}
                    </h4>

                    {item.status === 'UNAVAILABLE' && (
                      <span className="badge badge-danger" style={{ fontSize: '0.62rem', padding: '0.15rem 0.5rem' }}>SOLD OUT</span>
                    )}
                  </div>

                  {item.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.75rem', lineHeight: 1.45 }}>
                      {item.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {item.category && (
                      <span style={{
                        fontSize: '0.72rem',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-muted)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                      }}>
                        {item.category.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing & Add block */}
                <div className="menu-item-responsive-pricing">
                  <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                    ₹{item.price?.toFixed(2)}
                  </span>
                  
                  {getRole() === 'CUSTOMER' && item.status !== 'UNAVAILABLE' && (
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={addingId === item.id}
                      className="btn btn-primary btn-sm menu-item-responsive-pricing-btn"
                    >
                      {addingId === item.id ? (
                        <span className="spinner-sm" />
                      ) : (
                        '+ Add To Cart'
                      )}
                    </button>
                  )}

                  {getRole() === 'CUSTOMER' && item.status === 'UNAVAILABLE' && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Unavailable</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
