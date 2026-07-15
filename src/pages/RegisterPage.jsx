import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register, registerOwner } from '../api/auth';

export default function RegisterPage() {
  const [role, setRole] = useState('CUSTOMER');
  const [form, setForm] = useState({
    name: '', email: '', password: '', phoneNumber: '', address: '',
    restaurantName: '', licenseNumber: '', restaurantAddress: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (role === 'CUSTOMER') {
        await register({ name: form.name, email: form.email, password: form.password, phoneNumber: form.phoneNumber, address: form.address });
      } else {
        await registerOwner(form);
      }
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--primary)', fill: 'rgba(255, 107, 53, 0.1)' }}>
            <path d="M2 17h20M12 4a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8zM12 2v2" />
          </svg>
        </div>
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join FoodRush today</p>

        <div className="role-tabs">
          <div className={`role-tab ${role === 'CUSTOMER' ? 'active' : ''}`} onClick={() => setRole('CUSTOMER')}>
            👤 Customer
          </div>
          <div className={`role-tab ${role === 'OWNER' ? 'active' : ''}`} onClick={() => setRole('OWNER')}>
            🏪 Restaurant Owner
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" placeholder="John Doe"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" placeholder="you@example.com"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="Min 6 characters"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input type="text" className="form-input" placeholder="+91 9876543210"
              value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input type="text" className="form-input" placeholder="123 Main St, City"
              value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </div>

          {role === 'OWNER' && (
            <>
              <div style={{ borderTop: '1px solid var(--border)', margin: '1.2rem 0', paddingTop: '1rem' }}>
                <p className="form-label" style={{ marginBottom: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                  🏪 Restaurant Details (Optional)
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">Restaurant Name</label>
                <input type="text" className="form-input" placeholder="e.g. Spice Garden"
                  value={form.restaurantName} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">License Number</label>
                <input type="text" className="form-input" placeholder="e.g. FSSAI-123456"
                  value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Restaurant Address</label>
                <input type="text" className="form-input" placeholder="Restaurant location (if different)"
                  value={form.restaurantAddress} onChange={(e) => setForm({ ...form, restaurantAddress: e.target.value })} />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Creating Account...' : `Register as ${role === 'CUSTOMER' ? 'Customer' : 'Owner'}`}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
