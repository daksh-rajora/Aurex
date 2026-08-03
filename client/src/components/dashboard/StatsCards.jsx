import { motion } from 'framer-motion';
import { FolderGit2, Bot, Sparkles, ShieldCheck, TrendingUp } from 'lucide-react';

export const StatsCards = () => {
  const stats = [
    {
      title: 'Repositories',
      value: '14',
      unit: 'Active',
      trend: '+2 this week',
      isPositive: true,
      icon: FolderGit2,
      color: 'from-indigo-500/20 to-indigo-500/5',
      borderColor: 'border-indigo-500/30',
      iconColor: 'text-indigo-400',
    },
    {
      title: 'AI Analyses',
      value: '1,284',
      unit: 'Completed',
      trend: '+18% vs last week',
      isPositive: true,
      icon: Bot,
      color: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
    },
    {
      title: 'Average Score',
      value: '94.8',
      unit: '/ 100',
      trend: '+3.2 pts increase',
      isPositive: true,
      icon: Sparkles,
      color: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Security Issues Fixed',
      value: '342',
      unit: 'Resolved',
      trend: '99.4% resolution rate',
      isPositive: true,
      icon: ShieldCheck,
      color: 'from-cyan-500/20 to-cyan-500/5',
      borderColor: 'border-cyan-500/30',
      iconColor: 'text-cyan-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            className={`p-5 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] hover:${stat.borderColor} hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-indigo-500/5 flex flex-col justify-between group relative overflow-hidden`}
          >
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} rounded-full blur-2xl pointer-events-none`} />

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {stat.title}
              </span>
              <div className={`w-9 h-9 rounded-xl bg-[#0F172A] border border-[#2A3247] flex items-center justify-center ${stat.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                  {stat.value}
                </span>
                <span className="text-xs font-medium text-slate-400">{stat.unit}</span>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                <span>{stat.trend}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StatsCards;
