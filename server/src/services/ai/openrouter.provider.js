import axios from 'axios';
import ApiError from '../../utils/ApiError.js';

/**
 * OpenRouter API Provider implementation.
 *
 * @param {string} prompt - Structured prompt message for repository review
 * @returns {Promise<Object>} Parsed JSON review object
 */
export const generateOpenRouterReview = async (prompt) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new ApiError(500, 'OPENROUTER_API_KEY is not configured in environment variables');
  }

  console.log("Using OpenRouter Model:", process.env.OPENROUTER_MODEL);

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: process.env.OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert senior software architect and code reviewer. Always return valid JSON only.',
          },
          {
            role: 'user',
            content: `${prompt}\n\nIMPORTANT: Respond ONLY with raw valid JSON.`,
          },
        ],
        temperature: 0.2,
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

    console.log("Actual model used:", response.data.model);

    const text = response.data.choices?.[0]?.message?.content;
    if (!text) {
      throw new ApiError(500, 'Empty response received from OpenRouter API');
    }

    const cleanedText = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const msg = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'OpenRouter API request failed';
    throw new ApiError(500, msg);
  }
};

export default generateOpenRouterReview;
