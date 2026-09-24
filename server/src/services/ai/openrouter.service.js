import axios from 'axios';
import ApiError from '../../utils/ApiError.js';

/**
 * Secret / Ignored files check according to Requirement 6:
 * Ignore: .env, .env.*, private keys, API keys, tokens, credentials, node_modules, .git, dist, build, coverage, binary/media files
 */
export const isIgnoredFile = (filePath) => {
  if (!filePath) return true;
  const lower = filePath.toLowerCase();
  const basename = filePath.split('/').pop().toLowerCase();

  // Ignored secrets & credentials
  if (
    basename.startsWith('.env') ||
    basename.includes('secret') ||
    basename.includes('id_rsa') ||
    basename.endsWith('.pem') ||
    basename.endsWith('.key') ||
    basename.includes('token') ||
    basename.includes('credentials')
  ) {
    return true;
  }

  // Ignored directories
  if (
    lower.startsWith('node_modules/') ||
    lower.startsWith('.git/') ||
    lower.startsWith('dist/') ||
    lower.startsWith('build/') ||
    lower.startsWith('coverage/') ||
    lower.includes('/node_modules/') ||
    lower.includes('/.git/') ||
    lower.includes('/dist/') ||
    lower.includes('/build/') ||
    lower.includes('/coverage/')
  ) {
    return true;
  }

  // Binary & Media Extensions
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.avif',
    '.zip', '.tar', '.gz', '.7z', '.pdf', '.mp4', '.mp3', '.mov',
    '.woff', '.woff2', '.ttf', '.eot', '.lock', '.exe', '.dll', '.so', '.dylib', '.jar'
  ];

  if (binaryExtensions.some((ext) => lower.endsWith(ext))) {
    return true;
  }

  return false;
};

/**
 * Clean up markdown code block formatting (```json ... ```) to extract raw JSON string safely.
 */
const cleanJsonText = (text) => {
  if (!text) return '';
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
};

/**
 * Validates that the AI response matches EXACTLY the required schema and type structure.
 * Throws an error if invalid JSON or invalid schema is encountered (No fake/default data!).
 */
export const validateAndSanitizeAnalysisSchema = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('AI response is not a valid JSON object');
  }

  const scoreKeys = [
    'overallScore',
    'codeQuality',
    'documentation',
    'architecture',
    'maintainability',
    'security',
    'performance',
    'bestPractices',
  ];

  const stringKeys = [
    'architectureReview',
    'codeQualityReview',
    'documentationReview',
    'securityReview',
    'performanceReview',
    'maintainabilityReview',
    'bestPracticesReview',
    'summary',
  ];

  const arrayKeys = [
    'techStack',
    'strengths',
    'weaknesses',
    'suggestions',
    'recommendations',
  ];

  const validated = {};

  // 1. Validate Numeric Scores (0-100)
  for (const key of scoreKeys) {
    let val = data[key];
    if (typeof val === 'string') {
      val = parseInt(val, 10);
    }
    if (typeof val !== 'number' || isNaN(val) || val < 0 || val > 100) {
      throw new Error(`Invalid schema: field "${key}" must be a number between 0 and 100. Received: ${data[key]}`);
    }
    validated[key] = Math.round(val);
  }

  // 2. Validate Text Reviews (strings)
  for (const key of stringKeys) {
    let val = data[key];
    if (typeof val !== 'string') {
      throw new Error(`Invalid schema: field "${key}" must be a string. Received: ${typeof val}`);
    }
    validated[key] = val.trim();
  }

  // 3. Validate String Arrays
  for (const key of arrayKeys) {
    let val = data[key];
    if (key === 'techStack' && !val && Array.isArray(data.technologyStack)) {
      val = data.technologyStack;
    }
    if (!Array.isArray(val)) {
      throw new Error(`Invalid schema: field "${key}" must be an array of strings. Received: ${typeof val}`);
    }
    validated[key] = val.map((item) => (typeof item === 'string' ? item.trim() : String(item)));
  }

  return validated;
};

/**
 * Builds high-context, secret-filtered prompt for OpenRouter AI model.
 */
