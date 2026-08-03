import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FolderGit2,
  Loader2,
  CheckCircle2,
  Search,
  Lock,
  FileArchive,
  ArrowRight,
  ShieldCheck,
  Zap,
  Code2,
  Layers,
  Bot,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const HeroWelcomeCard = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const quickExamples = [
    'facebook/react',
    'vercel/next.js',
    'nodejs/node',
  ];

  const recentRepoChips = [
    'facebook/react',
    'vercel/next.js',
    'microsoft/vscode',
    'openai/openai-cookbook',
    'nodejs/node',
  ];

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleSelectRepo = (repoName) => {
    const fullUrl = repoName.startsWith('http')
      ? repoName
      : `https://github.com/${repoName}`;
    setRepoUrl(fullUrl);
    setError('');
  };

  const handleAnalyze = (e) => {
    e.preventDefault();
    setError('');

    if (!repoUrl.trim()) {
      const errMsg = 'Please enter a GitHub repository URL.';
      setError(errMsg);
      toast.error(errMsg);
      triggerShake();
      return;
    }

    setAnalyzing(true);

    // Simulate AI repository scan initialization
    setTimeout(() => {
      setAnalyzing(false);
      toast.success(`Repository analysis started for ${repoUrl.trim()}!`);
    }, 1500);
  };

  return (
    <div className="space-y-4 select-none">
      {/* Main Interactive Repository Analyzer Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={isShaking ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full rounded-2xl bg-gradient-to-r from-[#141B2D] via-[#1A233A] to-[#141B2D] border border-[#2A3247] p-6 lg:p-8 overflow-hidden shadow-2xl shadow-indigo-500/5"
      >
        {/* Background Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LEFT SIDE (7 Cols on Desktop) */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <span>🚀 Analyze GitHub Repository</span>
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mt-2">
                Paste any public GitHub repository URL and let <span className="font-semibold text-indigo-300">Aurex AI</span> generate an intelligent code review, security analysis, performance insights, and architecture report.
              </p>
            </div>

            {/* Input & Form */}
            <form onSubmit={handleAnalyze} className="space-y-3">
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors pointer-events-none">
                  <FolderGit2 className="w-4 h-4" />
                </div>

                <input
                  type="text"
                  placeholder="https://github.com/owner/repository"
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    if (error) setError('');
                  }}
                  className={`w-full bg-[#0F172A]/90 border ${
                    error ? 'border-rose-500/80 ring-1 ring-rose-500/50' : 'border-[#2A3247]'
                  } rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:shadow-[0_0_20px_rgba(165,180,252,0.15)] transition-all duration-200`}
                />
              </div>

              {/* Quick Input Examples */}
              <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400">
                <span className="text-[11px] font-medium text-slate-400">Examples:</span>
                {quickExamples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => handleSelectRepo(ex)}
                    className="px-2.5 py-1 rounded-lg bg-[#0F172A] border border-[#2A3247] hover:border-indigo-500/40 text-indigo-300 text-[11px] font-mono hover:bg-indigo-500/10 transition-all cursor-pointer"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={analyzing}
                  className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#A5B4FC] to-[#D8B4FE] hover:opacity-95 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Analyze Repository</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => toast.success('Connecting to GitHub organization repositories...')}
                  className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-200 bg-[#0F172A]/80 hover:bg-[#1E293B] border border-[#2A3247] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FolderGit2 className="w-4 h-4 text-indigo-400" />
                  <span>Browse Connected Repositories</span>
                </button>
              </div>
            </form>

            {/* Feature Compatibility Note */}
            <div className="pt-2 border-t border-[#2A3247]/50 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Supported:</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Public GitHub Repositories
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <FileArchive className="w-3 h-3" /> Repository ZIP Upload (Coming Soon)
              </span>
              <span className="flex items-center gap-1 text-indigo-400">
                <Lock className="w-3 h-3" /> Private Repositories (After Auth)
              </span>
            </div>
          </div>

          {/* RIGHT SIDE (5 Cols on Desktop - Animated Developer Workspace Illustration) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="w-full p-5 rounded-2xl bg-[#0F172A]/90 border border-[#2A3247] shadow-xl relative overflow-hidden space-y-4">
              {/* Workspace Header */}
              <div className="flex items-center justify-between border-b border-[#2A3247]/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] font-mono text-indigo-300 font-semibold flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" /> Aurex Copilot Engine
                </span>
              </div>

              {/* Floating Animated Badges Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs font-semibold text-emerald-300 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>✔ AI Ready</span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center gap-2 text-xs font-semibold text-indigo-300 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>✔ Security Scan</span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-2 text-xs font-semibold text-cyan-300 shadow-sm"
                >
                  <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>✔ Performance</span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-2 text-xs font-semibold text-purple-300 shadow-sm"
                >
                  <Code2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>✔ Code Quality</span>
                </motion.div>
              </div>

              {/* Wide Floating Architecture Badge */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-3 rounded-xl bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-indigo-500/15 border border-indigo-500/40 flex items-center justify-between text-xs font-semibold text-indigo-200 shadow-md"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-300" />
                  <span>✔ Architecture Review</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-[10px] text-indigo-300 font-bold">
                  Deep Audit
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Repositories Chips Bar */}
      <div className="p-3.5 rounded-xl bg-[#141B2D]/80 border border-[#2A3247] flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-300 shrink-0 text-xs">Recent Repositories:</span>
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {recentRepoChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSelectRepo(chip)}
              className="px-3 py-1 rounded-lg bg-[#0F172A] border border-[#2A3247] hover:border-indigo-500/50 hover:bg-indigo-500/10 text-slate-300 hover:text-white text-xs font-mono transition-all duration-200 flex items-center gap-1.5 cursor-pointer group"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>{chip}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroWelcomeCard;
