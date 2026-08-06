import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Share2,
  RotateCw,
  FolderGit2,
  Code2,
  Layers,
  ArrowLeft,
  FileCode,
  FolderTree,
  PackageCheck,
  TrendingUp,
  Check,
  Loader2,
  AlertOctagon,
  Award,
  CheckSquare,
} from 'lucide-react';
import analysisService from '../../services/analysisService.js';
import toast from 'react-hot-toast';

export const AnalysisReportPage = () => {
  const { analysisId } = useParams();
  const navigate = useNavigate();

  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let pollInterval = null;

    const fetchAnalysis = async () => {
      if (!analysisId) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await analysisService.getSingleAnalysis(analysisId);
        console.log('[GET /api/analysis/:id response.data]:', res);

        if (isMounted && res) {
          const doc = res.data?.data || res.data || res;
          console.log('[GET /api/analysis/:id extracted doc]:', doc);
          setReportData(doc);
          setIsLoading(false);

          if (doc.status === 'Processing' || doc.status === 'Pending') {
            pollInterval = setTimeout(fetchAnalysis, 2500);
          }
        }
      } catch (err) {
        console.warn('Failed to load report from backend:', err);
        if (isMounted) {
          setErrorMessage(err.response?.data?.message || err.message || 'Failed to load report from MongoDB.');
          setIsLoading(false);
        }
      }
    };

    fetchAnalysis();

    return () => {
      isMounted = false;
      if (pollInterval) clearTimeout(pollInterval);
    };
  }, [analysisId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4 text-center select-none">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        <h3 className="text-xl font-extrabold text-white">Loading Analysis Report...</h3>
        <p className="text-xs text-slate-400">Fetching analysis document from MongoDB.</p>
      </div>
    );
  }

  if (reportData && (reportData.status === 'Processing' || reportData.status === 'Pending')) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4 text-center select-none">
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
        <h3 className="text-xl font-extrabold text-white">Processing Repository...</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Aurex AI Engine is scanning repository files, constructing context prompts, and generating your AI analysis.
        </p>
      </div>
    );
  }

  if (errorMessage || (reportData && reportData.status === 'Failed')) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4 text-center select-none">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
          <AlertOctagon className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-extrabold text-white">Analysis Generation Failed</h3>
        <p className="text-xs text-slate-400 max-w-md">
          {reportData?.errorMessage || errorMessage || 'AI encountered an issue analyzing this repository. Please try running the analysis again.'}
        </p>
        <button
          onClick={() => navigate('/dashboard/repositories')}
          className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
        >
          Return to Repositories
        </button>
      </div>
    );
  }

  // Extract MongoDB Analysis Document fields
  const doc = reportData?.data?.data || reportData?.data || reportData || {};
  const repo = doc.repository || {};
  const github = doc.github || {};
  const metadata = doc.metadata || {};
  const analysis = doc.analysis || {};

  // Bind Repository metadata fields
  const repoName = repo.name || github.repositoryName || '';
  const repoOwner = repo.owner?.login || repo.owner || github.owner || '';
  const fullRepoTitle =
    repo.fullName ||
    (repoOwner && repoName ? `${repoOwner}/${repoName}` : repoName || 'Not available');

  const defaultBranch = repo.defaultBranch || repo.default_branch || github.defaultBranch || null;
  const primaryLanguage = github.language || repo.language || repo.primaryLanguage || (metadata.languages && Object.keys(metadata.languages).length > 0 ? Object.keys(metadata.languages)[0] : null);
  const stars = github.stars ?? repo.stargazers_count ?? repo.stars ?? 0;
  const forks = github.forks ?? repo.forks_count ?? repo.forks ?? 0;

  // Bind AI Provider & Completion Date
  const aiProvider = doc.aiProvider || 'OpenRouter';
  const formattedDate = doc.completedAt
    ? new Date(doc.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : doc.createdAt
    ? new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Not available';

  // Bind Numeric Scores
  const overallScore = typeof analysis.overallScore === 'number' && analysis.overallScore > 0 ? analysis.overallScore : null;
  const codeQualityScore = typeof analysis.codeQuality === 'number' && analysis.codeQuality > 0 ? analysis.codeQuality : null;
  const documentationScore = typeof analysis.documentation === 'number' && analysis.documentation > 0 ? analysis.documentation : null;
  const architectureScore = typeof analysis.architecture === 'number' && analysis.architecture > 0 ? analysis.architecture : null;
  const securityScore = typeof analysis.security === 'number' && analysis.security > 0 ? analysis.security : null;
  const performanceScore = typeof analysis.performance === 'number' && analysis.performance > 0 ? analysis.performance : null;
  const maintainabilityScore = typeof analysis.maintainability === 'number' && analysis.maintainability > 0 ? analysis.maintainability : null;
  const bestPracticesScore = typeof analysis.bestPractices === 'number' && analysis.bestPractices > 0 ? analysis.bestPractices : null;

  // Bind Review Texts
  const summary = analysis.summary || null;
  const architectureReview = analysis.architectureReview || null;
  const securityReview = analysis.securityReview || null;
  const performanceReview = analysis.performanceReview || null;
  const documentationReview = analysis.documentationReview || null;
  const codeQualityReview = analysis.codeQualityReview || null;
  const maintainabilityReview =
    analysis.maintainabilityReview ||
    (typeof analysis.maintainability === 'string' ? analysis.maintainability : null);
  const bestPracticesReview = analysis.bestPracticesReview || null;

  // Bind Array Fields
  const techStack =
    Array.isArray(analysis.techStack) && analysis.techStack.length > 0
      ? analysis.techStack
      : Array.isArray(analysis.technologyStack) && analysis.technologyStack.length > 0
      ? analysis.technologyStack
      : [];

  const strengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
  const weaknesses = Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [];
  const suggestions = Array.isArray(analysis.suggestions) && analysis.suggestions.length > 0
    ? analysis.suggestions
    : Array.isArray(analysis.recommendations)
    ? analysis.recommendations
    : [];
  const recommendations = Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0
    ? analysis.recommendations
    : Array.isArray(analysis.suggestions)
    ? analysis.suggestions
    : [];

  const rootContentsList = Array.isArray(metadata.rootContents) ? metadata.rootContents : [];

  const handleExportPDF = () => {
    toast.success('Generating PDF Report... Download will start shortly!');
  };

  const handleShareReport = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success('Report URL copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReanalyze = () => {
    navigate('/dashboard/repositories');
    toast.success('Select a repository to start a fresh analysis!');
  };

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A3247]/60 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/repositories')}
            className="p-2 rounded-xl bg-[#141B2D] border border-[#2A3247] text-slate-400 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {fullRepoTitle}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-extrabold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full">
                {`${aiProvider} AI Analyzed`}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Completed on {formattedDate}
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141B2D] border border-[#2A3247] hover:border-indigo-500/40 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleShareReport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141B2D] border border-[#2A3247] hover:border-indigo-500/40 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-purple-400" />}
            <span>{copiedLink ? 'Copied Link' : 'Share Report'}</span>
          </button>

          <button
            onClick={handleReanalyze}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer active:scale-[0.98]"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Reanalyze</span>
          </button>
        </div>
      </div>

      {/* Hero AI Overall Score Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Overall Gauge Card (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#141B2D] to-[#0F172A] border border-[#2A3247] p-6 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative mb-4">
            <div className="w-36 h-36 rounded-full bg-[#0F172A] border-4 border-indigo-500/40 flex flex-col items-center justify-center shadow-inner shadow-indigo-500/20">
              <span className="text-4xl font-black bg-gradient-to-tr from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                {overallScore !== null ? overallScore : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                OUT OF 100
              </span>
            </div>
            {overallScore !== null && (
              <div className="absolute -bottom-2 inset-x-0 mx-auto w-24 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                {overallScore >= 90 ? 'EXCELLENT' : overallScore >= 75 ? 'GOOD' : 'NEEDS WORK'}
              </div>
            )}
          </div>

          <h3 className="text-lg font-extrabold text-white mb-1">Overall AI Score</h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            {summary || 'Not available'}
          </p>
        </div>

        {/* Right Category Reviews Grid (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Security Review */}
          <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                Security Review
              </h4>
              {securityScore !== null && (
                <span className="text-xs font-extrabold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {securityScore}/100
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{securityReview || 'Not available'}</p>
          </div>

          {/* Performance Review */}
          <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-amber-400 flex items-center gap-2 uppercase tracking-wider">
                <Zap className="w-4 h-4" />
                Performance Review
              </h4>
              {performanceScore !== null && (
                <span className="text-xs font-extrabold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {performanceScore}/100
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{performanceReview || 'Not available'}</p>
          </div>

          {/* Architecture Review */}
          <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                Architecture Review
              </h4>
              {architectureScore !== null && (
                <span className="text-xs font-extrabold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                  {architectureScore}/100
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{architectureReview || 'Not available'}</p>
          </div>

          {/* Documentation Review */}
          <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-cyan-400 flex items-center gap-2 uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                Documentation Review
              </h4>
              {documentationScore !== null && (
                <span className="text-xs font-extrabold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                  {documentationScore}/100
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{documentationReview || 'Not available'}</p>
          </div>

          {/* Code Quality Review */}
          <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-purple-400 flex items-center gap-2 uppercase tracking-wider">
                <Code2 className="w-4 h-4" />
                Code Quality Review
              </h4>
              {codeQualityScore !== null && (
                <span className="text-xs font-extrabold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                  {codeQualityScore}/100
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{codeQualityReview || 'Not available'}</p>
          </div>

          {/* Maintainability Review */}
          <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-pink-400 flex items-center gap-2 uppercase tracking-wider">
                <Award className="w-4 h-4" />
                Maintainability Review
              </h4>
              {maintainabilityScore !== null && (
                <span className="text-xs font-extrabold text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">
                  {maintainabilityScore}/100
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{maintainabilityReview || 'Not available'}</p>
          </div>

          {/* Best Practices Review */}
          <div className="p-4 md:col-span-2 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-blue-400 flex items-center gap-2 uppercase tracking-wider">
                <CheckSquare className="w-4 h-4" />
                Best Practices Review
              </h4>
              {bestPracticesScore !== null && (
                <span className="text-xs font-extrabold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                  {bestPracticesScore}/100
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{bestPracticesReview || 'Not available'}</p>
          </div>
        </div>
      </div>

      {/* Technology Stack & Repository Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
            <FolderGit2 className="w-4 h-4 text-indigo-400" />
            Repository Metadata
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141B2D] border border-[#2A3247]">
              <span className="text-slate-400 font-medium">Default Branch</span>
              <span className="font-mono font-bold text-indigo-300">{defaultBranch || 'Not available'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141B2D] border border-[#2A3247]">
              <span className="text-slate-400 font-medium">Primary Language</span>
              <span className="font-bold text-white">{primaryLanguage || 'Not available'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141B2D] border border-[#2A3247]">
              <span className="text-slate-400 font-medium">Stars & Forks</span>
              <span className="font-bold text-amber-300">⭐ {stars} / 🍴 {forks}</span>
            </div>
          </div>
        </div>

        {/* Tech Stack List */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
            <PackageCheck className="w-4 h-4 text-purple-400" />
            Technology Stack
          </h3>
          {techStack.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#141B2D] border border-[#2A3247] text-indigo-300 flex items-center gap-1.5 shadow-sm"
                >
                  <Code2 className="w-3.5 h-3.5 text-purple-400" />
                  {tech}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Not available</p>
          )}
        </div>
      </div>

      {/* Root Folder Structure (Top-level only) */}
      {rootContentsList.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
            <FolderTree className="w-4 h-4 text-cyan-400" />
            Root Folder Structure (Top-level)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            {rootContentsList.map((item) => (
              <div key={item.name} className="p-3 rounded-xl bg-[#141B2D] border border-[#2A3247] flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="font-mono text-slate-200 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="p-6 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-4">
          <h3 className="text-sm font-extrabold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            Strengths {strengths.length > 0 && `(${strengths.length})`}
          </h3>
          {strengths.length > 0 ? (
            <div className="space-y-2.5 text-xs">
              {strengths.map((str, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{str}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Not available</p>
          )}
        </div>

        {/* Weaknesses */}
        <div className="p-6 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-4">
          <h3 className="text-sm font-extrabold text-amber-400 flex items-center gap-2 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            Weaknesses {weaknesses.length > 0 && `(${weaknesses.length})`}
          </h3>
          {weaknesses.length > 0 ? (
            <div className="space-y-2.5 text-xs">
              {weaknesses.map((weak, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{weak}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Not available</p>
          )}
        </div>
      </div>

      {/* Recommendations & Suggestions */}
      <div className="p-6 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-4">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Recommendations {recommendations.length > 0 && `(${recommendations.length})`}
        </h3>
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#141B2D] border border-[#2A3247] text-slate-200 flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Not available</p>
        )}
      </div>
    </div>
  );
};

export default AnalysisReportPage;
