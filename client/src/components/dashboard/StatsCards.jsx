import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderGit2, Bot, Sparkles, ShieldCheck, TrendingUp } from 'lucide-react';
import axiosInstance from '../../utils/axios.js';
import securityService from '../../services/securityService.js';

export const StatsCards = () => {
  const [dashboardOverview, setDashboardOverview] = useState(null);
  const [securityOverview, setSecurityOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const [dashRes, secRes] = await Promise.all([
          axiosInstance.get('/dashboard/overview').catch(() => null),
          securityService.getSecurityOverview().catch(() => null),
        ]);

        if (isMounted) {
          setDashboardOverview(dashRes?.data?.data || dashRes?.data || null);
          setSecurityOverview(secRes || null);
        }
      } catch (err) {
        console.warn('Failed to load dashboard metrics:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalRepos = dashboardOverview?.repositoriesAnalysed ?? 0;
  const totalAnalyses = dashboardOverview?.totalAnalyses ?? 0;
  const avgScore = dashboardOverview?.averageScore != null && dashboardOverview?.averageScore > 0
    ? Number(dashboardOverview.averageScore).toFixed(1)
    : 'N/A';
  const resolvedIssues = securityOverview?.resolvedFindings ?? 0;
  const unresolvedIssues = securityOverview?.unresolvedFindings ?? 0;

  const stats = [
    {
      title: 'Repositories',
      value: String(totalRepos),
      unit: 'Analyzed',
      trend: `${totalRepos} repos in MongoDB`,
      isPositive: true,
      icon: FolderGit2,
      color: 'from-indigo-500/20 to-indigo-500/5',
      borderColor: 'border-indigo-500/30',
      iconColor: 'text-indigo-400',
    },
    {
      title: 'AI Analyses',
      value: String(totalAnalyses),
      unit: 'Completed',
      trend: `${dashboardOverview?.completedAnalyses ?? 0} successful runs`,
      isPositive: true,
      icon: Bot,
      color: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
    },
    {
      title: 'Average Score',
      value: avgScore,
      unit: avgScore !== 'N/A' ? '/ 100' : '',
      trend: avgScore !== 'N/A' ? 'Overall code health' : 'Awaiting first analysis',
      isPositive: true,
      icon: Sparkles,
      color: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Security Issues Fixed',
      value: String(resolvedIssues),
      unit: 'Verified',
      trend: `${unresolvedIssues} active unresolved`,
      isPositive: resolvedIssues > 0,
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
                  {isLoading ? '...' : stat.value}
                </span>
                {stat.unit && <span className="text-xs font-medium text-slate-400">{stat.unit}</span>}
              </div>

              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <TrendingUp className="w-3 h-3 text-indigo-400" />
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
