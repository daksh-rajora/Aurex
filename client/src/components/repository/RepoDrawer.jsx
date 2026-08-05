import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  Bot,
  Copy,
  Check,
  Star,
  GitFork,
  AlertCircle,
  HardDrive,
  Clock,
  Lock,
  Globe,
  GitBranch,
  Shield,
  Users,
  Calendar,
  Activity,
  GitCommit,
  Loader2,
} from 'lucide-react';
import { LANGUAGE_COLORS } from '../../data/repositoriesData.js';
import githubService from '../../services/githubService.js';
import toast from 'react-hot-toast';

export const RepoDrawer = ({ isOpen, onClose, repo, onAnalyze }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [extraDetails, setExtraDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && repo && repo.owner?.login && repo.name) {
      let isMounted = true;
      setIsLoadingDetails(true);
      githubService
        .getRepositoryDetails(repo.owner.login, repo.name)
        .then((res) => {
          if (isMounted && res?.data) {
            setExtraDetails(res.data);
          }
        })
        .catch(() => {
          // Ignore detail fetch errors gracefully
        })
        .finally(() => {
          if (isMounted) setIsLoadingDetails(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setExtraDetails(null);
    }
  }, [isOpen, repo]);

  if (!isOpen || !repo) return null;

  const langStyle = LANGUAGE_COLORS[repo.language] || {
    bg: 'bg-slate-500/20',
    text: 'text-slate-300',
    border: 'border-slate-500/30',
    dot: '#94a3b8',
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(repo.url);
    setCopied(true);
    toast.success('Repository URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Drawer Window Container */}
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-[#0F172A] border-l border-[#2A3247] shadow-2xl flex flex-col justify-between"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#2A3247] space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Repository Overview
                </span>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-[#141B2D] border border-[#2A3247] hover:border-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Repo Title & Avatar */}
              <div className="flex items-start gap-3.5">
                <img
                  src={repo.owner.avatarUrl}
                  alt={repo.owner.login}
                  className="w-12 h-12 rounded-2xl object-cover border border-indigo-500/40 shadow-lg shrink-0"
                />
                <div className="overflow-hidden">
                  <span className="text-xs text-slate-400 font-medium block">
                    @{repo.owner.login}
                  </span>
                  <h2 className="text-xl font-extrabold text-white truncate tracking-tight">
                    {repo.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
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

                    {repo.isAnalyzed && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                        <Bot className="w-2.5 h-2.5" />
                        AI Analyzed ({repo.healthScore}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className="flex border-b border-[#2A3247] pt-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2.5 px-3 text-xs font-bold transition-all relative ${
                    activeTab === 'overview'
                      ? 'text-indigo-400 border-b-2 border-indigo-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`pb-2.5 px-3 text-xs font-bold transition-all relative ${
                    activeTab === 'activity'
                      ? 'text-indigo-400 border-b-2 border-indigo-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Recent Activity
                </button>
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'overview' ? (
                <>
                  {/* Description */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      About
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-[#141B2D] border border-[#2A3247] rounded-xl p-3.5">
                      {repo.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Primary Metrics 2x2 Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#141B2D] border border-[#2A3247] flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Star className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Stars</span>
                        <span className="text-sm font-bold text-white">
                          {repo.stars.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#141B2D] border border-[#2A3247] flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <GitFork className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Forks</span>
                        <span className="text-sm font-bold text-white">
                          {repo.forks.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#141B2D] border border-[#2A3247] flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Open Issues</span>
                        <span className="text-sm font-bold text-white">
                          {repo.openIssues}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#141B2D] border border-[#2A3247] flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Contributors</span>
                        <span className="text-sm font-bold text-white">
                          {extraDetails?.contributors?.length || repo.contributors || 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comprehensive Metadata Details List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Metadata
                    </h4>
                    <div className="divide-y divide-[#2A3247]/60 bg-[#141B2D] border border-[#2A3247] rounded-xl text-xs">
                      <div className="flex items-center justify-between p-3">
                        <span className="text-slate-400 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: langStyle.dot }}
                          />
                          Primary Language
                        </span>
                        <span className="font-bold text-white">{repo.language}</span>
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <span className="text-slate-400 flex items-center gap-2">
                          <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                          Repository Size
                        </span>
                        <span className="font-bold text-slate-200">{repo.size}</span>
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <span className="text-slate-400 flex items-center gap-2">
                          <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                          Default Branch
                        </span>
                        <span className="font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {repo.defaultBranch}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-slate-500" />
                          License
                        </span>
                        <span className="font-bold text-slate-200">{repo.license}</span>
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          Created Date
                        </span>
                        <span className="font-semibold text-slate-300">{repo.createdDate}</span>
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          Last Updated
                        </span>
                        <span className="font-semibold text-slate-300">{repo.lastUpdated}</span>
                      </div>
                    </div>
                  </div>

                  {/* Topics Pills */}
                  {repo.topics && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Topics & Tags
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {repo.topics.map((t) => (
                          <span
                            key={t}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#141B2D] border border-[#2A3247] text-indigo-300"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Activity Tab Content */
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    Recent Commits & Events
                  </h4>

                  {repo.recentActivity && repo.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {repo.recentActivity.map((act) => (
                        <div
                          key={act.id}
                          className="p-3 rounded-xl bg-[#141B2D] border border-[#2A3247] space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-indigo-400 font-bold flex items-center gap-1">
                              <GitCommit className="w-3 h-3 text-purple-400" />
                              {act.hash}
                            </span>
                            <span className="text-slate-400">{act.time}</span>
                          </div>
                          <p className="text-xs font-medium text-slate-200">{act.message}</p>
                          <div className="text-[10px] text-slate-400 font-medium">
                            Committed by <span className="text-slate-300 font-bold">@{act.author}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500 bg-[#141B2D] rounded-xl border border-[#2A3247]">
                      No recent activity recorded.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Quick Actions Footer */}
            <div className="p-5 border-t border-[#2A3247] bg-[#0F172A] space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Quick Actions
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onAnalyze(repo);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Analyze</span>
                </button>

                <a
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#141B2D] border border-[#2A3247] hover:border-slate-500 text-slate-200 hover:text-white text-xs font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                </a>

                <button
                  onClick={handleCopyUrl}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#141B2D] border border-[#2A3247] hover:border-slate-500 text-slate-200 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{copied ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default RepoDrawer;
