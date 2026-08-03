import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const languages = [
  { name: 'TypeScript', value: 42, color: '#6366F1' },
  { name: 'JavaScript', value: 28, color: '#A855F7' },
  { name: 'Python', value: 15, color: '#38BDF8' },
  { name: 'Go', value: 10, color: '#10B981' },
  { name: 'Rust', value: 5, color: '#F59E0B' },
];

export const LanguageDistributionChart = () => {
  return (
    <div className="p-6 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] shadow-2xl shadow-indigo-500/5 select-none space-y-4">
      <div>
        <h3 className="text-base font-bold text-white tracking-tight">Language Distribution</h3>
        <p className="text-xs text-slate-400">Codebase breakdown across active repositories</p>
      </div>

      <div className="h-44 w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={languages}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {languages.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="#0F172A" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#2A3247',
                borderRadius: '12px',
                color: '#F8FAFC',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-extrabold text-white">5</span>
          <span className="text-[10px] text-slate-400 font-medium">Languages</span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2A3247]/60">
        {languages.map((lang) => (
          <div key={lang.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
              <span className="text-slate-300 font-medium">{lang.name}</span>
            </div>
            <span className="font-bold text-white">{lang.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageDistributionChart;
