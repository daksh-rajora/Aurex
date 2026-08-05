import { ChevronLeft, ChevronRight } from 'lucide-react';

export const RepoPagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 6,
  onPageChange,
}) => {
  if (totalItems <= 0 || totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="bg-[#0F172A]/80 border border-[#2A3247] rounded-2xl p-4 shadow-lg backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 select-none">
      {/* Item Range Info */}
      <div className="text-xs text-slate-400 font-medium">
        Showing <span className="font-bold text-white">{startItem}</span> to{' '}
        <span className="font-bold text-white">{endItem}</span> of{' '}
        <span className="font-bold text-indigo-400">{totalItems}</span> repositories
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#141B2D] border border-[#2A3247] text-slate-300 hover:text-white hover:bg-[#1E293B] text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((page) => {
            const isActive = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/30'
                    : 'bg-[#141B2D] border border-[#2A3247] text-slate-400 hover:text-white hover:bg-[#1E293B]'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#141B2D] border border-[#2A3247] text-slate-300 hover:text-white hover:bg-[#1E293B] text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default RepoPagination;
