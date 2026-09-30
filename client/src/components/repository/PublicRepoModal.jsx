import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Globe, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import analysisService from '../../services/analysisService.js';
import toast from 'react-hot-toast';

export const PublicRepoModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const [githubUrl, setGithubUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const validateUrlFormat = (url) => {
    if (!url || typeof url !== 'string' || !url.trim()) {
      return 'Please enter a valid public GitHub repository URL.';
    }

    const clean = url.trim();

    // Rejections for non-github URLs or malformed strings
    if (/^https?:\/\//i.test(clean)) {
      try {
        const parsed = new URL(clean);
        const host = parsed.hostname.toLowerCase();
        if (host !== 'github.com' && host !== 'www.github.com') {
          return 'Please enter a valid public GitHub repository URL.';
        }
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length !== 2) {
          return 'Please enter a valid public GitHub repository URL.';
        }
      } catch {
        return 'Please enter a valid public GitHub repository URL.';
      }
    } else {
      const parts = clean.replace(/^(www\.)?github\.com\//i, '').split('/').filter(Boolean);
      if (parts.length !== 2) {
        return 'Please enter a valid public GitHub repository URL.';
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    const validationError = validateUrlFormat(githubUrl);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await analysisService.startPublicAnalysis(githubUrl.trim());

      const analysisId =
        res?.data?.analysisId ||
        res?.data?._id ||
        res?.analysisId ||
        res?._id;

      if (analysisId) {
        toast.success('Public repository analysis started!', { icon: '🚀' });
        setGithubUrl('');
        setErrorMessage('');
        onClose();
        navigate(`/dashboard/analysis/${analysisId}/progress`);
      } else {
        setErrorMessage('Failed to obtain analysis ID from server. Please try again.');
      }
    } catch (err) {
      console.error('Public analysis submission failed:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Unable to analyze this repository right now.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setGithubUrl('');
    setErrorMessage('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative w-full max-w-lg rounded-3xl bg-[#0F172A] border border-[#2A3247] shadow-2xl p-6 md:p-8 overflow-hidden"
        >
          {/* Neon Ambient Background Orbs */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          {!isSubmitting && (
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-[#141B2D] border border-[#2A3247] hover:border-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Modal Header */}
          <div className="flex items-center gap-3.5 mb-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                Analyze Any Public GitHub Repository
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">
            Paste a public GitHub repository URL and let Aurex analyze its code, architecture, security, performance and maintainability.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                GitHub Repository URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://github.com/owner/repository"
                  value={githubUrl}
                  onChange={(e) => {
                    setGithubUrl(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  disabled={isSubmitting}
                  className="w-full bg-[#141B2D] border border-[#2A3247] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Example hint */}
            <div className="p-3 rounded-xl bg-[#141B2D]/60 border border-[#2A3247]/60 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Example format:</span>
              <code className="text-indigo-300 font-mono font-bold">https://github.com/facebook/react</code>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2A3247]">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-[#141B2D] border border-[#2A3247] text-slate-300 hover:text-white hover:bg-[#1E293B] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !githubUrl.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating Repository...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Repository</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PublicRepoModal;
