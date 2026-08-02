import { Shield, Zap, Code2, Wrench } from 'lucide-react';

export const AiHealthCard = () => {
  const metrics = [
    { label: 'Security Score', value: 96, icon: Shield, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    { label: 'Code Quality', value: 91, icon: Code2, color: 'bg-indigo-500', textColor: 'text-indigo-400' },
    { label: 'Maintainability', value: 89, icon: Wrench, color: 'bg-purple-500', textColor: 'text-purple-400' },
    { label: 'Performance', value: 94, icon: Zap, color: 'bg-cyan-500', textColor: 'text-cyan-400' },
  ];

  return (
    <div className="p-6 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] shadow-2xl shadow-indigo-500/5 select-none space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Overall AI Health</h3>
          <p className="text-xs text-slate-400">Aggregate code quality and security index</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-extrabold">
          92%
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3 pt-1">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Icon className={`w-3.5 h-3.5 ${item.textColor}`} />
                  <span>{item.label}</span>
                </div>
                <span className="font-bold text-white">{item.value}%</span>
              </div>
              <div className="h-2 w-full bg-[#0F172A] rounded-full overflow-hidden border border-[#2A3247]/50">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-500`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AiHealthCard;
