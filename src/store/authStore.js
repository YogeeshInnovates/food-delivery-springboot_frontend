import { create } from 'zustand';

// Decode JWT payload without a library
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: (() => {
    const t = localStorage.getItem('token');
    return t ? decodeToken(t) : null;
  })(),

  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token, user: decodeToken(token) });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },

  // Helper to get role from JWT claims
  getRole: () => {
    const t = localStorage.getItem('token');
    if (!t) return null;
    const payload = decodeToken(t);

    const roles = payload?.roles || payload?.authorities || [];
    if (Array.isArray(roles) && roles.length > 0) {
      const role = roles[0];
      const extracted = typeof role === 'string'
        ? role
        : role?.authority;
      if (extracted) return extracted.replace('ROLE_', '');
    }

    if (payload?.role) {
      return String(payload.role).replace('ROLE_', '');
    }

    return 'CUSTOMER';
  },
}));

export default useAuthStore;
