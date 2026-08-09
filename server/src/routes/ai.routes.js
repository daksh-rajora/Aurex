import { Router } from 'express';
import { testOpenRouterConnection } from '../services/ai/openrouter.service.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

/**
 * @route   GET /test
 * @desc    Temporary test endpoint for OpenRouter API connection
 * @access  Public
 */
router.get(
  '/test',
  asyncHandler(async (req, res) => {
    const message = await testOpenRouterConnection();
    return res.status(200).json({
      success: true,
      message,
    });
  })
);

export default router;
