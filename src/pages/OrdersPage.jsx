import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyOrders, getMyTotalSpend } from '../api/orders';

const STATUS_BADGE = {
  PENDING_PAYMENT: 'badge-warning',
  PLACED: 'badge-primary',
  ACCEPTED: 'badge-primary',
  PREPARING: 'badge-warning',
  OUT_FOR_DELIVERY: 'badge-warning',
  DELIVERED: 'badge-success',
  CANCELLED: 'badge-danger',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [totalSpend, setTotalSpend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingIds, setTrackingIds] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getMyOrders(0, 20).then((r) => setOrders(r.data.content || r.data)),
      getMyTotalSpend().then((r) => setTotalSpend(r.data)),
    ]).catch((err) => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!orders.length) return;
    const delivered = (() => { try { return JSON.parse(localStorage.getItem('deliveredOrders') || '[]'); } catch (e) { return []; } })();
    const activeStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'];
    const MAX_TRACKING_AGE = 180000;
    const ids = new Set();
    let latestId = -1;
    const now = Date.now();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('tracking_')) {
        const orderId = Number(key.replace('tracking_', ''));
        const savedTime = (() => { try { return parseInt(localStorage.getItem(key)); } catch (e) { return 0; } })();
        const order = orders.find(o => o.id === orderId);
        if (order && activeStatuses.includes(order.status) && !delivered.includes(orderId) && (now - savedTime) < MAX_TRACKING_AGE) {
          ids.add(orderId);
          if (orderId > latestId) latestId = orderId;
        } else {
          localStorage.removeItem(key);
        }
      }
    }
    const newest = new Set(latestId > 0 ? [latestId] : []);
    setTrackingIds(newest);
  }, [orders]);

  if (loading) return <div className="page"><div className="spinner" /></div>;

  return (
    <div className="page" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingTop: '76px' }}>
      <div className="container section" style={{ maxWidth: '800px', padding: '3rem 1.5rem 5rem' }}>
        
        {/* Header Summary */}
        <div className="page-header flex-between" style={{ marginBottom: '2.5rem', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Order History
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.2rem 0 0', letterSpacing: '-0.02em', color: '#0f172a' }}>
              📦 My Orders
            </h2>
          </div>
          {totalSpend !== null && (
            <div className="stat-card" style={{
              minWidth: '200px',
              padding: '1rem 1.25rem',
              borderRadius: '16px',
            }}>
              <div className="stat-label" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>TOTAL EXPENDITURE</div>
              <div className="stat-value" style={{ fontSize: '1.65rem' }}>₹{totalSpend?.toFixed(2) || '0.00'}</div>
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No Orders Yet</h3>
            <p>Your order list is empty. Place your first order today to satisfy your cravings!</p>
            <button className="btn btn-primary" onClick={() => navigate('/restaurants')} style={{ borderRadius: '20px' }}>
              Explore Restaurants
            </button>
          </div>
        ) : (
          <div className="grid" style={{ gap: '1.25rem' }}>
            {orders.map((order) => (
              <div
                key={order.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  padding: '1.5rem 1.75rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '18px',
                }}
                onClick={() => {
                  navigate(trackingIds.has(order.id) ? `/tracking/${order.id}` : `/orders/${order.id}`);
                }}
              >
                <div className="order-header">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: 'var(--primary)' }}>
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                      </svg>
                      Order #{order.id}
                    </div>
                    <div className="order-meta" style={{ fontWeight: 600 }}>
                      {order.restaurantName} · {new Date(order.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.45rem' }}>
                    {trackingIds.has(order.id) ? (
                      <span className="badge badge-warning" style={{ fontSize: '0.72rem', padding: '0.25rem 0.75rem' }}>
                        In Progress
                      </span>
                    ) : (
                      <span className={`badge ${STATUS_BADGE[order.status] || 'badge-muted'}`} style={{ fontSize: '0.72rem', padding: '0.25rem 0.75rem' }}>
                        {order.status.replace('_', ' ')}
                      </span>
                    )}
                    <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.1rem' }}>
                      ₹{order.totalAmount?.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="order-items-list" style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                    {order.items?.slice(0, 3).map((i) => `${i.name} (${i.quantity}x)`).join(', ')}
                    {order.items?.length > 3 && ` +${order.items.length - 3} more items`}
                  </div>
                  {trackingIds.has(order.id) && (
                    <button
                      className="btn btn-primary"
                      style={{ borderRadius: '20px', padding: '0.4rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/tracking/${order.id}`); }}
                    >
                      Track
                    </button>
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
