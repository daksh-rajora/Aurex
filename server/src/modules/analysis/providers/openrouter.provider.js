import { generateRepositoryAnalysis } from '../../../services/ai/openrouter.service.js';

/**
 * OpenRouter Provider adapter using axios.
 *
 * @param {string|Object} promptOrData - Structured prompt string or repository metadata object
 * @returns {Promise<Object>} Structured analysis JSON object
 */
export const generateOpenRouterAnalysis = async (promptOrData) => {
  if (typeof promptOrData === 'object' && promptOrData !== null) {
    return await generateRepositoryAnalysis(promptOrData);
  }
  return await generateRepositoryAnalysis({ prompt: promptOrData });
};

export default generateOpenRouterAnalysis;
