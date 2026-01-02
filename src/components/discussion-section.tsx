"use client";

import type { Book, Chapter, DiscussionPost, User } from "@/lib/types";
import { useFormState } from "react-dom";
import { getAIDiscussionPrompts, getAIDiscussionSummary } from "@/app/actions";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { currentUser, users } from "@/lib/data";
import { Separator } from "./ui/separator";
import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

interface DiscussionSectionProps {
  chapter: Chapter;
  book: Book;
}

function Comment({ post }: { post: DiscussionPost }) {
    const user = users.find(u => u.id === post.userId);
    if (!user) return null;

    return (
        <div className="flex gap-3">
            <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-baseline gap-2">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(post.timestamp).toLocaleDateString()}</p>
                </div>
                <p className="text-sm">{post.content}</p>
                 {post.replies.map(reply => <Comment key={reply.id} post={reply} />)}
            </div>
        </div>
    )
}

export function DiscussionSection({ chapter, book }: DiscussionSectionProps) {
  const [prompts, setPrompts] = useState<string[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isPromptsLoading, setPromptsLoading] = useState(false);
  const [isSummaryLoading, setSummaryLoading] = useState(false);

  const handleGeneratePrompts = async () => {
    setPromptsLoading(true);
    setPrompts(null);
    try {
      const result = await getAIDiscussionPrompts({
        bookTitle: book.title,
        chapterTitle: chapter.title,
        chapterSummary: chapter.content.substring(0, 500) + "...",
      });
      setPrompts(result.discussionPrompts);
    } catch (error) {
      console.error("Failed to generate prompts:", error);
    } finally {
      setPromptsLoading(false);
    }
  };
  
  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setSummary(null);
    const discussionText = chapter.discussion.map(p => `${users.find(u=>u.id===p.userId)?.name}: ${p.content}`).join('\n');
    try {
      const result = await getAIDiscussionSummary({
        chapterText: chapter.content,
        discussionText: discussionText,
      });
      setSummary(result.summary);
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setSummaryLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={handleGeneratePrompts} disabled={isPromptsLoading}>
          {isPromptsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Spark Conversation
        </Button>
        <Button variant="secondary" onClick={handleGenerateSummary} disabled={isSummaryLoading || chapter.discussion.length === 0}>
           {isSummaryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Summarize Discussion
        </Button>
      </div>

      {isPromptsLoading && <p className="text-sm text-muted-foreground">Generating discussion prompts...</p>}
      {prompts && (
        <Card className="bg-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> AI Discussion Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc pl-5">
              {prompts.map((prompt, index) => (
                <li key={index} className="text-sm">{prompt}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {isSummaryLoading && <p className="text-sm text-muted-foreground">Generating summary...</p>}
      {summary && (
        <Card>
            <CardHeader>
                <CardTitle>AI Discussion Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm">{summary}</p>
            </CardContent>
        </Card>
      )}

      <Separator />

      <h4 className="font-bold text-lg">Comments ({chapter.discussion.length})</h4>
      <div className="space-y-4">
        {chapter.discussion.map((post) => (
            <Comment key={post.id} post={post} />
        ))}
        {chapter.discussion.length === 0 && <p className="text-sm text-muted-foreground">No comments yet. Be the first to start the discussion!</p>}
      </div>
      
      <div className="flex gap-3 items-start">
        <Avatar>
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <form className="flex-1 space-y-2">
            <Textarea placeholder="Add your thoughts..." rows={3} />
            <Button>Post Comment</Button>
        </form>
      </div>
    </div>
  );
}
