import { Search, X, RotateCw, Plus, Filter, ArrowUpDown, Code2, Eye } from 'lucide-react';

const GithubIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export const RepoActionBar = ({
  searchQuery,
  setSearchQuery,
  selectedLanguage,
  setSelectedLanguage,
  selectedVisibility,
  setSelectedVisibility,
  selectedSort,
  setSelectedSort,
  onRefresh,
  isRefreshing,
  onConnectGithub,
}) => {
  const languageOptions = ['All', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'C++', 'Java', 'HTML/CSS'];
  const visibilityOptions = [
    { value: 'All', label: 'All Visibility' },
    { value: 'Public', label: 'Public' },
    { value: 'Private', label: 'Private' },
  ];
  const sortOptions = [
    { value: 'Recently Updated', label: 'Recently Updated' },
    { value: 'Stars', label: 'Stars (High to Low)' },
    { value: 'Name', label: 'Name (A to Z)' },
  ];

  return (
    <div className="bg-[#0F172A]/80 border border-[#2A3247] rounded-2xl p-4 shadow-lg backdrop-blur-xl flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center select-none">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#141B2D] border border-[#2A3247] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
        />
        {searchQuery ? (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-[#0F172A] border border-[#2A3247] rounded">
            /
          </kbd>
        )}
      </div>

      {/* Filters & Actions Group */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
        {/* Language Filter */}
        <div className="relative flex-1 sm:flex-initial min-w-[130px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full appearance-none bg-[#141B2D] border border-[#2A3247] text-slate-200 text-xs font-medium rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors"
          >
            {languageOptions.map((lang) => (
              <option key={lang} value={lang} className="bg-[#141B2D] text-slate-200">
                {lang === 'All' ? 'All Languages' : lang}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <Filter className="w-3 h-3" />
          </div>
        </div>

        {/* Visibility Filter */}
        <div className="relative flex-1 sm:flex-initial min-w-[130px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <select
            value={selectedVisibility}
            onChange={(e) => setSelectedVisibility(e.target.value)}
            className="w-full appearance-none bg-[#141B2D] border border-[#2A3247] text-slate-200 text-xs font-medium rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors"
          >
            {visibilityOptions.map((vis) => (
              <option key={vis.value} value={vis.value} className="bg-[#141B2D] text-slate-200">
                {vis.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <Filter className="w-3 h-3" />
          </div>
        </div>

        {/* Sort By Filter */}
        <div className="relative flex-1 sm:flex-initial min-w-[150px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="w-full appearance-none bg-[#141B2D] border border-[#2A3247] text-slate-200 text-xs font-medium rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#141B2D] text-slate-200">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Repositories"
            className="p-2.5 rounded-xl bg-[#141B2D] border border-[#2A3247] text-slate-300 hover:text-white hover:border-slate-500 hover:bg-[#1E293B] transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Connect GitHub Button */}
          <button
            onClick={onConnectGithub}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <GithubIcon className="w-4 h-4" />
            <span>Connect GitHub</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepoActionBar;
