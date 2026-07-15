import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, getRole } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(getRole())) {
    return (
      <div className="page flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '4rem' }}>🚫</div>
        <h2>Access Denied</h2>
        <p className="text-muted">You don't have permission to view this page.</p>
        <a href="/" className="btn btn-primary">Go Home</a>
      </div>
    );
  }

  return children;
}
