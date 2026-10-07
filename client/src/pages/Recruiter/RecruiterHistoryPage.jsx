import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserCheck,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  Share2,
  RotateCw,
  ExternalLink,
  ChevronRight,
  Loader2,
  FolderGit2,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import recruiterService from '../../services/recruiterService.js';
import analysisService from '../../services/analysisService.js';

export const RecruiterHistoryPage = () => {
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('Newest First');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [exportingId, setExportingId] = useState(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await recruiterService.getRecruiterHistory({
        page,
        limit: 10,
        search,
        status,
        sort,
      });

      const data = res.data?.data || res.data || res;
      setAnalyses(data.analyses || []);
      setSummary(data.summary || null);
      if (data.pagination) setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch recruiter history:', err);
      toast.error('Failed to load recruiter history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, status, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleExportPDF = async (e, analysisId, repoName) => {
    e.stopPropagation();
    if (!analysisId || exportingId) return;

    setExportingId(analysisId);
    const toastId = toast.loading('Generating PDF Report...');

    try {
      const response = await analysisService.downloadAnalysisPdf(analysisId);

      let filename = `aurex-recruiter-${(repoName || 'report').toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
      const contentDisposition = response.headers?.['content-disposition'];
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('PDF report downloaded successfully.', { id: toastId });
    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error(err.response?.data?.message || 'Failed to generate PDF.', { id: toastId });
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A3247]/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-white tracking-tight">Recruiter Analysis History</h1>
            <span className="px-2.5 py-0.5 text-xs font-extrabold bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              Recruiter Mode
            </span>
          </div>
          <p className="text-xs text-slate-400">
            View candidate evaluations performed on public GitHub repositories
          </p>
        </div>

        <Link
          to="/dashboard/recruiter"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-purple-200" />
          <span>New Recruiter Analysis</span>
        </Link>
      </div>

      {/* Summary Metrics Bar */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247]">
            <p className="text-[11px] font-semibold text-slate-400">Total Candidate Analyses</p>
            <p className="text-xl font-black text-white mt-1">{summary.total || 0}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247]">
            <p className="text-[11px] font-semibold text-slate-400">Completed</p>
            <p className="text-xl font-black text-emerald-400 mt-1">{summary.completed || 0}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247]">
            <p className="text-[11px] font-semibold text-slate-400">Processing</p>
            <p className="text-xl font-black text-indigo-400 mt-1">{summary.processing || 0}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247]">
            <p className="text-[11px] font-semibold text-slate-400">Average Candidate Score</p>
            <p className="text-xl font-black text-purple-300 mt-1">{summary.averageScore || 0} / 100</p>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247]">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate repository or owner..."
            className="w-full pl-10 pr-4 py-2 bg-[#0B1020] border border-[#2A3247] focus:border-purple-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-[#0B1020] border border-[#2A3247] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Processing">Processing</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="bg-[#0B1020] border border-[#2A3247] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="Newest First">Newest First</option>
              <option value="Oldest First">Oldest First</option>
              <option value="Highest Score">Highest Score</option>
              <option value="Lowest Score">Lowest Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table / List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-3">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <p className="text-xs text-slate-400">Loading recruiter candidate analyses...</p>
        </div>
      ) : analyses.length === 0 ? (
        /* Empty State Requirement 14 */
        <div className="flex flex-col items-center justify-center p-16 rounded-3xl bg-[#0F172A]/60 border border-[#2A3247] text-center space-y-4">
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <UserCheck className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-white">No recruiter analyses yet.</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Analyze a public GitHub repository to get started with candidate evaluations.
            </p>
          </div>
          <Link
            to="/dashboard/recruiter"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            Analyze Repository
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((item) => {
            const itemAnalysisId = String(item._id);
            const repo = item.repository || {};
            const github = item.github || {};
            const analysis = item.analysis || {};

            const fullName = repo.fullName || `${repo.owner}/${repo.name}`;
            const formattedDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recently';

            const score = typeof analysis.overallScore === 'number' && analysis.overallScore > 0 ? analysis.overallScore : null;

            return (
              <div
                key={itemAnalysisId}
                onClick={() => navigate(`/dashboard/analysis/${itemAnalysisId}`)}
                className="p-5 rounded-2xl bg-[#0F172A]/90 hover:bg-[#141B2D] border border-[#2A3247] hover:border-purple-500/40 transition-all duration-200 cursor-pointer shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-[#141B2D] border border-[#2A3247] text-purple-400 group-hover:border-purple-500/40 transition-colors shrink-0">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-extrabold text-white group-hover:text-purple-300 transition-colors">
                        {fullName}
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-md">
                        Recruiter Analysis
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span>Language: {github.language || 'TypeScript'}</span>
                      {score !== null && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">Score: {score}/100</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 border-[#2A3247]/60 pt-3 md:pt-0">
                  <button
                    onClick={(e) => handleExportPDF(e, itemAnalysisId, repo.name)}
                    disabled={exportingId === itemAnalysisId}
                    className="p-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] border border-[#2A3247] text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                    title="Export PDF"
                  >
                    {exportingId === itemAnalysisId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span className="hidden sm:inline">PDF</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/recruiter`);
                    }}
                    className="p-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] border border-[#2A3247] text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                    title="Reanalyze"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden sm:inline">Reanalyze</span>
                  </button>

                  <div className="p-2 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 text-purple-400 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecruiterHistoryPage;
