'use client';

import Link from "next/link";
import { useState } from "react";
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Users, BookOpen } from "lucide-react";
import { collection, query, where, doc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import {
  useFirestore, useUser, useCollection, useMemoFirebase,
  updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking,
} from '@/firebase';

// ── Create Club Dialog ────────────────────────────────────────────────────────
function CreateClubDialog({ onCreate }: {
  onCreate: (data: { name: string; description: string; vibe: string; theme: string; isPublic: boolean }) => void
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vibe, setVibe] = useState('');
  const [theme, setTheme] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name, description, vibe, theme, isPublic });
    setOpen(false);
    setName(''); setDescription(''); setVibe(''); setTheme(''); setIsPublic(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus className="h-4 w-4 mr-2" />Create a Club
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Book Club</DialogTitle>
          <DialogDescription>Start a reading community. Everyone reads their own book, together.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Club Name</Label>
            <Input placeholder="e.g. Cozy Readers Circle" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="What's your club about?" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Vibe</Label>
            <Input placeholder="e.g. Cozy and supportive" value={vibe} onChange={e => setVibe(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Theme (optional)</Label>
            <Input placeholder="e.g. All genres welcome" value={theme} onChange={e => setTheme(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Public Club</Label>
              <p className="text-xs text-muted-foreground">Anyone can find and join</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <Button className="w-full" onClick={handleSubmit}>Create Club</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Club Card ─────────────────────────────────────────────────────────────────
function ClubCard({ club, isMember, onJoin }: { club: any; isMember: boolean; onJoin: (clubId: string) => void }) {
  const firestore = useFirestore();
  const membersRef = useMemoFirebase(
    () => collection(firestore, 'clubs', club.id, 'members'),
    [firestore, club.id]
  );
  const { data: membersRaw } = useCollection(membersRef);
  const members: any[] = membersRaw ?? [];

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl">{club.name}</CardTitle>
            <CardDescription className="mt-1">{club.description}</CardDescription>
          </div>
          {club.isPublic && <Badge variant="secondary">Public</Badge>}
        </div>
        <div className="flex gap-2 mt-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />{club.memberIds?.length ?? 0}
          </Badge>
        </div>
        {club.theme && <p className="text-sm text-muted-foreground mt-2">📚 {club.theme}</p>}
      </CardHeader>

      <CardContent className="flex-grow">
        <Separator className="my-4" />
        <div>
          <p className="text-sm font-medium mb-2">Members:</p>
          <div className="flex items-center -space-x-2">
            {members.slice(0, 5).map((member) => (
              <Avatar key={member.userId} className="border-2 border-card">
                <AvatarImage src={member.avatarUrl} alt={member.userId} />
                <AvatarFallback>{member.userId?.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {members.length > 5 && (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-card">
                +{members.length - 5}
              </div>
            )}
            {members.length === 0 && (
              <p className="text-xs text-muted-foreground">No members yet</p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground italic">{club.vibe}</p>
        {isMember ? (
          <Button asChild><Link href={`/clubs/${club.id}`}>View Club</Link></Button>
        ) : (
          <Button variant="secondary" onClick={() => onJoin(club.id)}>Join Club</Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ClubsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // My clubs
  const myClubsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'clubs'), where('memberIds', 'array-contains', user.uid));
  }, [firestore, user?.uid]);
  const { data: myClubsRaw } = useCollection(myClubsQuery);
  const myClubs: any[] = myClubsRaw ?? [];

  // All public clubs — guarded by user to prevent unauthenticated list
  const publicClubsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'clubs'), where('isPublic', '==', true));
  }, [firestore, user?.uid]);
  const { data: allPublicClubsRaw } = useCollection(publicClubsQuery);
  const allPublicClubs: any[] = allPublicClubsRaw ?? [];

  const myClubIds = new Set(myClubs.map((c) => c.id));
  const publicClubs = allPublicClubs.filter((c) => !myClubIds.has(c.id));

  // ── Create club ───────────────────────────────────────────────────────────
  const handleCreateClub = async (data: {
    name: string; description: string; vibe: string; theme: string; isPublic: boolean
  }) => {
    if (!user) return;
    const clubId = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    await setDocumentNonBlocking(
      doc(firestore, 'clubs', clubId),
      {
        ...data,
        memberIds: [user.uid],
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      },
      { merge: false }
    );

    setDocumentNonBlocking(
      doc(firestore, 'clubs', clubId, 'members', user.uid),
      {
        userId: user.uid,
        role: 'owner',
        isOnline: false,
        joinedAt: serverTimestamp(),
      },
      { merge: false }
    );

    addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
      userId: user.uid,
      clubId,
      type: 'joined-club',
      timestamp: serverTimestamp(),
    });
  };

  // ── Join club ─────────────────────────────────────────────────────────────
  const handleJoinClub = (clubId: string) => {
    if (!user) return;

    updateDocumentNonBlocking(doc(firestore, 'clubs', clubId), {
      memberIds: arrayUnion(user.uid),
    });

    setDocumentNonBlocking(
      doc(firestore, 'clubs', clubId, 'members', user.uid),
      { userId: user.uid, role: 'member', isOnline: false, joinedAt: serverTimestamp() },
      { merge: false }
    );

    addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
      userId: user.uid, clubId, type: 'joined-club', timestamp: serverTimestamp(),
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Book Clubs</h1>
          <p className="text-muted-foreground mt-1">
            Find your reading community. Everyone reads their own book, together.
          </p>
        </div>
        <CreateClubDialog onCreate={handleCreateClub} />
      </div>

      {/* My Clubs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">My Clubs</h2>
        {myClubs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myClubs.map((club) => (
              <ClubCard key={club.id} club={club} isMember={true} onJoin={handleJoinClub} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">You haven't joined any clubs yet.</p>
              <p className="text-sm text-muted-foreground mb-4">Join a club to share your reading journey with others!</p>
              <Button asChild><Link href="#explore">Explore Clubs Below</Link></Button>
            </CardContent>
          </Card>
        )}
      </section>

      <Separator />

      {/* Explore */}
      <section className="space-y-4" id="explore">
        <div>
          <h2 className="text-2xl font-bold">Explore Public Clubs</h2>
          <p className="text-muted-foreground mt-1">Join a community that matches your reading vibe</p>
        </div>
        {publicClubs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publicClubs.map((club) => (
              <ClubCard key={club.id} club={club} isMember={false} onJoin={handleJoinClub} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground">No public clubs available right now.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}