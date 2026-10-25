import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Bug,
  Key,
  Lock,
  FileCode,
  RefreshCw,
  Search,
  ExternalLink,
  Sparkles,
  Bot,
  Filter,
  Check,
  X,
  Play,
  Loader2,
  FolderGit2,
  ChevronRight,
  Info,
  Layers,
  Terminal,
  Clock,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import securityService from '../../services/securityService.js';
import githubService from '../../services/githubService.js';
import socket from '../../services/socket.js';

export const SecurityScanPage = () => {
  // Data states
  const [overview, setOverview] = useState(null);
  const [scans, setScans] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [connectedRepos, setConnectedRepos] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Scan-in-progress state
  const [activeScanProgress, setActiveScanProgress] = useState(null); // { scanId, percentage, stage, status, repoName }

  // Modal states
  const [isNewScanModalOpen, setIsNewScanModalOpen] = useState(false);
  const [selectedRepoToScan, setSelectedRepoToScan] = useState('');
  const [publicRepoUrl, setPublicRepoUrl] = useState('');
  const [isStartingScan, setIsStartingScan] = useState(false);
  const [activeDetailFinding, setActiveDetailFinding] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedOrigin, setSelectedOrigin] = useState('All');
  const [selectedRepoFilter, setSelectedRepoFilter] = useState('All');

  // Load overview, scans, and connected repositories
  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    setErrorMessage(null);

    try {
      const [overviewData, scansData, reposData] = await Promise.all([
        securityService.getSecurityOverview().catch(() => null),
        securityService.getSecurityScans({ limit: 20 }).catch(() => ({ scans: [] })),
        githubService.getRepositories().catch(() => []),
      ]);

      setOverview(overviewData);
      const scanList = scansData?.scans || [];
      setScans(scanList);
      setConnectedRepos(Array.isArray(reposData) ? reposData : []);

      // Default select the latest scan if available
      if (scanList.length > 0) {
        // Fetch full scan details including evidence
        const latestId = scanList[0]._id;
        try {
          const fullLatest = await securityService.getSecurityScanById(latestId);
          setSelectedScan(fullLatest);
        } catch {
          setSelectedScan(scanList[0]);
        }
      } else {
        setSelectedScan(null);
      }
    } catch (err) {
      console.error('Failed to load security scan data:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load security scans from server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Real-time socket listener for scan progress
  useEffect(() => {
    const handleProgress = (data) => {
      console.log('[Security Socket Progress]:', data);
      if (data?.scanId) {
        setActiveScanProgress({
          scanId: data.scanId,
          percentage: data.percentage ?? 0,
          stage: data.stage || 'Scanning repository...',
          status: data.status || 'Scanning',
        });

        if (data.percentage === 100 || data.status === 'Completed') {
          toast.success('Security scan completed successfully!');
          setTimeout(() => {
            setActiveScanProgress(null);
            loadData(false);
          }, 1500);
        } else if (data.status === 'Failed') {
          toast.error(data.error || 'Security scan failed.');
          setTimeout(() => setActiveScanProgress(null), 3000);
        }
      }
    };

    socket.on('security:global_progress', handleProgress);
    socket.on('security_progress', handleProgress);

    return () => {
      socket.off('security:global_progress', handleProgress);
      socket.off('security_progress', handleProgress);
    };
  }, [loadData]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(false);
    toast.success('Security scan records re-synchronized!');
  };

  // Switch selected scan from scan history list
  const handleSelectScan = async (scanItem) => {
    try {
      const fullScan = await securityService.getSecurityScanById(scanItem._id);
      setSelectedScan(fullScan);
    } catch {
      setSelectedScan(scanItem);
    }
  };

  // Launch a new security scan
  const handleStartScan = async () => {
    if (!selectedRepoToScan && !publicRepoUrl.trim()) {
      toast.error('Please select a connected repository or enter a public GitHub URL.');
      return;
    }

    setIsStartingScan(true);
    try {
      let payload = {};
      let displayName = '';

      if (publicRepoUrl.trim()) {
        payload = { githubUrl: publicRepoUrl.trim() };
        displayName = publicRepoUrl.trim();
      } else {
        const parts = selectedRepoToScan.split('/');
        payload = { owner: parts[0], repo: parts[1] };
        displayName = selectedRepoToScan;
      }

      const res = await securityService.startSecurityScan(payload);
      toast.success(`Security scan started for ${displayName}!`);
      setIsNewScanModalOpen(false);
      setPublicRepoUrl('');
      setSelectedRepoToScan('');

      // Join socket room and set active progress banner
      const scanId = res.scanId || res._id;
      if (scanId) {
        socket.emit('join_security', scanId);
        setActiveScanProgress({
          scanId,
          percentage: 10,
          stage: 'Connecting to GitHub repository...',
          status: 'Scanning',
          repoName: displayName,
        });
      }
    } catch (err) {
      console.error('Failed to start security scan:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to start security scan.');
    } finally {
      setIsStartingScan(false);
    }
  };

  // Filter findings of the currently selected scan
  const filteredFindings = useMemo(() => {
    if (!selectedScan || !Array.isArray(selectedScan.findings)) return [];

    return selectedScan.findings.filter((finding) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = finding.title?.toLowerCase().includes(q);
        const descMatch = finding.description?.toLowerCase().includes(q);
        const fileMatch = finding.file?.toLowerCase().includes(q);
        const cveMatch = finding.cve?.toLowerCase().includes(q);
        const remediationMatch = finding.remediation?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !fileMatch && !cveMatch && !remediationMatch) {
          return false;
        }
      }

      // Severity filter
      if (selectedSeverity !== 'All' && finding.severity !== selectedSeverity) {
        return false;
      }

      // Status filter (unresolved vs resolved)
      if (selectedStatus !== 'All') {
        const statusVal = selectedStatus.toLowerCase();
        if (finding.status !== statusVal) return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && finding.category !== selectedCategory) {
        return false;
      }

      // Origin filter (scanner vs ai)
      if (selectedOrigin !== 'All') {
        const originVal = selectedOrigin.toLowerCase();
        if (finding.origin !== originVal) return false;
      }

      return true;
    });
  }, [selectedScan, searchQuery, selectedSeverity, selectedStatus, selectedCategory, selectedOrigin]);

  // Unique categories in the current scan
  const availableCategories = useMemo(() => {
    if (!selectedScan || !Array.isArray(selectedScan.findings)) return [];
    const set = new Set(selectedScan.findings.map((f) => f.category).filter(Boolean));
    return Array.from(set);
  }, [selectedScan]);

  // Color helpers for severity
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-500/15 border-rose-500/30 text-rose-400';
      case 'High':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
      case 'Medium':
        return 'bg-yellow-500/15 border-yellow-500/30 text-yellow-300';
      case 'Low':
        return 'bg-blue-500/15 border-blue-500/30 text-blue-400';
      default:
        return 'bg-slate-500/15 border-slate-500/30 text-slate-300';
    }
  };

  const getScoreColor = (score) => {
    if (score === null || score === undefined) return 'text-slate-400';
    if (score >= 90) return 'text-emerald-400';
    if (score >= 75) return 'text-amber-400';
    return 'text-rose-400';
  };

  // Loading skeleton state
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

  // Error state
  if (errorMessage && !overview && scans.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-[#141B2D]/90 border border-rose-500/30 text-center space-y-4 select-none">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Security Scanner Connection Error</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">{errorMessage}</p>
        <button
          onClick={() => loadData(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* 1. Header Banner & Action Bar */}
      <div className="p-6 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] shadow-xl shadow-indigo-500/5 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Security Vulnerability & SAST Scanner
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Live Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Deterministic dependency auditing via Google OSV.dev, secret detection, injection checks, and AI architectural audits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto z-10">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-[#0F172A] border border-[#2A3247] hover:border-slate-500 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
            title="Refresh Security Scans"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsNewScanModalOpen(true)}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run Security Scan
          </button>
        </div>
      </div>

      {/* 2. Scan-In-Progress Live Banner (Requirement 11) */}
      <AnimatePresence>
        {activeScanProgress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 shadow-lg shadow-indigo-500/10 space-y-2 overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Security Scan in Progress:</span>
                <span className="text-white font-mono">{activeScanProgress.stage}</span>
              </div>
              <span className="font-bold text-indigo-400">{activeScanProgress.percentage}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full"
                animate={{ width: `${activeScanProgress.percentage}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Security Overview Metrics Cards (Requirement 4: Accurate numbers, no mock counts) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 select-none">
        {/* Security Health Score */}
        <div className="p-4 rounded-xl bg-[#141B2D]/90 border border-[#2A3247] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Security Score</span>
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black ${getScoreColor(overview?.securityScore)}`}>
              {overview?.securityScore !== null && overview?.securityScore !== undefined ? overview.securityScore : 'N/A'}
            </span>
            {overview?.securityScore !== null && overview?.securityScore !== undefined && (
              <span className="text-[11px] font-medium text-slate-500">/ 100</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">
            {overview?.scansAvailable ? `Across ${overview.scannedRepositoriesCount} scanned repos` : 'No scans performed yet'}
          </span>
        </div>

        {/* Critical Findings */}
        <div className="p-4 rounded-xl bg-[#141B2D]/90 border border-[#2A3247] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Critical</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            {overview?.critical ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Requires immediate patch</span>
        </div>

        {/* High Findings */}
        <div className="p-4 rounded-xl bg-[#141B2D]/90 border border-[#2A3247] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">High</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {overview?.high ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Elevated risk level</span>
        </div>

        {/* Medium & Low Findings */}
        <div className="p-4 rounded-xl bg-[#141B2D]/90 border border-[#2A3247] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Med / Low</span>
            <Bug className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-black text-yellow-300">
            {(overview?.medium ?? 0) + (overview?.low ?? 0)}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">
            {overview?.medium ?? 0} Med, {overview?.low ?? 0} Low
          </span>
        </div>

        {/* Verified Resolved Findings (Requirement 9) */}
        <div className="p-4 rounded-xl bg-[#141B2D]/90 border border-[#2A3247] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Verified Fixed</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {overview?.resolvedFindings ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Confirmed by re-scan</span>
        </div>

        {/* Unresolved Active Findings */}
        <div className="p-4 rounded-xl bg-[#141B2D]/90 border border-[#2A3247] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unresolved</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-200">
            {overview?.unresolvedFindings ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Open security issues</span>
        </div>
      </div>

      {/* 4. Repository Scan Selector & Header Info */}
      <div className="p-4 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FolderGit2 className="w-5 h-5 text-indigo-400 shrink-0" />
          <div>
            <span className="text-xs text-slate-400">Currently Viewing Scan Report:</span>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              {selectedScan ? selectedScan.repository?.fullName : 'No repository selected'}
              {selectedScan?.repository?.visibility && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-normal">
                  {selectedScan.repository.visibility}
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Switch Scan Dropdown */}
        {scans.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 shrink-0">Switch Scan:</span>
            <select
              value={selectedScan?._id || ''}
              onChange={(e) => {
                const found = scans.find((s) => s._id === e.target.value);
                if (found) handleSelectScan(found);
              }}
              aria-label="Select Security Scan"
              className="w-full sm:w-64 px-3 py-1.5 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {scans.map((scan) => (
                <option key={scan._id} value={scan._id}>
                  {scan.repository?.fullName} — Score: {scan.securityScore ?? 'N/A'} (
                  {new Date(scan.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 5. Filters & Search Bar (Requirement 10) */}
      <div className="p-4 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter findings by title, file, package, CVE, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0F172A] border border-[#2A3247] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              aria-label="Filter by Severity"
              className="px-3 py-2 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Status"
              className="px-3 py-2 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Unresolved">Unresolved Only</option>
              <option value="Resolved">Verified Resolved Only</option>
            </select>

            {/* Origin Filter (Requirement 8) */}
            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              aria-label="Filter by Origin"
              className="px-3 py-2 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Sources</option>
              <option value="Scanner">Deterministic Scanner</option>
              <option value="Ai">AI Suggestions</option>
            </select>

            {/* Category Filter */}
            {availableCategories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by Category"
                className="px-3 py-2 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All Categories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Filter Summary Tags */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-[#2A3247]/50">
          <span>
            Showing <strong className="text-white">{filteredFindings.length}</strong> findings in this report
          </span>
          {(selectedSeverity !== 'All' || selectedStatus !== 'All' || selectedOrigin !== 'All' || selectedCategory !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSeverity('All');
                setSelectedStatus('All');
                setSelectedOrigin('All');
                setSelectedCategory('All');
              }}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* 6. Findings List / Empty State (Requirement 5, 8, 9, 11) */}
      {!selectedScan || !selectedScan.findings || selectedScan.findings.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] text-center space-y-4 select-none">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Security Vulnerabilities Detected</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {scans.length === 0
                ? "You haven't run any security scans yet. Click 'Run Security Scan' to analyze your repository for vulnerabilities and exposed secrets."
                : 'All deterministic checks passed! No vulnerable dependencies or static security issues found in this scan.'}
            </p>
          </div>
          {scans.length === 0 && (
            <button
              onClick={() => setIsNewScanModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Launch First Security Scan
            </button>
          )}
        </div>
      ) : filteredFindings.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#141B2D]/90 border border-[#2A3247] text-center space-y-3">
          <Filter className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No findings match your filter criteria</h3>
          <p className="text-xs text-slate-400">Try adjusting your search terms or filter dropdowns above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding, idx) => {
            const isResolved = finding.status === 'resolved';

            return (
              <motion.div
                key={finding.findingId || idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className={`p-5 rounded-2xl bg-[#141B2D]/90 border ${
                  isResolved
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-[#2A3247] hover:border-slate-600'
                } transition-all space-y-3`}
              >
                {/* Header row: Badges, Title, Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Severity Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getSeverityBadge(
                          finding.severity
                        )}`}
                      >
                        {finding.severity}
                      </span>

                      {/* Origin Badge: Requirement 8: Clearly distinguish scanner vs AI */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${
                          finding.origin === 'scanner'
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                            : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                        }`}
                      >
                        {finding.origin === 'scanner' ? (
                          <>
                            <Terminal className="w-3 h-3" />
                            Scanner ({finding.scannerType || 'SAST'})
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3" />
                            AI Suggestion
                          </>
                        )}
                      </span>

                      {/* Category Badge */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 border border-slate-700 text-slate-300">
                        {finding.category}
                      </span>

                      {/* CVE / Advisory Badge */}
                      {finding.cve && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-mono font-bold">
                          {finding.cve}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white tracking-tight">{finding.title}</h3>
                  </div>

                  {/* Verification Status Badge (Requirement 9) */}
                  <div className="shrink-0">
                    {isResolved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        Verified Resolved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Unresolved
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed">{finding.description}</p>

                {/* File & Line Info (Requirement 5) */}
                {finding.file && (
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#0F172A] px-3 py-1.5 rounded-lg border border-[#2A3247] w-fit">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {finding.file}
                      {finding.line ? `:${finding.line}` : ''}
                    </span>
                  </div>
                )}

                {/* Evidence snippet (Mandatory Redacted secrets, Requirement 7) */}
                {finding.evidence && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Evidence & Context (Redacted)
                    </span>
                    <pre className="p-3 rounded-xl bg-[#090D1A] border border-[#2A3247] text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                      {finding.evidence}
                    </pre>
                  </div>
                )}

                {/* Remediation Guidance (Requirement 5) */}
                {finding.remediation && (
                  <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block mb-0.5">Remediation Guidance:</strong>
                      {finding.remediation}
                    </div>
                  </div>
                )}

                {/* Resolution notice for resolved findings (Requirement 9) */}
                {isResolved && finding.resolutionNote && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{finding.resolutionNote}</span>
                  </div>
                )}

                {/* Advisory References */}
                {Array.isArray(finding.references) && finding.references.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">References:</span>
                    {finding.references.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 underline"
                      >
                        Advisory #{i + 1}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 7. Modal: Run New Security Scan (Requirement 2, 12) */}
      <AnimatePresence>
        {isNewScanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-2xl bg-[#141B2D] border border-[#2A3247] shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Launch New Security Scan</h3>
                    <p className="text-xs text-slate-400">Select a connected repository or enter any public GitHub URL.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNewScanModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Option A: Pick Connected Repo */}
              {connectedRepos.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Choose Connected GitHub Repository:
                  </label>
                  <select
                    value={selectedRepoToScan}
                    onChange={(e) => {
                      setSelectedRepoToScan(e.target.value);
                      if (e.target.value) setPublicRepoUrl('');
                    }}
                    aria-label="Select Connected GitHub Repository"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
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
                  {connectedRepos.length > 0 ? 'OR SCAN ANY PUBLIC REPO' : 'SCAN PUBLIC REPOSITORY'}
                </span>
                <div className="flex-grow border-t border-[#2A3247]" />
              </div>

              {/* Option B: Enter Public GitHub URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Public GitHub Repository URL:
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/owner/repository or owner/repository"
                  value={publicRepoUrl}
                  onChange={(e) => {
                    setPublicRepoUrl(e.target.value);
                    if (e.target.value) setSelectedRepoToScan('');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-[#2A3247] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 block">
                  Supports any public open-source project (e.g., facebook/react, expressjs/express).
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewScanModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartScan}
                  disabled={isStartingScan}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isStartingScan ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Initiating Scan...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Start Security Scan
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

export default SecurityScanPage;
