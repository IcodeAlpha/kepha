'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ActivityFeedCompact } from "@/components/activity-feed";
import { BookOpen, Users, TrendingUp, Calendar, LogOut, Plus } from "lucide-react";
import { collection, query, where, orderBy, limit, serverTimestamp, doc } from 'firebase/firestore';
import {
  useFirestore, useUser, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking,
} from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// ── Add Book Dialog ────────────────────────────────────────────────────────────
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
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />Add Book
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Book</DialogTitle>
          <DialogDescription>What are you reading right now?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Book Title</Label>
            <Input placeholder="e.g. Dune" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Author</Label>
            <Input placeholder="e.g. Frank Herbert" value={author} onChange={e => setAuthor(e.target.value)} />
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

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const uid = user?.uid ?? null;

  // ── User profile ───────────────────────────────────────────────────────────
  const userRef = useMemoFirebase(
    () => (uid ? doc(firestore, 'users', uid) : null),
    [firestore, uid]
  );
  const { data: userProfile } = useDoc(userRef);

  // ── My clubs ───────────────────────────────────────────────────────────────
  const myClubsQuery = useMemoFirebase(() => {
    if (!uid) return null;
    return query(
      collection(firestore, 'clubs'),
      where('memberIds', 'array-contains', uid)
    );
  }, [firestore, uid]);
  const { data: myClubsRaw, isLoading: clubsLoading } = useCollection(myClubsQuery);
  const myClubs: any[] = myClubsRaw ?? [];

  // ── Currently reading ──────────────────────────────────────────────────────
  const readingQuery = useMemoFirebase(() => {
    if (!uid) return null;
    return query(
      collection(firestore, 'userBooks'),
      where('userId', '==', uid),
      where('status', '==', 'reading')
    );
  }, [firestore, uid]);
  const { data: currentlyReadingRaw } = useCollection(readingQuery);
  const currentlyReading: any[] = currentlyReadingRaw ?? [];

  // ── Finished books ─────────────────────────────────────────────────────────
  const finishedQuery = useMemoFirebase(() => {
    if (!uid) return null;
    return query(
      collection(firestore, 'userBooks'),
      where('userId', '==', uid),
      where('status', '==', 'finished')
    );
  }, [firestore, uid]);
  const { data: finishedBooksRaw } = useCollection(finishedQuery);
  const finishedBooks: any[] = finishedBooksRaw ?? [];

  // ── Activity feed ──────────────────────────────────────────────────────────
  // clubIds is computed INSIDE the factory so the empty-array guard
  // always runs against the current value of myClubs at memo time.
  const activityQuery = useMemoFirebase(() => {
    if (!uid || clubsLoading) return null;
    const clubIds = myClubs.map((c) => c.id).slice(0, 10); // inside factory
    if (clubIds.length === 0) return null;                  // guard fires correctly
    return query(
      collection(firestore, 'readingActivities'),
      where('clubId', 'in', clubIds),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
  }, [firestore, uid, clubsLoading, myClubs]); // depend on myClubs directly
  const { data: activitiesRaw } = useCollection(activityQuery);
  const activities: any[] = activitiesRaw ?? [];

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut(getAuth());
    router.push('/login');
  };

  const handleAddBook = (bookId: string, title: string, author: string, format: string) => {
    if (!uid) return;
    addDocumentNonBlocking(collection(firestore, 'userBooks'), {
      userId: uid,
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
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">📚</div>
          <p className="text-muted-foreground">Loading your shelf...</p>
        </div>
      </div>
    );
  }

  const profile = userProfile as any;
  const displayName = user.displayName || profile?.name || 'Reader';
  const avatarUrl = user.photoURL || profile?.avatarUrl;
  const bio = profile?.bio || 'Happy reading! Share your journey with your book clubs.';
  const favoriteGenres: string[] = profile?.favoriteGenres ?? [];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="text-3xl">{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">Welcome back, {displayName}! 📚</CardTitle>
          <CardDescription className="max-w-md">{bio}</CardDescription>
          {favoriteGenres.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap justify-center">
              {favoriteGenres.map((genre: string) => (
                <Badge key={genre} variant="secondary">{genre}</Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile">Edit Profile</Link>
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={handleSignOut}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />Sign Out
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Reading</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentlyReading.length}</div>
            <p className="text-xs text-muted-foreground">
              {currentlyReading.length === 1 ? 'book' : 'books'} in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Finished</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{finishedBooks.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Clubs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myClubs.length}</div>
            <p className="text-xs text-muted-foreground">Reading communities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reading Streak</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">days in a row</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Currently Reading */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>My Current Books</CardTitle>
              <AddBookDialog onAdd={handleAddBook} />
            </div>
          </CardHeader>
          <CardContent>
            {currentlyReading.length > 0 ? (
              <div className="space-y-4">
                {currentlyReading.map((ub) => (
                  <div key={ub.id} className="flex gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <Image
                      src={ub.coverUrl || `https://picsum.photos/seed/${ub.bookId}/60/90`}
                      alt={ub.title || ub.bookId}
                      width={60} height={90}
                      className="rounded-md shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{ub.title || ub.bookId}</p>
                      <p className="text-sm text-muted-foreground truncate">{ub.author || ''}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">{ub.format}</Badge>
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{ub.progressPercent ?? 0}%</span>
                          {ub.currentPage && ub.pageCount && (
                            <span className="text-muted-foreground">
                              pg {ub.currentPage} / {ub.pageCount}
                            </span>
                          )}
                        </div>
                        <Progress value={ub.progressPercent ?? 0} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="mb-3">You're not reading anything yet!</p>
                <AddBookDialog onAdd={handleAddBook} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>What's happening in your clubs</CardDescription>
          </CardHeader>
          <CardContent>
            {clubsLoading ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Loading activity...</p>
            ) : activities.length > 0 ? (
              <ActivityFeedCompact activities={activities as any} />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {myClubs.length === 0
                  ? 'Join a club to see activity here!'
                  : 'No recent activity in your clubs'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Clubs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>My Book Clubs</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/clubs">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {myClubs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myClubs.map((club) => (
                <Link key={club.id} href={`/clubs/${club.id}`} className="group">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {club.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">{club.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{club.memberIds?.length ?? 0} members</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-3">You haven't joined any clubs yet.</p>
              <Button asChild><Link href="/clubs">Explore Clubs</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reading History */}
      <Card>
        <CardHeader><CardTitle>Recently Finished</CardTitle></CardHeader>
        <CardContent>
          {finishedBooks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {finishedBooks.slice(0, 6).map((ub) => (
                <div key={ub.id} className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-md">
                    <Image
                      src={ub.coverUrl || `https://picsum.photos/seed/${ub.bookId}/150/225`}
                      alt={ub.title || ub.bookId}
                      width={150} height={225}
                      className="w-full h-auto object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <p className="text-sm font-medium mt-2 truncate">{ub.title || ub.bookId}</p>
                  {ub.rating && (
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < ub.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No finished books yet. Keep reading!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}