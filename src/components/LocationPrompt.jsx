import { useState } from 'react';
import toast from 'react-hot-toast';

export default function LocationPrompt({ onConfirm }) {
  const [address, setAddress] = useState('');
  const [fetching, setFetching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [coords, setCoords] = useState(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setFetching(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setFetching(false);
        setGeocoding(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } },
          );
          const data = await res.json();
          if (data.display_name) {
            setAddress(data.display_name);
          } else {
            toast('Could not get exact address — you can edit it below', { icon: '📍' });
          }
        } catch {
          toast('Could not get exact address — please enter manually', { icon: '📍' });
        } finally {
          setGeocoding(false);
        }
      },
      () => {
        setFetching(false);
        toast.error('Could not get location. Please enter manually.');
      },
    );
  };

  const handleConfirm = () => {
    if (!address.trim() && !coords) {
      toast.error('Please enter your delivery address or use current location');
      return;
    }
    onConfirm({
      address: address.trim() || 'Current Location',
      lat: coords?.lat,
      lng: coords?.lng,
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', maxWidth: '440px', width: '100%',
        padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📍</div>
          <h3 style={{ margin: '0 0 0.25rem' }}>Set Delivery Location</h3>
          <p className="text-muted fs-sm" style={{ margin: 0 }}>
            Where should we deliver your order?
          </p>
        </div>

        <button
          onClick={getCurrentLocation}
          disabled={fetching || geocoding}
          style={{
            width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px dashed var(--primary)',
            background: 'rgba(249,115,22,0.06)', cursor: 'pointer', fontWeight: 600,
            color: 'var(--primary)', fontSize: '0.95rem', marginBottom: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}
        >
          {fetching ? (
            <><span className="spinner-sm" style={{ borderTopColor: 'var(--primary)', borderColor: 'rgba(249,115,22,0.2)' }} /> Detecting...</>
          ) : geocoding ? (
            <><span className="spinner-sm" style={{ borderTopColor: 'var(--primary)', borderColor: 'rgba(249,115,22,0.2)' }} /> Getting address...</>
          ) : coords ? (
            '✅ Location Detected'
          ) : (
            '📍 Use My Current Location'
          )}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span className="text-muted fs-sm">or enter manually</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <textarea
          placeholder="Flat / House No., Building, Street, Area, City"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          style={{
            width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border)',
            fontSize: '0.9rem', resize: 'none', marginBottom: '1.25rem', fontFamily: 'inherit',
          }}
        />

        <button
          onClick={handleConfirm}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem', fontWeight: 600 }}
        >
          Confirm Location & Place Order
        </button>
      </div>
    </div>
  );
}
