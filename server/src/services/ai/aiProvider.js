import ApiError from '../../utils/ApiError.js';
import { generateOpenAIReview } from './openai.provider.js';
import { generateGeminiReview } from './gemini.provider.js';

/**
 * AI Provider Factory to dynamically select AI engine based on process.env.AI_PROVIDER.
 *
 * @param {string} prompt - Structured prompt
 * @returns {Promise<Object>} Parsed JSON response from selected AI provider
 */
export const generateAIReview = async (prompt) => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase().trim();

  switch (provider) {
    case 'openai':
      return await generateOpenAIReview(prompt);

    case 'gemini':
      return await generateGeminiReview(prompt);

    default:
      throw new ApiError(
        500,
        `Unsupported AI_PROVIDER: "${provider}". Expected "openai" or "gemini".`
      );
  }
};

export default generateAIReview;
