import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrderDetails, cancelOrder, confirmDelivery, advanceStatus } from '../api/orders';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DELIVERY_PARTNERS = [
  { name: 'Rahul Sharma', phone: '+91-9876543210', vehicle: '🏍️' },
  { name: 'Amit Kumar', phone: '+91-8765432109', vehicle: '🛵' },
  { name: 'Suresh Reddy', phone: '+91-7654321098', vehicle: '🚲' },
  { name: 'Vikram Singh', phone: '+91-6543210987', vehicle: '🏍️' },
  { name: 'Ravi Patel', phone: '+91-5432109876', vehicle: '🛵' },
  { name: 'Manoj Joshi', phone: '+91-4321098765', vehicle: '🚲' },
  { name: 'Deepak Verma', phone: '+91-3210987654', vehicle: '🏍️' },
  { name: 'Sanjay Gupta', phone: '+91-2109876543', vehicle: '🛵' },
  { name: 'Arun Nair', phone: '+91-1234567890', vehicle: '🛵' },
  { name: 'Karthik Iyer', phone: '+91-9988776655', vehicle: '🏍️' },
];

const STATUSES = [
  { key: 'PLACED', label: 'Order Placed', icon: '✅' },
  { key: 'ACCEPTED', label: 'Order Accepted', icon: '👍' },
  { key: 'PREPARING', label: 'Preparing Your Food', icon: '👨‍🍳' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🛵' },
  { key: 'DELIVERED', label: 'Delivered', icon: '📍' },
];

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function interpolate(a, b, t) {
  return a + (b - a) * t;
}

export default function OrderTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const bikeMarker = useRef(null);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(-1);
  const [eta, setEta] = useState('');
  const [bikeProgress, setBikeProgress] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [partner, setPartner] = useState(null);
  const REASONS = [
    'Changed my mind',
    'Found a better option',
    'Delivery taking too long',
    'Wrong delivery address',
    'Ordered by mistake',
    'Price too high',
    'Other',
  ];

  const updateMapPosition = useCallback((restLat, restLng, userLat, userLng, progress) => {
    if (!mapInstance.current || !bikeMarker.current) return;
    const lat = interpolate(restLat, userLat, progress);
    const lng = interpolate(restLng, userLng, progress);
    bikeMarker.current.setLatLng([lat, lng]);
  }, []);

  useEffect(() => {
    getOrderDetails(id)
      .then((r) => {
        if (r.data.status === 'PENDING_PAYMENT') {
          navigate(`/payment/${id}`, { replace: true });
          return;
        }
        setOrder(r.data);
        const idx = STATUSES.findIndex((s) => s.key === r.data.status);
        setCurrentStep(idx >= 0 ? idx : -1);

        const trackingKey = `tracking_${id}`;
        if (!localStorage.getItem(trackingKey)) {
          try { localStorage.setItem(trackingKey, Date.now()); } catch (e) {}
        }

        const partnerKey = `partner_${id}`;
        let selected = (() => { try { return JSON.parse(localStorage.getItem(partnerKey)); } catch (e) { return null; } })();
        if (!selected) {
          selected = DELIVERY_PARTNERS[Math.floor(Math.random() * DELIVERY_PARTNERS.length)];
          try { localStorage.setItem(partnerKey, JSON.stringify(selected)); } catch (e) {}
        }
        setPartner(selected);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!order || order.status !== 'PLACED') return;
    const interval = setInterval(() => {
      getOrderDetails(id)
        .then((r) => {
          if (r.data.status !== 'PLACED') {
            setOrder(r.data);
            toast.success('Restaurant accepted your order! 🎉');
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [order?.status, id]);

  useEffect(() => {
    if (!order) return;

    const restLat = order.restaurantLatitude || 12.9716;
    const restLng = order.restaurantLongitude || 77.5946;
    const userLat = order.deliveryLatitude || 12.9352;
    const userLng = order.deliveryLongitude || 77.6245;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { zoomControl: true }).setView([restLat, restLng], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(mapInstance.current);

      const restaurantIcon = L.divIcon({ html: '<span style="font-size:2rem">🏪</span>', iconSize: [32, 32], className: '' });
      const userIcon = L.divIcon({ html: '<span style="font-size:2rem">📍</span>', iconSize: [32, 32], className: '' });
      const bikeIcon = L.divIcon({ html: '<span style="font-size:2rem">🛵</span>', iconSize: [32, 32], className: '' });

      L.marker([restLat, restLng], { icon: restaurantIcon }).addTo(mapInstance.current).bindPopup(order.restaurantName);
      L.marker([userLat, userLng], { icon: userIcon }).addTo(mapInstance.current).bindPopup('Your Location');
      bikeMarker.current = L.marker([restLat, restLng], { icon: bikeIcon }).addTo(mapInstance.current);

      const bounds = L.latLngBounds([restLat, restLng], [userLat, userLng]);
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        bikeMarker.current = null;
      }
    };
  }, [order]);

  useEffect(() => {
    if (!order || currentStep < 0) return;

    const wasDelivered = (() => {
      try {
        return (JSON.parse(localStorage.getItem('deliveredOrders') || '[]')).includes(order.id);
      } catch (e) { return false; }
    })();
    if (wasDelivered) {
      setCurrentStep(4);
      setBikeProgress(1);
      setEta('');
      updateMapPosition(
        order.restaurantLatitude || 12.9716,
        order.restaurantLongitude || 77.5946,
        order.deliveryLatitude || 12.9352,
        order.deliveryLongitude || 77.6245,
        1
      );
      return;
    }

    const restLat = order.restaurantLatitude || 12.9716;
    const restLng = order.restaurantLongitude || 77.5946;
    const userLat = order.deliveryLatitude || 12.9352;
    const userLng = order.deliveryLongitude || 77.6245;

    const distance = calcDistance(restLat, restLng, userLat, userLng);
    const speedKmh = 25;
    const etaMin = Math.max(2, Math.ceil((distance / speedKmh) * 60));
    const cappedEta = Math.min(etaMin, 2);

    if (order.status === 'PLACED') {
      setCurrentStep(0);
      setBikeProgress(0);
      setEta('Waiting...');
      return;
    }

    const storageKey = `tracking_${order.id}`;
    let startTime = (() => {
      try { return parseInt(localStorage.getItem(storageKey)); } catch (e) { return null; }
    })();
    const now = Date.now();
    if (!startTime) {
      startTime = now;
      try { localStorage.setItem(storageKey, startTime); } catch (e) {}
    }

    const ACCEPTED_DURATION = 30000;
    const PREP_DURATION = 45000;
    const DELIVERY_DURATION = 90000;
    const totalMs = ACCEPTED_DURATION + PREP_DURATION + DELIVERY_DURATION;

    const advKey = `advancing_${order.id}`;
    let lastAdvStep = (() => { try { return parseInt(localStorage.getItem(advKey)) || 0; } catch (e) { return 0; } })();
    let advancing = false;

    const doAdvance = (targetStep) => {
      if (targetStep <= lastAdvStep || advancing) return;
      advancing = true;
      advanceStatus(order.id)
        .then(() => { lastAdvStep = targetStep; try { localStorage.setItem(advKey, targetStep); } catch (e) {} })
        .catch(() => {})
        .finally(() => { advancing = false; });
    };

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
      setEta(`${Math.ceil(remaining / 60)}m`);

      if (elapsed < ACCEPTED_DURATION) {
        setCurrentStep(1);
        setBikeProgress(0);
        doAdvance(1);
      } else if (elapsed < ACCEPTED_DURATION + PREP_DURATION) {
        setCurrentStep(2);
        setBikeProgress(0);
        doAdvance(2);
      } else if (elapsed < totalMs) {
        setCurrentStep(3);
        doAdvance(3);
        const deliveryProgress = (elapsed - ACCEPTED_DURATION - PREP_DURATION) / DELIVERY_DURATION;
        const clamped = Math.min(deliveryProgress, 1);
        setBikeProgress(clamped);
        updateMapPosition(restLat, restLng, userLat, userLng, clamped);
      } else {
        setCurrentStep(4);
        setBikeProgress(1);
        doAdvance(4);
        updateMapPosition(restLat, restLng, userLat, userLng, 1);
      }

      if (elapsed < totalMs) {
        requestAnimationFrame(tick);
      } else {
        try {
          localStorage.removeItem(storageKey);
          localStorage.removeItem(advKey);
          const delivered = JSON.parse(localStorage.getItem('deliveredOrders') || '[]');
          if (!delivered.includes(order.id)) {
            delivered.push(order.id);
            localStorage.setItem('deliveredOrders', JSON.stringify(delivered));
          }
        } catch (e) {}
      }
    };

    const frame = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [order, currentStep >= 0]);

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!order) return null;

  const isDelivered = currentStep >= 4;
  const restName = order.restaurantName || 'Restaurant';

  return (
    <div className="page" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingTop: '76px' }}>
      <div className="container" style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>

        {/* Map Card */}
        <div style={{
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
          marginBottom: '1.5rem',
          position: 'relative',
          height: '320px',
        }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          {isDelivered && (
            <div style={{
              position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)',
              background: '#10b981', color: '#fff', padding: '0.55rem 1.25rem', borderRadius: '30px',
              fontWeight: 700, fontSize: '0.88rem', zIndex: 1000, boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap',
            }}>
              ✅ Delivered to your location!
            </div>
          )}
        </div>

        {/* ETA Card */}
        {!isDelivered && eta && order.status !== 'PLACED' && currentStep >= 2 && (
          <div className="card" style={{
            padding: '1.25rem', marginBottom: '1rem', textAlign: 'center',
            borderRadius: '16px',
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Estimated Delivery Time</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)' }}>
              ~{eta}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.15rem', fontWeight: 600 }}>
              {restName} → Your Location
            </div>
          </div>
        )}

        {isDelivered && (
          <div className="card" style={{
            padding: '1.5rem', marginBottom: '1rem', textAlign: 'center',
            borderRadius: '16px',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🎉</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>Your food has been delivered!</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600 }}>Enjoy your meal from {restName}</div>
          </div>
        )}

        {/* Order Info Bar */}
        <div className="card" style={{
          padding: '1.1rem 1.5rem', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderRadius: '16px',
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Order #{order.id}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{restName}</div>
          </div>
          <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.15rem' }}>₹{order.totalAmount?.toFixed(2)}</span>
        </div>

        {/* Order Accepted - shows during step 1 only */}
        {currentStep === 1 && !isDelivered && (
          <div className="card" style={{
            padding: '1.5rem', marginBottom: '1rem', borderRadius: '16px', textAlign: 'center',
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            border: '1.5px solid #86efac',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>👍</div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#166534', marginBottom: '0.25rem' }}>
              {restName} accepted your order!
            </div>
            <div style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 500 }}>
              Finding you a delivery partner...
            </div>
          </div>
        )}

        {/* Delivery Partner Card */}
        {partner && !isDelivered && order.status !== 'PLACED' && currentStep >= 2 && (
          <div className="card" style={{
            padding: '1.25rem 1.5rem', marginBottom: '1rem', borderRadius: '16px',
            background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
            border: '1.5px solid #bae6fd',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'var(--primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', fontWeight: 700, flexShrink: 0,
              }}>
                {partner.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  {partner.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                  📞 {partner.phone}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {partner.vehicle} Delivery Partner
                </div>
                <div style={{
                  fontSize: '0.85rem', marginTop: '0.35rem', fontWeight: 600,
                  color: currentStep === 2 ? '#d97706' : 'var(--primary)',
                  background: currentStep === 2 ? '#fef3c7' : '#e0f2fe',
                  display: 'inline-block', padding: '0.2rem 0.75rem', borderRadius: '20px',
                }}>
                  {currentStep === 1
                    ? '🚶 Heading to restaurant to pick up'
                    : currentStep === 2
                      ? `🔄 ${restName} is preparing your order`
                      : currentStep === 3
                        ? '🛵 Your food is on the way!'
                        : '📍 Getting your order ready'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel section (visible during PLACED / PREPARING) */}
        {(order.status === 'PLACED' || (currentStep >= 1 && currentStep < 3)) && (
          <div className="card" style={{
            padding: '1.25rem', marginBottom: '1rem', borderRadius: '16px', textAlign: 'center',
            background: 'linear-gradient(135deg, #fef3c7, #ffedd5)',
            border: '1.5px solid #fcd34d',
          }}>
            <div style={{
              overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: '0.75rem',
            }}>
              <div style={{
                display: 'inline-block',
                animation: 'marquee 12s linear infinite',
                fontSize: '0.85rem', fontWeight: 600, color: '#92400e',
              }}>
                ⚠️ &nbsp;You can cancel your order anytime before Out for Delivery &nbsp; ⚠️ &nbsp;
                You can cancel your order anytime before Out for Delivery &nbsp; ⚠️
              </div>
            </div>
            <button
              className="btn"
              style={{
                background: '#ef4444', color: '#fff', border: 'none',
                padding: '0.65rem 2rem', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem',
                cursor: 'pointer', transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
              onClick={() => { setCancelReason(''); setCustomReason(''); setShowCancelModal(true); }}
            >
              Cancel Order
            </button>
          </div>
        )}

        {/* Timeline */}
        <div className="card" style={{
          padding: '1.75rem', borderRadius: '16px',
        }}>
          {STATUSES.map((s, i) => {
            const done = i <= currentStep;
            const active = i === currentStep;
            return (
              <div key={s.key} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: i < STATUSES.length - 1 ? '1.25rem' : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
                    background: done ? 'var(--primary)' : '#f3f4f6',
                    color: done ? '#fff' : '#d1d5db',
                    boxShadow: active ? '0 0 0 4px rgba(249,115,22,0.2)' : 'none',
                    transition: 'all 0.3s',
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  {i < STATUSES.length - 1 && (
                    <div style={{
                      width: '2px', flex: 1, minHeight: '32px', marginTop: '4px',
                      background: done ? 'var(--primary)' : '#e5e7eb',
                      transition: 'background 0.3s',
                    }} />
                  )}
                </div>
                <div style={{ paddingTop: '4px', flex: 1 }}>
                  <div style={{
                    fontWeight: active ? 700 : done ? 600 : 400,
                    color: done ? '#1f2937' : '#9ca3af',
                    fontSize: '0.95rem',
                    transition: 'all 0.3s',
                  }}>
                    {s.icon} {s.label}
                  </div>
                  {active && !isDelivered && (
                    <div style={{
                      marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary)',
                      fontWeight: 500,
                    }}>
                      {s.key === 'OUT_FOR_DELIVERY'
                        ? `${partner ? partner.name + ' ' : ''}Your delivery partner is on the way! ${eta}`
                        : s.key === 'PREPARING'
                          ? 'Your food is being cooked with love ❤️'
                          : s.key === 'PLACED'
                            ? 'Your order has been placed'
                            : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isDelivered && (
            <div style={{
              marginTop: '1.25rem', padding: '1rem', borderRadius: '12px',
              background: 'rgba(16,185,129,0.08)', textAlign: 'center', fontWeight: 600,
              color: '#059669', fontSize: '0.95rem',
            }}>
              🎉 Your food has been delivered! Enjoy your meal!
            </div>
          )}

          {isDelivered && (
            <button
              className="btn btn-secondary btn-full"
              style={{ marginTop: '1.25rem', borderRadius: '30px' }}
              onClick={() => navigate(`/orders/${id}`)}
            >
              View Receipt
            </button>
          )}
        </div>

        {/* Cancellation Reason Modal */}
        {showCancelModal && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, padding: '1rem',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowCancelModal(false); }}
          >
            <div className="card" style={{
              width: '100%', maxWidth: '460px', padding: '2rem', borderRadius: '20px', backgroundColor: '#fff',
            }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                Cancel Order #{order.id}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', fontWeight: 500 }}>
                Please tell us the reason for cancellation
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {REASONS.map((r) => (
                  <label key={r} style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.55rem 0.85rem',
                    borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
                    background: cancelReason === r ? 'var(--primary-light)' : '#f8fafc',
                    border: cancelReason === r ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                    transition: 'var(--transition)',
                    color: cancelReason === r ? 'var(--primary)' : '#334155',
                  }}>
                    <input
                      type="radio"
                      name="cancelReason"
                      value={r}
                      checked={cancelReason === r}
                      onChange={() => setCancelReason(r)}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    {r}
                  </label>
                ))}
              </div>

              {cancelReason === 'Other' && (
                <textarea
                  className="form-input"
                  placeholder="Describe your reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical', marginBottom: '1rem', minHeight: '70px' }}
                />
              )}

              {(() => {
                const elapsed = order.placedAt ? (Date.now() - new Date(order.placedAt).getTime()) / 1000 : 0;
                const cutPct = elapsed <= 1 ? 4 : elapsed <= 5 ? 10 : 25;
                const refund = order.totalAmount ? order.totalAmount * (1 - cutPct / 100) : 0;
                return (
                  <div style={{
                    background: '#fef3c7', borderRadius: '10px', padding: '0.75rem 1rem',
                    border: '1px solid #fcd34d', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#92400e', fontWeight: 600, lineHeight: 1.6,
                  }}>
                    ⚠️ You placed this order <strong>{Math.round(elapsed)}s</strong> ago. A <strong>{cutPct}% cancellation fee</strong> applies.
                    {refund > 0 ? (
                      <div style={{ marginTop: '0.35rem', fontSize: '0.95rem', color: '#059669' }}>
                        💰 Estimated refund: <strong>₹{refund.toFixed(2)}</strong>
                      </div>
                    ) : (
                      <div style={{ marginTop: '0.35rem' }}>No refund applicable.</div>
                    )}
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ borderRadius: '30px', padding: '0.65rem 1.5rem', fontSize: '0.88rem', fontWeight: 700 }}
                  onClick={() => setShowCancelModal(false)}
                >
                  Go Back
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: '#ef4444', color: '#fff', border: 'none',
                    borderRadius: '30px', padding: '0.65rem 1.5rem', fontSize: '0.88rem',
                    fontWeight: 700, cursor: 'pointer', opacity: cancelReason ? 1 : 0.5,
                    transition: 'var(--transition)',
                  }}
                  disabled={!cancelReason}
                  onMouseEnter={(e) => { if (cancelReason) e.currentTarget.style.background = '#dc2626'; }}
                  onMouseLeave={(e) => { if (cancelReason) e.currentTarget.style.background = '#ef4444'; }}
                  onClick={async () => {
                    const reason = cancelReason === 'Other' ? customReason.trim() : cancelReason;
                    if (!reason) { toast.error('Please select or enter a reason'); return; }
                    try {
                      await cancelOrder(order.id, reason);
                      toast.success('Order cancelled successfully');
                      setShowCancelModal(false);
                      navigate('/orders', { replace: true });
                    } catch (err) {
                      toast.error(err.response?.data?.message || err.message || 'Failed to cancel order');
                    }
                  }}
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
