import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import githubRoutes from './github.routes.js';
import aiRoutes from './ai.routes.js';
import analysisRoutes from './analysis.routes.js';

const router = Router();

// Mount routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/github', githubRoutes);
router.use('/ai', aiRoutes);
router.use('/analysis', analysisRoutes);

export default router;
