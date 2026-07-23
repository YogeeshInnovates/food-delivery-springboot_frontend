import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrderDetails, cancelOrder } from '../api/orders';
import useAuthStore from '../store/authStore';

const STATUS_BADGE = {
  PENDING_PAYMENT: 'badge-warning',
  PLACED: 'badge-primary',
  ACCEPTED: 'badge-primary',
  PREPARING: 'badge-warning',
  OUT_FOR_DELIVERY: 'badge-warning',
  DELIVERED: 'badge-success',
  CANCELLED: 'badge-danger',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRole } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const isDelivered = (() => {
    try {
      return (JSON.parse(localStorage.getItem('deliveredOrders') || '[]')).includes(Number(id));
    } catch (e) { return false; }
  })();

  useEffect(() => {
    getOrderDetails(id)
      .then((r) => setOrder(r.data))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await cancelOrder(id);
      toast.success('Order cancelled');
      setOrder((prev) => ({ ...prev, status: 'CANCELLED' }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!order) return <div className="page flex-center"><p>Order not found</p></div>;

  const getStepIndex = (status) => {
    if (status === 'CANCELLED') return -1;
    if (status === 'PENDING_PAYMENT' || status === 'PLACED') return 1;
    if (status === 'ACCEPTED' || status === 'PREPARING') return 2;
    if (status === 'OUT_FOR_DELIVERY') return 3;
    if (status === 'DELIVERED') return 4;
    return 1;
  };

  const currentStep = isDelivered ? 4 : getStepIndex(order.status);

  return (
    <div className="page" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingTop: '76px' }}>
      <div className="container section" style={{ maxWidth: '750px', padding: '3rem 1.5rem 5rem' }}>
        
        <button
          className="btn btn-secondary btn-sm"
          style={{ marginBottom: '1.75rem', borderRadius: '20px' }}
          onClick={() => navigate(-1)}
        >
          ← Go Back
        </button>

        <div className="card" style={{ padding: '2rem 2.25rem', backgroundColor: '#ffffff', borderRadius: '20px' }}>
          {/* Header section */}
          <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Transaction Receipt
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.15rem 0 0.25rem', letterSpacing: '-0.02em', color: '#0f172a' }}>
                Order #{order.id}
              </h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                {new Date(order.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <span className={`badge ${STATUS_BADGE[order.status] || 'badge-muted'}`} style={{ fontSize: '0.82rem', padding: '0.45rem 1.1rem' }}>
              {order.status.replace('_', ' ')}
            </span>
          </div>

          {/* Stepper Timeline Progress Indicator */}
          {order.status !== 'CANCELLED' && (
            <div style={{
              margin: '0.5rem 0 2.5rem',
              background: '#fafaf9',
              padding: '1.5rem 1.25rem',
              borderRadius: '16px',
              border: '1.5px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', width: '100%' }}>
                {/* Horizontal connection line */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '10%',
                  right: '10%',
                  height: '4px',
                  background: 'var(--border)',
                  zIndex: 1,
                }} />
                
                {/* Active progress line */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '10%',
                  width: currentStep === 1 ? '20%' : currentStep === 2 ? '47%' : currentStep === 3 ? '73%' : '80%',
                  height: '4px',
                  background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                  zIndex: 2,
                  transition: 'width 0.4s ease',
                }} />

                {[
                  { title: 'Placed', icon: '📝', step: 1 },
                  { title: 'Preparing', icon: '🍳', step: 2 },
                  { title: 'Dispatched', icon: '🛵', step: 3 },
                  { title: 'Delivered', icon: '✅', step: 4 },
                ].map((s) => {
                  const isActive = currentStep >= s.step;
                  return (
                    <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, flex: 1, textAlign: 'center' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isActive ? 'var(--primary)' : '#ffffff',
                        border: `2.5px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                        color: isActive ? '#ffffff' : 'var(--text-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        boxShadow: isActive ? '0 4px 10px rgba(255, 107, 53, 0.3)' : 'none',
                        transition: 'all 0.3s ease',
                      }}>
                        {s.step}
                      </div>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: isActive ? 'var(--text)' : 'var(--text-dim)',
                        marginTop: '0.5rem',
                      }}>
                        {s.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Restaurant Details */}
          <div style={{ marginBottom: '1.75rem', borderBottom: '1.5px solid var(--border)', paddingBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
              RESTAURANT PROVIDER
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🏪</span>
              {order.restaurantName}
            </div>
          </div>

          {/* Payment metadata */}
          {order.paymentMethod && (
            <div style={{
              display: 'flex',
              gap: '2.5rem',
              flexWrap: 'wrap',
              marginBottom: '2rem',
              background: '#fcfbf9',
              padding: '1.15rem 1.5rem',
              borderRadius: '16px',
              border: '1px solid var(--border)',
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                  PAYMENT GATEWAY
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                  {order.paymentMethod === 'UPI' && '📱 UPI Transactions'}
                  {order.paymentMethod === 'CARD' && '💳 Debit/Credit Card'}
                  {order.paymentMethod === 'COD' && '💵 Cash on Delivery'}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                  STATUS
                </div>
                <span style={{
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED' ? 'var(--success)' : order.paymentStatus === 'PROCESSING_REFUND' ? '#d97706' : 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}>
                  {order.paymentStatus === 'PAID' && '✅ Payment Settled'}
                  {order.paymentStatus === 'PROCESSING_REFUND' && '⏳ Refund Processing'}
                  {order.paymentStatus === 'REFUNDED' && '✅ Refund Complete'}
                  {(!order.paymentStatus || order.paymentStatus === 'PENDING') && '⏳ Action Pending'}
                  {order.paymentStatus === 'FAILED' && '❌ Payment Failed'}
                </span>
              </div>
            </div>
          )}

          {/* Bill items */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              ORDERED ITEMS & PRICING
            </div>
            {order.items?.map((item, i) => (
              <div
                key={i}
                className="flex-between"
                style={{
                  padding: '0.95rem 0',
                  borderBottom: '1.5px solid var(--border)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                <span>
                  {item.name} <span style={{ color: 'var(--text-dim)', marginLeft: '0.35rem', fontWeight: 700 }}>× {item.quantity}</span>
                </span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>
                  ₹{(item.priceAtOrder * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total bill display */}
          <div className="cart-total" style={{ borderRadius: '16px' }}>
            <span>{order.status === 'CANCELLED' && order.refundAmount != null ? 'Total Bill' : 'Total Bill Paid'}</span>
            <span style={{
              fontSize: '1.45rem', fontWeight: 900,
              color: order.status === 'CANCELLED' && order.refundAmount != null ? '#dc2626' : 'var(--primary)',
            }}>
              ₹{order.totalAmount?.toFixed(2)}
            </span>
          </div>
          {order.status === 'CANCELLED' && order.refundAmount != null && (
            <div style={{
              marginTop: '0.75rem', padding: '0.85rem 1rem', borderRadius: '12px',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.9rem', color: '#059669', marginBottom: '0.3rem' }}>
                <span>🔄 Refund Amount</span>
                <span>₹{order.refundAmount?.toFixed(2)}</span>
              </div>
              {order.cancellationReason && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Reason: {order.cancellationReason}
                </div>
              )}
              <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 600, marginTop: '0.35rem', background: '#fef3c7', padding: '0.35rem 0.7rem', borderRadius: '8px', display: 'inline-block' }}>
                {order.paymentStatus === 'PROCESSING_REFUND' ? '⏳ Refund will be processed within a minute' : '✅ Refund completed'}
              </div>
            </div>
          )}

          {/* Action triggers */}
          {order.status === 'PLACED' && (
            <div style={{
              marginTop: '1.5rem', padding: '1.5rem', borderRadius: '16px', textAlign: 'center',
              background: 'linear-gradient(135deg, #fef3c7, #ffedd5)',
              border: '1.5px solid #fcd34d',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#92400e', marginBottom: '0.35rem' }}>
                Waiting for restaurant to accept your order
              </div>
              <div style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 500 }}>
                The restaurant will confirm your order shortly. You can track it once accepted.
              </div>
              {getRole() === 'CUSTOMER' && (
                <button
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={cancelling}
                  style={{ borderRadius: '30px', marginTop: '1rem', padding: '0.5rem 1.5rem', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  {cancelling ? <span className="spinner-sm" /> : '✕ Cancel Order'}
                </button>
              )}
            </div>
          )}
          {order.status === 'ACCEPTED' || order.status === 'PREPARING' || order.status === 'OUT_FOR_DELIVERY' ? (
            <div style={{ marginTop: '1.5rem' }}>
              <button
                className="btn btn-primary btn-full"
                onClick={() => navigate(`/tracking/${id}`)}
                style={{ borderRadius: '30px' }}
              >
                🛵 Live Track Delivery
              </button>
            </div>
          ) : order.status === 'PENDING_PAYMENT' && getRole() === 'CUSTOMER' ? (
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.8rem' }}>
              <button
                className="btn btn-danger btn-full"
                onClick={handleCancel}
                disabled={cancelling}
                style={{ borderRadius: '30px' }}
              >
                {cancelling ? <span className="spinner-sm" /> : '✕ Cancel Order'}
              </button>
              <button
                className="btn btn-primary btn-full"
                onClick={() => navigate(`/payment/${id}`)}
                style={{ borderRadius: '30px' }}
              >
                💳 Complete Payment
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
