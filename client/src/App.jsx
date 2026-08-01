import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login.jsx';
import GithubCallback from './pages/auth/GithubCallback.jsx';

// Placeholder Dashboard component until Dashboard UI module is loaded
const DashboardPlaceholder = () => {
  const { user } = useSelector((state) => state.auth);
  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col items-center justify-center p-6 select-none">
      <div className="bg-[#141B2D] border border-[#2A3247] p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
          Aurex Dashboard
        </h1>
        <p className="text-slate-400 text-sm">
          Welcome back, {user?.fullName || user?.username || user?.email || 'Developer'}!
        </p>
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
          Successfully logged in & authenticated
        </div>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} />
        <Route path="/auth/github/callback" element={<GithubCallback />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPlaceholder />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
