import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserCheck,
  Search,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  History,
  FileCode,
  Lock,
  Globe,
  Loader2,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import recruiterService from '../../services/recruiterService.js';

export const RecruiterModePage = () => {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateUrlInput = (input) => {
    if (!input || !input.trim()) {
      return 'Please enter a public GitHub repository URL.';
    }

    const val = input.trim();

    // Reject invalid domains
    if (/^https?:\/\//i.test(val)) {
      try {
        const parsed = new URL(val);
        const host = parsed.hostname.toLowerCase();
        if (host !== 'github.com' && host !== 'www.github.com') {
          return 'Only public GitHub repository URLs are supported (e.g. https://github.com/owner/repo).';
        }
      } catch {
        return 'Please enter a valid URL structure.';
      }
    }

    // Basic structure check for owner/repo
    const cleanPath = val
      .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
      .replace(/\.git\/?$/i, '')
      .replace(/\/+$/, '')
      .replace(/^\/+/, '');

    const parts = cleanPath.split('/').filter(Boolean);
    if (parts.length < 2) {
      return 'Please enter a complete repository URL including owner and repository name.';
    }

    const reserved = new Set(['settings', 'orgs', 'notifications', 'login', 'signup', 'explore']);
    if (reserved.has(parts[0].toLowerCase())) {
      return 'The provided path is a GitHub system page, not a project repository.';
    }

    return '';
  };

  const handleAnalyzeSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const errorMsg = validateUrlInput(repoUrl);
    if (errorMsg) {
      setValidationError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsAnalyzing(true);
    const toastId = toast.loading('Initiating candidate repository evaluation...');

    try {
      const response = await recruiterService.startRecruiterAnalysis(repoUrl.trim());
      const data = response.data || response;
      const analysisId = data.analysisId || data._id;

      toast.success('Candidate repository analysis started!', { id: toastId });

      // Navigate immediately to realtime analysis progress page
      if (analysisId) {
        navigate(`/dashboard/analysis/${analysisId}/progress`);
      } else {
        navigate('/dashboard/history');
      }
    } catch (err) {
      console.error('Recruiter analysis error:', err);
      const serverMessage = err.response?.data?.message || err.message || 'Failed to start recruiter analysis.';

      setValidationError(serverMessage);
      toast.error(serverMessage, { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Top Banner Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#141B2D] to-[#0F172A] border border-[#2A3247] p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
              <UserCheck className="w-3.5 h-3.5" />
              Recruiter Mode
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Evaluate Candidate Technical Projects
            </h1>
            <p className="text-xs lg:text-sm text-slate-400 leading-relaxed">
              Analyze public GitHub repositories and evaluate technical projects without requiring the candidate to connect their GitHub account.
            </p>
          </div>

          <Link
            to="/dashboard/recruiter/history"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] border border-[#2A3247] hover:border-purple-500/40 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            <History className="w-4 h-4 text-purple-400" />
            <span>Recruiter History</span>
          </Link>
        </div>
      </div>

      {/* Main Analyzer Input Form */}
      <div className="max-w-3xl mx-auto rounded-3xl bg-[#0F172A]/90 border border-[#2A3247] p-6 lg:p-8 shadow-2xl space-y-6">
        <div className="space-y-1 text-center">
          <h2 className="text-lg font-extrabold text-white">Enter Public Repository URL</h2>
          <p className="text-xs text-slate-400">
            Paste any candidate's public GitHub project repository link to run automated AI auditing
          </p>
        </div>

        <form onSubmit={handleAnalyzeSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Globe className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  if (validationError) setValidationError('');
                }}
                placeholder="https://github.com/username/repository"
                disabled={isAnalyzing}
                className={`w-full pl-12 pr-4 py-3.5 bg-[#0B1020] border ${
                  validationError ? 'border-rose-500/60 focus:border-rose-500' : 'border-[#2A3247] focus:border-purple-500/60'
                } rounded-2xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all`}
              />
            </div>
            {validationError && (
              <p className="text-xs text-rose-400 flex items-center gap-1.5 pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                {validationError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                <span>Validating & Analyzing Repository...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Analyze Repository</span>
                <ArrowRight className="w-4 h-4 text-purple-200" />
              </>
            )}
          </button>
        </form>

        {/* Quick Example URLs */}
        <div className="pt-2 border-t border-[#2A3247]/60">
          <p className="text-[11px] font-semibold text-slate-400 mb-2">Try example public repositories:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'https://github.com/facebook/react',
              'https://github.com/vercel/next.js',
              'https://github.com/expressjs/express',
            ].map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => {
                  setRepoUrl(url);
                  setValidationError('');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] border border-[#2A3247] text-[11px] font-mono text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer"
              >
                {url.replace('https://github.com/', '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Highlights & Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-2.5">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 w-fit">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-white">Zero Candidate Setup</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Evaluate candidate GitHub repos directly. Candidates do not need to sign up or authorize OAuth.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 w-fit">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-white">Objective Code Audits</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Get structured scorecards on security, architecture, maintainability, and code quality.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] space-y-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 w-fit">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-white">PDF & Share Reports</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Export detailed PDF evaluation reports or generate secure public share links for hiring managers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecruiterModePage;