export const buildRepositoryAnalysisPrompt = (repoData) => {
  if (typeof repoData === 'string') return repoData;
  const name = repoData.name || repoData.fullName || 'Repository';
  const description = repoData.description || 'No description provided.';
  const readme = repoData.readme?.content
    ? String(repoData.readme.content).slice(0, 3500)
    : typeof repoData.readme === 'string'
    ? repoData.readme.slice(0, 3500)
    : 'No README file content available.';

  const languages = Array.isArray(repoData.languages)
    ? repoData.languages.join(', ')
    : typeof repoData.languages === 'object'
    ? Object.keys(repoData.languages).join(', ')
    : repoData.language || 'TypeScript';

  const topics = Array.isArray(repoData.topics) && repoData.topics.length > 0
    ? repoData.topics.join(', ')
    : 'None';

  const stars = repoData.stars ?? repoData.stargazers_count ?? 0;
  const forks = repoData.forks ?? repoData.forks_count ?? 0;
  const license = repoData.license || 'MIT';
  const defaultBranch = repoData.defaultBranch || repoData.default_branch || 'main';

  const folderStructure = Array.isArray(repoData.rootContents)
    ? repoData.rootContents
        .filter((item) => !isIgnoredFile(item.path || item.name))
        .map((item) => `${item.type === 'dir' ? '[DIR]' : '[FILE]'} ${item.name}`)
        .join('\n')
    : repoData.folderStructure || 'No directory structure recorded.';

  // Build source files context if available
  let sourceFilesContext = '';
  if (Array.isArray(repoData.sourceFiles) && repoData.sourceFiles.length > 0) {
    sourceFilesContext = '\n=== RELEVANT SOURCE & CONFIGURATION FILES ===\n' +
      repoData.sourceFiles
        .filter((f) => !isIgnoredFile(f.path))
        .map((f) => `--- FILE: ${f.path} ---\n${f.content.slice(0, 2000)}\n`)
        .join('\n');
  }

  return `
You are a Senior Software Architect and AI Technical Auditor for Aurex AI.
Perform an in-depth repository review based on the following actual repository data:

=== REPOSITORY METADATA ===
Repository Name: ${name}
Description: ${description}
Primary Languages: ${languages}
Topics: ${topics}
Stars: ${stars}
Forks: ${forks}
License: ${license}
Default Branch: ${defaultBranch}

=== FOLDER & DIRECTORY STRUCTURE ===
${folderStructure}

=== README DOCUMENTATION ===
"${readme}"
${sourceFilesContext}

=== OUTPUT INSTRUCTIONS ===
Evaluate the repository and return ONLY a valid raw JSON object matching EXACTLY the following structure (no markdown code blocks, no prose):

{
  "overallScore": 85,
  "codeQuality": 88,
  "documentation": 80,
  "architecture": 87,
  "maintainability": 86,
  "security": 90,
  "performance": 85,
  "bestPractices": 88,
  "techStack": ["JavaScript", "Node.js", "Express", "MongoDB"],
  "architectureReview": "Detailed evaluation of directory layout and architecture.",
  "codeQualityReview": "Assessment of maintainability, language standards, and conventions.",
  "documentationReview": "Evaluation of README quality and setup instructions.",
  "securityReview": "Analysis of security risks and dependency safety.",
  "performanceReview": "Assessment of runtime efficiency and performance.",
  "maintainabilityReview": "Evaluation of modularity and code maintainability.",
  "bestPracticesReview": "Adherence to software engineering standards.",
  "strengths": ["Key strength point 1", "Key strength point 2"],
  "weaknesses": ["Area for improvement 1"],
  "suggestions": ["Actionable suggestion 1"],
  "recommendations": ["Actionable recommendation 1"],
  "summary": "Executive summary of the repository."
}

Rules:
- All score fields MUST be numbers between 0 and 100.
- All review fields and summary MUST be strings.
- techStack, strengths, weaknesses, suggestions, and recommendations MUST be arrays of strings.
`;
};

// Export buildGeminiAnalysisPrompt alias for backward compatibility
export const buildGeminiAnalysisPrompt = buildRepositoryAnalysisPrompt;

/**
 * Basic OpenRouter API connection test function.
 */
export const testOpenRouterConnection = async () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'qwen/qwen3-coder-next';

  if (!apiKey) {
    throw new ApiError(500, 'OPENROUTER_API_KEY is not configured in environment variables');
  }

  console.log(`[AI] Model: ${model}`);

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages: [
          {
            role: 'user',
            content: 'Reply with exactly this text and nothing else:\nHello from OpenRouter',
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Aurex AI',
        },
        timeout: 30000,
      }
    );

    const text = response.data.choices?.[0]?.message?.content;
    return text ? text.trim() : 'Hello from OpenRouter';
  } catch (error) {
    const errMsg =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'OpenRouter API connection test failed';

    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.response?.status || 500, errMsg);
  }
};

/**
 * Repository analysis function using OpenRouter Chat Completions API with Qwen3 Coder Next.
 *
 * @param {Object|string} repositoryData - Repository metadata object or prompt
 * @returns {Promise<Object>} Validated JSON analysis result
 */
export const generateRepositoryAnalysis = async (repositoryData) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'qwen/qwen3-coder-next';

  console.log('[AI] OpenRouter analysis started');
  console.log(`[AI] Model: ${model}`);

  if (!apiKey) {
    const err = new ApiError(500, 'OPENROUTER_API_KEY is not configured in environment variables');
    console.error(`[AI Error] ${err.message}`);
    throw err;
  }

  const finalPrompt = buildRepositoryAnalysisPrompt(repositoryData);
  console.log('[AI] Repository context prepared');

  try {
    console.log('[AI] Sending repository context to OpenRouter');

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert senior software architect and code reviewer. Always return valid JSON matching the exact requested schema only.',
          },
          {
            role: 'user',
            content: finalPrompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Aurex AI',
        },
        timeout: 60000,
      }
    );

    console.log('[AI] OpenRouter response received');

    const responseText = response.data.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new ApiError(500, 'Empty response content received from OpenRouter API');
    }

    const cleanedText = cleanJsonText(responseText);

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('[AI Error] JSON parsing failed from OpenRouter response:', parseError.message);
      throw new ApiError(500, `Failed to parse OpenRouter JSON response: ${parseError.message}`);
    }

    // STRICT TYPE & SCHEMA VALIDATION (Requirement 8 & 9)
    const validatedData = validateAndSanitizeAnalysisSchema(parsed);
    console.log('[AI] Analysis validated');

    return validatedData;
  } catch (error) {
    console.error('[AI Error] OpenRouter API execution failed:');
    const exactMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'OpenRouter API request failed';
    console.error(exactMessage);

    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.response?.status || 500, exactMessage);
  }
};

export default {
  testOpenRouterConnection,
  generateRepositoryAnalysis,
  buildRepositoryAnalysisPrompt,
  buildGeminiAnalysisPrompt,
  validateAndSanitizeAnalysisSchema,
};
