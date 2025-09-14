
'use server';

import {
  recommendRelatedVideos,
  type RecommendRelatedVideosInput,
} from '@/ai/flows/recommend-related-videos';

export async function getRecommendations(input: RecommendRelatedVideosInput) {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: 'The GEMINI_API_KEY environment variable is not set.' };
  }
  try {
    const result = await recommendRelatedVideos(input);
    return { success: true, data: result.recommendedVideos };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to get recommendations. Please try again later.' };
  }
}
