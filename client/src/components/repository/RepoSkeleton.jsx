export const RepoSkeleton = ({ count = 6 }) => {
  return (
    <div className="space-y-6 animate-pulse select-none">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] p-5 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="w-24 h-3 bg-[#1E293B] rounded" />
                <div className="w-16 h-7 bg-[#1E293B] rounded-lg" />
              </div>
              <div className="w-9 h-9 bg-[#1E293B] rounded-xl" />
            </div>
            <div className="w-32 h-2.5 bg-[#1E293B] rounded" />
          </div>
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="h-64 rounded-2xl bg-[#0F172A]/80 border border-[#2A3247] p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E293B] shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-20 h-2.5 bg-[#1E293B] rounded" />
                  <div className="w-32 h-4 bg-[#1E293B] rounded-md" />
                </div>
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="w-full h-3 bg-[#1E293B] rounded" />
                <div className="w-3/4 h-3 bg-[#1E293B] rounded" />
              </div>
            </div>

            <div className="h-10 bg-[#141B2D] rounded-xl border border-[#2A3247]/60" />

            <div className="pt-3 border-t border-[#2A3247]/60 flex items-center justify-between">
              <div className="w-28 h-8 bg-[#1E293B] rounded-xl" />
              <div className="w-20 h-8 bg-[#1E293B] rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RepoSkeleton;
