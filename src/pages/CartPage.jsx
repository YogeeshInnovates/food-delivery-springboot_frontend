import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getCart, updateCartItem, removeFromCart, clearCart } from '../api/cart';
import { placeOrder, updateDeliveryAddress } from '../api/orders';
import useCartStore from '../store/cartStore';
import LocationPrompt from '../components/LocationPrompt';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const { fetchCount } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => { loadCart(); }, []);

  const loadCart = async () => {
    try {
      const res = await getCart();
      setCartItems(res.data || []);
      fetchCount();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQty = async (itemId, qty) => {
    if (qty <= 0) { handleRemove(itemId); return; }
    try {
      await updateCartItem(itemId, qty);
      setCartItems((prev) => prev.map((i) => i.menuItemId === itemId ? { ...i, quantity: qty } : i));
      fetchCount();
    } catch (err) { toast.error(err.message); }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeFromCart(itemId);
      setCartItems((prev) => prev.filter((i) => i.menuItemId !== itemId));
      fetchCount();
      toast.success('Item removed');
    } catch (err) { toast.error(err.message); }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      setCartItems([]);
      fetchCount();
      toast.success('Cart cleared');
    } catch (err) { toast.error(err.message); }
  };

  const handleLocationConfirm = async (location) => {
    setShowLocation(false);
    if (location) {
      localStorage.setItem('deliveryLocation', JSON.stringify(location));
    }
    setPlacing(true);
    try {
      const res = await placeOrder();
      const orderId = res.data.id;
      await updateDeliveryAddress(orderId, {
        deliveryAddress: location.address,
        deliveryLatitude: location.lat,
        deliveryLongitude: location.lng,
      });
      setCartItems([]);
      fetchCount();
      toast.success('Order created! Proceed to payment 💳');
      navigate(`/payment/${orderId}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPlacing(false);
    }
  };

  const handlePlaceOrder = async () => {
    const saved = localStorage.getItem('deliveryLocation');
    if (saved) {
      await handleLocationConfirm(JSON.parse(saved));
    } else {
      setShowLocation(true);
    }
  };

  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (loading) return <div className="page"><div className="spinner" /></div>;

  return (
    <div className="page" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingTop: '76px' }}>
      <div className="container section" style={{ maxWidth: '800px', padding: '3rem 1.5rem 5rem' }}>
        
        {/* Header section */}
        <div className="page-header flex-between cart-header-responsive" style={{ marginBottom: '2rem' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              My Selection
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.2rem 0 0', letterSpacing: '-0.02em', color: '#0f172a' }}>
              🛒 Shopping Cart
            </h2>
          </div>
          {cartItems.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={handleClear} style={{ borderRadius: '20px' }}>
              Clear All Items
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <h3>Your Cart Is Empty</h3>
            <p>You haven't added any meals to your order yet. Explore our top restaurants to get started!</p>
            <button className="btn btn-primary" onClick={() => navigate('/restaurants')} style={{ borderRadius: '20px' }}>
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Cart Items Card */}
            <div className="card cart-card-responsive" style={{ padding: '1.5rem 1.75rem', backgroundColor: '#ffffff', borderRadius: '20px' }}>
              {cartItems.map((item, idx) => (
                <div
                  key={item.menuItemId}
                  className="cart-item"
                  style={{
                    borderBottom: idx === cartItems.length - 1 ? 'none' : '1.5px solid var(--border)',
                    padding: '1.25rem 0',
                  }}
                >
                  <div className="cart-item-details">
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>{item.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.15rem', fontWeight: 600 }}>
                      ₹{item.price?.toFixed(2)} each
                    </div>
                  </div>
                  
                  {/* SVG Trash Icon instead of standard X */}
                  <button
                    className="btn btn-sm cart-item-delete"
                    onClick={() => handleRemove(item.menuItemId)}
                    style={{
                      background: 'transparent',
                      color: 'var(--danger)',
                      padding: '0.4rem',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>

                  {/* Actions wrapper to group quantity controls and total price */}
                  <div className="cart-item-actions-wrapper">
                    {/* Styled quantity counters */}
                    <div className="cart-qty">
                      <button
                        onClick={() => handleQty(item.menuItemId, item.quantity - 1)}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid var(--border)',
                          background: '#fafaf9',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        −
                      </button>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', minWidth: '1.5rem', textAlign: 'center', color: '#0f172a' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQty(item.menuItemId, item.quantity + 1)}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid var(--border)',
                          background: '#fafaf9',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        +
                      </button>
                    </div>

                    <div className="cart-item-total" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', minWidth: '85px', textAlign: 'right' }}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Premium receipt invoice card to fill empty layout gaps */}
            <div className="card cart-card-responsive" style={{ padding: '1.75rem 2rem', backgroundColor: '#ffffff', borderRadius: '20px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
                Order Invoice Summary
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '1.25rem', borderBottom: '1.5px dashed var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <span>Items Subtotal</span>
                  <span style={{ color: '#0f172a' }}>₹{total.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <span>Delivery Service Charge</span>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>FREE PROMO</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <span>CGST & SGST Taxes</span>
                  <span style={{ color: '#0f172a' }}>₹0.00</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0 0' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Grand Total Amount</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>₹{total.toFixed(2)}</span>
              </div>

              <button
                className="btn btn-primary btn-full btn-lg"
                style={{ marginTop: '1.5rem', borderRadius: '30px' }}
                onClick={handlePlaceOrder}
                disabled={placing}
              >
                {placing ? (
                  <>
                    <span className="spinner-sm" style={{ marginRight: '0.5rem' }} />
                    Creating Order Receipt...
                  </>
                ) : (
                  <>
                    🚀 Proceed to Delivery Location
                  </>
                )}
              </button>
            </div>

          </div>
        )}
      </div>
      {showLocation && <LocationPrompt onConfirm={handleLocationConfirm} />}
    </div>
  );
}
