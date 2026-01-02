'use server';
/**
 * @fileOverview Generates AI-powered discussion prompts for book club chapters.
 *
 * - generateDiscussionPrompts - A function that generates discussion prompts for a given chapter.
 * - GenerateDiscussionPromptsInput - The input type for the generateDiscussionPrompts function.
 * - GenerateDiscussionPromptsOutput - The return type for the generateDiscussionPrompts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDiscussionPromptsInputSchema = z.object({
  bookTitle: z.string().describe('The title of the book being discussed.'),
  chapterTitle: z.string().describe('The title of the chapter being discussed.'),
  chapterSummary: z.string().describe('A summary of the chapter content.'),
});
export type GenerateDiscussionPromptsInput = z.infer<
  typeof GenerateDiscussionPromptsInputSchema
>;

const GenerateDiscussionPromptsOutputSchema = z.object({
  discussionPrompts: z
    .array(z.string())
    .describe('A list of AI-generated discussion prompts for the chapter.'),
});
export type GenerateDiscussionPromptsOutput = z.infer<
  typeof GenerateDiscussionPromptsOutputSchema
>;

export async function generateDiscussionPrompts(
  input: GenerateDiscussionPromptsInput
): Promise<GenerateDiscussionPromptsOutput> {
  return generateDiscussionPromptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDiscussionPromptsPrompt',
  input: {schema: GenerateDiscussionPromptsInputSchema},
  output: {schema: GenerateDiscussionPromptsOutputSchema},
  prompt: `You are an AI assistant designed to generate thought-provoking discussion prompts for book clubs.

  Given the following information about a book chapter, generate a list of discussion prompts that will encourage deeper engagement and conversation among readers.

  Book Title: {{{bookTitle}}}
  Chapter Title: {{{chapterTitle}}}
  Chapter Summary: {{{chapterSummary}}}

  Please provide 3-5 distinct discussion prompts that explore different aspects of the chapter's themes, characters, or plot points. Format the prompts as a numbered list.
`,
});

const generateDiscussionPromptsFlow = ai.defineFlow(
  {
    name: 'generateDiscussionPromptsFlow',
    inputSchema: GenerateDiscussionPromptsInputSchema,
    outputSchema: GenerateDiscussionPromptsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
