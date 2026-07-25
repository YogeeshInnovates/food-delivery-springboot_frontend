import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import api from './api/axiosInstance';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RestaurantsPage from './pages/RestaurantsPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import CartPage from './pages/CartPage';
import PaymentPage from './pages/PaymentPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';

// Owner
import { OwnerLayout, OwnerDashboard, AddRestaurantPage, CompleteRegistrationPage, ManageMenuPage, OwnerOrdersPage } from './pages/OwnerPages';

// Admin
import AdminLoginPage from './pages/AdminLoginPage';
import { AdminLayout, AdminDashboard, AdminUsersPage, AdminRestaurantsPage, AdminOrdersPage, AdminCreateAdminPage } from './pages/AdminPages';

export default function App() {
  useEffect(() => {
    const ping = setInterval(() => {
      api.get('/api/menu-items/popular').catch(() => {});
    }, 30000);
    return () => clearInterval(ping);
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#1F2937',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            fontSize: '0.9rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <Navbar />

      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
        <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />

        {/* Customer */}
        <Route path="/cart" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CartPage /></ProtectedRoute>} />
        <Route path="/payment/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><PaymentPage /></ProtectedRoute>} />
        <Route path="/tracking/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrderTrackingPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'OWNER', 'ADMIN']}><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><ProfilePage /></ProtectedRoute>} />

        {/* Owner */}
        <Route path="/owner" element={<ProtectedRoute allowedRoles={['OWNER']}><OwnerLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="orders" element={<OwnerOrdersPage />} />
          <Route path="restaurants/add" element={<AddRestaurantPage />} />
          <Route path="restaurants/:id/complete-registration" element={<CompleteRegistrationPage />} />
          <Route path="restaurants/:id/menu" element={<ManageMenuPage />} />
        </Route>

        {/* Admin login (hidden, no navbar link) */}
        <Route path="/admin-login" element={<AdminLoginPage />} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="restaurants" element={<AdminRestaurantsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="create-admin" element={<AdminCreateAdminPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <div className="page flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '5rem' }}>🍕</div>
            <h2>404 - Page Not Found</h2>
            <p className="text-muted">Looks like this page got eaten!</p>
            <a href="/" className="btn btn-primary">Go Home</a>
          </div>
        } />
      </Routes>
    </>
  );
}
