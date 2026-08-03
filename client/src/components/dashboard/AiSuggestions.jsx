import { Lightbulb, Zap, ShieldAlert, PackageCheck, Layers } from 'lucide-react';

export const AiSuggestions = () => {
  const suggestions = [
    {
      id: 1,
      title: 'Use memoization in heavy React render lists',
      impact: 'High Impact',
      category: 'Performance',
      icon: Zap,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 2,
      title: 'Replace nested loops in analyzer-service parser',
      impact: 'Medium Impact',
      category: 'Refactoring',
      icon: Layers,
      iconColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      id: 3,
      title: 'Improve Redis API response caching TTL',
      impact: 'High Impact',
      category: 'Optimization',
      icon: Lightbulb,
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      id: 4,
      title: 'Unused dependencies detected in package.json',
      impact: 'Low Impact',
      category: 'Maintenance',
      icon: PackageCheck,
      iconColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      id: 5,
      title: 'Security vulnerability found in legacy JWT package',
      impact: 'Critical',
      category: 'Security',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] shadow-2xl shadow-indigo-500/5 select-none space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Recent AI Recommendations</h3>
          <p className="text-xs text-slate-400">Context-aware optimization suggestions</p>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold">
          5 New
        </span>
      </div>

      <div className="space-y-2.5">
        {suggestions.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-[#0F172A] border border-[#2A3247] hover:border-slate-600 transition-all flex items-start gap-3 group cursor-pointer"
            >
              <div className={`p-2 rounded-lg border ${item.bgColor} shrink-0 mt-0.5`}>
                <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white group-hover:text-indigo-200 transition-colors truncate">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400">{item.category}</span>
                  <span className="text-[10px] text-slate-600">•</span>
                  <span
                    className={`text-[10px] font-semibold ${
                      item.impact === 'Critical'
                        ? 'text-rose-400'
                        : item.impact === 'High Impact'
                        ? 'text-amber-400'
                        : 'text-indigo-400'
                    }`}
                  >
                    {item.impact}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AiSuggestions;
