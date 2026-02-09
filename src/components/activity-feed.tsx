'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  BookCheck, 
  Quote, 
  Sparkles, 
  Users,
  MessageCircle
} from "lucide-react";
import type { ReadingActivity, User, Book } from "@/lib/types";

interface ActivityFeedProps {
  activities: (ReadingActivity & {
    user: User & { id: string };
    book?: Book;
    club?: { id: string; name: string };
  })[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
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

function ActivityItem({ activity }: { 
  activity: ReadingActivity & {
    user: User & { id: string };
    book?: Book;
    club?: { id: string; name: string };
  } 
}) {
  const { type, user, book, club, content, timestamp } = activity;

  const getIcon = () => {
    switch (type) {
      case 'started-book':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'finished-book':
        return <BookCheck className="h-4 w-4 text-green-500" />;
      case 'finished-chapter':
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      case 'shared-quote':
        return <Quote className="h-4 w-4 text-amber-500" />;
      case 'joined-club':
        return <Users className="h-4 w-4 text-pink-500" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'started-book':
        return (
          <>
            <span className="font-semibold">{user.name}</span> started reading{' '}
            <span className="font-medium">{book?.title}</span>
          </>
        );
      case 'finished-book':
        return (
          <>
            <span className="font-semibold">{user.name}</span> finished{' '}
            <span className="font-medium">{book?.title}</span> 🎉
          </>
        );
      case 'finished-chapter':
        return (
          <>
            <span className="font-semibold">{user.name}</span> finished a chapter in{' '}
            <span className="font-medium">{book?.title}</span>
          </>
        );
      case 'shared-quote':
        return (
          <>
            <span className="font-semibold">{user.name}</span> shared a quote from{' '}
            <span className="font-medium">{book?.title}</span>
          </>
        );
      case 'joined-club':
        return (
          <>
            <span className="font-semibold">{user.name}</span> joined{' '}
            <span className="font-medium">{club?.name}</span>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatarUrl} alt={user.name} />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getIcon()}
          <p className="text-sm">{getMessage()}</p>
        </div>
        
        {content && (
          <div className="mt-2 p-3 bg-muted rounded-md border-l-2 border-primary">
            <p className="text-sm italic text-muted-foreground">"{content}"</p>
          </div>
        )}
        
        {club && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {club.name}
          </Badge>
        )}
        
        <p className="text-xs text-muted-foreground mt-1">
          {getTimeAgo(timestamp)}
        </p>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return then.toLocaleDateString();
}

// Compact version for sidebars
export function ActivityFeedCompact({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-2">
      {activities.slice(0, 5).map((activity) => (
        <div key={activity.id} className="flex items-center gap-2 text-sm">
          <Avatar className="h-6 w-6">
            <AvatarImage src={activity.user.avatarUrl} alt={activity.user.name} />
            <AvatarFallback className="text-xs">{activity.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <p className="flex-1 truncate text-muted-foreground">
            <span className="font-medium text-foreground">{activity.user.name}</span>
            {activity.type === 'finished-book' && ' finished a book'}
            {activity.type === 'started-book' && ' started reading'}
            {activity.type === 'finished-chapter' && ' finished a chapter'}
          </p>
          <span className="text-xs text-muted-foreground">
            {getTimeAgo(activity.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
// 