import { FolderGit2, ShieldCheck, Zap, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

export const RecentAnalysesTable = () => {
  const analyses = [
    {
      id: 1,
      repo: 'aurex-ai/core-engine',
      branch: 'main',
      language: 'TypeScript',
      aiScore: 96,
      security: '0 Vulnerabilities',
      performance: '98%',
      date: '12 mins ago',
      status: 'Completed',
    },
    {
      id: 2,
      repo: 'aurex-ai/client-web',
      branch: 'feature/auth-v2',
      language: 'React / TS',
      aiScore: 92,
      security: '1 Minor Alert',
      performance: '94%',
      date: '45 mins ago',
      status: 'Completed',
    },
    {
      id: 3,
      repo: 'aurex-ai/analyzer-service',
      branch: 'main',
      language: 'Go',
      aiScore: 89,
      security: '2 Warnings',
      performance: '91%',
      date: '2 hours ago',
      status: 'Completed',
    },
    {
      id: 4,
      repo: 'aurex-ai/security-scanner',
      branch: 'patch/deps',
      language: 'Python',
      aiScore: 98,
      security: 'Clean',
      performance: '99%',
      date: '5 hours ago',
      status: 'Completed',
    },
    {
      id: 5,
      repo: 'aurex-ai/docs-portal',
      branch: 'main',
      language: 'Rust',
      aiScore: 95,
      security: 'Clean',
      performance: '97%',
      date: '1 day ago',
      status: 'Completed',
    },
  ];

  const getScoreBadge = (score) => {
    if (score >= 95) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    if (score >= 90) return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300';
    return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
  };

  return (
    <div className="p-6 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] shadow-2xl shadow-indigo-500/5 select-none space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Recent Repository Analyses</h3>
          <p className="text-xs text-slate-400">Latest automated AI code scans across connected GitHub repositories</p>
        </div>
        <button className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer">
          <span>View All</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#2A3247] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-3">Repository</th>
              <th className="py-3 px-3">Language</th>
              <th className="py-3 px-3">AI Score</th>
              <th className="py-3 px-3">Security</th>
              <th className="py-3 px-3">Performance</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A3247]/50 text-xs">
            {analyses.map((item) => (
              <tr key={item.id} className="hover:bg-[#1E293B]/40 transition-colors group">
                <td className="py-3.5 px-3 font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <div className="group-hover:text-indigo-300 transition-colors">{item.repo}</div>
                      <div className="text-[10px] font-mono text-slate-500">{item.branch}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-slate-300 font-medium">{item.language}</td>
                <td className="py-3.5 px-3">
                  <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${getScoreBadge(item.aiScore)}`}>
                    {item.aiScore} / 100
                  </span>
                </td>
                <td className="py-3.5 px-3 text-slate-300 flex items-center gap-1.5 pt-4">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{item.security}</span>
                </td>
                <td className="py-3.5 px-3 text-slate-300 font-medium">{item.performance}</td>
                <td className="py-3.5 px-3 text-slate-400">{item.date}</td>
                <td className="py-3.5 px-3 text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{item.status}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentAnalysesTable;
