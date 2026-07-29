import { Router } from 'express';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    API Health Check
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Aurex API is running',
  });
});

export default router;
