import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FolderGit2,
  Code2,
  Layers,
  FileCode,
  FolderTree,
  PackageCheck,
  TrendingUp,
  Loader2,
  AlertOctagon,
  Award,
  CheckSquare,
  ExternalLink,
  Lock,
  FileQuestion,
  Share2,
  UserCheck,
} from 'lucide-react';
import analysisService from '../../services/analysisService.js';

export const SharedAnalysisReportPage = () => {
  const { token } = useParams();

  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState(null); // 'not_found' | 'disabled' | 'server_error'

  useEffect(() => {
    let isMounted = true;

    const fetchSharedAnalysis = async () => {
      if (!token) {
        setIsLoading(false);
        setErrorType('not_found');
        return;
      }

      try {
        const res = await analysisService.getSharedAnalysis(token);
        if (isMounted && res) {
          const doc = res.data?.data || res.data || res;
          setReportData(doc);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching public shared report:', err);
        if (isMounted) {
          const status = err.response?.status;
          const message = (err.response?.data?.message || err.message || '').toLowerCase();

          if (message.includes('disabled')) {
            setErrorType('disabled');
          } else if (status === 404 || message.includes('not found')) {
            setErrorType('not_found');
          } else {
            setErrorType('server_error');
          }
          setIsLoading(false);
        }
      }
    };

    fetchSharedAnalysis();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // State 1: Loading
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0B1020] text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-4 animate-pulse">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
        <h3 className="text-xl font-extrabold text-white mb-2">Loading shared analysis...</h3>
        <p className="text-xs text-slate-400">Fetching report from Aurex AI Engine</p>
      </div>
    );
  }

  // State 2: Invalid token (Not Found)
  if (errorType === 'not_found') {
    return (
      <div className="min-h-screen w-full bg-[#0B1020] text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4">
          <FileQuestion className="w-12 h-12" />
        </div>
        <h3 className="text-2xl font-extrabold text-white mb-2">Analysis report not found</h3>
        <p className="text-xs text-slate-400 max-w-md text-center mb-6 leading-relaxed">
          The public link you accessed is invalid or may have expired. Please verify the URL or ask the owner for a new link.
        </p>
        <Link
          to="/login"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
        >
          Go to Aurex AI
        </Link>
      </div>
    );
  }

  // State 3: Disabled link
  if (errorType === 'disabled') {
    return (
      <div className="min-h-screen w-full bg-[#0B1020] text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4">
          <Lock className="w-12 h-12" />
        </div>
        <h3 className="text-2xl font-extrabold text-white mb-2">Sharing for this report has been disabled.</h3>
        <p className="text-xs text-slate-400 max-w-md text-center mb-6 leading-relaxed">
          The owner of this repository analysis has disabled public sharing for this report.
        </p>
        <Link
          to="/login"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
        >
          Go to Aurex AI
        </Link>
      </div>
    );
  }

  // State 4: Server Error
  if (errorType === 'server_error' || !reportData) {
    return (
      <div className="min-h-screen w-full bg-[#0B1020] text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4">
          <AlertOctagon className="w-12 h-12" />
        </div>
        <h3 className="text-2xl font-extrabold text-white mb-2">Unable to load this report.</h3>
        <p className="text-xs text-slate-400 max-w-md text-center mb-6 leading-relaxed">
          An error occurred while connecting to the Aurex AI backend. Please check your connection and try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  // Extract Report Data fields safely
  const doc = reportData.data?.data || reportData.data || reportData;
  const repo = doc.repository || {};
  const github = doc.github || {};
  const metadata = doc.metadata || {};
  const analysis = doc.analysis || {};

  const repoName = doc.repositoryName || repo.name || github.repositoryName || 'Repository';
  const repoOwner = doc.repositoryOwner || repo.owner?.login || repo.owner || github.owner || '';
  const fullRepoTitle =
    repo.fullName ||
    (repoOwner && repoName ? `${repoOwner}/${repoName}` : repoName);
  const repoUrl =
    doc.repositoryUrl ||
    repo.htmlUrl ||
    github.htmlUrl ||
    (repoOwner && repoName ? `https://github.com/${repoOwner}/${repoName}` : '');

  const defaultBranch = repo.defaultBranch || repo.default_branch || github.defaultBranch || 'main';
  const primaryLanguage = github.language || repo.language || (metadata.languages && Object.keys(metadata.languages).length > 0 ? Object.keys(metadata.languages)[0] : 'TypeScript');
  const stars = github.stars ?? repo.stargazers_count ?? repo.stars ?? 0;
  const forks = github.forks ?? repo.forks_count ?? repo.forks ?? 0;

  const aiProvider = doc.aiProvider || 'OpenRouter';
  const rawDate = doc.analysisDate || doc.completedAt || doc.createdAt;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently';

  // Bind Numeric Scores
  const overallScore = typeof analysis.overallScore === 'number' && analysis.overallScore > 0 ? analysis.overallScore : (doc.overallScore || null);
  const codeQualityScore = typeof analysis.codeQuality === 'number' && analysis.codeQuality > 0 ? analysis.codeQuality : (doc.codeQuality || null);
  const documentationScore = typeof analysis.documentation === 'number' && analysis.documentation > 0 ? analysis.documentation : (doc.documentation || null);
  const architectureScore = typeof analysis.architecture === 'number' && analysis.architecture > 0 ? analysis.architecture : (doc.architecture || null);
  const securityScore = typeof analysis.security === 'number' && analysis.security > 0 ? analysis.security : (doc.security || null);
  const performanceScore = typeof analysis.performance === 'number' && analysis.performance > 0 ? analysis.performance : (doc.performance || null);
  const maintainabilityScore = typeof analysis.maintainability === 'number' && analysis.maintainability > 0 ? analysis.maintainability : (doc.maintainability || null);
  const bestPracticesScore = typeof analysis.bestPractices === 'number' && analysis.bestPractices > 0 ? analysis.bestPractices : (doc.bestPractices || null);

  // Bind Review Texts
  const summary = analysis.summary || doc.summary || doc.executiveSummary || null;
  const architectureReview = analysis.architectureReview || doc.architectureReview || null;
  const securityReview = analysis.securityReview || doc.securityReview || null;
  const performanceReview = analysis.performanceReview || doc.performanceReview || null;
  const documentationReview = analysis.documentationReview || doc.documentationReview || null;
  const codeQualityReview = analysis.codeQualityReview || doc.codeQualityReview || null;
  const maintainabilityReview = analysis.maintainabilityReview || doc.maintainabilityReview || null;
  const bestPracticesReview = analysis.bestPracticesReview || doc.bestPracticesReview || null;

  // Bind Array Fields
  const techStack =
    Array.isArray(analysis.techStack) && analysis.techStack.length > 0
      ? analysis.techStack
      : Array.isArray(doc.techStack)
      ? doc.techStack
      : [];

  const strengths = Array.isArray(analysis.strengths) && analysis.strengths.length > 0 ? analysis.strengths : (Array.isArray(doc.strengths) ? doc.strengths : []);
  const weaknesses = Array.isArray(analysis.weaknesses) && analysis.weaknesses.length > 0 ? analysis.weaknesses : (Array.isArray(doc.weaknesses) ? doc.weaknesses : []);
  const recommendations =
    Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0
      ? analysis.recommendations
      : Array.isArray(analysis.suggestions) && analysis.suggestions.length > 0
      ? analysis.suggestions
      : Array.isArray(doc.recommendations)
      ? doc.recommendations
      : Array.isArray(doc.suggestions)
      ? doc.suggestions
      : [];

  const rootContentsList = Array.isArray(metadata.rootContents) ? metadata.rootContents : [];

  return (
    <div className="min-h-screen w-full bg-[#0B1020] text-slate-100 font-sans select-none flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0B1020]/90 backdrop-blur-md border-b border-[#2A3247] px-4 lg:px-12 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-base font-extrabold text-white tracking-tight">Aurex AI</span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-extrabold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full uppercase tracking-wider">
              Public Report
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            Analyze Your Repo
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8 flex-1">
        {/* Header Metadata Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A3247]/60 pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                {fullRepoTitle}
              </h1>
              {repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-[#141B2D] border border-[#2A3247] text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 transition-colors cursor-pointer"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>Analyzed on {formattedDate}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 font-extrabold flex items-center gap-1">
                {doc.sourceType === 'recruiter' || doc.isRecruiterAnalysis ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    Recruiter Analysis • Public GitHub Repository
                  </>
                ) : (
                  `${aiProvider} AI Engine`
                )}
              </span>
            </div>
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
              {summary || 'Executive summary not available for this repository.'}
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
                <span className="font-mono font-bold text-indigo-300">{defaultBranch || 'main'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141B2D] border border-[#2A3247]">
                <span className="text-slate-400 font-medium">Primary Language</span>
                <span className="font-bold text-white">{primaryLanguage || 'TypeScript'}</span>
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
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2A3247] py-6 text-center text-xs text-slate-400 bg-[#0B1020]">
        <p className="font-medium text-slate-400">Generated by Aurex AI</p>
      </footer>
    </div>
  );
};

export default SharedAnalysisReportPage;
