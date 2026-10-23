import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Gauge,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  FolderGit2,
  FileCode,
  Sparkles,
  Terminal,
  Bot,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Play,
  Loader2,
  X,
  Layers,
  Database,
  Cpu,
  Package,
  Activity,
  ShieldCheck,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import performanceService from '../../services/performanceService.js';
import githubService from '../../services/githubService.js';
import analysisService from '../../services/analysisService.js';
import socket from '../../services/socket.js';

export const PerformancePage = () => {
  // Data states
  const [overview, setOverview] = useState(null);
  const [analyzedRepos, setAnalyzedRepos] = useState([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('');
  const [report, setReport] = useState(null);
  const [connectedRepos, setConnectedRepos] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Scanning / progress state
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [selectedRepoToAnalyze, setSelectedRepoToAnalyze] = useState('');
  const [publicRepoUrl, setPublicRepoUrl] = useState('');
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false);
  const [activeAnalysisProgress, setActiveAnalysisProgress] = useState(null); // { analysisId, percentage, stage }

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedOrigin, setSelectedOrigin] = useState('All');

  // Load overview, analyzed repos, and connected repos
  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    setErrorMessage(null);

    try {
      const [overviewData, reposList, connectedList] = await Promise.all([
        performanceService.getPerformanceOverview().catch(() => null),
        performanceService.getPerformanceRepositories().catch(() => []),
        githubService.getRepositories().catch(() => []),
      ]);

      setOverview(overviewData);
      setAnalyzedRepos(Array.isArray(reposList) ? reposList : []);
      setConnectedRepos(Array.isArray(connectedList) ? connectedList : []);

      // If we have analyzed repositories, load report for the first one by default
      if (Array.isArray(reposList) && reposList.length > 0) {
        const targetId = selectedAnalysisId || reposList[0].analysisId;
        setSelectedAnalysisId(targetId);
        try {
          const reportData = await performanceService.getPerformanceReport(targetId);
          setReport(reportData);
        } catch (err) {
          console.warn('Failed to load performance report for analysis:', err);
        }
      } else {
        setReport(null);
      }
    } catch (err) {
      console.error('Failed to load performance overview data:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load performance analysis data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedAnalysisId]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Real-time socket listener for analysis progress
  useEffect(() => {
    const handleProgress = (data) => {
      if (data?.analysisId) {
        setActiveAnalysisProgress({
          analysisId: data.analysisId,
          percentage: data.percentage ?? 0,
          stage: data.stage || 'Analyzing repository performance...',
          status: data.status || 'Processing',
        });

        if (data.percentage === 100 || data.status === 'Completed') {
          toast.success('Performance analysis completed!');
          setTimeout(() => {
            setActiveAnalysisProgress(null);
            loadData(false);
          }, 1500);
        } else if (data.status === 'Failed') {
          toast.error(data.error || 'Analysis failed.');
          setTimeout(() => setActiveAnalysisProgress(null), 3000);
        }
      }
    };

    socket.on('analysis_progress', handleProgress);
    return () => {
      socket.off('analysis_progress', handleProgress);
    };
  }, [loadData]);

  // Switch repository report
  const handleSelectRepo = async (analysisId) => {
    setSelectedAnalysisId(analysisId);
    try {
      const reportData = await performanceService.getPerformanceReport(analysisId);
      setReport(reportData);
    } catch (err) {
      toast.error('Failed to load report for the selected repository.');
    }
  };

  // Launch analysis
  const handleStartAnalysis = async () => {
    if (!selectedRepoToAnalyze && !publicRepoUrl.trim()) {
      toast.error('Please select a connected repository or enter a public GitHub URL.');
      return;
    }

    setIsStartingAnalysis(true);
    try {
      let res;
      let displayName = '';

      if (publicRepoUrl.trim()) {
        res = await analysisService.startPublicAnalysis(publicRepoUrl.trim());
        displayName = publicRepoUrl.trim();
      } else {
        const parts = selectedRepoToAnalyze.split('/');
        res = await analysisService.startAnalysis(parts[0], parts[1]);
        displayName = selectedRepoToAnalyze;
      }

      toast.success(`Performance analysis queued for ${displayName}!`);
      setIsAnalyzeModalOpen(false);
      setPublicRepoUrl('');
      setSelectedRepoToAnalyze('');

      const analysisId = res.analysisId || res._id || res.data?.analysisId;
      if (analysisId) {
        socket.emit('join_analysis', analysisId);
        setActiveAnalysisProgress({
          analysisId,
          percentage: 10,
          stage: 'Connecting to GitHub repository...',
          status: 'Processing',
        });
      }
    } catch (err) {
      console.error('Failed to trigger performance analysis:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to start performance analysis.');
    } finally {
      setIsStartingAnalysis(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(false);
    toast.success('Performance metrics updated!');
  };

  // Filter findings
  const filteredFindings = useMemo(() => {
    if (!report || !Array.isArray(report.findings)) return [];

    return report.findings.filter((finding) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = finding.title?.toLowerCase().includes(q);
        const descMatch = finding.description?.toLowerCase().includes(q);
        const fileMatch = finding.file?.toLowerCase().includes(q);
        const fixMatch = finding.recommendedFix?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !fileMatch && !fixMatch) return false;
      }

      if (selectedPriority !== 'All') {
        const p = finding.priority || finding.severity;
        if (p !== selectedPriority) return false;
      }

      if (selectedCategory !== 'All' && finding.category !== selectedCategory) {
        return false;
      }

      if (selectedOrigin !== 'All') {
        if (finding.origin !== selectedOrigin.toLowerCase()) return false;
      }

      return true;
    });
  }, [report, searchQuery, selectedPriority, selectedCategory, selectedOrigin]);

  // Unique categories in current report
  const availableCategories = useMemo(() => {
    if (!report || !Array.isArray(report.findings)) return [];
    return Array.from(new Set(report.findings.map((f) => f.category).filter(Boolean)));
  }, [report]);

  const getScoreColor = (score) => {
    if (score === null || score === undefined) return 'text-slate-400';
    if (score >= 90) return 'text-emerald-400';
    if (score >= 75) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
      case 'Critical':
        return 'bg-rose-500/15 border-rose-500/30 text-rose-400';
      case 'Medium':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
      case 'Low':
        return 'bg-blue-500/15 border-blue-500/30 text-blue-400';
      default:
        return 'bg-slate-500/15 border-slate-500/30 text-slate-300';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 select-none animate-pulse">
        <div className="h-28 rounded-2xl bg-[#141B2D]/80 border border-[#2A3247]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-[#141B2D]/80 border border-[#2A3247]" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-[#141B2D]/80 border border-[#2A3247]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* 1. Header (Requirement A) */}
      <div className="p-6 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] shadow-xl shadow-indigo-500/5 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Performance Analysis
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Engine v2.0
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Analyze repository performance risks, runtime bottlenecks, and optimization opportunities.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto z-10">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-[#0F172A] border border-[#2A3247] hover:border-slate-500 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
            title="Refresh Performance Records"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsAnalyzeModalOpen(true)}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Analyze Performance
          </button>
        </div>
      </div>

      {/* Live Scan-in-progress Banner (Requirement G) */}
      <AnimatePresence>
        {activeAnalysisProgress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 shadow-lg shadow-amber-500/10 space-y-2 overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Performance Analysis in Progress:</span>
                <span className="text-white font-mono">{activeAnalysisProgress.stage}</span>
              </div>
              <span className="font-bold text-amber-400">{activeAnalysisProgress.percentage}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 rounded-full"
                animate={{ width: `${activeAnalysisProgress.percentage}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Overview Cards (Requirement B) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 select-none">
        {/* Performance Score */}
        <div className="p-4 rounded-xl bg-[#141B2D]/90 border border-[#2A3247] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Performance Score</span>
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black ${getScoreColor(report?.performanceScore ?? overview?.performanceScore)}`}>
              {report?.performanceScore !== null && report?.performanceScore !== undefined
                ? report.performanceScore
                : overview?.performanceScore !== null && overview?.performanceScore !== undefined
                ? overview.performanceScore
                : 'N/A'}
            </span>
            {(report?.performanceScore != null || overview?.performanceScore != null) && (
              <span className="text-[11px] font-medium text-slate-500">/ 100</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">
            {report?.performanceScore != null ? 'Current repository' : 'Awaiting repository scan'}
          </span>
        </div>

        {/* Identified Performance Findings */}
        <div className="p-4 rounded-xl bg-[#141B2D]/90 border border-[#2A3247] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Identified Findings</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {report?.metrics?.totalFindings ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Detected optimization risks</span>
        </div>

        {/* High Priority Findings */}
        <div className="p-4 rounded-xl bg-[#141B2D]/90 border border-[#2A3247] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">High Priority</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            {report?.metrics?.highPriorityFindings ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Severe runtime or DB bottlenecks</span>
        </div>

        {/* Verified Resolved Findings */}
        <div className="p-4 rounded-xl bg-[#141B2D]/90 border border-[#2A3247] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Verified Resolved</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {report?.metrics?.verifiedResolvedFindings ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Verified absent across scans</span>
        </div>

        {/* Analysis Date */}
        <div className="p-4 rounded-xl bg-[#141B2D]/90 border border-[#2A3247] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Analysis Date</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-sm font-bold text-slate-200">
            {report?.completedAt
              ? new Date(report.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Timestamp recorded in MongoDB</span>
        </div>
      </div>

      {/* 3. Repository Selector Bar (Requirement A) */}
      <div className="p-4 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FolderGit2 className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="text-xs text-slate-400">Selected Repository:</span>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              {report?.repository?.fullName || (analyzedRepos.length > 0 ? analyzedRepos[0].fullName : 'None')}
              {report?.repository?.visibility && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-normal">
                  {report.repository.visibility}
                </span>
              )}
            </h2>
          </div>
        </div>

        {analyzedRepos.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 shrink-0">Switch Repo:</span>
            <select
              value={selectedAnalysisId || ''}
              onChange={(e) => handleSelectRepo(e.target.value)}
              aria-label="Select Repository Analysis"
              className="w-full sm:w-72 px-3 py-1.5 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {analyzedRepos.map((repo) => (
                <option key={repo.analysisId} value={repo.analysisId}>
                  {repo.fullName} (Score: {repo.performanceScore ?? 'N/A'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4. Core Web Vitals Panel (Requirement E: Lab/Browser measurement only, no fabricated numbers) */}
      <div className="p-5 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Browser Core Web Vitals</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Real Browser Lab Measurement Only</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#2A3247] space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>LCP (Largest Contentful Paint)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Lab Metric</span>
            </div>
            <div className="text-lg font-bold text-slate-400">Not Measured</div>
            <p className="text-[10px] text-slate-500">Requires deployed URL and live browser runtime instrumentation.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#2A3247] space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>INP (Interaction to Next Paint)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Field Metric</span>
            </div>
            <div className="text-lg font-bold text-slate-400">Not Measured</div>
            <p className="text-[10px] text-slate-500">Requires real user interaction telemetry in browser.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#2A3247] space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>CLS (Cumulative Layout Shift)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Lab Metric</span>
            </div>
            <div className="text-lg font-bold text-slate-400">Not Measured</div>
            <p className="text-[10px] text-slate-500">Requires headless Chromium viewport rendering.</p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 italic">
          * Aurex strictly avoids fabricating browser runtime measurements from static source code.
        </p>
      </div>

      {/* 5. Filters & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search performance findings by title, file, or recommendation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0F172A] border border-[#2A3247] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              aria-label="Filter by Priority"
              className="px-3 py-2 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            {/* Category Filter */}
            {availableCategories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by Category"
                className="px-3 py-2 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="All">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {/* Origin Filter */}
            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              aria-label="Filter by Source"
              className="px-3 py-2 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All">All Sources</option>
              <option value="Scanner">Deterministic Scanner</option>
              <option value="Ai">AI Suggestions</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-[#2A3247]/50">
          <span>
            Showing <strong className="text-white">{filteredFindings.length}</strong> performance findings
          </span>
          {(selectedPriority !== 'All' || selectedCategory !== 'All' || selectedOrigin !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedPriority('All');
                setSelectedCategory('All');
                setSelectedOrigin('All');
              }}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* 6. Performance Findings List & Empty States (Requirements C, D, F, G) */}
      {!report || analyzedRepos.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] text-center space-y-4 select-none">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No performance analyses yet.</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Select a repository to identify potential performance improvements, query bottlenecks, and bundle size risks.
            </p>
          </div>
          <button
            onClick={() => setIsAnalyzeModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Launch First Performance Scan
          </button>
        </div>
      ) : filteredFindings.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] text-center space-y-3">
          <Filter className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No performance findings match the current filter criteria</h3>
          <p className="text-xs text-slate-400">Try clearing filters or adjusting your search keyword.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding, idx) => {
            const isResolved = finding.verificationStatus === 'resolved';

            return (
              <motion.div
                key={finding.findingId || idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="p-5 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] hover:border-slate-600 transition-all space-y-3"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Priority / Severity Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getPriorityBadge(
                          finding.priority || finding.severity
                        )}`}
                      >
                        {finding.priority || finding.severity} Priority
                      </span>

                      {/* Origin Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${
                          finding.origin === 'scanner'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                        }`}
                      >
                        {finding.origin === 'scanner' ? (
                          <>
                            <Terminal className="w-3 h-3" />
                            Scanner (SAST)
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3" />
                            AI Recommendation
                          </>
                        )}
                      </span>

                      {/* Category Badge (Requirement D) */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 border border-slate-700 text-slate-300">
                        {finding.category}
                      </span>

                      {/* Impact & Effort (Requirement F) */}
                      {finding.impact && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-indigo-950/40 border border-indigo-500/30 text-indigo-300">
                          Impact: {finding.impact}
                        </span>
                      )}
                      {finding.effort && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-900 border border-slate-700 text-slate-400">
                          Effort: {finding.effort}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white tracking-tight">{finding.title}</h3>
                  </div>

                  {/* Verification Status */}
                  <div className="shrink-0">
                    {isResolved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        Verified Resolved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                        <Clock className="w-3.5 h-3.5" />
                        Active Finding
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed">{finding.description}</p>

                {/* Affected File & Line (Requirement C) */}
                {finding.file && (
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#0F172A] px-3 py-1.5 rounded-lg border border-[#2A3247] w-fit">
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {finding.file}
                      {finding.line ? `:${finding.line}` : ''}
                    </span>
                  </div>
                )}

                {/* Evidence snippet */}
                {finding.evidence && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Evidence
                    </span>
                    <pre className="p-3 rounded-xl bg-[#090D1A] border border-[#2A3247] text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                      {finding.evidence}
                    </pre>
                  </div>
                )}

                {/* Recommended Fix (Requirement C, F) */}
                {finding.recommendedFix && (
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block mb-0.5">Recommended Optimization:</strong>
                      {finding.recommendedFix}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 7. Modal: Analyze Performance (Requirement A) */}
      <AnimatePresence>
        {isAnalyzeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-2xl bg-[#141B2D] border border-[#2A3247] shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Analyze Repository Performance</h3>
                    <p className="text-xs text-slate-400">Select a connected repo or enter any public GitHub URL.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAnalyzeModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Connected Repos */}
              {connectedRepos.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Choose Connected GitHub Repository:
                  </label>
                  <select
                    value={selectedRepoToAnalyze}
                    onChange={(e) => {
                      setSelectedRepoToAnalyze(e.target.value);
                      if (e.target.value) setPublicRepoUrl('');
                    }}
                    aria-label="Select Connected GitHub Repository"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="">-- Select from your connected GitHub account --</option>
                    {connectedRepos.map((repo) => (
                      <option key={repo.id || repo.fullName} value={repo.fullName}>
                        {repo.fullName} ({repo.visibility || 'public'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#2A3247]" />
                <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-500">
                  {connectedRepos.length > 0 ? 'OR ENTER PUBLIC REPO' : 'ANALYZE PUBLIC REPOSITORY'}
                </span>
                <div className="flex-grow border-t border-[#2A3247]" />
              </div>

              {/* Public URL Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Public GitHub Repository URL or owner/repo:
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/facebook/react or expressjs/express"
                  value={publicRepoUrl}
                  onChange={(e) => {
                    setPublicRepoUrl(e.target.value);
                    if (e.target.value) setSelectedRepoToAnalyze('');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAnalyzeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartAnalysis}
                  disabled={isStartingAnalysis}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isStartingAnalysis ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Run Analysis
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PerformancePage;
