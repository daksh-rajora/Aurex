import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  FolderGit2,
  Cpu,
  AlertOctagon,
} from 'lucide-react';
import { socket } from '../../services/socket.js';
import analysisService from '../../services/analysisService.js';

const STAGES = [
  { percent: 10, name: 'Connecting to GitHub' },
  { percent: 20, name: 'Fetching repository metadata' },
  { percent: 30, name: 'Reading repository structure' },
  { percent: 45, name: 'Detecting languages' },
  { percent: 60, name: 'Running AI analysis' },
  { percent: 75, name: 'Generating code quality report' },
  { percent: 85, name: 'Generating security review' },
  { percent: 92, name: 'Saving report' },
  { percent: 100, name: 'Analysis completed' },
];

export const AnalysisLoadingPage = ({ repoName: propRepoName, owner: propOwner, analysisId: propAnalysisId, onComplete }) => {
  const { analysisId: paramAnalysisId } = useParams();
  const navigate = useNavigate();

  const targetAnalysisId = propAnalysisId || paramAnalysisId;

  const [progress, setProgress] = useState(10);
  const [currentStage, setCurrentStage] = useState('Connecting to GitHub');
  const [errorMessage, setErrorMessage] = useState(null);
  const [repoDetails, setRepoDetails] = useState({ name: propRepoName || 'Repository', owner: propOwner || '' });

  useEffect(() => {
    if (!targetAnalysisId) return;

    // Join Socket.IO room for targetAnalysisId
    socket.emit('join_analysis', targetAnalysisId);

    // Handler for real-time progress events
    const handleProgress = (data) => {
      console.log('[Socket.IO Realtime Progress Received]:', data);

      if (data.status === 'Failed' || data.error) {
        setErrorMessage(data.error || 'Analysis execution failed');
        return;
      }

      if (typeof data.percentage === 'number') {
        setProgress(data.percentage);
      }
      if (data.stage) {
        setCurrentStage(data.stage);
      }

      // Automatically redirect when progress reaches 100% or status Completed
      if (data.percentage >= 100 || data.status === 'Completed') {
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          } else {
            navigate(`/dashboard/analysis/${targetAnalysisId}`);
          }
        }, 500);
      }
    };

    // Listen on socket room event & broadcast fallback
    socket.on('analysis_progress', handleProgress);
    socket.on(`analysis:${targetAnalysisId}:progress`, handleProgress);

    // Initial check from REST API in case of page refresh
    analysisService.getSingleAnalysis(targetAnalysisId).then((res) => {
      const doc = res.data?.data || res.data || res;
      if (doc) {
        if (doc.repository?.name) {
          setRepoDetails({
            name: doc.repository.name,
            owner: doc.repository.owner?.login || doc.repository.owner || '',
          });
        }
        if (doc.status === 'Completed') {
          setProgress(100);
          setCurrentStage('Analysis completed');
          setTimeout(() => {
            if (onComplete) onComplete();
            else navigate(`/dashboard/analysis/${targetAnalysisId}`);
          }, 300);
        } else if (doc.status === 'Failed') {
          setErrorMessage(doc.errorMessage || 'Analysis execution failed');
        }
      }
    }).catch(() => {});

    return () => {
      socket.emit('leave_analysis', targetAnalysisId);
      socket.off('analysis_progress', handleProgress);
      socket.off(`analysis:${targetAnalysisId}:progress`, handleProgress);
    };
  }, [targetAnalysisId, navigate, onComplete]);

  if (errorMessage) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B1020] text-white flex items-center justify-center p-4 select-none">
        <div className="w-full max-w-lg bg-[#0F172A] border border-rose-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Analysis Progress Stopped</h2>
          <p className="text-xs text-rose-300 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 max-w-md mx-auto leading-relaxed">
            {errorMessage}
          </p>
          <button
            onClick={() => navigate('/dashboard/repositories')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            Return to Repositories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1020] text-white flex items-center justify-center p-4 overflow-hidden select-none">
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[128px] pointer-events-none animate-pulse" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-xl bg-[#0F172A]/90 border border-[#2A3247] rounded-3xl p-8 shadow-2xl backdrop-blur-2xl space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-400 p-0.5 shadow-xl shadow-indigo-500/25 mb-2">
            <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          </div>

          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent tracking-tight">
            Analyzing Repository
          </h2>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-white font-bold">{repoDetails.owner ? `${repoDetails.owner}/${repoDetails.name}` : repoDetails.name}</span>
          </div>
        </div>

        {/* Real-time Progress Gauge */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-indigo-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 animate-spin" />
              {currentStage}
            </span>
            <span className="font-mono text-base text-white">{Math.round(progress)}%</span>
          </div>

          {/* Progress Bar Container */}
          <div className="relative w-full h-3.5 bg-[#141B2D] border border-[#2A3247] rounded-full overflow-hidden p-0.5 shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full shadow-lg shadow-indigo-500/50"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.3 }}
            />
          </div>
        </div>

        {/* Backend Real-Time Stages */}
        <div className="p-5 rounded-2xl bg-[#141B2D]/80 border border-[#2A3247] space-y-3 max-h-60 overflow-y-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Real-Time Backend Stages
          </span>

          <div className="space-y-2 text-xs">
            {STAGES.map((stg) => {
              const isCompleted = progress >= stg.percent;
              const isCurrent = currentStage === stg.name || (progress >= stg.percent && progress < (STAGES.find(s => s.percent > stg.percent)?.percent || 101));

              return (
                <div
                  key={stg.name}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all duration-200 ${
                    isCurrent && progress < 100
                      ? 'bg-indigo-500/10 border border-indigo-500/30 text-white font-bold'
                      : isCompleted
                      ? 'text-slate-200 font-medium'
                      : 'text-slate-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent && progress < 100 ? (
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                    )}
                    <span>{stg.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{stg.percent}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalysisLoadingPage;
