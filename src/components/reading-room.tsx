'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Coffee, Send, Timer, Users } from "lucide-react";
import type { Book } from "@/lib/types";

interface ActiveReader {
  user: { id: string; name: string; avatarUrl: string };
  currentBook: Book;
  currentChapter?: number;
  joinedAt: any; // Firestore Timestamp or string
}

interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  timestamp: any; // Firestore Timestamp
  type: string;
}

interface ReadingRoomProps {
  clubName: string;
  activeReaders: ActiveReader[];
  chatMessages: ChatMessage[];
  allUsers: any[]; // members array from Firestore for name lookups
  onSendMessage: (message: string) => void;
  isInSession?: boolean;
  onJoinSession?: () => void;
  onLeaveSession?: () => void;
}

export function ReadingRoom({
  clubName,
  activeReaders,
  chatMessages,
  allUsers,
  onSendMessage,
  isInSession = false,
  onJoinSession,
  onLeaveSession,
}: ReadingRoomProps) {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left: Active Readers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Reading Together Now
              </CardTitle>
              <CardDescription>
                {activeReaders.length}{' '}
                {activeReaders.length === 1 ? 'person' : 'people'} reading
              </CardDescription>
            </div>
            {!isInSession ? (
              <Button onClick={onJoinSession} size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Join Session
              </Button>
            ) : (
              <Button onClick={onLeaveSession} variant="outline" size="sm">
                Leave Session
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeReaders.length === 0 ? (
            <div className="text-center py-12">
              <Coffee className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                No one is reading right now. Start a session!
              </p>
              <Button onClick={onJoinSession}>
                <BookOpen className="h-4 w-4 mr-2" />
                Start Reading
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {activeReaders.map((reader) => (
                  <div
                    key={reader.user.id}
                    className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={reader.user.avatarUrl} alt={reader.user.name} />
                        <AvatarFallback>{reader.user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{reader.user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {reader.currentBook.title}
                      </p>
                      {reader.currentChapter && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Chapter {reader.currentChapter}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {getTimeElapsed(reader.joinedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Right: Cozy Corner Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Cozy Corner Chat
          </CardTitle>
          <CardDescription>
            Share quick thoughts while reading (no spoilers!)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[320px] pr-4">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No messages yet. Say hello! 👋</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chatMessages.map((msg) => (
                  <ChatMessageItem key={msg.id} message={msg} users={allUsers} />
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              placeholder="Send a quick message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={!isInSession}
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!message.trim() || !isInSession}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {!isInSession && (
            <p className="text-xs text-muted-foreground text-center">
              Join the reading session to chat
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── ChatMessageItem: looks up real user from allUsers ─────────────────────────
function ChatMessageItem({ message, users }: { message: ChatMessage; users: any[] }) {
  const msgUser = users.find((u) => u.userId === message.userId || u.id === message.userId);
  const displayName = msgUser?.name || 'Reader';
  const avatarUrl = msgUser?.avatarUrl;

  // Firestore Timestamp → Date, or fallback for string timestamps
  const timestamp = message.timestamp?.toDate
    ? message.timestamp.toDate()
    : message.timestamp
    ? new Date(message.timestamp)
    : null;

  return (
    <div className="flex gap-2 text-sm">
      <Avatar className="h-6 w-6">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <span className="font-medium">{displayName}</span>
        {timestamp && (
          <span className="text-muted-foreground text-xs ml-2">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <p className="text-muted-foreground mt-0.5">{message.content}</p>
      </div>
    </div>
  );
}

function getTimeElapsed(joinedAt: any): string {
  const now = new Date();
  const joined = joinedAt?.toDate ? joinedAt.toDate() : new Date(joinedAt);
  const diffMs = now.getTime() - joined.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just joined';
  if (diffMins < 60) return `Reading for ${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  return `Reading for ${diffHours}h ${diffMins % 60}m`;
}

// ── Reading Timer ──────────────────────────────────────────────────────────────
export function ReadingTimer() {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <Timer className="h-8 w-8 text-muted-foreground mb-4" />
        <div className="text-5xl font-bold font-mono mb-4">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsActive(!isActive)}
            variant={isActive ? 'secondary' : 'default'}
          >
            {isActive ? 'Pause' : 'Start Reading'}
          </Button>
          <Button
            onClick={() => { setMinutes(0); setSeconds(0); setIsActive(false); }}
            variant="outline"
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Quick Reactions ────────────────────────────────────────────────────────────
export function QuickReactions({ onReact }: { onReact: (emoji: string) => void }) {
  const reactions = ['📖', '☕', '🤯', '😭', '😂', '❤️', '🔥'];

  return (
    <div className="flex gap-2 flex-wrap">
      {reactions.map((emoji) => (
        <Button
          key={emoji}
          variant="outline"
          size="sm"
          onClick={() => onReact(emoji)}
          className="text-lg"
        >
          {emoji}
        </Button>
      ))}
    </div>
  );
}