import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Lock,
  UserCheck,
  Check,
  CheckCheck,
  ChevronRight,
  Loader2,
  Info,
} from 'lucide-react';
import { NOTIFICATION_TYPES } from '../../constants/notificationTypes.js';
import {
  fetchNotificationsThunk,
  markAsReadThunk,
  markAllAsReadThunk,
} from '../../redux/slices/notificationSlice.js';

/**
 * Format relative timestamp string
 */
const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Just now';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSecs = Math.floor((now - past) / 1000);

  if (diffInSecs < 60) return 'Just now';
  const diffInMins = Math.floor(diffInSecs / 60);
  if (diffInMins < 60) return `${diffInMins}m ago`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const NotificationDropdown = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const { notifications, unreadCount, isLoading } = useSelector((state) => state.notification);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotificationsThunk({ limit: 8 }));
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      dispatch(markAsReadThunk(notif.id || notif._id));
    }

    const analysisId = notif.metadata?.analysisId;
    if (analysisId) {
      onClose();
      navigate(`/dashboard/analysis/${analysisId}`);
    }
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsReadThunk());
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.ANALYSIS_COMPLETED:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
      case NOTIFICATION_TYPES.RECRUITER_ANALYSIS_COMPLETED:
        return <UserCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />;
      case NOTIFICATION_TYPES.ANALYSIS_FAILED:
        return <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
      case NOTIFICATION_TYPES.SHARE_CREATED:
        return <Share2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />;
      case NOTIFICATION_TYPES.SHARE_DISABLED:
        return <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />;
    }
  };

  const recentList = notifications.slice(0, 6);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-[#0F172A] border border-[#2A3247] rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col select-none animate-in fade-in zoom-in duration-150"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#2A3247]/60 flex items-center justify-between bg-[#141B2D]/80">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-extrabold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#2A3247]/40">
        {isLoading && notifications.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading notifications...</p>
          </div>
        ) : recentList.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Bell className="w-8 h-8 text-slate-500 mx-auto opacity-50" />
            <p className="text-xs font-bold text-slate-300">No new notifications</p>
            <p className="text-[11px] text-slate-500">You're all caught up with your analysis updates.</p>
          </div>
        ) : (
          recentList.map((notif) => {
            const notifId = notif.id || notif._id;
            const isUnread = !notif.read;

            return (
              <div
                key={notifId}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 flex items-start gap-3 hover:bg-[#141B2D] transition-colors cursor-pointer relative group ${
                  isUnread ? 'bg-[#141B2D]/50 font-medium' : 'opacity-80'
                }`}
              >
                {/* Unread indicator dot */}
                {isUnread && (
                  <span className="absolute left-1.5 top-5 w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400" />
                )}

                <div className="pl-2">{getTypeIcon(notif.type)}</div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Link */}
      <div className="p-3 border-t border-[#2A3247]/60 bg-[#141B2D]/80 text-center">
        <button
          onClick={() => {
            onClose();
            navigate('/dashboard/notifications');
          }}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
        >
          <span>View all notifications</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
