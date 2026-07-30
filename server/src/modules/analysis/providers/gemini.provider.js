import axios from 'axios';
import ApiError from '../../../utils/ApiError.js';

/**
 * Gemini Provider implementation for Repository Analysis.
 *
 * @param {string} prompt - Structured prompt message
 * @returns {Promise<Object>} Parsed JSON review object
 */
export const generateGeminiAnalysis = async (prompt) => {
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
            parts: [
              {
                text: `${prompt}\n\nIMPORTANT: Return ONLY a raw valid JSON object. Do not include markdown code block formatting or additional prose.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 45000,
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new ApiError(502, 'Empty response received from Gemini API');
    }

    try {
      // Clean up markdown ```json blocks if present
      const cleanedText = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(cleanedText);
    } catch (parseError) {
      throw new ApiError(502, 'Invalid JSON returned from Gemini API');
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new ApiError(504, 'Gemini API request timed out');
    }

    if (error.response?.status === 429) {
      throw new ApiError(429, 'Gemini API rate limit exceeded. Please try again later.');
    }

    throw new ApiError(
      error.response?.status || 500,
      error.response?.data?.error?.message || 'Gemini API request failed'
    );
  }
};

export default generateGeminiAnalysis;
