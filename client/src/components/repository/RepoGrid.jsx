import { AnimatePresence } from 'framer-motion';
import RepoCard from './RepoCard.jsx';

export const RepoGrid = ({
  repositories = [],
  onViewDetails,
  onAnalyze,
  onToggleFavorite,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <AnimatePresence mode="popLayout">
        {repositories.map((repo) => (
          <RepoCard
            key={repo.id}
            repo={repo}
            onViewDetails={onViewDetails}
            onAnalyze={onAnalyze}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RepoGrid;
