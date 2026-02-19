'use client';

import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ActivityFeedCompact } from "@/components/activity-feed";
import { BookOpen, Users, TrendingUp, Calendar } from "lucide-react";
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // ── My clubs ─────────────────────────────────────────────────────────────
  const myClubsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'clubs'),
      where('memberIds', 'array-contains', user.uid)
    );
  }, [firestore, user?.uid]);
  const { data: myClubsRaw, isLoading: clubsLoading } = useCollection(myClubsQuery);
  const myClubs: any[] = myClubsRaw ?? [];

  // ── Currently reading ─────────────────────────────────────────────────────
  const readingQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'userBooks'),
      where('userId', '==', user.uid),
      where('status', '==', 'reading')
    );
  }, [firestore, user?.uid]);
  const { data: currentlyReadingRaw } = useCollection(readingQuery);
  const currentlyReading: any[] = currentlyReadingRaw ?? [];

  // ── Finished books ────────────────────────────────────────────────────────
  const finishedQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'userBooks'),
      where('userId', '==', user.uid),
      where('status', '==', 'finished')
    );
  }, [firestore, user?.uid]);
  const { data: finishedBooksRaw } = useCollection(finishedQuery);
  const finishedBooks: any[] = finishedBooksRaw ?? [];

  // ── Activity feed — wait for clubs to finish loading ──────────────────────
  const clubIds = myClubs.map((c) => c.id).slice(0, 10);
  const activityQuery = useMemoFirebase(() => {
    if (clubsLoading || clubIds.length === 0) return null;
    return query(
      collection(firestore, 'readingActivities'),
      where('clubId', 'in', clubIds),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
  }, [firestore, clubsLoading, JSON.stringify(clubIds)]);
  const { data: activitiesRaw } = useCollection(activityQuery);
  const activities: any[] = activitiesRaw ?? [];

  // ── User profile ──────────────────────────────────────────────────────────
  const userProfileQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users'),
      where('uid', '==', user.uid),
      limit(1)
    );
  }, [firestore, user?.uid]);
  const { data: userProfileDocsRaw } = useCollection(userProfileQuery);
  const userProfileDocs: any[] = userProfileDocsRaw ?? [];
  const userProfile = userProfileDocs[0];

  // ── Block render until auth resolves ─────────────────────────────────────
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

  const displayName = user.displayName || userProfile?.name || 'Reader';
  const avatarUrl = user.photoURL || userProfile?.avatarUrl;
  const bio = userProfile?.bio || 'Happy reading! Share your journey with your book clubs.';
  const favoriteGenres: string[] = userProfile?.favoriteGenres ?? [];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="text-3xl">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">
            Welcome back, {displayName}! 📚
          </CardTitle>
          <CardDescription className="max-w-md">{bio}</CardDescription>
          {favoriteGenres.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap justify-center">
              {favoriteGenres.map((genre: string) => (
                <Badge key={genre} variant="secondary">{genre}</Badge>
              ))}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Stats Overview */}
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
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Add Book
              </Button>
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
                      width={60}
                      height={90}
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
                <Button variant="outline" size="sm">Start Reading</Button>
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
            {activities.length > 0 ? (
              <ActivityFeedCompact activities={activities as any} />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No recent activity
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
                      <CardDescription className="line-clamp-2">
                        {club.description}
                      </CardDescription>
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
              <p className="text-muted-foreground mb-3">
                You haven't joined any clubs yet.
              </p>
              <Button asChild>
                <Link href="/clubs">Explore Clubs</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reading History */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Finished</CardTitle>
        </CardHeader>
        <CardContent>
          {finishedBooks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {finishedBooks.slice(0, 6).map((ub) => (
                <div key={ub.id} className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-md">
                    <Image
                      src={ub.coverUrl || `https://picsum.photos/seed/${ub.bookId}/150/225`}
                      alt={ub.title || ub.bookId}
                      width={150}
                      height={225}
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
            <p className="text-center text-muted-foreground py-4">
              No finished books yet. Keep reading!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}