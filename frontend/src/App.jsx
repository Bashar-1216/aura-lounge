import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/shared/Toast';
import CustomerMenu from './pages/CustomerMenu';
import OrderTracking from './pages/OrderTracking';
import KitchenView from './pages/KitchenView';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/menu?table=1" replace />} />
              <Route path="/menu" element={<CustomerMenu />} />
              <Route path="/order/:id" element={<OrderTracking />} />
              <Route path="/kitchen" element={<KitchenView />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
