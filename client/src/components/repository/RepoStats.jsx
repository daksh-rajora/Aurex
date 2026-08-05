import { FolderGit2, Lock, Globe, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

export const RepoStats = ({ totalCount = 0, privateCount = 0, publicCount = 0, analyzedCount = 0 }) => {
  const stats = [
    {
      id: 'total',
      title: 'Total Repositories',
      value: totalCount,
      subtext: 'Connected GitHub Repos',
      icon: FolderGit2,
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      gradient: 'from-indigo-500/10 via-purple-500/5 to-transparent',
      borderColor: 'group-hover:border-indigo-500/40',
      badge: 'Active',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'private',
      title: 'Private Repositories',
      value: privateCount,
      subtext: 'Isolated Enterprise Code',
      icon: Lock,
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      borderColor: 'group-hover:border-amber-500/40',
      badge: 'Protected',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'public',
      title: 'Public Repositories',
      value: publicCount,
      subtext: 'Open Source Packages',
      icon: Globe,
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      borderColor: 'group-hover:border-emerald-500/40',
      badge: 'Community',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'analyzed',
      title: 'AI Analyzed',
      value: analyzedCount,
      subtext: `${Math.round((analyzedCount / (totalCount || 1)) * 100)}% Codebase Coverage`,
      icon: Bot,
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      gradient: 'from-purple-500/10 via-pink-500/5 to-transparent',
      borderColor: 'group-hover:border-purple-500/40',
      badge: 'AI Indexed',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={`group relative overflow-hidden rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 ${stat.borderColor} select-none`}
          >
            {/* Background Accent Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {stat.title}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                    {stat.value}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">{stat.subtext}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className={`p-2.5 rounded-xl border ${stat.iconBg} shadow-inner`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${stat.badgeColor}`}>
                  {stat.badge}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default RepoStats;
