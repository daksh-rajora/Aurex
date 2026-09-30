import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import githubService from '../../services/githubService.js';
import analysisService from '../../services/analysisService.js';
import RepoStats from '../../components/repository/RepoStats.jsx';
import RepoActionBar from '../../components/repository/RepoActionBar.jsx';
import RepoGrid from '../../components/repository/RepoGrid.jsx';
import RepoPagination from '../../components/repository/RepoPagination.jsx';
import RepoEmptyState from '../../components/repository/RepoEmptyState.jsx';
import RepoSkeleton from '../../components/repository/RepoSkeleton.jsx';
import AnalyzeModal from '../../components/repository/AnalyzeModal.jsx';
import PublicRepoModal from '../../components/repository/PublicRepoModal.jsx';
import RepoDrawer from '../../components/repository/RepoDrawer.jsx';
import ConnectGithubModal from '../../components/repository/ConnectGithubModal.jsx';
import AnalysisLoadingPage from '../Analysis/AnalysisLoadingPage.jsx';
import { Sparkles, FolderGit2, AlertTriangle, RefreshCw, Unplug } from 'lucide-react';
import toast from 'react-hot-toast';

export const RepositoriesPage = () => {
  const navigate = useNavigate();

  const [repositories, setRepositories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isGithubConnected, setIsGithubConnected] = useState(true);

  // Filters & Controls State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedVisibility, setSelectedVisibility] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Recently Updated');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Active Modals, Drawer & Fullscreen Loading State
  const [selectedDrawerRepo, setSelectedDrawerRepo] = useState(null);
  const [analyzeModalRepo, setAnalyzeModalRepo] = useState(null);
  const [isPublicModalOpen, setIsPublicModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [activeAnalysisLoading, setActiveAnalysisLoading] = useState(null); // { repo, analysisId }


  // Fetch real repositories from backend and sync favorite status from MongoDB
  const fetchRepositories = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setErrorMessage(null);

    try {
      const [data, favList] = await Promise.all([
        githubService.getRepositories(),
        githubService.getFavoritesApi().catch(() => []),
      ]);

      const favSet = new Set(
        Array.isArray(favList)
          ? favList.map((f) => String(f.repositoryId || f.fullName))
          : []
      );

      const merged = data.map((repo) => ({
        ...repo,
        isFavorite: favSet.has(String(repo.id)) || favSet.has(repo.fullName),
      }));

      setRepositories(merged);
      setIsGithubConnected(true);
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load repositories from backend API';

      if (
        message.toLowerCase().includes('not connected') ||
        error.response?.status === 400
      ) {
        setIsGithubConnected(false);
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRepositories(true);
  }, [fetchRepositories]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRepositories(false);
    toast.success('Repositories re-synchronized with backend API!');
  };

  // Robust Language Normalization and Matching Helper
  const matchesLanguageFilter = (repoLanguage, filterLanguage) => {
    if (!filterLanguage || filterLanguage === 'All' || filterLanguage === 'All Languages') {
      return true;
    }
    if (!repoLanguage) return false;

    const normalize = (val) => {
      const lower = String(val).trim().toLowerCase();
      if (lower === 'js') return 'javascript';
      if (lower === 'ts') return 'typescript';
      if (lower === 'py') return 'python';
      if (lower === 'cpp') return 'c++';
      if (lower === 'cs' || lower === 'csharp') return 'c#';
      if (lower === 'sh' || lower === 'bash') return 'shell';
      if (lower === 'pwsh') return 'powershell';
      if (lower === 'objc') return 'objective-c';
      return lower;
    };

    const repoNorm = normalize(repoLanguage);
    const filterNorm = normalize(filterLanguage);

    if (repoNorm === filterNorm) return true;

    // Handle hybrid or legacy tags like 'HTML/CSS'
    if (repoNorm === 'html/css') {
      if (filterNorm === 'html' || filterNorm === 'css' || filterNorm === 'html/css') {
        return true;
      }
    }

    return false;
  };

  // Search filtering by Name, Description, Language and Visibility
  const filteredRepositories = useMemo(() => {
    return repositories
      .filter((repo) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          repo.name.toLowerCase().includes(q) ||
          (repo.fullName && repo.fullName.toLowerCase().includes(q)) ||
          (repo.description && repo.description.toLowerCase().includes(q)) ||
          (Array.isArray(repo.topics) && repo.topics.some((t) => t.toLowerCase().includes(q)));

        const matchesLanguage = matchesLanguageFilter(repo.language, selectedLanguage);

        const matchesVisibility =
          selectedVisibility === 'All' ||
          (selectedVisibility === 'Private' && repo.isPrivate) ||
          (selectedVisibility === 'Public' && !repo.isPrivate);

        return matchesSearch && matchesLanguage && matchesVisibility;
      })
      .sort((a, b) => {
        if (selectedSort === 'Stars') {
          return (b.stars || 0) - (a.stars || 0);
        } else if (selectedSort === 'Name') {
          return a.name.localeCompare(b.name);
        } else {
          return String(a.id).localeCompare(String(b.id));
        }
      });
  }, [repositories, searchQuery, selectedLanguage, selectedVisibility, selectedSort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLanguage, selectedVisibility, selectedSort]);

  const totalPages = Math.ceil(filteredRepositories.length / itemsPerPage) || 1;
  const paginatedRepositories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRepositories.slice(start, start + itemsPerPage);
  }, [filteredRepositories, currentPage, itemsPerPage]);

  const [togglingFavIds, setTogglingFavIds] = useState(new Set());

  const handleToggleFavorite = async (targetRepo) => {
    if (!targetRepo) return;

    const repoId = String(targetRepo.id || targetRepo.fullName);
    const repoFullName = targetRepo.fullName || `${targetRepo.owner?.login || 'owner'}/${targetRepo.name}`;

    // Prevent concurrent toggle requests for the same repository
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
        language: targetRepo.language || 'TypeScript',
        stars: targetRepo.stars || 0,
        forks: targetRepo.forks || 0,
        isPrivate: Boolean(targetRepo.isPrivate),
      };

      const res = await githubService.toggleFavoriteApi(payload);

      // Backend API response is the single source of truth for the final state
      const finalFavoriteState = Boolean(res?.data?.isFavorite ?? res?.isFavorite);
      const displayName = res?.data?.repositoryName || res?.repositoryName || repoName;

      // Update UI state to match final backend state
      setRepositories((prev) =>
        prev.map((r) => {
          if (String(r.id) === repoId || r.fullName === repoFullName) {
            return { ...r, isFavorite: finalFavoriteState };
          }
          return r;
        })
      );

      // Show toast strictly matching final backend state
      if (finalFavoriteState) {
        toast.success(`Added ${displayName} to Favorites`, { icon: '⭐' });
      } else {
        toast.success(`Removed ${displayName} from Favorites`, { icon: '⭐' });
      }
    } catch (err) {
      console.error('Failed to update favorite status on server:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update favorite status');
    } finally {
      setTogglingFavIds((prev) => {
        const next = new Set(prev);
        next.delete(repoId);
        next.delete(repoFullName);
        return next;
      });
    }
  };

  const [isAnalyzingRepo, setIsAnalyzingRepo] = useState(false);

  // STEP 2 & 3: Initiate analysis call to backend & navigate immediately to real-time progress page
  const handleConfirmAnalysis = async (targetRepo) => {
    if (!targetRepo || isAnalyzingRepo) return;

    setIsAnalyzingRepo(true);
    setAnalyzeModalRepo(null);

    console.log('[Analysis] Analyze clicked');
    console.log('[Analysis] Creating analysis...');

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
        console.log(`[Analysis] Analysis created: ${createdAnalysisId}`);
        console.log('[Analysis] Navigating to progress page');
        navigate(`/dashboard/analysis/${createdAnalysisId}/progress`);
      } else {
        toast.error('Failed to obtain analysis ID from server');
      }
    } catch (err) {
      console.error('Backend startAnalysis error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to start analysis');
    } finally {
      setIsAnalyzingRepo(false);
    }
  };

  // STEP 4: Redirect on completion to /analysis/:analysisId
  const handleLoadingComplete = () => {
    if (activeAnalysisLoading) {
      const targetId = activeAnalysisLoading.analysisId;
      setActiveAnalysisLoading(null);
      toast.success('AI Repository Analysis completed successfully!', { icon: '✨' });
      navigate(`/dashboard/analysis/${targetId}`);
    }
  };

  const handleInitiateGithubConnect = () => {
    const oauthUrl =
      import.meta.env.VITE_GITHUB_OAUTH_URL || 'http://localhost:5000/api/github/login';
    const token = localStorage.getItem('token');
    if (token) {
      window.location.href = `${oauthUrl}?token=${token}`;
    } else {
      window.location.href = oauthUrl;
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLanguage('All');
    setSelectedVisibility('All');
    setSelectedSort('Recently Updated');
  };

  const totalCount = repositories.length;
  const privateCount = repositories.filter((r) => r.isPrivate).length;
  const publicCount = repositories.filter((r) => !r.isPrivate).length;
  const analyzedCount = repositories.filter((r) => r.isAnalyzed).length;

  const hasFiltersActive =
    searchQuery !== '' || selectedLanguage !== 'All' || selectedVisibility !== 'All';

  // Render Full-Screen Loading View during analysis execution
  if (activeAnalysisLoading) {
    return (
      <AnalysisLoadingPage
        repoName={activeAnalysisLoading.repo.name}
        owner={activeAnalysisLoading.repo.owner?.login}
        onComplete={handleLoadingComplete}
      />
    );
  }

  return (
    <div className="space-y-6 pb-8 select-none">
      {/* Page Title & Subtitle Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A3247]/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Repositories
            </h1>
            {!isLoading && (
              <span className="px-2.5 py-0.5 text-xs font-extrabold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full">
                {filteredRepositories.length === totalCount
                  ? totalCount
                  : `${filteredRepositories.length} of ${totalCount}`}
              </span>
            )}
          </div>
          <p className="text-xs lg:text-sm text-slate-400 font-medium">
            Manage, search and analyze your connected GitHub repositories.
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0F172A]/80 border border-[#2A3247] text-xs font-semibold text-slate-300">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>Real-time GitHub Integration</span>
        </div>
      </div>

      {/* GitHub Disconnected Error Alert */}
      {!isGithubConnected && !isLoading && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Unplug className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200">
                GitHub Account Disconnected
              </h4>
              <p className="text-xs text-amber-300/80">
                Please connect your GitHub account to access your repositories.
              </p>
            </div>
          </div>
          <button
            onClick={handleInitiateGithubConnect}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer"
          >
            Connect GitHub Account
          </button>
        </div>
      )}

      {/* API Generic Error Alert */}
      {errorMessage && isGithubConnected && !isLoading && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchRepositories(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-white font-semibold hover:bg-rose-500/30 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Statistics Cards Row */}
      <RepoStats
        totalCount={totalCount}
        privateCount={privateCount}
        publicCount={publicCount}
        analyzedCount={analyzedCount}
      />

      {/* Top Action Bar (Search & Filter Controls) */}
      <RepoActionBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        selectedVisibility={selectedVisibility}
        setSelectedVisibility={setSelectedVisibility}
        selectedSort={selectedSort}
        setSelectedSort={setSelectedSort}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onConnectGithub={handleInitiateGithubConnect}
        onOpenPublicModal={() => setIsPublicModalOpen(true)}
      />

      {/* Loading Skeletons vs Real Repository Cards Grid */}
      {isLoading || isRefreshing ? (
        <RepoSkeleton count={6} />
      ) : paginatedRepositories.length > 0 ? (
        <>
          <RepoGrid
            repositories={paginatedRepositories}
            onViewDetails={(repo) => setSelectedDrawerRepo(repo)}
            onAnalyze={(repo) => setAnalyzeModalRepo(repo)}
            onToggleFavorite={handleToggleFavorite}
            togglingFavIds={togglingFavIds}
          />

          {/* Pagination Controls */}
          <RepoPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredRepositories.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      ) : (
        <RepoEmptyState
          hasFilters={hasFiltersActive}
          onResetFilters={handleResetFilters}
          onConnectGithub={handleInitiateGithubConnect}
        />
      )}

      {/* Modals & Right Drawer */}
      <AnalyzeModal
        isOpen={Boolean(analyzeModalRepo)}
        onClose={() => setAnalyzeModalRepo(null)}
        repo={analyzeModalRepo}
        onConfirmAnalysis={handleConfirmAnalysis}
      />

      <PublicRepoModal
        isOpen={isPublicModalOpen}
        onClose={() => setIsPublicModalOpen(false)}
      />

      <RepoDrawer
        isOpen={Boolean(selectedDrawerRepo)}
        onClose={() => setSelectedDrawerRepo(null)}
        repo={selectedDrawerRepo}
        onAnalyze={(repo) => setAnalyzeModalRepo(repo)}
      />

      <ConnectGithubModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={() => fetchRepositories(true)}
      />
    </div>
  );
};

export default RepositoriesPage;

