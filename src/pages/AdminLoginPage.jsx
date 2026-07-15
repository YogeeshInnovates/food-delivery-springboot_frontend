import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken, getRole } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const res = await login({ email, password });
      setToken(res.data.token);
      const role = getRole();
      if (role !== 'ADMIN') {
        toast.error('Not authorized — admin access only');
        useAuthStore.getState().logout();
        return;
      }
      toast.success('Welcome Admin');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page flex-center" style={{ minHeight: '100vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
          <h2>Admin Login</h2>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Restricted access — administrators only</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <a href="/" className="text-muted" style={{ fontSize: '0.82rem' }}>← Back to home</a>
        </div>
      </div>
    </div>
  );
}
