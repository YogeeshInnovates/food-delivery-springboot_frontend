import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login, forgotPassword, resetPassword } from '../api/auth';
import useAuthStore from '../store/authStore';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { setToken } = useAuthStore();
  const navigate = useNavigate();

  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = email, 2 = otp+password
  const [resetForm, setResetForm] = useState({ email: '', otp: '', newPassword: '' });
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(form.email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const res = await login(form);
      setToken(res.data.token);
      toast.success('Welcome back! 🎉');
      // Redirect based on role
      const role = useAuthStore.getState().getRole();
      if (role === 'ADMIN') navigate('/admin/dashboard');
      else if (role === 'OWNER') navigate('/owner/dashboard');
      else navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const openReset = () => {
    setShowReset(true);
    setResetStep(1);
    setResetError('');
    setResetForm({ email: '', otp: '', newPassword: '' });
  };

  const closeReset = () => setShowReset(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(resetForm.email)) {
      setResetError('Enter a valid email address');
      return;
    }
    setResetLoading(true);
    setResetError('');
    try {
      const res = await forgotPassword({ email: resetForm.email });
      toast.success(res.data?.message || 'Reset code sent to your email');
      setResetStep(2);
    } catch (err) {
      setResetError(err.message || 'Failed to send reset code');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetForm.newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long');
      return;
    }
    if (resetForm.otp.trim().length === 0) {
      setResetError('Enter the verification code');
      return;
    }
    setResetLoading(true);
    setResetError('');
    try {
      const res = await resetPassword({
        email: resetForm.email,
        otp: resetForm.otp,
        newPassword: resetForm.newPassword,
      });
      toast.success(res.data?.message || 'Password updated successfully');
      closeReset();
    } catch (err) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
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
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your FoodRush account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailError(''); }}
              required
            />
            {emailError && <span style={{ color: '#e53e3e', fontSize: '0.8rem' }}>{emailError}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <span />
            <button type="button" className="btn btn-link" style={{ padding: '0.25rem 0', fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)' }} onClick={openReset}>
              Forgot password?
            </button>
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>

      {showReset && (
        <div className="modal-overlay" onClick={closeReset}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button className="modal-close" onClick={closeReset} aria-label="Close">&times;</button>
            </div>

            {resetStep === 1 ? (
              <form onSubmit={handleSendOtp}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={resetForm.email}
                    onChange={(e) => { setResetForm({ ...resetForm, email: e.target.value }); setResetError(''); }}
                    required
                  />
                </div>
                <p className="fs-sm text-muted mb-3" style={{ lineHeight: 1.5 }}>
                  Enter your registered email and we&apos;ll send you a verification code to reset your password.
                </p>
                {resetError && <p style={{ color: '#e53e3e', fontSize: '0.85rem', marginBottom: '1rem' }}>{resetError}</p>}
                <button type="submit" className="btn btn-primary btn-full" disabled={resetLoading}>
                  {resetLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <p className="fs-sm text-muted mb-2" style={{ lineHeight: 1.5 }}>
                  A verification code was sent to <strong style={{ color: 'var(--primary-dark)' }}>{resetForm.email}</strong>.
                </p>
                <div className="form-group">
                  <label className="form-label">Verification Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="6-digit code"
                    value={resetForm.otp}
                    onChange={(e) => { setResetForm({ ...resetForm, otp: e.target.value }); setResetError(''); }}
                    maxLength={6}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="At least 6 characters"
                    value={resetForm.newPassword}
                    onChange={(e) => { setResetForm({ ...resetForm, newPassword: e.target.value }); setResetError(''); }}
                    required
                  />
                </div>
                {resetError && <p style={{ color: '#e53e3e', fontSize: '0.85rem', marginBottom: '1rem' }}>{resetError}</p>}
                <button type="submit" className="btn btn-primary btn-full" disabled={resetLoading}>
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
                <p className="auth-footer" style={{ marginTop: '1.25rem' }}>
                  <button type="button" onClick={() => { setResetStep(1); setResetError(''); }} style={{ background: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.88rem' }}>
                    ← Use a different email
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
