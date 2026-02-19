'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import {
  useFirestore, useUser, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking,
} from '@/firebase';

// ── Edit Profile Dialog ───────────────────────────────────────────────────────
function EditProfileDialog({
  profile,
  onSave,
}: {
  profile: any;
  onSave: (data: { name: string; bio: string; favoriteGenres: string[]; readingStyle: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [genresInput, setGenresInput] = useState((profile?.favoriteGenres ?? []).join(', '));
  const [readingStyle, setReadingStyle] = useState(profile?.readingStyle || '');

  const handleSave = () => {
    const favoriteGenres = genresInput
      .split(',')
      .map((g: string) => g.trim())
      .filter(Boolean);
    onSave({ name, bio, favoriteGenres, readingStyle });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your reading profile.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Favorite Genres</Label>
            <Input
              value={genresInput}
              onChange={e => setGenresInput(e.target.value)}
              placeholder="e.g. Fantasy, Sci-Fi, Romance"
            />
            <p className="text-xs text-muted-foreground">Separate genres with commas</p>
          </div>
          <div className="space-y-2">
            <Label>Reading Style</Label>
            <Input value={readingStyle} onChange={e => setReadingStyle(e.target.value)} placeholder="e.g. Night owl reader" />
          </div>
          <Button className="w-full" onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // ── Firestore user profile ────────────────────────────────────────────────
  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user?.uid]
  );
  const { data: userProfileRaw } = useDoc(userDocRef);
  const userProfile = userProfileRaw as any;

  // ── My clubs ──────────────────────────────────────────────────────────────
  const myClubsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'clubs'), where('memberIds', 'array-contains', user.uid));
  }, [firestore, user?.uid]);
  const { data: myClubsRaw } = useCollection(myClubsQuery);
  const myClubs: any[] = myClubsRaw ?? [];

  // ── Reading history ───────────────────────────────────────────────────────
  const readingHistoryQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'userBooks'),
      where('userId', '==', user.uid),
      where('status', '==', 'finished')
    );
  }, [firestore, user?.uid]);
  const { data: readingHistoryRaw } = useCollection(readingHistoryQuery);
  const readingHistory: any[] = readingHistoryRaw ?? [];

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSaveProfile = (data: {
    name: string; bio: string; favoriteGenres: string[]; readingStyle: string
  }) => {
    if (!user) return;
    updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">📚</div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const displayName = userProfile?.name || user.displayName || 'Reader';
  const avatarUrl = user.photoURL || userProfile?.avatarUrl;
  const bio = userProfile?.bio;
  const favoriteGenres: string[] = userProfile?.favoriteGenres ?? [];
  const readingStyle: string | undefined = userProfile?.readingStyle;
  const memberSince = userProfile?.createdAt?.toDate
    ? new Date(userProfile.createdAt.toDate()).getFullYear()
    : new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="text-3xl">{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">{displayName}</CardTitle>
          {bio && <CardDescription className="max-w-md">{bio}</CardDescription>}
          <CardDescription>Member since {memberSince}</CardDescription>
          {favoriteGenres.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap justify-center">
              {favoriteGenres.map((genre) => (
                <Badge key={genre} variant="secondary">{genre}</Badge>
              ))}
            </div>
          )}
          {readingStyle && (
            <p className="text-sm text-muted-foreground mt-2 italic">Reading style: {readingStyle}</p>
          )}
          <div className="mt-4">
            <EditProfileDialog profile={userProfile} onSave={handleSaveProfile} />
          </div>
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
                {myClubs.map((club) => (
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
                {readingHistory.slice(0, 6).map((ub) => (
                  <div key={ub.id} className="flex items-center gap-3">
                    <Image
                      src={ub.coverUrl || `https://picsum.photos/seed/${ub.bookId}/40/60`}
                      alt={ub.title || ub.bookId}
                      width={40} height={60}
                      className="rounded-sm shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{ub.title || ub.bookId}</p>
                      <p className="text-sm text-muted-foreground truncate">{ub.author || ''}</p>
                      {ub.rating && (
                        <div className="flex gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < ub.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{ub.format}</Badge>
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
        <p className="font-semibold truncate group-hover:text-primary transition-colors">{club.name}</p>
        <p className="text-sm text-muted-foreground truncate">{club.description}</p>
      </div>
      <Badge variant="outline" className="text-xs shrink-0">
        {club.memberIds?.length ?? 0} members
      </Badge>
    </Link>
  );
}