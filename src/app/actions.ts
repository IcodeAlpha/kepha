"use server";

import {
  generateDiscussionPrompts,
  GenerateDiscussionPromptsInput,
  GenerateDiscussionPromptsOutput,
} from "@/ai/flows/generate-discussion-prompts";
import {
    generateRecommendations,
    GenerateRecommendationsInput,
    GenerateRecommendationsOutput,
} from "@/ai/flows/generate-recommendations";
import {
  summarizeChapterDiscussions,
  SummarizeChapterDiscussionsInput,
  SummarizeChapterDiscussionsOutput,
} from "@/ai/flows/summarize-chapter-discussions";
import {
  textToSpeech,
  TextToSpeechInput,
  TextToSpeechOutput,
} from "@/ai/flows/text-to-speech";
import type { Book } from "@/lib/types";


export async function getAIDiscussionPrompts(
  input: GenerateDiscussionPromptsInput
): Promise<GenerateDiscussionPromptsOutput> {
  console.log("Generating AI discussion prompts with input:", input);
  try {
    const output = await generateDiscussionPrompts(input);
    console.log("AI discussion prompts generated:", output);
    return output;
  } catch (error) {
    console.error("Error generating AI discussion prompts:", error);
    throw new Error("Failed to generate discussion prompts.");
  }
}

export async function getAIDiscussionSummary(
  input: SummarizeChapterDiscussionsInput
): Promise<SummarizeChapterDiscussionsOutput> {
  console.log("Generating AI discussion summary with input:", input);
  try {
    const output = await summarizeChapterDiscussions(input);
    console.log("AI discussion summary generated:", output);
    return output;
  } catch (error) {
    console.error("Error generating AI discussion summary:", error);
    throw new Error("Failed to generate discussion summary.");
  }
}

export async function getAIAudio(
  input: TextToSpeechInput
): Promise<TextToSpeechOutput> {
  console.log("Generating AI audio with input:", input.text.substring(0, 20));
  try {
    const output = await textToSpeech(input);
    console.log("AI audio generated");
    return output;
  } catch (error) {
    console.error("Error generating AI audio:", error);
    throw new Error("Failed to generate audio.");
  }
}

export async function getAIRecommendations(
  input: GenerateRecommendationsInput
): Promise<GenerateRecommendationsOutput> {
    console.log("Generating AI recommendations with input:", input.readBooks.map(b => b.title));
    try {
        const output = await generateRecommendations(input);
        console.log("AI recommendations generated:", output);
        return output;
    } catch (error) {
        console.error("Error generating AI recommendations:", error);
        throw new Error("Failed to generate recommendations.");
    }
}

export async function searchBooks(query: string): Promise<Book[]> {
  if (!query) {
    return [];
  }
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`);
    if (!response.ok) {
      throw new Error(`Google Books API failed with status: ${response.status}`);
    }
    const data = await response.json();
    const items = data.items || [];
    
    return items.map((item: any): Book => ({
      id: item.id,
      title: item.volumeInfo.title,
      author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown Author',
      coverUrl: item.volumeInfo.imageLinks?.thumbnail || 'https://picsum.photos/seed/placeholder/400/600',
      coverHint: 'book cover',
      summary: item.volumeInfo.description || 'No summary available.',
    }));
  } catch (error) {
    console.error("Error searching books:", error);
    // In case of an API error, we can return an empty array
    // or you could handle it differently in the UI.
    return [];
  }
}
