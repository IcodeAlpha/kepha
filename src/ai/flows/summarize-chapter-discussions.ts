'use server';

/**
 * @fileOverview Summarizes chapter discussions using AI.
 *
 * - summarizeChapterDiscussions - A function that summarizes the discussion of a chapter.
 * - SummarizeChapterDiscussionsInput - The input type for the summarizeChapterDiscussions function.
 * - SummarizeChapterDiscussionsOutput - The return type for the summarizeChapterDiscussions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeChapterDiscussionsInputSchema = z.object({
  chapterText: z.string().describe('The chapter text to provide context.'),
  discussionText: z.string().describe('The discussion text to summarize.'),
});
export type SummarizeChapterDiscussionsInput = z.infer<
  typeof SummarizeChapterDiscussionsInputSchema
>;

const SummarizeChapterDiscussionsOutputSchema = z.object({
  summary: z.string().describe('The summary of the chapter discussions.'),
});
export type SummarizeChapterDiscussionsOutput = z.infer<
  typeof SummarizeChapterDiscussionsOutputSchema
>;

export async function summarizeChapterDiscussions(
  input: SummarizeChapterDiscussionsInput
): Promise<SummarizeChapterDiscussionsOutput> {
  return summarizeChapterDiscussionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeChapterDiscussionsPrompt',
  input: {schema: SummarizeChapterDiscussionsInputSchema},
  output: {schema: SummarizeChapterDiscussionsOutputSchema},
  prompt: `Summarize the following discussion about the chapter text provided. The summary should be concise and highlight the key points and insights from the discussion.\n\nChapter Text:\n{{chapterText}}\n\nDiscussion:\n{{discussionText}}`,
});

const summarizeChapterDiscussionsFlow = ai.defineFlow(
  {
    name: 'summarizeChapterDiscussionsFlow',
    inputSchema: SummarizeChapterDiscussionsInputSchema,
    outputSchema: SummarizeChapterDiscussionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
