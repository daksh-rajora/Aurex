import { Router } from 'express';
import { githubLogin } from '../controllers/github/githubLogin.controller.js';
import { githubCallback } from '../controllers/github/githubCallback.controller.js';
import { getGithubProfile } from '../controllers/github/githubProfile.controller.js';
import { githubConnect } from '../controllers/github/githubConnect.controller.js';
import { getGithubRepositories } from '../controllers/github/githubRepositories.controller.js';
import { getRepositoryDetails } from '../controllers/github/repositoryDetails.controller.js';
import { analyzeRepository } from '../controllers/github/repositoryAnalysis.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route   GET /login
 * @desc    Initiate GitHub OAuth flow (optional ?token=<JWT> query param for state preservation)
 * @access  Public
 */
router.get('/login', githubLogin);

/**
 * @route   GET /callback
 * @desc    Handle GitHub OAuth callback
 * @access  Public
 */
router.get('/callback', githubCallback);

/**
 * @route   GET /profile
 * @desc    Fetch authenticated GitHub user profile
 * @access  Private (JWT Required)
 */
router.get('/profile', authenticateUser, getGithubProfile);

/**
 * @route   POST /connect
 * @desc    Link GitHub account to authenticated Aurex user in MongoDB
 * @access  Private (JWT Required)
 */
router.post('/connect', authenticateUser, githubConnect);

/**
 * @route   GET /repositories
 * @desc    Fetch all repositories for connected GitHub account
 * @access  Private (JWT Required)
 */
router.get('/repositories', authenticateUser, getGithubRepositories);

/**
 * @route   GET /repositories/:owner/:repo
 * @desc    Fetch detailed information for a specific repository
 * @access  Private (JWT Required)
 */
router.get('/repositories/:owner/:repo', authenticateUser, getRepositoryDetails);

/**
 * @route   GET /repositories/:owner/:repo/analyze
 * @desc    Analyze repository health and generate structured report
 * @access  Private (JWT Required)
 */
router.get('/repositories/:owner/:repo/analyze', authenticateUser, analyzeRepository);

export default router;
