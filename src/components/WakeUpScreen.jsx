import { useState, useEffect } from 'react';

const BACKEND_URL = 'https://online-food-delivery-pkf3.onrender.com';
const POLL_INTERVAL = 3000;

export default function WakeUpScreen({ onReady }) {
  const [seconds, setSeconds] = useState(0);
  const [checking, setChecking] = useState(false);
  const [services, setServices] = useState([
    { name: 'Backend', ready: false },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkBackend = async () => {
      if (cancelled) return;
      setChecking(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/menu-items/popular`, {
          method: 'GET',
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok && !cancelled) {
          setServices([{ name: 'Backend', ready: true }]);
          setTimeout(() => {
            if (!cancelled) onReady();
          }, 800);
          return;
        }
      } catch {
        // Backend still sleeping, keep polling
      }
      if (!cancelled) setChecking(false);
    };

    checkBackend();
    const interval = setInterval(checkBackend, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [onReady]);

  return (
    <div className="wakeup-screen">
      <div className="wakeup-card">
        <div className="wakeup-logo">🍕</div>
        <h1 className="wakeup-title">We&apos;re sorry for the inconvenience</h1>
        <p className="wakeup-text">
          Our platform runs on a free hosting tier, so after about 15 minutes
          of inactivity the servers go to sleep. It may take up to ~100 seconds
          to wake them up.
        </p>

        <div className="wakeup-services">
          {services.map((svc) => (
            <div key={svc.name} className="wakeup-service">
              <span className={`wakeup-dot ${svc.ready ? 'ready' : ''}`} />
              <span className="wakeup-service-name">{svc.name}</span>
            </div>
          ))}
        </div>

        <p className="wakeup-status">
          {services.every((s) => s.ready) ? (
            <span className="wakeup-ready">Backend is ready! Loading...</span>
          ) : (
            <>
              Waking up... ({seconds}s){' '}
              {checking && <span className="wakeup-pulse">Checking...</span>}
            </>
          )}
        </p>

        <p className="wakeup-note">Please wait &mdash; this is not an error.</p>
      </div>
    </div>
  );
}
