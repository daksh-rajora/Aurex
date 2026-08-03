export const DashboardFooter = () => {
  return (
    <footer className="w-full pt-8 pb-4 border-t border-[#2A3247]/40 flex flex-col sm:flex-row items-center justify-between text-xs text-[#94A3B8] gap-4 select-none">
      <div>Aurex AI © 2026. Developer Intelligence Platform. All rights reserved.</div>
      <div className="flex items-center gap-6">
        <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-slate-200 transition-colors">
          Privacy
        </a>
        <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-slate-200 transition-colors">
          Terms
        </a>
        <a href="#security" onClick={(e) => e.preventDefault()} className="hover:text-slate-200 transition-colors">
          Security
        </a>
        <a href="#api" onClick={(e) => e.preventDefault()} className="hover:text-slate-200 transition-colors">
          API
        </a>
        <a href="#support" onClick={(e) => e.preventDefault()} className="hover:text-slate-200 transition-colors">
          Support
        </a>
      </div>
    </footer>
  );
};

export default DashboardFooter;
