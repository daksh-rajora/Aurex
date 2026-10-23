import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Share2,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  FolderGit2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowUpDown,
  Sparkles,
  Calendar,
  Layers,
  Bot,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import analysisService from '../../services/analysisService.js';
import reportService from '../../services/reportService.js';
import ShareReportModal from '../../components/report/ShareReportModal.jsx';

export const ReportsPage = () => {
  const navigate = useNavigate();

  // Data states
  const [reports, setReports] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [exportingId, setExportingId] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Share modal state
  const [shareModalConfig, setShareModalConfig] = useState({
    isOpen: false,
    analysisId: null,
    shareUrl: '',
  });

  // Fetch reports list and summary metrics
  const fetchReportsData = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = {
        page: currentPage,
        limit: 10,
      };

      if (sortOption === 'newest') params.sort = 'Newest First';
      else if (sortOption === 'oldest') params.sort = 'Oldest First';
      else if (sortOption === 'highest') params.sort = 'Highest Score';
      else if (sortOption === 'lowest') params.sort = 'Lowest Score';
      else params.sort = 'Newest First';

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== 'All') params.status = statusFilter;
      if (sourceFilter !== 'All') params.source = sourceFilter.toLowerCase();
      
      if (dateFilter === 'today') params.dateRange = 'Today';
      else if (dateFilter === 'week') params.dateRange = 'Last 7 Days';
      else if (dateFilter === 'month') params.dateRange = 'Last 30 Days';
      else params.dateRange = 'All Time';

      const [historyRes, summaryRes] = await Promise.all([
        analysisService.getAnalysisHistory(params).catch((err) => {
          console.warn('Analysis history fetch caught:', err);
          return { data: { analyses: [], pagination: {}, summary: {} } };
        }),
        reportService.getReportsSummary().catch((err) => {
          console.warn('Reports summary fetch caught:', err);
          return null;
        }),
      ]);

      const historyData = historyRes?.data?.analyses !== undefined ? historyRes.data : (historyRes?.data || historyRes || {});
      const analysesList = Array.isArray(historyData?.analyses) ? historyData.analyses : (Array.isArray(historyData) ? historyData : []);
      setReports(analysesList);

      if (historyData.pagination) {
        setPagination({
          page: historyData.pagination.page || 1,
          limit: historyData.pagination.limit || 10,
          total: historyData.pagination.total !== undefined ? historyData.pagination.total : analysesList.length,
          totalPages: historyData.pagination.totalPages || 1,
        });
      } else {
        setPagination((prev) => ({
          ...prev,
          total: analysesList.length,
          totalPages: Math.max(1, Math.ceil(analysesList.length / 10)),
        }));
      }

      setSummaryStats(summaryRes || historyData.summary || null);
    } catch (err) {
      console.error('Failed to load reports data:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load analysis reports.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, sortOption, searchQuery, statusFilter, sourceFilter, dateFilter]);

  useEffect(() => {
    fetchReportsData(true);
  }, [fetchReportsData]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReportsData(false);
    toast.success('Reports list refreshed!');
  };

  // Export PDF handler
  const handleExportPdf = async (analysisId, repoName) => {
    setExportingId(analysisId);
    try {
      toast.loading('Generating PDF report...', { id: `pdf-${analysisId}` });
      const response = await reportService.downloadPdf(analysisId);

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      const cleanName = (repoName || 'repository')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
      link.setAttribute('download', `aurex-report-${cleanName}.pdf`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('PDF report exported successfully!', { id: `pdf-${analysisId}` });
    } catch (err) {
      console.error('Failed to download PDF:', err);
      toast.error(err.response?.data?.message || 'Failed to export PDF report.', { id: `pdf-${analysisId}` });
    } finally {
      setExportingId(null);
    }
  };

  // Share handler
  const handleShareClick = async (reportItem) => {
    const analysisId = reportItem._id;
    if (reportItem.shareEnabled && reportItem.shareToken) {
      setShareModalConfig({
        isOpen: true,
        analysisId,
        shareUrl: `${window.location.origin}/shared/analysis/${reportItem.shareToken}`,
      });
      return;
    }

    // Enable sharing
    try {
      const res = await analysisService.generateShareLink(analysisId);
      const shareToken = res.data?.shareToken || res.shareToken;
      setShareModalConfig({
        isOpen: true,
        analysisId,
        shareUrl: `${window.location.origin}/shared/analysis/${shareToken}`,
      });
      // Refresh list to update badge
      fetchReportsData(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate share link.');
    }
  };

  const getScoreBadge = (score) => {
    if (score == null || score === 0) return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    if (score >= 90) return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
    if (score >= 75) return 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300';
    return 'bg-amber-500/15 border-amber-500/30 text-amber-300';
  };

  const getSourceBadge = (sourceType, isRecruiter) => {
    if (isRecruiter || sourceType === 'recruiter') {
      return {
        label: 'Recruiter',
        className: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
        icon: UserCheck,
      };
    }
    if (sourceType === 'connected') {
      return {
        label: 'Connected',
        className: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
        icon: FolderGit2,
      };
    }
    return {
      label: 'Public',
      className: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
      icon: ExternalLink,
    };
  };

  return (
    <div className="space-y-6 select-none">
      {/* 1. Header (Requirement A) */}
      <div className="p-6 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] shadow-xl shadow-indigo-500/5 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Reports
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Repository Audit Hub
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                View, manage, and export your repository analysis reports.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto z-10">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-[#0F172A] border border-[#2A3247] hover:border-slate-500 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
            title="Refresh Reports"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/dashboard/repositories')}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            Analyze New Repository
          </button>
        </div>
      </div>

      {/* 2. Summary Cards using Real Database Data (Requirement B) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 select-none">
        {/* Total Completed Reports */}
        <div className="p-5 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] shadow-xl shadow-indigo-500/5 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Reports</span>
            <div className="w-8 h-8 rounded-xl bg-[#0F172A] border border-[#2A3247] flex items-center justify-center text-indigo-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {isLoading ? '...' : summaryStats?.totalCompletedReports ?? summaryStats?.completed ?? 0}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">Ready for PDF export & review</span>
          </div>
        </div>

        {/* Reports Generated This Month */}
        <div className="p-5 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] shadow-xl shadow-indigo-500/5 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">This Month</span>
            <div className="w-8 h-8 rounded-xl bg-[#0F172A] border border-[#2A3247] flex items-center justify-center text-purple-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {isLoading ? '...' : summaryStats?.reportsThisMonth ?? 0}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">Current billing cycle</span>
          </div>
        </div>

        {/* Average Analysis Score */}
        <div className="p-5 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] shadow-xl shadow-indigo-500/5 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Score</span>
            <div className="w-8 h-8 rounded-xl bg-[#0F172A] border border-[#2A3247] flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {isLoading
                ? '...'
                : summaryStats?.averageScore != null && summaryStats.averageScore > 0
                ? summaryStats.averageScore
                : 'N/A'}
            </span>
            {summaryStats?.averageScore != null && summaryStats.averageScore > 0 && (
              <span className="text-xs font-medium text-slate-400">/ 100</span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Calculated across completed runs</span>
        </div>

        {/* Shareable Reports */}
        <div className="p-5 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] shadow-xl shadow-indigo-500/5 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shareable Reports</span>
            <div className="w-8 h-8 rounded-xl bg-[#0F172A] border border-[#2A3247] flex items-center justify-center text-cyan-400">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {isLoading ? '...' : summaryStats?.shareableReportsCount ?? 0}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">Active public share links</span>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Bar (Requirement E) */}
      <div className="p-4 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] space-y-3 select-none">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports by repository name or owner..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#0F172A] border border-[#2A3247] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Status"
              className="px-3 py-2 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Processing">Processing</option>
              <option value="Failed">Failed</option>
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Source Type"
              className="px-3 py-2 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Sources</option>
              <option value="Connected">Connected GitHub</option>
              <option value="Public">Public Repositories</option>
              <option value="Recruiter">Recruiter Mode</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Date"
              className="px-3 py-2 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Sort Reports"
              className="px-3 py-2 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="score_desc">Score: High to Low</option>
              <option value="score_asc">Score: Low to High</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-[#2A3247]/50">
          <span>
            Found <strong className="text-white">{pagination.total}</strong> reports matching criteria
          </span>
          {(searchQuery || statusFilter !== 'All' || sourceFilter !== 'All' || dateFilter !== 'all' || sortOption !== 'newest') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setSourceFilter('All');
                setDateFilter('all');
                setSortOption('newest');
                setCurrentPage(1);
              }}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Reports Table / List (Requirements C, D, F) */}
      {isLoading ? (
        <div className="p-12 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading analysis reports from MongoDB...</p>
        </div>
      ) : errorMessage ? (
        <div className="p-8 rounded-2xl bg-[#141B2D]/90 border border-rose-500/30 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Failed to load reports</h3>
          <p className="text-xs text-slate-400">{errorMessage}</p>
          <button
            onClick={() => fetchReportsData(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] text-center space-y-4 select-none">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No reports yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Analyze a repository to generate comprehensive architecture reviews, security scorecards, and downloadable PDF reports.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/repositories')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            Analyze Repository
          </button>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] shadow-xl shadow-indigo-500/5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2A3247] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Repository</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3">Score</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">AI Engine</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A3247]/50 text-xs">
                {reports.map((report) => {
                  const repoFullName = report.repository?.fullName || `${report.repository?.owner}/${report.repository?.name}`;
                  const score = report.analysis?.overallScore;
                  const isCompleted = report.status === 'Completed';
                  const isProcessing = report.status === 'Processing' || report.status === 'Pending';
                  const isFailed = report.status === 'Failed';
                  const source = getSourceBadge(report.sourceType, report.isRecruiterAnalysis);
                  const SourceIcon = source.icon;
                  const isExportingThis = exportingId === report._id;

                  return (
                    <tr
                      key={report._id}
                      className="hover:bg-[#1E293B]/40 transition-colors group"
                    >
                      {/* Repository Name & Owner */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#0F172A] border border-[#2A3247] flex items-center justify-center text-indigo-400 shrink-0">
                            <FolderGit2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white group-hover:text-indigo-300 transition-colors block">
                              {repoFullName}
                            </span>
                            {report.repository?.htmlUrl && (
                              <a
                                href={report.repository.htmlUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-slate-500 hover:text-slate-300 inline-flex items-center gap-1 font-mono"
                                onClick={(e) => e.stopPropagation()}
                              >
                                github.com/{repoFullName}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Source Badge */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border ${source.className}`}
                        >
                          <SourceIcon className="w-3 h-3" />
                          <span>{source.label}</span>
                        </span>
                      </td>

                      {/* Overall Score */}
                      <td className="py-3.5 px-3">
                        {isCompleted && score != null ? (
                          <span
                            className={`px-2.5 py-1 rounded-full border text-xs font-bold ${getScoreBadge(
                              score
                            )}`}
                          >
                            {score} / 100
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">--</span>
                        )}
                      </td>

                      {/* Analysis Date */}
                      <td className="py-3.5 px-3 text-slate-400">
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recently'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        ) : isProcessing ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Processing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 border border-rose-500/20 text-rose-400">
                            <AlertTriangle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </td>

                      {/* AI Provider */}
                      <td className="py-3.5 px-3">
                        <span className="text-xs text-slate-400 font-mono">
                          {report.aiProvider || 'OpenRouter'}
                        </span>
                      </td>

                      {/* Actions (Requirement D) */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Report */}
                          <button
                            onClick={() => navigate(`/dashboard/analysis/${report._id}`)}
                            className="p-1.5 rounded-lg bg-[#0F172A] border border-[#2A3247] hover:border-indigo-500/50 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="View Detailed Report"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Export PDF */}
                          {isCompleted && (
                            <button
                              onClick={() => handleExportPdf(report._id, report.repository?.name)}
                              disabled={isExportingThis}
                              className="p-1.5 rounded-lg bg-[#0F172A] border border-[#2A3247] hover:border-purple-500/50 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                              title="Export PDF Report"
                            >
                              {isExportingThis ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Share Report */}
                          {isCompleted && (
                            <button
                              onClick={() => handleShareClick(report)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                report.shareEnabled
                                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25'
                                  : 'bg-[#0F172A] border-[#2A3247] hover:border-cyan-500/50 text-slate-300 hover:text-white'
                              }`}
                              title={report.shareEnabled ? 'Manage Active Share Link' : 'Generate Public Share Link'}
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-[#2A3247]/50 text-xs">
              <span className="text-slate-400">
                Page <strong className="text-white">{pagination.page}</strong> of{' '}
                <strong className="text-white">{pagination.totalPages}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-[#0F172A] border border-[#2A3247] text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-lg bg-[#0F172A] border border-[#2A3247] text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Share Report Modal */}
      <ShareReportModal
        isOpen={shareModalConfig.isOpen}
        onClose={() => setShareModalConfig({ isOpen: false, analysisId: null, shareUrl: '' })}
        analysisId={shareModalConfig.analysisId}
        shareUrl={shareModalConfig.shareUrl}
        onShareDisabled={() => fetchReportsData(false)}
      />
    </div>
  );
};

export default ReportsPage;
