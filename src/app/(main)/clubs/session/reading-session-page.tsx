'use client';

import { useState } from 'react';
import { useParams, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReadingRoom, ReadingTimer, QuickReactions } from "@/components/reading-room";
import { clubs, users, books, userBooks, clubMembers } from "@/lib/data";
import type { ChatMessage } from "@/lib/types";

const currentUserId = 'user-1';

export default function ReadingSessionPage() {
  const params = useParams();
  const clubId = params.id as string;
  const club = clubs.find(c => c.id === clubId);

  const [isInSession, setIsInSession] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      userId: 'user-2',
      content: 'Starting my reading session! ☕',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      type: 'text'
    },
    {
      id: 'msg-2',
      userId: 'user-3',
      content: 'This chapter is intense! 😱',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      type: 'text'
    }
  ]);

  if (!club) {
    return notFound();
  }

  // Get active readers (mock - in real app, this would be real-time)
  const activeMembers = clubMembers
    .filter(cm => cm.clubId === clubId && cm.isOnline && cm.currentlyReading)
    .map(cm => {
      const user = users.find(u => u.id === cm.userId)!;
      const book = books.find(b => b.id === cm.currentlyReading?.bookId)!;
      const userBook = userBooks.find(ub => 
        ub.userId === cm.userId && ub.bookId === cm.currentlyReading?.bookId
      );
      
      return {
        user: { ...user, id: user.id },
        currentBook: book,
        currentChapter: userBook?.currentChapter,
        joinedAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
      };
    });

  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: currentUserId,
      content: message,
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    setChatMessages([...chatMessages, newMessage]);
  };

  const handleJoinSession = () => {
    setIsInSession(true);
    handleSendMessage('Joined the reading session! 📚');
  };

  const handleLeaveSession = () => {
    setIsInSession(false);
    handleSendMessage('Taking a break. Happy reading everyone! ✨');
  };

  const handleReact = (emoji: string) => {
    handleSendMessage(emoji);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/clubs/${clubId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{club.name}</h1>
          <p className="text-muted-foreground">Reading Session</p>
        </div>
        {isInSession && (
          <Badge variant="default" className="ml-auto">
            In Session
          </Badge>
        )}
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to the Reading Room</CardTitle>
          <CardDescription>
            A cozy space to read together. Everyone brings their own book, we share the experience. 
            No pressure, no schedules - just peaceful reading and optional chat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Ambient company</Badge>
            <Badge variant="outline">Optional chat</Badge>
            <Badge variant="outline">No spoilers</Badge>
            <Badge variant="outline">Good vibes only</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Reading Room */}
      <ReadingRoom
        clubName={club.name}
        activeReaders={activeMembers}
        chatMessages={chatMessages}
        onSendMessage={handleSendMessage}
        isInSession={isInSession}
        onJoinSession={handleJoinSession}
        onLeaveSession={handleLeaveSession}
      />

      {/* Additional Features */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Reading Timer */}
        <ReadingTimer />

        {/* Quick Reactions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Reactions</CardTitle>
            <CardDescription>
              Share your reading mood without interrupting others
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuickReactions onReact={handleReact} />
          </CardContent>
        </Card>
      </div>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle>Reading Session Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>📖 <strong>Stay present:</strong> The timer can help you stay focused on your reading</p>
          <p>💬 <strong>Chat mindfully:</strong> Keep messages brief so everyone can focus on reading</p>
          <p>🤫 <strong>No spoilers:</strong> Save detailed discussions for the discussion threads</p>
          <p>☕ <strong>Take breaks:</strong> It's okay to step away - come back anytime!</p>
          <p>✨ <strong>Enjoy the vibe:</strong> There's something special about reading "together"</p>
        </CardContent>
      </Card>
    </div>
  );
}