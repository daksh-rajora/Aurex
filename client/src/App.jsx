import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/Auth/ForgotPassword.jsx';
import VerifyOtp from './pages/Auth/VerifyOtp.jsx';
import ResetPassword from './pages/Auth/ResetPassword.jsx';
import GithubCallback from './pages/auth/GithubCallback.jsx';
import Dashboard from './pages/Dashboard.jsx';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  // Allow dashboard preview if logged in or token exists in localStorage
  const hasToken = localStorage.getItem('token');
  return isAuthenticated || hasToken ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#141B2D',
            color: '#F8FAFC',
            border: '1px solid #2A3247',
            borderRadius: '12px',
            fontSize: '13px',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/auth/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/github/callback" element={<GithubCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/repositories" element={<Navigate to="/dashboard/repositories" replace />} />
        <Route path="/analysis/:analysisId" element={<Dashboard />} />
        <Route path="/analysis" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
