import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Search,
  X,
  Filter,
  ArrowUpDown,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertOctagon,
  Globe,
  FolderGit2,
  Trash2,
  RotateCw,
  Eye,
  Calendar,
  Layers,
  Award,
  ShieldCheck,
  Zap,
  Code2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import analysisService from '../../services/analysisService.js';
import { socket } from '../../services/socket.js';
import PublicRepoModal from '../../components/repository/PublicRepoModal.jsx';
import toast from 'react-hot-toast';

const GithubIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export const HistoryPage = () => {
  const navigate = useNavigate();

  // Data & Pagination State
  const [analyses, setAnalyses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, completed: 0, processing: 0, failed: 0, averageScore: 0 });

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [reanalyzingId, setReanalyzingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // Item to delete
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublicModalOpen, setIsPublicModalOpen] = useState(false);

  // Search & Filter Controls State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedDateRange, setSelectedDateRange] = useState('All Time');
  const [selectedSort, setSelectedSort] = useState('Newest First');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Real History from Backend API
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
        status: selectedStatus,
        source: selectedSource,
        dateRange: selectedDateRange,
        sort: selectedSort,
      };

      const res = await analysisService.getAnalysisHistory(params);
      const data = res?.data || res;

      if (data) {
        setAnalyses(data.analyses || []);
        setPagination(data.pagination || { page: currentPage, limit: 10, total: 0, totalPages: 1 });
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to fetch analysis history:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Unable to load analysis history.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedStatus, selectedSource, selectedDateRange, selectedSort]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Socket.IO Real-time Progress Tracking for active Processing items (Requirement 14)
  useEffect(() => {
    const processingItems = analyses.filter((a) => a.status === 'Processing');
    if (processingItems.length === 0) return;

    if (!socket.connected) {
      socket.connect();
    }

    processingItems.forEach((item) => {
      const id = String(item._id);
      socket.emit('join_analysis', id);
    });

    const handleProgress = (data) => {
      if (!data || !data.analysisId) return;

      setAnalyses((prev) =>
        prev.map((item) => {
          if (String(item._id) === String(data.analysisId)) {
            const newPercentage = typeof data.percentage === 'number' ? data.percentage : item.liveProgress;
            const newStage = data.stage || item.liveStage;
            const newStatus = data.status || (data.percentage >= 100 ? 'Completed' : item.status);

            return {
              ...item,
              liveProgress: newPercentage,
              liveStage: newStage,
              status: newStatus,
            };
          }
          return item;
        })
      );

      // If an analysis transitions to Completed or Failed, refresh history stats
      if (data.status === 'Completed' || data.status === 'Failed' || data.percentage >= 100) {
        setTimeout(fetchHistory, 1000);
      }
    };

    socket.on('analysis_progress', handleProgress);

    return () => {
      processingItems.forEach((item) => {
        socket.emit('leave_analysis', String(item._id));
      });
      socket.off('analysis_progress', handleProgress);
    };
  }, [analyses, fetchHistory]);

  // Action: View Report
  const handleViewReport = (item) => {
    if (!item || !item._id) return;
    navigate(`/dashboard/analysis/${item._id}`);
  };

  // Action: Re-analyze (Requirement 16)
  const handleReanalyze = async (item) => {
    if (!item || reanalyzingId) return;

    setReanalyzingId(item._id);
    const repo = item.repository || {};
    const repoOwner = repo.owner || repo.fullName?.split('/')[0] || 'owner';
    const repoName = repo.name || repo.fullName?.split('/')[1] || 'repository';
    const repoFullName = repo.fullName || `${repoOwner}/${repoName}`;
    const githubUrl = repo.htmlUrl || item.github?.htmlUrl || `https://github.com/${repoFullName}`;

    try {
      let response;
      // Decide if public URL analysis or connected analysis
      if (repo.visibility === 'public' || githubUrl) {
        response = await analysisService.startPublicAnalysis(githubUrl);
      } else {
        response = await analysisService.startAnalysisApi({
          repositoryName: repoName,
          owner: repoOwner,
          githubUrl,
          language: item.github?.language || 'TypeScript',
        });
      }

      const newAnalysisId =
        response?.data?.analysisId ||
        response?.data?._id ||
        response?.analysisId ||
        response?._id;

      if (newAnalysisId) {
        toast.success(`Re-analysis started for ${repoName}!`, { icon: '🚀' });
        navigate(`/dashboard/analysis/${newAnalysisId}/progress`);
      } else {
        toast.error('Failed to obtain new analysis ID');
      }
    } catch (err) {
      console.error('Re-analysis initiation failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to start re-analysis');
    } finally {
      setReanalyzingId(null);
    }
  };

  // Action: Delete Analysis
  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);
    try {
      await analysisService.deleteAnalysis(deleteTarget._id);
      toast.success('Analysis deleted successfully');
      setDeleteTarget(null);
      fetchHistory();
    } catch (err) {
      console.error('Failed to delete analysis:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to delete analysis');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('All');
    setSelectedSource('All');
    setSelectedDateRange('All Time');
    setSelectedSort('Newest First');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Page Title & Subtitle Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A3247]/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Analysis History
            </h1>
          </div>
          <p className="text-xs lg:text-sm text-slate-400 font-medium">
            Manage, view, and re-run past AI repository code analyses.
          </p>
        </div>

        <button
          onClick={() => setIsPublicModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer active:scale-[0.98] shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Summary Cards Header Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Analyses */}
        <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] shadow-lg flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Total Runs
            </span>
            <span className="text-lg font-black text-white font-mono">
              {isLoading ? '...' : summary.total}
            </span>
          </div>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] shadow-lg flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Completed
            </span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              {isLoading ? '...' : summary.completed}
            </span>
          </div>
        </div>

        {/* Processing */}
        <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] shadow-lg flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Processing
            </span>
            <span className="text-lg font-black text-amber-400 font-mono">
              {isLoading ? '...' : summary.processing}
            </span>
          </div>
        </div>

        {/* Failed */}
        <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] shadow-lg flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Failed
            </span>
            <span className="text-lg font-black text-rose-400 font-mono">
              {isLoading ? '...' : summary.failed}
            </span>
          </div>
        </div>

        {/* Average Score */}
        <div className="p-4 col-span-2 sm:col-span-1 rounded-2xl bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 shadow-lg flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">
              Average Score
            </span>
            <span className="text-lg font-black text-white font-mono">
              {isLoading ? '...' : summary.averageScore > 0 ? `${summary.averageScore}/100` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Search, Filter & Controls Bar */}
      <div className="bg-[#0F172A]/80 border border-[#2A3247] rounded-2xl p-4 shadow-lg backdrop-blur-xl flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search analyses by repository, owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141B2D] border border-[#2A3247] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          {/* Status Filter */}
          <div className="relative flex-1 sm:flex-initial min-w-[130px]">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-[#141B2D] border border-[#2A3247] text-slate-200 text-xs font-medium rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="All" className="bg-[#141B2D]">All Status</option>
              <option value="Completed" className="bg-[#141B2D]">Completed</option>
              <option value="Processing" className="bg-[#141B2D]">Processing</option>
              <option value="Failed" className="bg-[#141B2D]">Failed</option>
            </select>
            <Filter className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Source Filter */}
          <div className="relative flex-1 sm:flex-initial min-w-[155px]">
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-[#141B2D] border border-[#2A3247] text-slate-200 text-xs font-medium rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="All" className="bg-[#141B2D]">All Sources</option>
              <option value="Connected GitHub" className="bg-[#141B2D]">Connected GitHub</option>
              <option value="Public Repository" className="bg-[#141B2D]">Public Repository</option>
            </select>
            <Filter className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Date Range Filter */}
          <div className="relative flex-1 sm:flex-initial min-w-[130px]">
            <select
              value={selectedDateRange}
              onChange={(e) => {
                setSelectedDateRange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-[#141B2D] border border-[#2A3247] text-slate-200 text-xs font-medium rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="All Time" className="bg-[#141B2D]">All Time</option>
              <option value="Today" className="bg-[#141B2D]">Today</option>
              <option value="Last 7 Days" className="bg-[#141B2D]">Last 7 Days</option>
              <option value="Last 30 Days" className="bg-[#141B2D]">Last 30 Days</option>
            </select>
            <Calendar className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort By Filter */}
          <div className="relative flex-1 sm:flex-initial min-w-[150px]">
            <select
              value={selectedSort}
              onChange={(e) => {
                setSelectedSort(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-[#141B2D] border border-[#2A3247] text-slate-200 text-xs font-medium rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="Newest First" className="bg-[#141B2D]">Newest First</option>
              <option value="Oldest First" className="bg-[#141B2D]">Oldest First</option>
              <option value="Highest Score" className="bg-[#141B2D]">Highest Score</option>
              <option value="Lowest Score" className="bg-[#141B2D]">Lowest Score</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchHistory}
            title="Refresh History"
            className="p-2.5 rounded-xl bg-[#141B2D] border border-[#2A3247] text-slate-300 hover:text-white hover:border-slate-500 hover:bg-[#1E293B] transition-all cursor-pointer shrink-0"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {errorMessage && !isLoading && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4 text-rose-300 text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <h4 className="font-bold text-rose-200">Unable to load analysis history.</h4>
              <p className="text-[11px] text-rose-300/80">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={fetchHistory}
            className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-white font-bold hover:bg-rose-500/30 transition-colors cursor-pointer shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeletons vs Analyses Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-6 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 bg-[#141B2D] rounded-lg w-48" />
                <div className="h-5 bg-[#141B2D] rounded-full w-24" />
              </div>
              <div className="h-4 bg-[#141B2D] rounded-lg w-3/4" />
              <div className="grid grid-cols-4 gap-3 pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-[#141B2D] rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : analyses.length > 0 ? (
        <div className="space-y-4">
          {analyses.map((item) => {
            const repo = item.repository || {};
            const github = item.github || {};
            const analysis = item.analysis || {};

            const repoName = repo.name || repo.fullName?.split('/')[1] || 'Repository';
            const repoOwner = repo.owner?.login || repo.owner || repo.fullName?.split('/')[0] || 'owner';
            const fullName = repo.fullName || `${repoOwner}/${repoName}`;
            const visibility = repo.visibility || 'public';
            const isPublicSource = visibility === 'public' || item.isPublicRepo;

            const overallScore = typeof analysis.overallScore === 'number' && analysis.overallScore > 0 ? analysis.overallScore : null;
            const securityScore = typeof analysis.security === 'number' && analysis.security > 0 ? analysis.security : null;
            const codeQualityScore = typeof analysis.codeQuality === 'number' && analysis.codeQuality > 0 ? analysis.codeQuality : null;
            const architectureScore = typeof analysis.architecture === 'number' && analysis.architecture > 0 ? analysis.architecture : null;
            const maintainabilityScore = typeof analysis.maintainability === 'number' && analysis.maintainability > 0 ? analysis.maintainability : null;

            const formattedDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Unknown date';

            const status = item.status || 'Pending';
            const isProcessing = status === 'Processing';
            const isCompleted = status === 'Completed';
            const isFailed = status === 'Failed';

            return (
              <div
                key={item._id}
                className="p-5 lg:p-6 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] hover:border-indigo-500/40 transition-all duration-200 shadow-xl space-y-4 relative overflow-hidden"
              >
                {/* Top Row: Repo Title, Badges & Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A3247]/60 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-lg font-extrabold text-white tracking-tight">
                        {repoName}
                      </h3>
                      <span className="text-xs text-slate-400 font-mono font-medium">
                        {fullName}
                      </span>

                      {/* Source Badge (Connected vs Public) */}
                      {isPublicSource ? (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-purple-400" />
                          Public Repository
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex items-center gap-1">
                          <GithubIcon className="w-3 h-3 text-indigo-400" />
                          Connected GitHub
                        </span>
                      )}

                      {/* Visibility Badge */}
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#141B2D] border border-[#2A3247] text-slate-400 uppercase">
                        {visibility}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Analyzed on {formattedDate}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isCompleted && (
                      <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Completed
                      </span>
                    )}

                    {isProcessing && (
                      <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 shadow-sm">
                        <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        Processing {item.liveProgress ? `${Math.round(item.liveProgress)}%` : ''}
                      </span>
                    )}

                    {isFailed && (
                      <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-1.5 shadow-sm">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                        Failed
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Row: Scores Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {/* Overall Score */}
                  <div className="p-3 rounded-xl bg-[#141B2D] border border-[#2A3247] flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Score</span>
                    <span className="text-base font-black text-indigo-300 font-mono">
                      {overallScore !== null ? `${overallScore}/100` : 'N/A'}
                    </span>
                  </div>

                  {/* Security Score */}
                  <div className="p-3 rounded-xl bg-[#141B2D] border border-[#2A3247] flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Security
                    </span>
                    <span className="text-base font-extrabold text-emerald-400 font-mono">
                      {securityScore !== null ? `${securityScore}/100` : 'N/A'}
                    </span>
                  </div>

                  {/* Code Quality */}
                  <div className="p-3 rounded-xl bg-[#141B2D] border border-[#2A3247] flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Code2 className="w-3 h-3 text-purple-400" />
                      Code Quality
                    </span>
                    <span className="text-base font-extrabold text-purple-300 font-mono">
                      {codeQualityScore !== null ? `${codeQualityScore}/100` : 'N/A'}
                    </span>
                  </div>

                  {/* Architecture */}
                  <div className="p-3 rounded-xl bg-[#141B2D] border border-[#2A3247] flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      Architecture
                    </span>
                    <span className="text-base font-extrabold text-indigo-300 font-mono">
                      {architectureScore !== null ? `${architectureScore}/100` : 'N/A'}
                    </span>
                  </div>

                  {/* Maintainability */}
                  <div className="p-3 col-span-2 sm:col-span-1 rounded-xl bg-[#141B2D] border border-[#2A3247] flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Award className="w-3 h-3 text-pink-400" />
                      Maintainability
                    </span>
                    <span className="text-base font-extrabold text-pink-300 font-mono">
                      {maintainabilityScore !== null ? `${maintainabilityScore}/100` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: AI Provider & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      AI Provider: <strong className="text-slate-200">{item.aiProvider || 'OpenRouter'}</strong>
                    </span>
                  </div>

                  {/* Actions Group */}
                  <div className="flex items-center gap-2">
                    {/* View Report */}
                    <button
                      onClick={() => handleViewReport(item)}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141B2D] border border-[#2A3247] hover:border-indigo-500/40 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>View Report</span>
                    </button>

                    {/* Re-analyze */}
                    <button
                      onClick={() => handleReanalyze(item)}
                      disabled={reanalyzingId === item._id || isProcessing}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/15 border border-indigo-500/30 hover:bg-indigo-600/30 text-indigo-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {reanalyzingId === item._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCw className="w-3.5 h-3.5" />
                      )}
                      <span>Re-analyze</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteTarget(item)}
                      disabled={isProcessing}
                      className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all cursor-pointer disabled:opacity-50"
                      title="Delete Analysis"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] text-xs">
              <span className="text-slate-400 font-medium">
                Showing page <strong className="text-white">{pagination.page}</strong> of{' '}
                <strong className="text-white">{pagination.totalPages}</strong> ({pagination.total} total analyses)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 rounded-xl bg-[#141B2D] border border-[#2A3247] text-slate-300 hover:text-white hover:bg-[#1E293B] disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1 font-bold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                          p === pagination.page
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                            : 'bg-[#141B2D] border border-[#2A3247] text-slate-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-xl bg-[#141B2D] border border-[#2A3247] text-slate-300 hover:text-white hover:bg-[#1E293B] disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1 font-bold"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State (Requirement 11) */
        <div className="p-12 rounded-3xl bg-[#0F172A]/80 border border-[#2A3247] text-center space-y-4 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <History className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-white">No analyses yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Analyze a GitHub repository to see your results here.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            {searchQuery || selectedStatus !== 'All' || selectedSource !== 'All' ? (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-[#141B2D] border border-[#2A3247] text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            ) : null}

            <button
              onClick={() => setIsPublicModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze Repository</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Requirement 5) */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl bg-[#0F172A] border border-rose-500/30 shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Delete this analysis?</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {deleteTarget.repository?.fullName || deleteTarget.repository?.name}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-[#141B2D] p-3 rounded-xl border border-[#2A3247]">
                This will permanently remove this analysis from your history. This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-[#141B2D] border border-[#2A3247] text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Public Repository Analysis Modal */}
      <PublicRepoModal
        isOpen={isPublicModalOpen}
        onClose={() => setIsPublicModalOpen(false)}
      />
    </div>
  );
};

export default HistoryPage;
