import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Clock, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

export const AnalyzeModal = ({ isOpen, onClose, repo, onConfirmAnalysis }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !repo) return null;

  const repoName = repo.name || repo.fullName?.split('/')[1] || repo.fullName;
  const ownerName = repo.owner?.login || repo.fullName?.split('/')[0] || 'owner';
  const language = repo.language || 'TypeScript';

  const handleStartAnalysis = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (onConfirmAnalysis) {
        await onConfirmAnalysis(repo);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const featureBullets = [
    'Code Quality Score',
    'Security Analysis',
    'Performance Insights',
    'Maintainability Score',
    'Documentation Review',
    'AI Recommendations',
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none">
        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative w-full max-w-lg rounded-2xl bg-[#0F172A] border border-[#2A3247] shadow-2xl p-6 overflow-hidden"
        >
          {/* Ambient Glow Accents */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-[#2A3247] pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  Analyze Repository
                </h3>
                <p className="text-xs text-slate-400">Deep AI Code & Security Indexing</p>
              </div>
            </div>

            {!isSubmitting && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-[#141B2D] border border-[#2A3247] hover:border-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Repository & Owner Details */}
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl bg-[#141B2D] border border-[#2A3247] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Repository Name</span>
                <span className="text-white font-bold">{repoName}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Owner</span>
                <span className="text-indigo-300 font-bold">@{ownerName}</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#2A3247]/60">
                <span className="text-slate-400 font-semibold">Repository Language</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold text-[11px]">
                  {language}
                </span>
              </div>
            </div>

            {/* Estimated Analysis Time */}
            <div className="p-3.5 rounded-xl bg-[#141B2D]/60 border border-[#2A3247]/60 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                  Estimated Analysis Time
                </span>
                <span className="text-xs font-bold text-slate-200">20–60 seconds</span>
              </div>
            </div>

            {/* Information Bullets */}
            <div className="p-4 rounded-xl bg-[#141B2D]/40 border border-[#2A3247]/40 space-y-2.5">
              <span className="text-xs font-bold text-slate-200 block mb-1">
                Aurex AI will analyze your repository and generate:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {featureBullets.map((bullet) => (
                  <div key={bullet} className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2A3247]">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-[#141B2D] border border-[#2A3247] text-slate-300 hover:text-white hover:bg-[#1E293B] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleStartAnalysis}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initiating Analysis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Analysis</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AnalyzeModal;
