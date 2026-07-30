import ApiError from '../../../utils/ApiError.js';
import { generateOpenAIAnalysis } from './openai.provider.js';
import { generateGeminiAnalysis } from './gemini.provider.js';
import { generateClaudeAnalysis } from './claude.provider.js';

/**
 * AI Provider Registry / Factory
 * Supports: OpenAI, Gemini, Claude, and future extensibility.
 */
const PROVIDERS = {
  openai: generateOpenAIAnalysis,
  gemini: generateGeminiAnalysis,
  claude: generateClaudeAnalysis,
  anthropic: generateClaudeAnalysis,
};

/**
 * Executes AI analysis using the configured or explicitly passed AI provider.
 *
 * @param {string} prompt - Structured prompt to send to the AI provider
 * @param {string} [overrideProvider] - Optional explicit provider choice ('openai' | 'gemini' | 'claude')
 * @returns {Promise<Object>} Structured JSON response from the selected AI provider
 */
export const executeAIAnalysis = async (prompt, overrideProvider) => {
  const providerName = (
    overrideProvider ||
    process.env.AI_PROVIDER ||
    'openai'
  )
    .toLowerCase()
    .trim();

  const providerFn = PROVIDERS[providerName];

  if (!providerFn) {
    throw new ApiError(
      400,
      `Unsupported AI provider: "${providerName}". Available providers: ${Object.keys(
        PROVIDERS
      ).join(', ')}`
    );
  }

  return await providerFn(prompt);
};

/**
 * Register a new custom AI provider dynamically (for future providers).
 *
 * @param {string} name - Provider identifier
 * @param {Function} providerFn - Async provider execution function
 */
export const registerAIProvider = (name, providerFn) => {
  if (typeof providerFn !== 'function') {
    throw new ApiError(500, 'Provider implementation must be a function');
  }
  PROVIDERS[name.toLowerCase().trim()] = providerFn;
};

export default {
  executeAIAnalysis,
  registerAIProvider,
};
