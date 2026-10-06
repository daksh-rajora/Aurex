import { useState } from 'react';
import { X, Copy, Check, ShieldOff, Globe, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import analysisService from '../../services/analysisService.js';

export const ShareReportModal = ({
  isOpen,
  onClose,
  analysisId,
  shareUrl,
  onShareDisabled,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);
      toast.success('Report link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      toast.error('Failed to copy link to clipboard');
    }
  };

  const handleDisableSharing = async () => {
    if (!analysisId || isDisabling) return;

    setIsDisabling(true);
    try {
      await analysisService.disableShareLink(analysisId);
      toast.success('Sharing disabled');
      if (onShareDisabled) {
        onShareDisabled();
      }
      onClose();
    } catch (err) {
      console.error('Disable sharing error:', err);
      toast.error(err.response?.data?.message || 'Failed to disable sharing.');
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div
        className="w-full max-w-lg bg-[#0F172A] border border-[#2A3247] rounded-3xl shadow-2xl p-6 space-y-6 relative animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#2A3247]/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Share Analysis Report</h3>
              <p className="text-xs text-slate-400">Generate a public read-only link for this report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#141B2D] border border-transparent hover:border-[#2A3247] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Public Share URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl || ''}
                className="flex-1 bg-[#0B1020] border border-[#2A3247] rounded-xl px-3.5 py-2.5 text-xs font-mono text-indigo-300 focus:outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed bg-[#141B2D]/80 border border-[#2A3247] p-3 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            Anyone with this link can view this analysis report.
          </p>
        </div>

        {/* Modal Footer / Actions */}
        <div className="flex items-center justify-between border-t border-[#2A3247]/60 pt-4">
          <button
            onClick={handleDisableSharing}
            disabled={isDisabling}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {isDisabling ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Disabling...</span>
              </>
            ) : (
              <>
                <ShieldOff className="w-3.5 h-3.5" />
                <span>Disable Sharing</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#141B2D] hover:bg-[#1A233A] border border-[#2A3247] text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareReportModal;
