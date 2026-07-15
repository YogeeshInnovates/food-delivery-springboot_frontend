import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyProfile, updateMyProfile, uploadProfileImage } from '../api/users';

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [showLocModal, setShowLocModal] = useState(false);
  const [locForm, setLocForm] = useState({ street: '', city: '', state: '', pincode: '', landmark: '' });
  const [addressEditMode, setAddressEditMode] = useState(false);
  const addressSnapshot = useRef(null);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await getMyProfile();
      const data = res.data;
      const parts = (data.address || '').split(' || ').map((s) => s.trim());
      setForm({
        name: data.name || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        address: data.address || '',
        street: parts[0] || (data.address || ''),
        city: parts[1] || '',
        state: parts[2] || '',
        pincode: parts[3] || '',
        landmark: parts[4] || '',
      });
      setProfileImageUrl(data.profileImageUrl || null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fullAddress = [form.street, form.city, form.state, form.pincode, form.landmark].filter(Boolean).join(' || ');
      await updateMyProfile({
        name: form.name,
        phoneNumber: form.phoneNumber,
        address: fullAddress,
      });
      setForm((prev) => ({ ...prev, address: fullAddress }));
      setAddressEditMode(false);
      addressSnapshot.current = null;
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const loadingToast = toast.loading('Uploading profile image...');
    try {
      const res = await uploadProfileImage(file);
      setProfileImageUrl(res.data.profileImageUrl || res.data.imageUrl || res.data);
      toast.success('Profile image updated!', { id: loadingToast });
    } catch (err) {
      toast.error(err.message || 'Upload failed', { id: loadingToast });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getInitials = () => {
    const parts = form.name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.[0] || 'U').toUpperCase();
  };

  if (loading) {
    return (
      <div className="page" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingTop: '76px' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingTop: '76px' }}>
      <div className="container section" style={{ maxWidth: '680px', padding: '3rem 1.5rem 5rem' }}>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '0.4rem 0',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            transition: 'var(--transition)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Account
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.2rem 0 0', letterSpacing: '-0.02em', color: '#0f172a' }}>
            My Profile
          </h2>
        </div>

        {/* Profile Picture Section */}
        <div
          className="card"
          style={{
            padding: '2rem',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ position: 'relative' }}>
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Profile"
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--primary-light)',
                  boxShadow: '0 8px 20px rgba(255, 107, 53, 0.12)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '2rem',
                  fontWeight: 900,
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: '0 8px 20px rgba(255, 107, 53, 0.25)',
                }}
              >
                {getInitials()}
              </div>
            )}
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a', marginBottom: '0.15rem' }}>
              {form.name || 'Your Name'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 500 }}>
              {form.email}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '0.75rem', borderRadius: '20px', fontSize: '0.8rem' }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner-sm" style={{ marginRight: '0.4rem' }} />
                  Uploading...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Edit Photo
                </>
              )}
            </button>
          </div>
        </div>

        {/* Editable Fields */}
        <form onSubmit={handleSave}>
          <div
            className="card"
            style={{
              padding: '2rem',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              marginBottom: '1.5rem',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', letterSpacing: '-0.01em' }}>
              Personal Information
            </h3>

            {/* Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Email (read-only) */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                readOnly
                style={{
                  backgroundColor: '#f8fafc',
                  color: 'var(--text-muted)',
                  cursor: 'not-allowed',
                }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                Email cannot be changed
              </span>
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                type="text"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>

            {/* Address Section */}
            <div style={{ marginTop: '1.5rem', borderTop: '1.5px solid var(--border)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  Delivery Address
                </h3>
                {form.street ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!addressEditMode) {
                        addressSnapshot.current = { ...form };
                        setAddressEditMode(true);
                      } else {
                        setForm(addressSnapshot.current);
                        setAddressEditMode(false);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      color: addressEditMode ? 'var(--text-muted)' : 'var(--primary)',
                      border: addressEditMode ? '1.5px solid var(--border)' : '1.5px solid rgba(255, 107, 53, 0.25)',
                      padding: '0.45rem 1rem',
                      borderRadius: '30px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => { if (!addressEditMode) { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; } }}
                    onMouseLeave={(e) => { if (!addressEditMode) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary)'; } }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {addressEditMode ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>}
                    </svg>
                    {addressEditMode ? 'Cancel' : 'Edit'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
                      toast.loading('Getting current location...');
                      navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                          const { latitude, longitude } = pos.coords;
                          try {
                            const res = await fetch(
                              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
                              { headers: { 'Accept-Language': 'en' } }
                            );
                            const data = await res.json();
                            const addr = data.address || {};
                            const streetParts = [
                              addr.house_number,
                              addr.road || addr.pedestrian,
                              addr.suburb && !addr.neighbourhood ? addr.suburb : '',
                            ].filter(Boolean);
                            setLocForm({
                              street: streetParts.join(', '),
                              city: addr.city || addr.town || addr.village || addr.municipality || addr.county || '',
                              state: addr.state || '',
                              pincode: addr.postcode || '',
                              landmark: addr.neighbourhood || addr.suburb || addr.amenity || addr.attraction || addr.hotel || addr.shop || addr.leisure || addr.industrial || addr.place || '',
                            });
                            toast.dismiss();
                            setShowLocModal(true);
                          } catch (err) {
                            toast.dismiss();
                            toast.error('Failed to get address');
                          }
                        },
                        () => { toast.dismiss(); toast.error('Location access denied'); },
                        { enableHighAccuracy: true }
                      );
                    }}
                    style={{
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      border: '1.5px solid rgba(255, 107, 53, 0.25)',
                      padding: '0.5rem 1rem',
                      borderRadius: '30px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Use Current Location
                  </button>
                )}
              </div>

              {form.street && !addressEditMode ? (
            <div style={{
              background: '#f8fafc',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
              border: '1.5px solid var(--border)',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              color: '#1e293b',
              fontWeight: 500,
            }}>
              {[form.street, form.city, form.state, form.pincode, form.landmark].filter(Boolean).join(', ')}
            </div>
          ) : showLocModal ? (
            <div
              className="card"
              style={{
                padding: '1.5rem',
                borderRadius: '20px',
                backgroundColor: '#fff',
                border: '2.5px solid var(--primary-light)',
                boxShadow: '0 8px 25px rgba(255, 107, 53, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Confirm Your Address</span>
              </div>

              <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                border: '1.5px solid var(--border)',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                color: '#1e293b',
                fontWeight: 500,
                marginBottom: '1.25rem',
              }}>
                {[locForm.street, locForm.city, locForm.state, locForm.pincode, locForm.landmark].filter(Boolean).join(', ')}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ borderRadius: '30px', padding: '0.65rem 1.5rem', fontSize: '0.88rem', fontWeight: 700 }}
                  onClick={() => setShowLocModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ borderRadius: '30px', padding: '0.65rem 1.5rem', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => {
                    const fullAddr = [locForm.street, locForm.city, locForm.state, locForm.pincode, locForm.landmark].filter(Boolean).join(' || ');
                    setForm((prev) => ({
                      ...prev,
                      address: fullAddr,
                      street: locForm.street,
                      city: locForm.city,
                      state: locForm.state,
                      pincode: locForm.pincode,
                      landmark: locForm.landmark,
                    }));
                    setShowLocModal(false);
                    toast.success('Location set!');
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Confirm Address
                </button>
              </div>
            </div>
          ) : (
            <>
              {addressEditMode && (
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
                      toast.loading('Getting current location...');
                      navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                          const { latitude, longitude } = pos.coords;
                          try {
                            const res = await fetch(
                              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
                              { headers: { 'Accept-Language': 'en' } }
                            );
                            const data = await res.json();
                            const addr = data.address || {};
                            const streetParts = [
                              addr.house_number,
                              addr.road || addr.pedestrian,
                              addr.suburb && !addr.neighbourhood ? addr.suburb : '',
                            ].filter(Boolean);
                            setLocForm({
                              street: streetParts.join(', '),
                              city: addr.city || addr.town || addr.village || addr.municipality || addr.county || '',
                              state: addr.state || '',
                              pincode: addr.postcode || '',
                              landmark: addr.neighbourhood || addr.suburb || addr.amenity || addr.attraction || addr.hotel || addr.shop || addr.leisure || addr.industrial || addr.place || '',
                            });
                            toast.dismiss();
                            setShowLocModal(true);
                          } catch (err) {
                            toast.dismiss();
                            toast.error('Failed to get address');
                          }
                        },
                        () => { toast.dismiss(); toast.error('Location access denied'); },
                        { enableHighAccuracy: true }
                      );
                    }}
                    style={{
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      border: '1.5px solid rgba(255, 107, 53, 0.25)',
                      padding: '0.5rem 1.1rem',
                      borderRadius: '30px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Use Current Location
                  </button>
                </div>
              )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <label className="form-label">Street / Area</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.street || ''}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  placeholder="Street name, area, building"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">City</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.city || ''}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">State</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.state || ''}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Pincode</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.pincode || ''}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="Pincode"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Landmark</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.landmark || ''}
                  onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                  placeholder="Nearby landmark"
                />
              </div>
            </div>
            </>
          )}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            style={{ borderRadius: '30px' }}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-sm" style={{ marginRight: '0.5rem' }} />
                Saving Changes...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save Profile
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
