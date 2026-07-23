import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrderDetails, payForOrder } from '../api/orders';

const PAYMENT_OPTIONS = [
  {
    id: 'UPI',
    label: 'UPI',
    desc: 'Google Pay, PhonePe, Paytm & more',
    icon: '📱',
  },
  {
    id: 'CARD',
    label: 'Credit / Debit Card',
    desc: 'Visa, Mastercard, RuPay',
    icon: '💳',
  },
  {
    id: 'COD',
    label: 'Cash on Delivery',
    desc: 'Pay when your food arrives',
    icon: '💵',
  },
];

export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('UPI');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    getOrderDetails(id)
      .then((r) => {
        if (r.data.status !== 'PENDING_PAYMENT') {
          navigate(`/tracking/${id}`, { replace: true });
          return;
        }
        setOrder(r.data);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePay = async () => {
    setProcessing(true);
    try {
      if (method !== 'COD') {
        await new Promise((r) => setTimeout(r, 2000));
      }
      const res = await payForOrder(id, method);
      setOrder(res.data);
      toast.success(
        method === 'COD'
          ? 'Order placed! Pay on delivery 💵'
          : 'Payment successful! ✅'
      );
      navigate(`/tracking/${id}`, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!order) return null;

  return (
    <div className="page">
      <div className="container section" style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.3rem' }}>💳 Complete Payment</h2>
          <p className="text-muted fs-sm">Order #{order.id} · {order.restaurantName}</p>
        </div>

        {/* Order Summary */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="text-muted fs-sm" style={{ marginBottom: '0.75rem', fontWeight: 600 }}>ORDER SUMMARY</div>
          {order.items?.map((item, i) => (
            <div key={i} className="flex-between" style={{ padding: '0.4rem 0', borderBottom: i < order.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span>{item.name} <span className="text-muted">× {item.quantity}</span></span>
              <span className="fw-700">₹{(item.priceAtOrder * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="cart-total" style={{ marginTop: '0.75rem', paddingTop: '0.75rem' }}>
            <span>Total</span>
            <span className="text-primary" style={{ fontSize: '1.25rem' }}>₹{order.totalAmount?.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="card">
          <div className="text-muted fs-sm" style={{ marginBottom: '0.75rem', fontWeight: 600 }}>PAYMENT METHOD</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {PAYMENT_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.9rem', cursor: 'pointer',
                  padding: '1rem 1.25rem', borderRadius: '12px', transition: 'var(--transition)',
                  border: method === opt.id ? '2px solid var(--primary)' : '2.5px solid var(--border)',
                  background: method === opt.id ? 'var(--primary-light)' : '#ffffff',
                  boxShadow: method === opt.id ? 'var(--shadow-glow)' : 'none',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={opt.id}
                  checked={method === opt.id}
                  onChange={() => setMethod(opt.id)}
                  style={{ accentColor: 'var(--primary)', width: '1.2rem', height: '1.2rem' }}
                />
                <span style={{ fontSize: '1.65rem' }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="fw-700" style={{ fontSize: '0.95rem', color: '#0f172a' }}>{opt.label}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.1rem' }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <button
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: '1.25rem' }}
            onClick={handlePay}
            disabled={processing}
          >
            {processing ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="spinner-sm" /> Processing Payment...
              </span>
            ) : method === 'COD' ? (
              'Place Order (Pay on Delivery)'
            ) : (
              `Pay ₹${order.totalAmount?.toFixed(2)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
