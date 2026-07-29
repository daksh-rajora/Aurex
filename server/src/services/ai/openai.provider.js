import axios from 'axios';
import ApiError from '../../utils/ApiError.js';

/**
 * OpenAI API Provider implementation.
 *
 * @param {string} prompt - Structured prompt message for repository review
 * @returns {Promise<Object>} Parsed JSON review object
 */
export const generateOpenAIReview = async (prompt) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new ApiError(500, 'OPENAI_API_KEY is not configured in environment variables');
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a Senior Software Architect and Security Auditor. Always respond in valid JSON format only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      throw new ApiError(500, 'Empty response received from OpenAI API');
    }

    return JSON.parse(content);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error.response?.data?.error?.message || 'OpenAI API request failed'
    );
  }
};

export default generateOpenAIReview;
