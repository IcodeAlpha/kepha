"use client";

import type { Book, Chapter, DiscussionPost, User, UserNote } from "@/lib/types";
import { getAIDiscussionPrompts, getAIDiscussionSummary, getAIAudio } from "@/app/actions";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import React, { useState } from "react";
import { Loader2, Sparkles, Trash2, Volume2, Play, Pause } from "lucide-react";
import { useUser } from "@/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useForm, SubmitHandler } from "react-hook-form";
import { users as mockUsers } from "@/lib/data";

interface DiscussionSectionProps {
  chapter: Chapter;
  book: Book & { id: string };
}

function Comment({ post }: { post: DiscussionPost }) {
    const user = mockUsers.find(u => u.id === post.userId);

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
                 {post.replies?.map(reply => <Comment key={reply.id} post={reply} />)}
            </div>
        </div>
    )
}

function MyNotesSection({ bookId, chapterId }: { bookId: string; chapterId: string; }) {
    const { user } = useUser();
    const { register, handleSubmit, reset } = useForm<{ content: string }>();
    const [notes, setNotes] = useState<UserNote[]>([]);
    
    const onSubmit: SubmitHandler<{ content: string }> = async (data) => {
        if (!user) return;
        
        const newNote: UserNote = {
            id: `note-${Date.now()}`,
            userId: user.uid,
            bookId,
            chapterId,
            content: data.content,
            createdAt: new Date().toISOString()
        };

        setNotes(prev => [...prev, newNote]);
        reset();
    };

    const handleDeleteNote = (noteId: string) => {
        setNotes(prev => prev.filter(n => n.id !== noteId));
    }

    return (
        <div className="space-y-4">
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
                <Textarea placeholder="Add a private note..." {...register("content", { required: true })} />
                <Button type="submit">Save Note</Button>
            </form>

            <Separator />
            
            <div className="space-y-3">
                 {notes.map(note => (
                    <Card key={note.id} className="bg-secondary/50">
                        <CardContent className="p-4 text-sm flex justify-between items-start">
                           <p>{note.content}</p>
                           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteNote(note.id)}>
                                <Trash2 className="h-4 w-4" />
                           </Button>
                        </CardContent>
                    </Card>
                ))}
                {notes.length === 0 && <p className="text-xs text-muted-foreground">Your private notes for this chapter will appear here.</p>}
            </div>
        </div>
    )
}

export function DiscussionSection({ chapter, book }: DiscussionSectionProps) {
  const [prompts, setPrompts] = useState<string[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isPromptsLoading, setPromptsLoading] = useState(false);
  const [isSummaryLoading, setSummaryLoading] = useState(false);
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAudioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const discussion = chapter.discussion || [];

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
    if (!discussion) return;
    setSummaryLoading(true);
    setSummary(null);
    const discussionText = discussion.map(p => `${p.userId}: ${p.content}`).join('\n');
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
  
  const handleReadAloud = async () => {
    if (audioUrl) {
        // If audio is already loaded, just play/pause
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
        return;
    }

    setAudioLoading(true);
    try {
        const result = await getAIAudio({ text: chapter.content });
        setAudioUrl(result.audio);
    } catch (error) {
        console.error("Failed to generate audio:", error);
    } finally {
        setAudioLoading(false);
    }
  };

  React.useEffect(() => {
    if (audioUrl && audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
    }
  }, [audioUrl]);

  React.useEffect(() => {
    const audioElement = audioRef.current;
    const onEnded = () => setIsPlaying(false);
    if (audioElement) {
        audioElement.addEventListener('ended', onEnded);
    }
    return () => {
        if (audioElement) {
            audioElement.removeEventListener('ended', onEnded);
        }
    }
  }, [audioRef]);


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleGeneratePrompts} disabled={isPromptsLoading}>
          {isPromptsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Spark Conversation
        </Button>
        <Button variant="secondary" onClick={handleGenerateSummary} disabled={isSummaryLoading || (discussion?.length || 0) === 0}>
           {isSummaryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Summarize Discussion
        </Button>
        <Button variant="secondary" onClick={handleReadAloud} disabled={isAudioLoading}>
            {isAudioLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : audioUrl ? (
                isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />
            ) : (
                <Volume2 className="mr-2 h-4 w-4" />
            )}
            {audioUrl ? (isPlaying ? 'Pause' : 'Play') : 'Read Aloud'}
        </Button>
      </div>

       {audioUrl && <audio ref={audioRef} src={audioUrl} className="w-full" controls />}


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

        <Tabs defaultValue="comments" className="w-full">
            <TabsList>
                <TabsTrigger value="comments">Comments ({discussion?.length || 0})</TabsTrigger>
                <TabsTrigger value="notes">My Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="pt-4">
                <div className="space-y-4">
                {discussion?.map((post) => (
                    <Comment key={post.id} post={post} />
                ))}
                {(discussion?.length || 0) === 0 && <p className="text-sm text-muted-foreground">No comments yet. Be the first to start the discussion!</p>}
                </div>
                
                <div className="flex gap-3 items-start mt-6">
                    {/* Comment form would go here */}
                </div>
            </TabsContent>
            <TabsContent value="notes" className="pt-4">
                <MyNotesSection bookId={book.id} chapterId={chapter.id} />
            </TabsContent>
        </Tabs>
    </div>
  );
}
