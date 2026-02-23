'use client';

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  BookOpen, Users, Calendar, Settings, UserPlus,
  Trash2, UserMinus, Copy, Check, Loader2, X,
} from "lucide-react";
import { ActivityFeed } from "@/components/activity-feed";
import {
  doc, collection, query, where, orderBy, serverTimestamp, deleteDoc, arrayRemove,
} from 'firebase/firestore';
import {
  useFirestore, useUser, useDoc, useCollection, useMemoFirebase,
  addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking,
} from '@/firebase';
import { useRouter } from "next/navigation";

// ── Share Book Dialog ─────────────────────────────────────────────────────────
function ShareBookDialog({ clubId, onShare }: { clubId: string; onShare: (book: any) => void }) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();

  const userBooksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'userBooks'), where('userId', '==', user.uid));
  }, [firestore, user?.uid]);
  const { data: userBooksRaw, isLoading } = useCollection(userBooksQuery);
  const userBooks: any[] = (userBooksRaw ?? []).filter(
    b => b.status === 'reading' || b.status === 'want-to-read'
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><BookOpen className="h-4 w-4 mr-2" />Share a Book</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share a book with the club</DialogTitle>
          <DialogDescription>Pick a book from your shelf.</DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : userBooks.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-sm text-muted-foreground">No books on your shelf yet.</p>
              <p className="text-xs text-muted-foreground">Add books from the dashboard first.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {userBooks.map(book => (
                <button
                  key={book.id}
                  onClick={() => { onShare(book); setOpen(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="h-12 w-9 rounded bg-muted flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{book.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                    <Badge variant="outline" className="text-xs mt-1">{book.status}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Update Progress Dialog ────────────────────────────────────────────────────
function UpdateProgressDialog({ sharedBook, onUpdate }: {
  sharedBook: any;
  onUpdate: (progress: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(sharedBook.progressPercent ?? 0);

  const handleSave = () => {
    onUpdate(Number(progress));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Update Progress</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Progress</DialogTitle>
          <DialogDescription>{sharedBook.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Progress: {progress}%</Label>
            <input
              type="range" min={0} max={100} value={progress}
              onChange={e => setProgress(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <Button className="w-full" onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Invite Members Dialog ─────────────────────────────────────────────────────
function InviteMembersDialog({ clubId }: { clubId: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/clubs/${clubId}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><UserPlus className="h-4 w-4 mr-2" />Invite Members</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>Share this link to invite people to the club.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <Input value={inviteLink} readOnly className="text-sm" />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Anyone with this link can join if the club is public.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Settings Dialog ───────────────────────────────────────────────────────────
function SettingsDialog({ club, clubId }: { club: any; clubId: string }) {
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [name, setName] = useState(club.name ?? '');
  const [description, setDescription] = useState(club.description ?? '');
  const [vibe, setVibe] = useState(club.vibe ?? '');
  const [theme, setTheme] = useState(club.theme ?? '');
  const [isPublic, setIsPublic] = useState(club.isPublic ?? true);
  const firestore = useFirestore();
  const router = useRouter();

  const handleSave = () => {
    updateDocumentNonBlocking(doc(firestore, 'clubs', clubId), { name, description, vibe, theme, isPublic });
    setOpen(false);
  };

  const handleDelete = async () => {
    await deleteDoc(doc(firestore, 'clubs', clubId));
    router.push('/clubs');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Club Settings</DialogTitle>
            <DialogDescription>Edit your club details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Club Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Vibe</Label>
              <Input value={vibe} onChange={e => setVibe(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Input value={theme} onChange={e => setTheme(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Public Club</Label>
                <p className="text-xs text-muted-foreground">Anyone can find and join</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <Button className="w-full" onClick={handleSave}>Save Changes</Button>
            <Button className="w-full" variant="destructive"
              onClick={() => { setOpen(false); setShowDeleteConfirm(true); }}>
              <Trash2 className="h-4 w-4 mr-2" />Delete Club
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this club?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{club.name}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}>
              Delete Club
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ClubDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const clubRef = useMemoFirebase(() => (id ? doc(firestore, 'clubs', id) : null), [firestore, id]);
  const { data: club, isLoading } = useDoc(clubRef);

  const membersRef = useMemoFirebase(
    () => (id ? collection(firestore, 'clubs', id, 'members') : null), [firestore, id]
  );
  const { data: clubMembersRaw } = useCollection(membersRef);
  const clubMembers: any[] = clubMembersRaw ?? [];

  const sharedBooksRef = useMemoFirebase(
    () => (id ? collection(firestore, 'clubs', id, 'sharedBooks') : null), [firestore, id]
  );
  const { data: sharedBooksRaw } = useCollection(sharedBooksRef);
  const sharedBooks: any[] = sharedBooksRaw ?? [];

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

  if (isLoading || !club) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">📚</div>
          <p className="text-muted-foreground">Loading club...</p>
        </div>
      </div>
    );
  }

  const clubData = club as any;
  const isOwner = user?.uid === clubData.ownerId;
  const isMember = clubData.memberIds?.includes(user?.uid);
  const mySharedBook = sharedBooks.find(b => b.userId === user?.uid);

  const handleShareBook = (book: any) => {
    if (!user) return;
    setDocumentNonBlocking(
      doc(firestore, 'clubs', id, 'sharedBooks', user.uid),
      {
        userId: user.uid,
        bookId: book.bookId,
        title: book.title,
        author: book.author,
        progressPercent: book.progressPercent ?? 0,
        sharedAt: serverTimestamp(),
      },
      { merge: false }
    );
    addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
      userId: user.uid, clubId: id, type: 'started-book',
      bookId: book.bookId, bookTitle: book.title, timestamp: serverTimestamp(),
    });
  };

  const handleUpdateProgress = (progress: number) => {
    if (!user) return;
    updateDocumentNonBlocking(doc(firestore, 'clubs', id, 'sharedBooks', user.uid), {
      progressPercent: progress,
    });
    if (progress === 100) {
      addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
        userId: user.uid, clubId: id, type: 'finished-book',
        bookId: mySharedBook?.bookId, bookTitle: mySharedBook?.title, timestamp: serverTimestamp(),
      });
    }
  };

  const handleRemoveSharedBook = () => {
    if (!user) return;
    deleteDoc(doc(firestore, 'clubs', id, 'sharedBooks', user.uid));
  };

  const handleRemoveMember = (memberId: string) => {
    if (!isOwner || memberId === user?.uid) return;
    updateDocumentNonBlocking(doc(firestore, 'clubs', id), { memberIds: arrayRemove(memberId) });
    deleteDoc(doc(firestore, 'clubs', id, 'members', memberId));
  };

  const handleLeaveClub = () => {
    if (!user || isOwner) return;
    updateDocumentNonBlocking(doc(firestore, 'clubs', id), { memberIds: arrayRemove(user.uid) });
    deleteDoc(doc(firestore, 'clubs', id, 'members', user.uid));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <CardTitle className="text-4xl">{clubData.name}</CardTitle>
                {clubData.isPublic && <Badge variant="secondary">Public</Badge>}
                {isOwner && <Badge variant="outline">Owner</Badge>}
              </div>
              <CardDescription className="text-lg mb-2">{clubData.description}</CardDescription>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />{clubData.memberIds?.length ?? 0} members
                </Badge>
                {clubData.theme && <Badge variant="outline">{clubData.theme}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-3 italic">✨ {clubData.vibe}</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {isOwner && <SettingsDialog club={clubData} clubId={id} />}
              <Button variant="outline" asChild>
                <Link href={`/clubs/${id}/session`}>
                  <BookOpen className="h-4 w-4 mr-2" />Reading Room
                </Link>
              </Button>
              <InviteMembersDialog clubId={id} />
              {isMember && !isOwner && (
                <Button variant="ghost" onClick={handleLeaveClub}>Leave Club</Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="reading" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reading"><BookOpen className="h-4 w-4 mr-2" />Reading</TabsTrigger>
          <TabsTrigger value="members"><Users className="h-4 w-4 mr-2" />Members</TabsTrigger>
          <TabsTrigger value="activity"><Calendar className="h-4 w-4 mr-2" />Activity</TabsTrigger>
        </TabsList>

        {/* Reading Tab */}
        <TabsContent value="reading" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Currently Reading</h3>
              <p className="text-sm text-muted-foreground">Books members are sharing with the club</p>
            </div>
            {!mySharedBook && <ShareBookDialog clubId={id} onShare={handleShareBook} />}
          </div>

          {sharedBooks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">No one has shared a book yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Be the first to share what you're reading!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sharedBooks.map(sharedBook => {
                const isMyBook = sharedBook.userId === user?.uid;
                return (
                  <Card key={sharedBook.id} className={isMyBook ? 'border-primary/50' : ''}>
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <div className="h-16 w-12 rounded bg-muted flex items-center justify-center shrink-0">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{sharedBook.title}</p>
                              <p className="text-sm text-muted-foreground truncate">{sharedBook.author}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {isMyBook ? 'Shared by you' : `Shared by ${sharedBook.userId}`}
                              </p>
                            </div>
                            {isMyBook && (
                              <Button
                                variant="ghost" size="icon"
                                className="shrink-0 text-muted-foreground hover:text-destructive h-7 w-7"
                                onClick={handleRemoveSharedBook}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Progress</span>
                              <span>{sharedBook.progressPercent ?? 0}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${sharedBook.progressPercent ?? 0}%` }}
                              />
                            </div>
                          </div>
                          {isMyBook && (
                            <div className="mt-3">
                              <UpdateProgressDialog
                                sharedBook={sharedBook}
                                onUpdate={handleUpdateProgress}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
                <p className="text-center text-muted-foreground py-8 col-span-2">No members yet.</p>
              ) : (
                clubMembers.map(member => (
                  <div key={member.userId}
                    className="flex gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatarUrl} alt={member.userId} />
                      <AvatarFallback>{member.userId?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{member.name || member.userId}</p>
                      <Badge variant="outline" className="text-xs mt-1">{member.role}</Badge>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`h-2 w-2 rounded-full ${member.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-muted-foreground">
                          {member.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    {isOwner && member.userId !== user?.uid && (
                      <Button variant="ghost" size="icon"
                        className="shrink-0 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveMember(member.userId)}>
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
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
                <p className="text-sm mt-1">Activity appears when members join, share or finish books.</p>
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