import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderGit2, ShieldCheck, ArrowUpRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import axiosInstance from '../../utils/axios.js';

export const RecentAnalysesTable = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchRecent = async () => {
      try {
        const res = await axiosInstance.get('/dashboard/recent').catch(() => null);
        if (isMounted) {
          const list = res?.data?.data || res?.data || [];
          setAnalyses(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.warn('Failed to load recent analyses:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRecent();
    return () => {
      isMounted = false;
    };
  }, []);

  const getScoreBadge = (score) => {
    if (score == null) return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    if (score >= 90) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    if (score >= 75) return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300';
    return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
  };

  return (
    <div className="p-6 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] shadow-2xl shadow-indigo-500/5 select-none space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Recent Repository Analyses</h3>
          <p className="text-xs text-slate-400">Latest automated AI code scans recorded in MongoDB</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/history')}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
        >
          <span>View All</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
          Loading recent analyses...
        </div>
      ) : analyses.length === 0 ? (
        <div className="py-8 text-center space-y-2 border border-dashed border-[#2A3247] rounded-xl">
          <FolderGit2 className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs text-slate-400">No repository analyses recorded yet.</p>
          <button
            onClick={() => navigate('/dashboard/repositories')}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
          >
            Analyze your first repository
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2A3247] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Repository</th>
                <th className="py-3 px-3">AI Score</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A3247]/50 text-xs">
              {analyses.map((item) => (
                <tr
                  key={item._id}
                  onClick={() => navigate(`/dashboard/analysis/${item._id}`)}
                  className="hover:bg-[#1E293B]/40 transition-colors group cursor-pointer"
                >
                  <td className="py-3.5 px-3 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <div className="group-hover:text-indigo-300 transition-colors">
                          {item.fullName || `${item.owner}/${item.repositoryName}`}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {item.repositoryName || 'repository'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-xs font-bold ${getScoreBadge(
                        item.overallScore
                      )}`}
                    >
                      {item.overallScore != null ? `${item.overallScore} / 100` : 'N/A'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                        item.status === 'Completed'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : item.status === 'Processing'
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}
                    >
                      {item.status === 'Completed' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>{item.status || 'Completed'}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentAnalysesTable;
