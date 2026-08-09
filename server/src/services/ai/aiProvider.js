import ApiError from '../../utils/ApiError.js';
import { generateOpenAIReview } from './openai.provider.js';
import { generateOpenRouterReview } from './openrouter.provider.js';

/**
 * AI Provider Factory to dynamically select AI engine based on process.env.AI_PROVIDER.
 *
 * @param {string} prompt - Structured prompt
 * @returns {Promise<Object>} Parsed JSON response from selected AI provider
 */
export const generateAIReview = async (prompt) => {
  const provider = (process.env.AI_PROVIDER || 'openrouter').toLowerCase().trim();

  switch (provider) {
    case 'openai':
      return await generateOpenAIReview(prompt);

    case 'openrouter':
    case 'gemini':
      return await generateOpenRouterReview(prompt);

    default:
      return await generateOpenRouterReview(prompt);
  }
};

export default generateAIReview;
