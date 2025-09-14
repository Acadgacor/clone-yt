
'use server';

import {
  recommendRelatedVideos,
  type RecommendRelatedVideosInput,
} from '@/ai/flows/recommend-related-videos';

export async function getRecommendations(input: RecommendRelatedVideosInput) {
  try {
    const result = await recommendRelatedVideos(input);
    return { success: true, data: result.recommendedVideos };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to get recommendations. Please try again later.' };
  }
}
