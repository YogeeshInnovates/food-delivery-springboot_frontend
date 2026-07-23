import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register, registerOwner, verifyOtp } from '../api/auth';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\d{10}$/;

export default function RegisterPage() {
  const [role, setRole] = useState('CUSTOMER');
  const [form, setForm] = useState({
    name: '', email: '', password: '', phoneNumber: '', address: '',
    restaurantName: '', licenseNumber: '', restaurantAddress: '',
  });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!EMAIL_REGEX.test(form.email)) errs.email = 'Enter a valid email address';
    if (!PHONE_REGEX.test(form.phoneNumber)) errs.phoneNumber = 'Phone must be exactly 10 digits';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (role === 'CUSTOMER') {
        await register({ name: form.name, email: form.email, password: form.password, phoneNumber: form.phoneNumber, address: form.address });
      } else {
        await registerOwner(form);
      }
      setStep('otp');
      toast.success('Verification code sent to your email');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp({ email: form.email, otp });
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--primary)', fill: 'rgba(255, 107, 53, 0.1)' }}>
              <path d="M2 17h20M12 4a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8zM12 2v2" />
            </svg>
          </div>
          <h2 className="auth-title">Verify Email</h2>
          <p className="auth-subtitle">We sent a 6-digit code to {form.email}</p>

          <div style={{
            overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: '1rem',
            borderRadius: '10px', background: 'linear-gradient(135deg, #fef3c7, #ffedd5)',
            border: '1px solid #fcd34d', padding: '0.5rem 0',
          }}>
            <div style={{
              display: 'inline-block',
              animation: 'marquee 14s linear infinite',
              fontSize: '0.82rem', fontWeight: 600, color: '#92400e',
            }}>
              📧 &nbsp;Didn't see the email? Check your Spam / Junk folder &nbsp; 📧 &nbsp;Didn't see the email? Check your Spam / Junk folder &nbsp; 📧
            </div>
          </div>

          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label">Enter Verification Code</label>
              <input type="text" className="form-input" placeholder="000000" maxLength={6}
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
          </form>

          <p className="auth-footer" style={{ marginTop: '1rem' }}>
            Didn't receive the code?{' '}
            <button
              onClick={() => { setStep('form'); setOtp(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
            >
              Go back and try again
            </button>
          </p>
        </div>
      </div>
    );
  }

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

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" placeholder="John Doe"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" placeholder="you@example.com"
              value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }); }} required />
            {errors.email && <span style={{ color: '#e53e3e', fontSize: '0.8rem' }}>{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="Min 6 characters"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input type="text" className="form-input" placeholder="9876543210" maxLength={10}
              value={form.phoneNumber} onChange={(e) => { setForm({ ...form, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }); setErrors({ ...errors, phoneNumber: '' }); }} required />
            {errors.phoneNumber && <span style={{ color: '#e53e3e', fontSize: '0.8rem' }}>{errors.phoneNumber}</span>}
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
            {loading ? 'Sending Code...' : `Register as ${role === 'CUSTOMER' ? 'Customer' : 'Owner'}`}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
