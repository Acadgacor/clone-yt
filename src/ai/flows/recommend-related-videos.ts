// src/ai/flows/recommend-related-videos.ts
'use server';

/**
 * @fileOverview Recommends similar videos based on the currently playing video.
 *
 * - recommendRelatedVideos - A function that recommends related videos.
 * - RecommendRelatedVideosInput - The input type for the recommendRelatedVideos function.
 * - RecommendRelatedVideosOutput - The return type for the recommendRelatedVideos function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendRelatedVideosInputSchema = z.object({
  videoTitle: z.string().describe('The title of the currently playing video.'),
  videoGenre: z.string().describe('The genre of the currently playing video.'),
  userRating: z.number().describe('The user rating of the currently playing video.'),
});

export type RecommendRelatedVideosInput = z.infer<typeof RecommendRelatedVideosInputSchema>;

const RecommendRelatedVideosOutputSchema = z.object({
  recommendedVideos: z
    .array(z.string())
    .describe('A list of recommended video titles.'),
});

export type RecommendRelatedVideosOutput = z.infer<typeof RecommendRelatedVideosOutputSchema>;

export async function recommendRelatedVideos(
  input: RecommendRelatedVideosInput
): Promise<RecommendRelatedVideosOutput> {
  return recommendRelatedVideosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendRelatedVideosPrompt',
  input: {schema: RecommendRelatedVideosInputSchema},
  output: {schema: RecommendRelatedVideosOutputSchema},
  prompt: `You are a video recommendation expert. Based on the title, genre, and user rating of the current video, you will recommend similar videos.

Current Video Title: {{{videoTitle}}}
Current Video Genre: {{{videoGenre}}}
Current Video User Rating: {{{userRating}}}

Recommend videos with similar themes and genres, and which users have also enjoyed.

Return only a list of video titles.`,
});

const recommendRelatedVideosFlow = ai.defineFlow(
  {
    name: 'recommendRelatedVideosFlow',
    inputSchema: RecommendRelatedVideosInputSchema,
    outputSchema: RecommendRelatedVideosOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
