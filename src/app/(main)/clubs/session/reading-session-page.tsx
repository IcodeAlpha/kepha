'use client';
// src/app/(app)/clubs/[id]/session/page.tsx
// Full replacement — wires Cozy Corner Chat to Firestore in real-time

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { collection, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { ReadingRoom, ReadingTimer, QuickReactions } from '@/components/reading-room';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
} from '@/firebase';
import { useClubData } from '@/hooks/use-club-data';
import { useState } from 'react';

export default function ReadingSessionPage() {
  const params = useParams();
  const clubId = params.id as string;

  const firestore = useFirestore();
  const { user } = useUser();
  const { club, members } = useClubData(clubId);

  const [isInSession, setIsInSession] = useState(false);

  // ── Real-time chat messages from Firestore ────────────────────────────────
  const messagesQuery = useMemoFirebase(
    () =>
      query(
        collection(firestore, 'readingSessions', clubId, 'messages'),
        orderBy('timestamp', 'asc'),
        limit(50)
      ),
    [firestore, clubId]
  );
  const { data: chatMessages = [] } = useCollection(messagesQuery);

  if (!club) return notFound();

  // ── Active readers: members who are online and currently reading ──────────
  const activeMembers = members
    .filter(m => m.isOnline && m.currentlyReading)
    .map(m => {
      const memberUser = { id: m.userId, name: m.userId, avatarUrl: '' }; // enriched below
      return {
        user: memberUser,
        currentBook: { id: m.currentlyReading!.bookId } as any,
        currentChapter: undefined,
        joinedAt: m.joinedAt,
      };
    });

  // ── Write a message to Firestore ──────────────────────────────────────────
  const handleSendMessage = (content: string) => {
    if (!user) return;
    addDocumentNonBlocking(
      collection(firestore, 'readingSessions', clubId, 'messages'),
      {
        userId: user.uid,
        content,
        timestamp: serverTimestamp(),
        type: 'text',
      }
    );
  };

  const handleJoinSession = () => {
    setIsInSession(true);
    handleSendMessage('Joined the reading session! 📚');

    // Update presence on the member document
    if (user) {
      const { updateDocumentNonBlocking } = require('@/firebase');
      const { doc } = require('firebase/firestore');
      updateDocumentNonBlocking(
        doc(firestore, 'clubs', clubId, 'members', user.uid),
        { isOnline: true, lastSeen: serverTimestamp() }
      );
    }
  };

  const handleLeaveSession = () => {
    setIsInSession(false);
    handleSendMessage('Taking a break. Happy reading everyone! ✨');

    if (user) {
      const { updateDocumentNonBlocking } = require('@/firebase');
      const { doc } = require('firebase/firestore');
      updateDocumentNonBlocking(
        doc(firestore, 'clubs', clubId, 'members', user.uid),
        { isOnline: false, lastSeen: serverTimestamp() }
      );
    }
  };

  const handleReact = (emoji: string) => handleSendMessage(emoji);

  return (
    <div className="space-y-6">
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
          <Badge variant="default" className="ml-auto animate-pulse">
            In Session
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to the Reading Room</CardTitle>
          <CardDescription>
            A cozy space to read together. Everyone brings their own book, we share the experience.
            No pressure, no schedules — just peaceful reading and optional chat.
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

      <ReadingRoom
        clubName={club.name}
        activeReaders={activeMembers}
        chatMessages={chatMessages}
        allUsers={members}
        onSendMessage={handleSendMessage}
        isInSession={isInSession}
        onJoinSession={handleJoinSession}
        onLeaveSession={handleLeaveSession}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <ReadingTimer />
        <Card>
          <CardHeader>
            <CardTitle>Quick Reactions</CardTitle>
            <CardDescription>Share your reading mood without interrupting others</CardDescription>
          </CardHeader>
          <CardContent>
            <QuickReactions onReact={handleReact} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reading Session Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>📖 <strong>Stay present:</strong> The timer can help you stay focused</p>
          <p>💬 <strong>Chat mindfully:</strong> Keep messages brief so everyone can focus</p>
          <p>🤫 <strong>No spoilers:</strong> Save detailed discussions for the discussion threads</p>
          <p>☕ <strong>Take breaks:</strong> It's okay to step away — come back anytime!</p>
          <p>✨ <strong>Enjoy the vibe:</strong> There's something special about reading together</p>
        </CardContent>
      </Card>
    </div>
  );
}