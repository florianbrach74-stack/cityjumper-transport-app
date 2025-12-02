import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import ContractorDashboard from './pages/ContractorDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminPenalties from './pages/AdminPenalties';
import OrderPriceAdjustment from './pages/OrderPriceAdjustment';
import ContractorOrdersView from './pages/ContractorOrdersView';
import CMRSignature from './pages/CMRSignature';
import VerificationPage from './pages/VerificationPage';
import Settings from './pages/Settings';
import AGB from './pages/AGB';
import AGBNew from './pages/AGBNew';
import Widerruf from './pages/Widerruf';
import WiderrufNew from './pages/WiderrufNew';
import FAQ from './pages/FAQ';
import EmployeeSettings from './pages/EmployeeSettings';
import ContractorOrdersWithAssignment from './pages/ContractorOrdersWithAssignment';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailToken from './pages/VerifyEmailToken';
import ChatBot from './components/ChatBot';
import { GoogleAnalytics } from './components/GoogleAnalytics';

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user.role === 'employee') {
    return <EmployeeDashboard />;
  }

  return user.role === 'customer' ? <CustomerDashboard /> : <ContractorDashboard />;
};

function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          {/* Google Analytics */}
          <GoogleAnalytics />
          
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-email/:token" element={<VerifyEmailToken />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/agb" element={<AGBNew />} />
          <Route path="/agb-old" element={<AGB />} />
          <Route path="/widerruf" element={<Widerruf />} />
          <Route path="/widerruf-new" element={<WiderrufNew />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/cmr/:cmrNumber" element={<CMRSignature />} />
          <Route path="/cmr/:cmrNumber/sender" element={<CMRSignature />} />
          <Route path="/cmr/:cmrNumber/carrier" element={<CMRSignature />} />
          <Route path="/cmr/:cmrNumber/consignee" element={<CMRSignature />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verification"
            element={
              <ProtectedRoute>
                <VerificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-settings"
            element={
              <ProtectedRoute>
                <EmployeeSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contractor/orders"
            element={
              <ProtectedRoute>
                <ContractorOrdersWithAssignment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contractor/:contractorId/orders"
            element={
              <ProtectedRoute>
                <ContractorOrdersView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/penalties"
            element={
              <ProtectedRoute>
                <AdminPenalties />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/orders/:id/edit-price"
            element={
              <ProtectedRoute>
                <OrderPriceAdjustment />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {/* ChatBot - only on desktop and when not logged in */}
        {!isMobile && <ChatBot />}
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
