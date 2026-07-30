import axios from 'axios';
import ApiError from '../../../utils/ApiError.js';

/**
 * OpenAI Provider implementation for Repository Analysis.
 *
 * @param {string} prompt - Structured system/user prompt
 * @returns {Promise<Object>} Parsed JSON review object
 */
export const generateOpenAIAnalysis = async (prompt) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new ApiError(500, 'OPENAI_API_KEY is not configured in environment variables');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a Senior Software Architect and Security Auditor. You evaluate GitHub repository data and output structured, accurate, production-ready analysis. Always return your response in strictly valid JSON format matching the schema requested by the user.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 45000,
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      throw new ApiError(502, 'Empty response received from OpenAI API');
    }

    try {
      return JSON.parse(content);
    } catch (parseError) {
      throw new ApiError(502, 'Invalid JSON returned from OpenAI API');
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new ApiError(504, 'OpenAI API request timed out');
    }

    if (error.response?.status === 429) {
      throw new ApiError(429, 'OpenAI API rate limit exceeded. Please try again later.');
    }

    throw new ApiError(
      error.response?.status || 500,
      error.response?.data?.error?.message || 'OpenAI API request failed'
    );
  }
};

export default generateOpenAIAnalysis;
