'use server';
/**
 * @fileOverview Generates personalized book recommendations.
 *
 * - generateRecommendations - A function that generates book recommendations based on a user's reading history.
 * - GenerateRecommendationsInput - The input type for the generateRecommendations function.
 * - GenerateRecommendationsOutput - The return type for the generateRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendedBookSchema = z.object({
    title: z.string().describe('The title of the recommended book.'),
    author: z.string().describe('The author of the recommended book.'),
    reason: z.string().describe('A short, compelling reason why this book is being recommended to the user.'),
    id: z.string().describe('The ID of the book from the available book list.'),
});


const GenerateRecommendationsInputSchema = z.object({
  readBooks: z.array(z.object({
    title: z.string(),
    author: z.string(),
  })).describe('A list of books the user has already read or is currently reading.'),
  availableBooks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    author: z.string(),
  })).describe('A list of available books in the app catalog that can be recommended.'),
});
export type GenerateRecommendationsInput = z.infer<
  typeof GenerateRecommendationsInputSchema
>;

const GenerateRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(RecommendedBookSchema)
    .describe('A list of personalized book recommendations.'),
});
export type GenerateRecommendationsOutput = z.infer<
  typeof GenerateRecommendationsOutputSchema
>;

export async function generateRecommendations(
  input: GenerateRecommendationsInput
): Promise<GenerateRecommendationsOutput> {
  return generateRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecommendationsPrompt',
  input: {schema: GenerateRecommendationsInputSchema},
  output: {schema: GenerateRecommendationsOutputSchema},
  prompt: `You are a helpful and experienced librarian who provides personalized book recommendations.

Your task is to recommend books to a user based on their reading history. You will be given a list of books the user has read and a list of available books to choose from.

- Do NOT recommend books that the user has already read.
- Choose 3-5 books from the "available books" list.
- For each recommendation, provide a short, one-sentence reason why the user might enjoy it, based on their reading history.

User's Reading History:
{{#each readBooks}}
- {{title}} by {{author}}
{{/each}}

Available Books for Recommendation:
{{#each availableBooks}}
- (ID: {{id}}) {{title}} by {{author}}
{{/each}}
`,
});

const generateRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateRecommendationsFlow',
    inputSchema: GenerateRecommendationsInputSchema,
    outputSchema: GenerateRecommendationsOutputSchema,
  },
  async input => {
    // Filter out books the user has already read from the available list
    const readBookTitles = new Set(input.readBooks.map(b => b.title));
    const availableForRecommendation = input.availableBooks.filter(b => !readBookTitles.has(b.title));

    if (availableForRecommendation.length === 0) {
      return { recommendations: [] };
    }

    const {output} = await prompt({
      readBooks: input.readBooks,
      availableBooks: availableForRecommendation,
    });
    return output!;
  }
);
