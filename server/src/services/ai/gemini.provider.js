import axios from 'axios';
import ApiError from '../../utils/ApiError.js';

/**
 * Gemini API Provider implementation.
 *
 * @param {string} prompt - Structured prompt message for repository review
 * @returns {Promise<Object>} Parsed JSON review object
 */
export const generateGeminiReview = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new ApiError(500, 'GEMINI_API_KEY is not configured in environment variables');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [{ text: `${prompt}\n\nIMPORTANT: Respond ONLY with raw valid JSON.` }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new ApiError(500, 'Empty response received from Gemini API');
    }

    return JSON.parse(text);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error.response?.data?.error?.message || 'Gemini API request failed'
    );
  }
};

export default generateGeminiReview;
