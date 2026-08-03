import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Search,
  Bell,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

const GithubIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export const TopNavbar = ({ onToggleMobileSidebar, isMobileOpen }) => {
  const { user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');

  const displayName = user?.fullName || user?.name || 'Daksh Rajora';
  const displayAvatar = user?.avatarUrl || user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  return (
    <header className="h-16 border-b border-[#2A3247] bg-[#0F172A]/80 backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-[#141B2D] border border-[#2A3247] transition-colors"
          aria-label="Toggle Navigation"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div>
          <h2 className="text-base lg:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Dashboard
          </h2>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full group">
          <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141B2D]/90 border border-[#2A3247] rounded-xl pl-10 pr-12 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-[#0F172A] border border-[#2A3247] rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions & Badges */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* GitHub Connected Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <GithubIcon className="w-3.5 h-3.5" />
          <span>Connected</span>
        </div>

        {/* Notifications Icon */}
        <button
          className="p-2 rounded-xl text-slate-400 hover:text-white bg-[#141B2D] border border-[#2A3247] hover:border-slate-600 transition-colors relative cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
        </button>

        {/* Help Icon */}
        <button
          className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-white bg-[#141B2D] border border-[#2A3247] hover:border-slate-600 transition-colors cursor-pointer"
          aria-label="Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#2A3247]/60">
          <img
            src={displayAvatar}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover border border-indigo-500/40"
          />
          <span className="hidden xl:inline text-xs font-semibold text-slate-200">
            {displayName.split(' ')[0]}
          </span>
          <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
