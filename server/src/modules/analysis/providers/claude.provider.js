import axios from 'axios';
import ApiError from '../../../utils/ApiError.js';

/**
 * Anthropic Claude Provider implementation for Repository Analysis.
 *
 * @param {string} prompt - Structured prompt message
 * @returns {Promise<Object>} Parsed JSON review object
 */
export const generateClaudeAnalysis = async (prompt) => {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new ApiError(
      500,
      'CLAUDE_API_KEY or ANTHROPIC_API_KEY is not configured in environment variables'
    );
  }

  const model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: 4096,
        temperature: 0.2,
        system:
          'You are a Senior Software Architect and Security Auditor. You evaluate GitHub repository data and output structured, accurate, production-ready analysis. Always return your response in strictly valid JSON format matching the schema requested by the user.',
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\nIMPORTANT: Return ONLY a raw valid JSON object. Do not include markdown wrapper syntax or explanatory text.`,
          },
        ],
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 45000,
      }
    );

    const contentBlocks = response.data.content;
    const text = Array.isArray(contentBlocks)
      ? contentBlocks.map((b) => b.text).join('')
      : contentBlocks;

    if (!text) {
      throw new ApiError(502, 'Empty response received from Claude API');
    }

    try {
      const cleanedText = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(cleanedText);
    } catch (parseError) {
      throw new ApiError(502, 'Invalid JSON returned from Claude API');
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new ApiError(504, 'Claude API request timed out');
    }

    if (error.response?.status === 429) {
      throw new ApiError(429, 'Claude API rate limit exceeded. Please try again later.');
    }

    throw new ApiError(
      error.response?.status || 500,
      error.response?.data?.error?.message || 'Claude API request failed'
    );
  }
};

export default generateClaudeAnalysis;
