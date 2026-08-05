import { FolderGit2, RefreshCw } from 'lucide-react';

const GithubIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export const RepoEmptyState = ({
  hasFilters,
  onResetFilters,
  onConnectGithub,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] shadow-xl backdrop-blur-xl my-6 select-none">
      {/* Decorative Icon Glow Circle */}
      <div className="relative mb-5">
        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-2xl bg-[#141B2D] border border-[#2A3247] flex items-center justify-center shadow-2xl">
          <FolderGit2 className="w-10 h-10 text-indigo-400" />
        </div>
      </div>

      {/* Message */}
      <h3 className="text-lg font-extrabold text-white tracking-tight mb-2">
        {hasFilters ? 'No matching repositories found' : 'No repositories connected yet.'}
      </h3>
      <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
        {hasFilters
          ? 'Try adjusting your search criteria, language filters, or visibility settings to find what you are looking for.'
          : 'Connect your GitHub account or organization to import repositories and start analyzing code intelligence.'}
      </p>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {hasFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141B2D] border border-[#2A3247] hover:border-slate-500 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}

        <button
          onClick={onConnectGithub}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer active:scale-[0.98]"
        >
          <GithubIcon className="w-4 h-4" />
          <span>Connect GitHub</span>
        </button>
      </div>
    </div>
  );
};

export default RepoEmptyState;
