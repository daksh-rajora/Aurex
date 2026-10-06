import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/Auth/ForgotPassword.jsx';
import VerifyOtp from './pages/Auth/VerifyOtp.jsx';
import ResetPassword from './pages/Auth/ResetPassword.jsx';
import GithubCallback from './pages/auth/GithubCallback.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SharedAnalysisReportPage from './pages/Analysis/SharedAnalysisReportPage.jsx';
import socket from './services/socket.js';
import {
  fetchUnreadCount,
  fetchNotifications,
  addRealtimeNotification,
} from './redux/slices/notificationSlice.js';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  // Allow dashboard preview if logged in or token exists in localStorage
  const hasToken = localStorage.getItem('token');
  return isAuthenticated || hasToken ? children : <Navigate to="/login" replace />;
};

// Global Socket Listener Component for User Room & Notifications
const SocketListener = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const userId = user?._id || user?.id;

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    // Join room for realtime notifications
    socket.emit('join_user', userId);

    // Initial fetch of unread count and notifications
    dispatch(fetchUnreadCount());
    dispatch(fetchNotifications({ page: 1, limit: 20 }));

    // Handler for incoming realtime notifications
    const handleNewNotification = (notification) => {
      dispatch(addRealtimeNotification(notification));
    };

    // Handler for socket reconnect: re-join room and re-fetch unread count / notifications
    const handleConnect = () => {
      socket.emit('join_user', userId);
      dispatch(fetchUnreadCount());
      dispatch(fetchNotifications({ page: 1, limit: 20 }));
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('connect', handleConnect);
    };
  }, [dispatch, isAuthenticated, userId]);

  return null;
};

function App() {
  return (
    <Router>
      <SocketListener />
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
        <Route path="/shared/analysis/:token" element={<SharedAnalysisReportPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/notifications" element={<Dashboard />} />
        <Route path="/dashboard/recruiter/history" element={<Dashboard />} />
        <Route path="/dashboard/recruiter" element={<Dashboard />} />
        <Route path="/dashboard/analysis/:analysisId/progress" element={<Dashboard />} />
        <Route path="/dashboard/analysis/:analysisId" element={<Dashboard />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/notifications" element={<Navigate to="/dashboard/notifications" replace />} />
        <Route path="/repositories" element={<Navigate to="/dashboard/repositories" replace />} />
        <Route path="/history" element={<Navigate to="/dashboard/history" replace />} />
        <Route path="/recruiter/history" element={<Navigate to="/dashboard/recruiter/history" replace />} />
        <Route path="/recruiter" element={<Navigate to="/dashboard/recruiter" replace />} />
        <Route path="/analysis/:analysisId/progress" element={<Dashboard />} />
        <Route path="/analysis/:analysisId" element={<Dashboard />} />
        <Route path="/analysis" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
