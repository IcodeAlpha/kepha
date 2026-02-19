'use client';

import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Users,
  MessageSquare,
  Calendar,
  Settings,
  UserPlus
} from "lucide-react";
import { CurrentlyReading } from "@/components/currently-reading";
import { ActivityFeed } from "@/components/activity-feed";
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import type { Discussion } from "@/lib/types";

export default function ClubDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const firestore = useFirestore();
  const { user } = useUser();

  // ── Club document ─────────────────────────────────────────────────────────
  const clubRef = useMemoFirebase(
    () => doc(firestore, 'clubs', id),
    [firestore, id]
  );
  const { data: club, isLoading } = useDoc(clubRef);

  // ── Members subcollection ─────────────────────────────────────────────────
  const membersRef = useMemoFirebase(
    () => collection(firestore, 'clubs', id, 'members'),
    [firestore, id]
  );
  const { data: clubMembers = [] } = useCollection(membersRef);

  // ── Discussions subcollection ─────────────────────────────────────────────
  const discussionsRef = useMemoFirebase(
    () => collection(firestore, 'clubs', id, 'discussions'),
    [firestore, id]
  );
  const { data: discussions = [] } = useCollection(discussionsRef);

  // ── Club activities ───────────────────────────────────────────────────────
  const activitiesQuery = useMemoFirebase(
    () => query(
      collection(firestore, 'readingActivities'),
      where('clubId', '==', id),
      orderBy('timestamp', 'desc')
    ),
    [firestore, id]
  );
  const { data: clubActivities = [] } = useCollection(activitiesQuery);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-4xl animate-bounce">📚</div>
        <p className="text-muted-foreground">Loading club...</p>
      </div>
    </div>
  );

  if (!club) return notFound();

  const clubData = club as any;

  const generalDiscussions = (discussions as any[]).filter(
    d => d.type === 'general' || d.type === 'check-in'
  );
  const bookDiscussions = (discussions as any[]).filter(
    d => d.type === 'book-specific'
  );
  const thematicDiscussions = (discussions as any[]).filter(
    d => d.type === 'thematic'
  );

  return (
    <div className="space-y-6">
      {/* Club Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-4xl">{clubData.name}</CardTitle>
                {clubData.isPublic && <Badge variant="secondary">Public</Badge>}
              </div>
              <CardDescription className="text-lg mb-2">
                {clubData.description}
              </CardDescription>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {clubData.memberIds?.length ?? 0} members
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {clubMembers.length} in club
                </Badge>
                {clubData.theme && (
                  <Badge variant="outline">{clubData.theme}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-3 italic">
                ✨ {clubData.vibe}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="discussions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reading">
            <BookOpen className="h-4 w-4 mr-2" />
            Reading
          </TabsTrigger>
          <TabsTrigger value="discussions">
            <MessageSquare className="h-4 w-4 mr-2" />
            Discussions
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Calendar className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Reading Tab */}
        <TabsContent value="reading" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>What are you reading?</CardTitle>
                <Button>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Add a Book
                </Button>
              </div>
              <CardDescription>
                Share what you're reading with the club! Everyone reads their own book at their own pace.
              </CardDescription>
            </CardHeader>
          </Card>

          {bookDiscussions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Book Discussions</CardTitle>
                <CardDescription>
                  Join discussions about books members are reading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bookDiscussions.map((disc: any) => (
                  <DiscussionCard key={disc.id} discussion={disc} />
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Discussions Tab */}
        <TabsContent value="discussions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>General Chat</CardTitle>
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  New Discussion
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {generalDiscussions.map((disc: any) => (
                <DiscussionCard key={disc.id} discussion={disc} />
              ))}
              {generalDiscussions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No discussions yet. Start the conversation!
                </p>
              )}
            </CardContent>
          </Card>

          {thematicDiscussions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cross-Book Discussions</CardTitle>
                <CardDescription>Themes and topics across different books</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {thematicDiscussions.map((disc: any) => (
                  <DiscussionCard key={disc.id} discussion={disc} />
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Club Members ({clubMembers.length})</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {(clubMembers as any[]).map((member) => (
                <div key={member.userId} className="flex gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatarUrl} alt={member.userId} />
                    <AvatarFallback>{member.userId?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{member.name || member.userId}</p>
                    <Badge variant="outline" className="text-xs mt-1">{member.role}</Badge>
                    {member.currentlyReading && (
                      <div className="mt-1">
                        <p className="text-xs text-muted-foreground">Currently reading:</p>
                        <p className="text-sm font-medium truncate">{member.currentlyReading.bookId}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <div className={`h-2 w-2 rounded-full ${member.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-xs text-muted-foreground">
                        {member.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <ActivityFeed activities={clubActivities as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DiscussionCard({ discussion }: { discussion: any }) {
  return (
    <div className="flex gap-3 p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold truncate">{discussion.title}</h3>
          {discussion.isPinned && (
            <Badge variant="secondary" className="text-xs">Pinned</Badge>
          )}
        </div>
        {discussion.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {discussion.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-muted-foreground">
            {discussion.createdAt?.toDate
              ? new Date(discussion.createdAt.toDate()).toLocaleDateString()
              : ''}
          </span>
          {discussion.tags?.length > 0 && (
            <div className="flex gap-1">
              {discussion.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      <MessageSquare className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}