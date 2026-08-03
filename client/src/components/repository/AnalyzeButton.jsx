import { Bot } from 'lucide-react';

export const AnalyzeButton = ({ onClick, isAnalyzed, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
        isAnalyzed
          ? 'bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
          : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
      } ${className}`}
    >
      <Bot className="w-3.5 h-3.5" />
      <span>{isAnalyzed ? 'Re-Analyze' : 'Analyze Repository'}</span>
    </button>
  );
};

export default AnalyzeButton;
