import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Search,
  X,
  Filter,
  ArrowUpDown,
  RefreshCw,
  FolderGit2,
  AlertTriangle,
  Bot,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import githubService, { normalizeRepository } from '../../services/githubService.js';
import analysisService from '../../services/analysisService.js';
import RepoGrid from '../../components/repository/RepoGrid.jsx';
import RepoSkeleton from '../../components/repository/RepoSkeleton.jsx';
import AnalyzeModal from '../../components/repository/AnalyzeModal.jsx';
import RepoDrawer from '../../components/repository/RepoDrawer.jsx';
import toast from 'react-hot-toast';

export const FavoritesPage = () => {
  const navigate = useNavigate();

  // Primary Data State
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Recently Updated');

  // Modals & Drawer State
  const [selectedDrawerRepo, setSelectedDrawerRepo] = useState(null);
  const [analyzeModalRepo, setAnalyzeModalRepo] = useState(null);
  const [isAnalyzingRepo, setIsAnalyzingRepo] = useState(false);
  const [togglingFavIds, setTogglingFavIds] = useState(new Set());

  // Fetch Favorites directly from authenticated user's MongoDB records
  const fetchFavorites = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setErrorMessage(null);

    try {
      // Fetch favorites from backend and optionally connected GitHub repos for richest metadata
      const [favResult, repoResult] = await Promise.allSettled([
        githubService.getFavoritesApi(),
        githubService.getRepositories(),
      ]);

      const rawFavs = favResult.status === 'fulfilled' && Array.isArray(favResult.value)
        ? favResult.value
        : [];

      if (favResult.status === 'rejected') {
        throw new Error(favResult.reason?.response?.data?.message || 'Failed to fetch favorites from server');
      }

      // Build a map of connected repos by id and full_name if available
      const connectedReposMap = new Map();
      if (repoResult.status === 'fulfilled' && Array.isArray(repoResult.value)) {
        repoResult.value.forEach((r) => {
          if (r.id) connectedReposMap.set(String(r.id), r);
          if (r.fullName) connectedReposMap.set(r.fullName.toLowerCase(), r);
        });
      }

      // Normalize each favorite, merging enriched GitHub repository data if available
      const normalizedFavs = rawFavs.map((fav) => {
        const repoKey = String(fav.repositoryId || fav.fullName || '').toLowerCase();
        const connectedMatch =
          connectedReposMap.get(String(fav.repositoryId)) ||
          connectedReposMap.get(repoKey);

        const baseRepo = connectedMatch
          ? { ...connectedMatch, ...fav, isFavorite: true }
          : { ...fav, isFavorite: true };

        return normalizeRepository(baseRepo);
      });

      setFavorites(normalizedFavs);
    } catch (error) {
      console.error('[Favorites] Failed to fetch favorites:', error);
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load favorite repositories from backend API';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites(true);
  }, [fetchFavorites]);

  // Handle Manual Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFavorites(false);
    toast.success('Favorites updated!', { icon: '⭐' });
  };

  // Derive unique real languages from the user's favorited repositories
  const availableLanguages = useMemo(() => {
    const langSet = new Set();
    favorites.forEach((repo) => {
      if (repo?.language && repo.language !== 'N/A' && repo.language !== 'Unknown') {
        langSet.add(repo.language.trim());
      }
    });
    return ['All', ...Array.from(langSet).sort()];
  }, [favorites]);

  // Combined Search, Language Filter, and Sorting
  const filteredFavorites = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return favorites
      .filter((repo) => {
        // Search filter: repo name, owner, description, or full name
        const matchesSearch =
          !q ||
          repo.name.toLowerCase().includes(q) ||
          (repo.fullName && repo.fullName.toLowerCase().includes(q)) ||
          (repo.owner?.login && repo.owner.login.toLowerCase().includes(q)) ||
          (repo.description && repo.description.toLowerCase().includes(q));

        // Language filter: exact match with normalized check
        const matchesLanguage =
          selectedLanguage === 'All' ||
          repo.language?.toLowerCase() === selectedLanguage.toLowerCase();

        return matchesSearch && matchesLanguage;
      })
      .sort((a, b) => {
        if (selectedSort === 'Most Stars') {
          return (b.stars || 0) - (a.stars || 0);
        }
        if (selectedSort === 'Repository Name') {
          return a.name.localeCompare(b.name);
        }
        // Default: Recently Updated
        const dateA = new Date(a.lastCommit || a.createdDate || 0).getTime();
        const dateB = new Date(b.lastCommit || b.createdDate || 0).getTime();
        return dateB - dateA;
      });
  }, [favorites, searchQuery, selectedLanguage, selectedSort]);

  // Handle Remove/Toggle Favorite with Real MongoDB Persistence
  const handleToggleFavorite = async (targetRepo) => {
    if (!targetRepo) return;

    const repoId = String(targetRepo.id || targetRepo.fullName);
    const repoFullName =
      targetRepo.fullName || `${targetRepo.owner?.login || 'owner'}/${targetRepo.name}`;

    // Prevent concurrent actions on same item
    if (togglingFavIds.has(repoId) || togglingFavIds.has(repoFullName)) return;

    setTogglingFavIds((prev) => {
      const next = new Set(prev);
      next.add(repoId);
      next.add(repoFullName);
      return next;
    });

    const repoName = targetRepo.name || repoFullName.split('/')[1] || repoFullName;

    try {
      const payload = {
        repositoryId: repoId,
        name: repoName,
        fullName: repoFullName,
        owner: targetRepo.owner?.login || targetRepo.owner || 'owner',
        githubUrl: targetRepo.url || targetRepo.htmlUrl || `https://github.com/${repoFullName}`,
        description: targetRepo.description || '',
        language: targetRepo.language || 'TypeScript',
        stars: targetRepo.stars || 0,
        forks: targetRepo.forks || 0,
        isPrivate: Boolean(targetRepo.isPrivate),
      };

      const res = await githubService.toggleFavoriteApi(payload);
      const isStillFavorite = Boolean(res?.data?.isFavorite ?? res?.isFavorite);
      const displayName = res?.data?.repositoryName || res?.repositoryName || repoName;

      if (!isStillFavorite) {
        // Successfully removed from MongoDB -> remove from local state
        setFavorites((prev) =>
          prev.filter((r) => String(r.id) !== repoId && r.fullName !== repoFullName)
        );
        toast.success(`Removed ${displayName} from Favorites`, { icon: '⭐' });
      } else {
        // Toggled back to favorite
        setFavorites((prev) =>
          prev.map((r) =>
            String(r.id) === repoId || r.fullName === repoFullName
              ? { ...r, isFavorite: true }
              : r
          )
        );
        toast.success(`Added ${displayName} to Favorites`, { icon: '⭐' });
      }
    } catch (err) {
      console.error('[Favorites] Failed to toggle favorite:', err);
      toast.error(
        err.response?.data?.message || err.message || 'Failed to update favorite status in database'
      );
    } finally {
      setTogglingFavIds((prev) => {
        const next = new Set(prev);
        next.delete(repoId);
        next.delete(repoFullName);
        return next;
      });
    }
  };

  // Launch AI Repository Analysis Pipeline
  const handleConfirmAnalysis = async (targetRepo) => {
    if (!targetRepo || isAnalyzingRepo) return;

    setIsAnalyzingRepo(true);
    setAnalyzeModalRepo(null);

    try {
      const payload = {
        repositoryId: String(targetRepo.id),
        repositoryName: targetRepo.name,
        owner: targetRepo.owner?.login || targetRepo.fullName?.split('/')[0] || 'owner',
        githubUrl: targetRepo.url,
        language: targetRepo.language || 'TypeScript',
      };

      const response = await analysisService.startAnalysisApi(payload);
      const createdAnalysisId =
        response?.data?.analysisId ||
        response?.data?._id ||
        response?.analysisId ||
        response?._id;

      if (createdAnalysisId) {
        navigate(`/dashboard/analysis/${createdAnalysisId}/progress`);
      } else {
        toast.error('Failed to obtain analysis ID from server');
      }
    } catch (err) {
      console.error('[Favorites] Analysis start error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to start analysis');
    } finally {
      setIsAnalyzingRepo(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLanguage('All');
    setSelectedSort('Recently Updated');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedLanguage !== 'All';

  return (
    <div className="space-y-6">
      {/* 1. Page Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2A3247]/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              My Favorites
            </h1>
            {!isLoading && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                {favorites.length} {favorites.length === 1 ? 'repo' : 'repos'}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 font-medium">
            Your saved GitHub repositories in one place.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141B2D] border border-[#2A3247] hover:border-indigo-500/40 text-slate-300 hover:text-white text-xs font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50"
            title="Refresh Favorites"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/repositories')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 text-xs font-semibold transition-all duration-200 cursor-pointer"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Browse Repositories</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] backdrop-blur-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by repository name, owner, or description..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#141B2D] border border-[#2A3247] focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-400 transition-colors focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Language Filter */}
          <div className="relative min-w-[160px]">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full pl-8 pr-8 py-2.5 bg-[#141B2D] border border-[#2A3247] focus:border-indigo-500 rounded-xl text-xs text-slate-200 cursor-pointer focus:outline-none appearance-none"
            >
              <option value="All">All Languages ({favorites.length})</option>
              {availableLanguages
                .filter((lang) => lang !== 'All')
                .map((lang) => {
                  const count = favorites.filter((r) => r.language?.toLowerCase() === lang.toLowerCase()).length;
                  return (
                    <option key={lang} value={lang}>
                      {lang} ({count})
                    </option>
                  );
                })}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative min-w-[170px]">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full pl-8 pr-8 py-2.5 bg-[#141B2D] border border-[#2A3247] focus:border-indigo-500 rounded-xl text-xs text-slate-200 cursor-pointer focus:outline-none appearance-none"
            >
              <option value="Recently Updated">Recently Updated</option>
              <option value="Repository Name">Repository Name (A-Z)</option>
              <option value="Most Stars">Most Stars</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Filters Button (Visible only when filters active) */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#2A3247]/50 text-xs text-slate-400">
            <span>Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium">
                Search: "{searchQuery}"
                <X
                  className="w-3 h-3 cursor-pointer hover:text-white"
                  onClick={() => setSearchQuery('')}
                />
              </span>
            )}
            {selectedLanguage !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium">
                Language: {selectedLanguage}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-white"
                  onClick={() => setSelectedLanguage('All')}
                />
              </span>
            )}
            <span className="text-slate-500 ml-auto font-medium">
              Showing {filteredFavorites.length} of {favorites.length}
            </span>
          </div>
        )}
      </div>

      {/* 3. Error Banner */}
      {errorMessage && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchFavorites(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 4. Main Content: Loading Skeletons vs Real Cards vs Empty States */}
      {isLoading || isRefreshing ? (
        <RepoSkeleton count={6} />
      ) : favorites.length === 0 ? (
        /* Empty State: No favorites saved in database */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] shadow-xl backdrop-blur-xl select-none"
        >
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-indigo-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Star className="w-8 h-8 text-amber-400 fill-amber-400/20" />
            </div>
            <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>

          <h3 className="text-lg font-bold text-white mb-1.5">
            No favorite repositories yet.
          </h3>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            Star a repository to save it here. You can easily bookmark and analyze your key repositories anytime.
          </p>

          <button
            onClick={() => navigate('/dashboard/repositories')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 transition-all duration-200 cursor-pointer"
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Browse Repositories</span>
          </button>
        </motion.div>
      ) : filteredFavorites.length === 0 ? (
        /* Empty State: Search or filter produced 0 matches */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] shadow-xl backdrop-blur-xl select-none"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            No matching repositories found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
            No favorite repositories match your current search query or language filter.
          </p>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141B2D] border border-[#2A3247] hover:border-indigo-500/40 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        </motion.div>
      ) : (
        /* Real Repository Cards Grid */
        <RepoGrid
          repositories={filteredFavorites}
          onViewDetails={(repo) => setSelectedDrawerRepo(repo)}
          onAnalyze={(repo) => setAnalyzeModalRepo(repo)}
          onToggleFavorite={handleToggleFavorite}
          togglingFavIds={togglingFavIds}
        />
      )}

      {/* 5. Reused Modals & Right Drawer */}
      <AnalyzeModal
        isOpen={Boolean(analyzeModalRepo)}
        onClose={() => setAnalyzeModalRepo(null)}
        repo={analyzeModalRepo}
        onConfirmAnalysis={handleConfirmAnalysis}
      />

      <RepoDrawer
        isOpen={Boolean(selectedDrawerRepo)}
        onClose={() => setSelectedDrawerRepo(null)}
        repo={selectedDrawerRepo}
        onAnalyze={(repo) => setAnalyzeModalRepo(repo)}
      />
    </div>
  );
};

export default FavoritesPage;
