import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderGit2,
  Bot,
  ShieldAlert,
  Zap,
  FileText,
  History,
  Star,
  Bell,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import authService from '../../services/auth.service.js';
import { logout } from '../../redux/slices/authSlice.js';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const [activeItem, setActiveItem] = useState('Dashboard');

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', badge: null },
    { name: 'Repositories', icon: FolderGit2, path: '/dashboard/repositories', badge: '14' },
    { name: 'AI Analysis', icon: Bot, path: '/dashboard/analysis', badge: 'Pro' },
    { name: 'Security Scan', icon: ShieldAlert, path: '/dashboard/security', badge: '3' },
    { name: 'Performance', icon: Zap, path: '/dashboard/performance', badge: null },
    { name: 'Reports', icon: FileText, path: '/dashboard/reports', badge: null },
    { name: 'History', icon: History, path: '/dashboard/history', badge: null },
    { name: 'Favorites', icon: Star, path: '/dashboard/favorites', badge: null },
    { name: 'Notifications', icon: Bell, path: '/dashboard/notifications', badge: '5' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings', badge: null },
  ];

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore API logout failure
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  const displayName = user?.fullName || user?.name || 'Daksh Rajora';
  const displayUsername = user?.username ? `@${user.username}` : '@dakshrajora';
  const displayAvatar = user?.avatarUrl || user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen w-[280px] bg-[#0F172A]/95 border-r border-[#2A3247] flex flex-col justify-between p-4 overflow-y-auto transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } backdrop-blur-xl select-none`}
    >
      {/* Top Branding */}
      <div>
        <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-[#2A3247]/60">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-400 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-[#0F172A] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent tracking-tight">
                Aurex AI
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-md uppercase">
                v2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Developer Intelligence</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.name || location.pathname === item.path;

            return (
              <button
                key={item.name}
                onClick={() => {
                  setActiveItem(item.name);
                  navigate(item.path);
                  if (setIsMobileOpen) setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-white border border-indigo-500/30 shadow-md shadow-indigo-500/5 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#1E293B]/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors duration-200 ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      item.badge === 'Pro'
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                        : 'bg-[#1E293B] border-[#2A3247] text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Card & Logout */}
      <div className="pt-4 border-t border-[#2A3247]/60 space-y-3">
        {/* User Card */}
        <div className="p-2.5 rounded-xl bg-[#141B2D]/80 border border-[#2A3247] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative shrink-0">
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover border border-indigo-500/30"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0F172A] rounded-full" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-slate-400 truncate">{displayUsername}</p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
