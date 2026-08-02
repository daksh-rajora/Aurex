import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, Filter } from 'lucide-react';

const chartData7D = [
  { name: 'Mon', Analyses: 45, IssuesFixed: 12 },
  { name: 'Tue', Analyses: 72, IssuesFixed: 28 },
  { name: 'Wed', Analyses: 98, IssuesFixed: 34 },
  { name: 'Thu', Analyses: 65, IssuesFixed: 19 },
  { name: 'Fri', Analyses: 120, IssuesFixed: 45 },
  { name: 'Sat', Analyses: 88, IssuesFixed: 30 },
  { name: 'Sun', Analyses: 110, IssuesFixed: 42 },
];

const chartData30D = [
  { name: 'Week 1', Analyses: 320, IssuesFixed: 95 },
  { name: 'Week 2', Analyses: 450, IssuesFixed: 140 },
  { name: 'Week 3', Analyses: 610, IssuesFixed: 190 },
  { name: 'Week 4', Analyses: 780, IssuesFixed: 230 },
];

const chartData90D = [
  { name: 'Jan', Analyses: 1200, IssuesFixed: 350 },
  { name: 'Feb', Analyses: 1850, IssuesFixed: 520 },
  { name: 'Mar', Analyses: 2400, IssuesFixed: 710 },
];

export const ActivityChart = () => {
  const [filter, setFilter] = useState('7D');

  const getData = () => {
    switch (filter) {
      case '30D':
        return chartData30D;
      case '90D':
        return chartData90D;
      default:
        return chartData7D;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] shadow-2xl shadow-indigo-500/5 select-none space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Repository Activity</span>
          </h3>
          <p className="text-xs text-slate-400">
            Real-time AI code analysis frequency and vulnerability resolutions
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0F172A] border border-[#2A3247] rounded-xl text-xs font-semibold">
          {['7D', '30D', '90D', 'Custom'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === item
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-64 sm:h-72 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={getData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFixed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A3247" vertical={false} />
            <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#2A3247',
                borderRadius: '12px',
                color: '#F8FAFC',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              }}
            />
            <Area
              type="monotone"
              dataKey="Analyses"
              stroke="#6366F1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorAnalyses)"
            />
            <Area
              type="monotone"
              dataKey="IssuesFixed"
              stroke="#A855F7"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorFixed)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityChart;
