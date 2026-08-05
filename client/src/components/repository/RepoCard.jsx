import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  GitFork,
  AlertCircle,
  HardDrive,
  Clock,
  ExternalLink,
  Bot,
  Eye,
  MoreVertical,
  Lock,
  Globe,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { LANGUAGE_COLORS } from '../../data/repositoriesData.js';
import toast from 'react-hot-toast';

export const RepoCard = ({
  repo,
  onViewDetails,
  onAnalyze,
  onToggleFavorite,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  const langStyle = LANGUAGE_COLORS[repo.language] || {
    bg: 'bg-slate-500/20',
    text: 'text-slate-300',
    border: 'border-slate-500/30',
    dot: '#94a3b8',
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyUrl = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(repo.url);
    setCopied(true);
    toast.success(`Copied repository URL: ${repo.fullName}`);
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className="group relative flex flex-col justify-between rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 select-none"
    >
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Owner Avatar & Username & Repo Name */}
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={repo.owner.avatarUrl}
              alt={repo.owner.login}
              className="w-10 h-10 rounded-xl object-cover border border-[#2A3247] group-hover:border-indigo-500/40 transition-colors shrink-0"
            />
            <div className="truncate">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
                <a
                  href={repo.owner.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-indigo-300 transition-colors truncate"
                >
                  @{repo.owner.login}
                </a>
              </div>
              <h3
                onClick={() => onViewDetails(repo)}
                className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors truncate cursor-pointer tracking-tight"
                title={repo.fullName}
              >
                {repo.name}
              </h3>
            </div>
          </div>

          {/* Badges & Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Visibility Badge */}
            {repo.isPrivate ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <Lock className="w-2.5 h-2.5" />
                Private
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <Globe className="w-2.5 h-2.5" />
                Public
              </span>
            )}

            {/* Favorite Star Toggle */}
            <button
              onClick={() => onToggleFavorite(repo.id)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                repo.isFavorite
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
                  : 'bg-[#141B2D] border-[#2A3247] text-slate-400 hover:text-amber-400 hover:border-slate-600'
              }`}
              title={repo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-3.5 h-3.5 ${repo.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 min-h-[36px]">
          {repo.description || 'No description provided for this repository.'}
        </p>

        {/* Topics Tags */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {repo.topics.slice(0, 4).map((topic) => (
              <span
                key={topic}
                className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-[#141B2D] border border-[#2A3247] text-slate-300 hover:border-indigo-500/30 hover:text-indigo-300 transition-colors"
              >
                #{topic}
              </span>
            ))}
            {repo.topics.length > 4 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                +{repo.topics.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-[#141B2D]/80 border border-[#2A3247]/60 text-xs mb-4">
          {/* Primary Language */}
          <div className="flex items-center gap-1.5 truncate" title={`Language: ${repo.language}`}>
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: langStyle.dot }}
            />
            <span className="font-semibold text-slate-200 truncate">{repo.language}</span>
          </div>

          {/* Stars */}
          <div className="flex items-center justify-center gap-1 text-slate-300" title={`${repo.stars.toLocaleString()} Stars`}>
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">{repo.stars >= 1000 ? `${(repo.stars / 1000).toFixed(1)}k` : repo.stars}</span>
          </div>

          {/* Forks */}
          <div className="flex items-center justify-center gap-1 text-slate-300" title={`${repo.forks.toLocaleString()} Forks`}>
            <GitFork className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium">{repo.forks >= 1000 ? `${(repo.forks / 1000).toFixed(1)}k` : repo.forks}</span>
          </div>

          {/* Open Issues */}
          <div className="flex items-center justify-end gap-1 text-slate-300" title={`${repo.openIssues} Open Issues`}>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-medium">{repo.openIssues}</span>
          </div>
        </div>

        {/* Secondary Metadata Row */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-4 px-0.5">
          <div className="flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-slate-500" />
            <span>{repo.size}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Updated {repo.lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="pt-3 border-t border-[#2A3247]/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          {/* View Details Button */}
          <button
            onClick={() => onViewDetails(repo)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#141B2D] border border-[#2A3247] hover:border-indigo-500/40 text-slate-200 hover:text-white hover:bg-[#1E293B] text-xs font-semibold transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>View Details</span>
          </button>

          {/* Analyze Button */}
          <button
            onClick={() => onAnalyze(repo)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              repo.isAnalyzed
                ? 'bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{repo.isAnalyzed ? 'Re-Analyze' : 'Analyze'}</span>
          </button>
        </div>

        {/* External Link & Dropdown Menu */}
        <div className="flex items-center gap-1 relative" ref={menuRef}>
          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl bg-[#141B2D] border border-[#2A3247] text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
            title="Open on GitHub"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl bg-[#141B2D] border border-[#2A3247] text-slate-400 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
            title="More options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Context Menu Dropdown */}
          {showMenu && (
            <div className="absolute right-0 bottom-10 z-30 w-48 rounded-xl bg-[#141B2D] border border-[#2A3247] shadow-2xl p-1.5 space-y-1 backdrop-blur-xl">
              <button
                onClick={handleCopyUrl}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{copied ? 'Copied Link' : 'Copy GitHub URL'}</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onAnalyze(repo);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-purple-300 hover:bg-purple-500/10 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Security Scan</span>
              </button>

              <a
                href={`${repo.url}/issues`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowMenu(false)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1E293B] transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>View Issues ({repo.openIssues})</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RepoCard;
