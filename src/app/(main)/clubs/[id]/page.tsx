'use client';

import { useParams, notFound } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BookOpen, Users, MessageSquare, Calendar, Settings, UserPlus, Plus } from "lucide-react";
import { ActivityFeed } from "@/components/activity-feed";
import { doc, collection, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import {
  useFirestore, useUser, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking,
} from '@/firebase';

// ── Add Book Dialog ───────────────────────────────────────────────────────────
function AddBookDialog({ onAdd }: {
  onAdd: (bookId: string, title: string, author: string, format: string) => void
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [format, setFormat] = useState('physical');

  const handleSubmit = () => {
    if (!title.trim()) return;
    const bookId = title.toLowerCase().replace(/\s+/g, '-');
    onAdd(bookId, title, author, format);
    setOpen(false);
    setTitle(''); setAuthor(''); setFormat('physical');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />Add a Book
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What are you reading?</DialogTitle>
          <DialogDescription>Share your current book with the club.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Book Title</Label>
            <Input
              placeholder="e.g. Dune"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Author</Label>
            <Input
              placeholder="e.g. Frank Herbert"
              value={author}
              onChange={e => setAuthor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="physical">Physical</SelectItem>
                <SelectItem value="ebook">E-Book</SelectItem>
                <SelectItem value="audiobook">Audiobook</SelectItem>
                <SelectItem value="in-app">In-App</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={handleSubmit}>Start Reading</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Discussion Card ───────────────────────────────────────────────────────────
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ClubDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();

  // ── Club document ─────────────────────────────────────────────────────────
  const clubRef = useMemoFirebase(
    () => (id ? doc(firestore, 'clubs', id) : null),
    [firestore, id]
  );
  const { data: club, isLoading } = useDoc(clubRef);

  // ── Members subcollection ─────────────────────────────────────────────────
  const membersRef = useMemoFirebase(
    () => (id ? collection(firestore, 'clubs', id, 'members') : null),
    [firestore, id]
  );
  const { data: clubMembersRaw } = useCollection(membersRef);
  const clubMembers: any[] = clubMembersRaw ?? [];

  // ── Discussions subcollection ─────────────────────────────────────────────
  const discussionsRef = useMemoFirebase(
    () => (id ? collection(firestore, 'clubs', id, 'discussions') : null),
    [firestore, id]
  );
  const { data: discussionsRaw } = useCollection(discussionsRef);
  const discussions: any[] = discussionsRaw ?? [];

  // ── Activity feed — GUARDED: only fires when id is available ──────────────
  const activitiesQuery = useMemoFirebase(() => {
    if (!id) return null;
    return query(
      collection(firestore, 'readingActivities'),
      where('clubId', '==', id),
      orderBy('timestamp', 'desc')
    );
  }, [firestore, id]);
  const { data: clubActivitiesRaw } = useCollection(activitiesQuery);
  const clubActivities: any[] = clubActivitiesRaw ?? [];

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">📚</div>
          <p className="text-muted-foreground">Loading club...</p>
        </div>
      </div>
    );
  }

  if (!club) return notFound();

  const clubData = club as any;

  const generalDiscussions = discussions.filter(
    d => d.type === 'general' || d.type === 'check-in'
  );
  const bookDiscussions = discussions.filter(d => d.type === 'book-specific');
  const thematicDiscussions = discussions.filter(d => d.type === 'thematic');

  // ── Add book handler ──────────────────────────────────────────────────────
  const handleAddBook = (bookId: string, title: string, author: string, format: string) => {
    if (!user) return;

    // Add to user's personal shelf
    addDocumentNonBlocking(collection(firestore, 'userBooks'), {
      userId: user.uid,
      bookId,
      title,
      author,
      format,
      status: 'reading',
      progressPercent: 0,
      startedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Post activity to the club feed
    addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
      userId: user.uid,
      clubId: id,
      type: 'started-book',
      bookId,
      timestamp: serverTimestamp(),
    });
  };

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
                <UserPlus className="h-4 w-4 mr-2" />Invite Members
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="discussions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reading">
            <BookOpen className="h-4 w-4 mr-2" />Reading
          </TabsTrigger>
          <TabsTrigger value="discussions">
            <MessageSquare className="h-4 w-4 mr-2" />Discussions
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />Members
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Calendar className="h-4 w-4 mr-2" />Activity
          </TabsTrigger>
        </TabsList>

        {/* Reading Tab */}
        <TabsContent value="reading" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>What are you reading?</CardTitle>
                <AddBookDialog onAdd={handleAddBook} />
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
                {bookDiscussions.map(disc => (
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
                  <MessageSquare className="h-4 w-4 mr-2" />New Discussion
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {generalDiscussions.map(disc => (
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
                {thematicDiscussions.map(disc => (
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
              {clubMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 col-span-2">
                  No members yet.
                </p>
              ) : (
                clubMembers.map(member => (
                  <div
                    key={member.userId}
                    className="flex gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatarUrl} alt={member.userId} />
                      <AvatarFallback>{member.userId?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{member.name || member.userId}</p>
                      <Badge variant="outline" className="text-xs mt-1">{member.role}</Badge>
                      {member.currentlyReading && (
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground">Currently reading:</p>
                          <p className="text-sm font-medium truncate">
                            {member.currentlyReading.bookId}
                          </p>
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
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          {clubActivities.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No activity yet in this club.</p>
              </CardContent>
            </Card>
          ) : (
            <ActivityFeed activities={clubActivities as any} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}