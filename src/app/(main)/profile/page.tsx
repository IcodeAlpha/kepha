'use client';

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { collection, query, where, doc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // ── Firestore user profile ──────────────────────────────────────────────
  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user?.uid]
  );
  const { data: userProfile } = useDoc(userDocRef);
  const profile = userProfile as any;

  // ── My clubs ────────────────────────────────────────────────────────────
  const myClubsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'clubs'),
      where('memberIds', 'array-contains', user.uid)
    );
  }, [firestore, user?.uid]);
  const { data: myClubs = [] } = useCollection(myClubsQuery);

  // ── Reading history (finished books) ────────────────────────────────────
  const readingHistoryQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'userBooks'),
      where('userId', '==', user.uid),
      where('status', '==', 'finished')
    );
  }, [firestore, user?.uid]);
  const { data: readingHistory = [] } = useCollection(readingHistoryQuery);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">📚</div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const displayName = user?.displayName || profile?.name || 'Reader';
  const avatarUrl = user?.photoURL || profile?.avatarUrl;
  const bio = profile?.bio;
  const favoriteGenres: string[] = profile?.favoriteGenres || [];
  const readingStyle: string | undefined = profile?.readingStyle;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="text-3xl">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">{displayName}</CardTitle>
          {bio && <CardDescription className="max-w-md">{bio}</CardDescription>}
          <CardDescription>Member since {profile?.createdAt?.toDate
            ? new Date(profile.createdAt.toDate()).getFullYear()
            : new Date().getFullYear()}
          </CardDescription>
          {favoriteGenres.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap justify-center">
              {favoriteGenres.map((genre) => (
                <Badge key={genre} variant="secondary">{genre}</Badge>
              ))}
            </div>
          )}
          {readingStyle && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              Reading style: {readingStyle}
            </p>
          )}
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* My Clubs */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>My Clubs</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/clubs">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {myClubs.length > 0 ? (
              <div className="space-y-4">
                {(myClubs as any[]).map((club) => (
                  <ClubListItem key={club.id} club={club} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                You haven't joined any clubs yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Reading History */}
        <Card>
          <CardHeader>
            <CardTitle>Reading History</CardTitle>
            <CardDescription>{readingHistory.length} books finished</CardDescription>
          </CardHeader>
          <CardContent>
            {readingHistory.length > 0 ? (
              <div className="space-y-3">
                {(readingHistory as any[]).slice(0, 6).map((ub) => (
                  <div key={ub.id} className="flex items-center gap-3">
                    <Image
                      src={ub.coverUrl || `https://picsum.photos/seed/${ub.bookId}/40/60`}
                      alt={ub.title || ub.bookId}
                      width={40}
                      height={60}
                      className="rounded-sm shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{ub.title || ub.bookId}</p>
                      <p className="text-sm text-muted-foreground truncate">{ub.author || ''}</p>
                      {ub.rating && (
                        <div className="flex gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < ub.rating ? 'text-yellow-400' : 'text-gray-300'}>
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {ub.format}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No finished books yet. Keep reading!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClubListItem({ club }: { club: any }) {
  return (
    <Link href={`/clubs/${club.id}`} className="flex items-center gap-4 group hover:opacity-80 transition-opacity">
      <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-lg shrink-0">
        {club.name?.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate group-hover:text-primary transition-colors">
          {club.name}
        </p>
        <p className="text-sm text-muted-foreground truncate">{club.description}</p>
      </div>
      <Badge variant="outline" className="text-xs shrink-0">
        {club.memberIds?.length ?? 0} members
      </Badge>
    </Link>
  );
}