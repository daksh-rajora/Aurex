import { useNavigate } from 'react-router-dom';
import { UserCheck, ArrowRight, Sparkles } from 'lucide-react';

export const RecruiterCard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#141B2D] to-[#0F172A] border border-[#2A3247] hover:border-purple-500/30 transition-all duration-300 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">Recruiter Mode</h3>
              <span className="px-2 py-0.5 text-[9px] font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-md uppercase">
                Candidate Evaluation
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              Analyze candidate public GitHub repositories and evaluate technical projects without requiring candidate GitHub authentication.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard/recruiter')}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-[0.98]"
        >
          <span>Analyze Repository</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default RecruiterCard;
