import { Sparkles, Upload, FileCheck } from 'lucide-react';

const GithubIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export const QuickActions = () => {
  const actions = [
    {
      title: 'Analyze New Repository',
      desc: 'Run AI scan on GitHub repo',
      icon: Sparkles,
      color: 'hover:border-indigo-500/50 hover:bg-indigo-500/10 text-indigo-400',
    },
    {
      title: 'Connect GitHub',
      desc: 'Sync organization repos',
      icon: GithubIcon,
      color: 'hover:border-purple-500/50 hover:bg-purple-500/10 text-purple-400',
    },
    {
      title: 'Upload ZIP',
      desc: 'Upload codebase archive',
      icon: Upload,
      color: 'hover:border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400',
    },
    {
      title: 'Generate Report',
      desc: 'Export PDF security audit',
      icon: FileCheck,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400',
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] shadow-2xl shadow-indigo-500/5 select-none space-y-4">
      <div>
        <h3 className="text-base font-bold text-white tracking-tight">Quick Actions</h3>
        <p className="text-xs text-slate-400">Instant shortcuts for developer workflows</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.title}
              className={`p-3 rounded-xl bg-[#0F172A] border border-[#2A3247] text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between ${act.color}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span className="text-[10px] text-slate-500 font-mono">⚡</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors">
                  {act.title}
                </p>
                <p className="text-[10px] text-slate-400">{act.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
