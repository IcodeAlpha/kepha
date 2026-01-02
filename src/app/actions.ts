"use server";

import {
  generateDiscussionPrompts,
  GenerateDiscussionPromptsInput,
  GenerateDiscussionPromptsOutput,
} from "@/ai/flows/generate-discussion-prompts";
import {
  summarizeChapterDiscussions,
  SummarizeChapterDiscussionsInput,
  SummarizeChapterDiscussionsOutput,
} from "@/ai/flows/summarize-chapter-discussions";

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
