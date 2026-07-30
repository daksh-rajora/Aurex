import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import githubRoutes from './github.routes.js';
import aiRoutes from './ai.routes.js';
import analysisRoutes from '../modules/analysis/analysis.routes.js';
import publicAnalysisRoutes from '../modules/analysis/publicAnalysis.routes.js';
import jobRoutes from './job.routes.js';

const router = Router();

// Mount routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/github', githubRoutes);
router.use('/ai', aiRoutes);
router.use('/analysis', analysisRoutes);
router.use('/public-analysis', publicAnalysisRoutes);
router.use('/jobs', jobRoutes);

export default router;

