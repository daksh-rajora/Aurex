import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Briefcase,
  Share2,
  Lock,
  Trash2,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Inbox,
  Clock,
} from 'lucide-react';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../../redux/slices/notificationSlice.js';
import NOTIFICATION_TYPES from '../../constants/notificationTypes.js';

const getNotificationIcon = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.ANALYSIS_COMPLETED:
      return <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
    case NOTIFICATION_TYPES.ANALYSIS_FAILED:
      return <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />;
    case NOTIFICATION_TYPES.RECRUITER_ANALYSIS_COMPLETED:
      return <Briefcase className="w-5 h-5 text-purple-400 flex-shrink-0" />;
    case NOTIFICATION_TYPES.SHARE_CREATED:
      return <Share2 className="w-5 h-5 text-sky-400 flex-shrink-0" />;
    case NOTIFICATION_TYPES.SHARE_DISABLED:
      return <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />;
    case NOTIFICATION_TYPES.SYSTEM:
    default:
      return <Bell className="w-5 h-5 text-indigo-400 flex-shrink-0" />;
  }
};

const getNotificationBadgeColor = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.ANALYSIS_COMPLETED:
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case NOTIFICATION_TYPES.ANALYSIS_FAILED:
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case NOTIFICATION_TYPES.RECRUITER_ANALYSIS_COMPLETED:
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case NOTIFICATION_TYPES.SHARE_CREATED:
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    case NOTIFICATION_TYPES.SHARE_DISABLED:
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case NOTIFICATION_TYPES.SYSTEM:
    default:
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  }
};

const formatTimeAgo = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const NotificationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, pagination } = useSelector(
    (state) => state.notification
  );

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchNotifications({ page: currentPage, limit: 20 }));
  }, [dispatch, currentPage]);

  const handleMarkAsRead = (e, id) => {
    e.stopPropagation();
    dispatch(markNotificationAsRead(id));
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleNotificationClick = (item) => {
    if (!item.read) {
      dispatch(markNotificationAsRead(item._id));
    }

    if (item.metadata?.analysisId) {
      navigate(`/dashboard/analysis/${item.metadata.analysisId}`);
    }
  };

  // Filter notifications locally based on activeTab
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'unread') return !item.read;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Notifications</h1>
              <p className="text-sm text-slate-400">
                Stay updated on repository analyses, sharing status, and system alerts.
              </p>
            </div>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs & Controls */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            All Notifications ({pagination?.total || notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'unread'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-400/20 text-indigo-300">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading && notifications.length === 0 ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-20 bg-slate-800/40 border border-slate-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#141B2D]/60 border border-slate-800/80 rounded-2xl text-center space-y-4">
          <div className="p-4 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-500">
            {activeTab === 'unread' ? (
              <Sparkles className="w-8 h-8 text-emerald-400" />
            ) : (
              <Inbox className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">
              {activeTab === 'unread' ? "You're all caught up." : 'No notifications yet.'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {activeTab === 'unread'
                ? 'All your notifications have been marked as read.'
                : 'When analysis updates or share events occur, they will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        /* Notification Items List */
        <div className="space-y-3">
          {filteredNotifications.map((item) => (
            <div
              key={item._id}
              onClick={() => handleNotificationClick(item)}
              className={`group relative flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                !item.read
                  ? 'bg-[#141B2D] border-indigo-500/30 hover:border-indigo-500/60 shadow-md shadow-indigo-950/20'
                  : 'bg-[#141B2D]/40 border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              {/* Unread Accent Indicator */}
              {!item.read && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-500 rounded-r-full" />
              )}

              <div className="flex items-start gap-3.5 min-w-0 pl-1">
                {/* Icon */}
                <div className="mt-0.5">{getNotificationIcon(item.type)}</div>

                {/* Text Content */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        !item.read ? 'text-slate-100' : 'text-slate-300'
                      }`}
                    >
                      {item.title}
                    </h4>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getNotificationBadgeColor(
                        item.type
                      )}`}
                    >
                      {item.type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(item.createdAt)}
                    </span>
                    {item.metadata?.repositoryName && (
                      <span className="text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md text-[10px] border border-slate-700/50">
                        {item.metadata.repositoryOwner
                          ? `${item.metadata.repositoryOwner}/${item.metadata.repositoryName}`
                          : item.metadata.repositoryName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                {!item.read && (
                  <button
                    onClick={(e) => handleMarkAsRead(e, item._id)}
                    title="Mark as read"
                    className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDelete(e, item._id)}
                  title="Delete notification"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
          <div>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total}{' '}
            total)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="p-2 rounded-xl border border-slate-800 bg-[#141B2D] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="p-2 rounded-xl border border-slate-800 bg-[#141B2D] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
