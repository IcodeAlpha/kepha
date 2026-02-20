'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, BookCheck, Quote, Sparkles, Users, MessageCircle,
} from "lucide-react";

// Raw Firestore activity shape — no pre-joined user/book data
interface RawActivity {
  id: string;
  userId: string;
  clubId?: string;
  type: string;
  bookId?: string;
  content?: string;
  timestamp?: { toDate?: () => Date } | Date | string | null;
  // optional denormalized fields (populated by seed or writes)
  userName?: string;
  userAvatar?: string;
  bookTitle?: string;
  clubName?: string;
}

function getTimeAgo(timestamp: RawActivity['timestamp']): string {
  if (!timestamp) return '';
  let date: Date;
  if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof (timestamp as any).toDate === 'function') {
    date = (timestamp as any).toDate();
  } else {
    return '';
  }

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getIcon(type: string) {
  switch (type) {
    case 'started-book':    return <BookOpen className="h-4 w-4 text-blue-500" />;
    case 'finished-book':   return <BookCheck className="h-4 w-4 text-green-500" />;
    case 'finished-chapter': return <BookOpen className="h-4 w-4 text-purple-500" />;
    case 'shared-quote':    return <Quote className="h-4 w-4 text-amber-500" />;
    case 'joined-club':     return <Users className="h-4 w-4 text-pink-500" />;
    default:                return <MessageCircle className="h-4 w-4" />;
  }
}

function getMessage(activity: RawActivity) {
  const name = activity.userName || activity.userId?.slice(0, 8) || 'Someone';
  const book = activity.bookTitle || activity.bookId || 'a book';
  const club = activity.clubName || activity.clubId || 'a club';

  switch (activity.type) {
    case 'started-book':
      return <><span className="font-semibold">{name}</span> started reading <span className="font-medium">{book}</span></>;
    case 'finished-book':
      return <><span className="font-semibold">{name}</span> finished <span className="font-medium">{book}</span> 🎉</>;
    case 'finished-chapter':
      return <><span className="font-semibold">{name}</span> finished a chapter in <span className="font-medium">{book}</span></>;
    case 'shared-quote':
      return <><span className="font-semibold">{name}</span> shared a quote from <span className="font-medium">{book}</span></>;
    case 'joined-club':
      return <><span className="font-semibold">{name}</span> joined <span className="font-medium">{club}</span></>;
    default:
      return <><span className="font-semibold">{name}</span> did something</>;
  }
}

function ActivityItem({ activity }: { activity: RawActivity }) {
  const name = activity.userName || activity.userId?.slice(0, 8) || '?';
  const avatar = activity.userAvatar || '';

  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getIcon(activity.type)}
          <p className="text-sm">{getMessage(activity)}</p>
        </div>
        {activity.content && (
          <div className="mt-2 p-3 bg-muted rounded-md border-l-2 border-primary">
            <p className="text-sm italic text-muted-foreground">"{activity.content}"</p>
          </div>
        )}
        {activity.clubId && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {activity.clubName || activity.clubId}
          </Badge>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {getTimeAgo(activity.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ── Full feed (used in club details activity tab) ─────────────────────────────
export function ActivityFeed({ activities }: { activities: RawActivity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No recent activity. Start reading to see updates here!
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Compact feed (used in dashboard sidebar) ──────────────────────────────────
export function ActivityFeedCompact({ activities }: { activities: RawActivity[] }) {
  if (activities.length === 0) {
    return <p className="text-center text-muted-foreground py-4 text-sm">No recent activity</p>;
  }

  return (
    <div className="space-y-3">
      {activities.slice(0, 5).map((activity) => {
        const name = activity.userName || activity.userId?.slice(0, 8) || 'Someone';
        const avatar = activity.userAvatar || '';
        return (
          <div key={activity.id} className="flex items-center gap-2 text-sm">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="text-xs">{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="flex-1 truncate text-muted-foreground">
              <span className="font-medium text-foreground">{name}</span>
              {activity.type === 'finished-book'    && ' finished a book'}
              {activity.type === 'started-book'     && ' started reading'}
              {activity.type === 'finished-chapter' && ' finished a chapter'}
              {activity.type === 'joined-club'      && ' joined a club'}
              {activity.type === 'shared-quote'     && ' shared a quote'}
            </p>
            <span className="text-xs text-muted-foreground shrink-0">
              {getTimeAgo(activity.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}