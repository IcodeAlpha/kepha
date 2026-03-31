'use client';

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  BookOpen, Users, Settings, UserPlus, Trash2, UserMinus,
  Copy, Check, Loader2, X, Heart, MessageCircle, Bell, Search, Plus,
} from "lucide-react";
import {
  doc, collection, query, where, orderBy, serverTimestamp, deleteDoc, arrayRemove,
} from 'firebase/firestore';
import {
  useFirestore, useUser, useDoc, useCollection, useMemoFirebase,
  addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking,
} from '@/firebase';
import { useRouter } from "next/navigation";

function ShareBookDialog({ clubId, onShare }: { clubId: string; onShare: (book: any) => void }) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const userBooksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'userBooks'), where('userId', '==', user.uid));
  }, [firestore, user?.uid]);
  const { data: userBooksRaw, isLoading } = useCollection(userBooksQuery);
  const userBooks: any[] = (userBooksRaw ?? []).filter(b => b.status === 'reading' || b.status === 'want-to-read');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="ci-btn-outline"><BookOpen size={13} style={{ marginRight: 6 }} />Share a Book</button>
      </DialogTrigger>
      <DialogContent style={{ background: '#F5F0E8', border: '1px solid #D8D0C0' }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Share a Book</DialogTitle>
          <DialogDescription style={{ fontSize: 12, color: '#8A8578' }}>Pick a book from your shelf.</DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <Loader2 size={20} style={{ color: '#8A8578', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : userBooks.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: 13, color: '#8A8578', padding: '24px 0' }}>No books on your shelf yet.</p>
          ) : (
            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {userBooks.map(book => (
                <button key={book.id} onClick={() => { onShare(book); setOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 4, border: '1px solid #D8D0C0', background: '#EDE7D9', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}>
                  <div style={{ width: 32, height: 48, background: '#2A3D2D', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1A1A18' }}>{book.title}</p>
                    <p style={{ fontSize: 11, color: '#8A8578' }}>{book.author}</p>
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

function InviteMembersDialog({ clubId }: { clubId: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/clubs/${clubId}` : '';
  const handleCopy = () => { navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="ci-btn-outline"><UserPlus size={13} style={{ marginRight: 6 }} />Invite</button>
      </DialogTrigger>
      <DialogContent style={{ background: '#F5F0E8', border: '1px solid #D8D0C0' }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Invite Members</DialogTitle>
          <DialogDescription style={{ fontSize: 12, color: '#8A8578' }}>Share this link to invite people.</DialogDescription>
        </DialogHeader>
        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <Input value={inviteLink} readOnly style={{ fontSize: 12, background: '#EDE7D9', borderColor: '#D8D0C0' }} />
          <button onClick={handleCopy} style={{ padding: '0 12px', border: '1px solid #D8D0C0', background: 'transparent', cursor: 'pointer', borderRadius: 2 }}>
            {copied ? <Check size={14} style={{ color: '#4A7C59' }} /> : <Copy size={14} />}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
          <button className="ci-icon-btn"><Settings size={14} /></button>
        </DialogTrigger>
        <DialogContent style={{ background: '#F5F0E8', border: '1px solid #D8D0C0' }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Circle Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Name</Label>
              <Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13 }} value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Description</Label>
              <Textarea style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13 }} value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Vibe</Label>
              <Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13 }} value={vibe} onChange={e => setVibe(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <p style={{ fontSize: 12 }}>Public</p>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <button className="ci-btn-primary" style={{ width: '100%' }} onClick={handleSave}>Save Changes</button>
            <button style={{ width: '100%', background: 'transparent', border: '1px solid #E57373', color: '#C62828', padding: '9px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => { setOpen(false); setShowDeleteConfirm(true); }}>
              <Trash2 size={12} />Delete Circle
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent style={{ background: '#F5F0E8', border: '1px solid #D8D0C0' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>Delete this circle?</AlertDialogTitle>
            <AlertDialogDescription style={{ fontSize: 13, color: '#8A8578' }}>
              This will permanently delete <strong>{club.name}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction style={{ background: '#C62828', color: '#fff' }} onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function timeAgo(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function ClubDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'reflections' | 'members' | 'activity'>('reflections');

  const clubRef = useMemoFirebase(() => (id ? doc(firestore, 'clubs', id) : null), [firestore, id]);
  const { data: club, isLoading } = useDoc(clubRef);

  const membersRef = useMemoFirebase(() => (id ? collection(firestore, 'clubs', id, 'members') : null), [firestore, id]);
  const { data: clubMembersRaw } = useCollection(membersRef);
  const clubMembers: any[] = clubMembersRaw ?? [];

  const sharedBooksRef = useMemoFirebase(() => (id ? collection(firestore, 'clubs', id, 'sharedBooks') : null), [firestore, id]);
  const { data: sharedBooksRaw } = useCollection(sharedBooksRef);
  const sharedBooks: any[] = sharedBooksRaw ?? [];

  const activitiesQuery = useMemoFirebase(() => {
    if (!id) return null;
    return query(collection(firestore, 'readingActivities'), where('clubId', '==', id), orderBy('timestamp', 'desc'));
  }, [firestore, id]);
  const { data: clubActivitiesRaw } = useCollection(activitiesQuery);
  const clubActivities: any[] = clubActivitiesRaw ?? [];

  if (isLoading || !club) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
          <p style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', color: '#8A8578', fontSize: 13 }}>Loading the circle...</p>
        </div>
      </div>
    );
  }

  const clubData = club as any;
  const isOwner = user?.uid === clubData.ownerId;
  const isMember = clubData.memberIds?.includes(user?.uid);
  const mySharedBook = sharedBooks.find(b => b.userId === user?.uid);

  // Average collective progress
  const avgProgress = sharedBooks.length > 0
    ? Math.round(sharedBooks.reduce((sum, b) => sum + (b.progressPercent ?? 0), 0) / sharedBooks.length)
    : 0;

  const handleShareBook = (book: any) => {
    if (!user) return;
    setDocumentNonBlocking(doc(firestore, 'clubs', id, 'sharedBooks', user.uid), {
      userId: user.uid, bookId: book.bookId, title: book.title, author: book.author,
      progressPercent: book.progressPercent ?? 0, sharedAt: serverTimestamp(),
    }, { merge: false });
    addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
      userId: user.uid, clubId: id, type: 'started-book',
      bookId: book.bookId, bookTitle: book.title, timestamp: serverTimestamp(),
    });
  };

  const handleUpdateProgress = (progress: number) => {
    if (!user) return;
    updateDocumentNonBlocking(doc(firestore, 'clubs', id, 'sharedBooks', user.uid), { progressPercent: progress });
    if (progress === 100) {
      addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
        userId: user.uid, clubId: id, type: 'finished-book',
        bookId: mySharedBook?.bookId, bookTitle: mySharedBook?.title, timestamp: serverTimestamp(),
      });
    }
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .ci-page { font-family: 'DM Sans', sans-serif; color: #1A1A18; max-width: 1000px; }

        /* Top bar */
        .ci-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 1px solid #D8D0C0; }
        .ci-club-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 400; color: #1A1A18; }
        .ci-topbar-actions { display: flex; gap: 8px; align-items: center; }
        .ci-icon-btn { width: 32px; height: 32px; border: 1px solid #D8D0C0; background: transparent; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #8A8578; transition: all 0.15s; }
        .ci-icon-btn:hover { border-color: #3D3D38; color: #3D3D38; }

        /* Buttons */
        .ci-btn-primary { background: #1C2B1E; color: #fff; border: none; padding: 10px 20px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: background 0.15s; display: inline-flex; align-items: center; }
        .ci-btn-primary:hover { background: #2A3D2D; }
        .ci-btn-outline { background: transparent; color: #3D3D38; border: 1px solid #D8D0C0; padding: 8px 16px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: all 0.15s; display: inline-flex; align-items: center; }
        .ci-btn-outline:hover { border-color: #3D3D38; }

        /* Hero: Current Pick */
        .ci-hero { display: grid; grid-template-columns: auto 1fr; gap: 32px; background: #EDE7D9; border: 1px solid #D8D0C0; border-radius: 4px; padding: 32px; margin-bottom: 32px; align-items: start; }
        @media (max-width: 600px) { .ci-hero { grid-template-columns: 1fr; } }
        .ci-book-cover { width: 140px; height: 200px; object-fit: cover; border-radius: 2px; box-shadow: 6px 8px 24px rgba(0,0,0,0.2); display: block; }
        .ci-book-cover-placeholder { width: 140px; height: 200px; background: #2A3D2D; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3); }
        .ci-pick-label { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: #C4873A; background: rgba(196,135,58,0.12); padding: 3px 8px; border-radius: 2px; display: inline-block; margin-bottom: 8px; }
        .ci-pick-genre { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #8A8578; margin-left: 8px; }
        .ci-book-title { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; color: #1A1A18; line-height: 1.1; margin-bottom: 6px; }
        .ci-book-author { font-family: 'Libre Baskerville', serif; font-size: 14px; font-style: italic; color: #8A8578; margin-bottom: 24px; }
        .ci-progress-label { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #8A8578; margin-bottom: 6px; display: flex; justify-content: space-between; }
        .ci-progress-bar { height: 2px; background: #D8D0C0; border-radius: 1px; margin-bottom: 24px; overflow: hidden; }
        .ci-progress-fill { height: 100%; background: #1C2B1E; border-radius: 1px; }
        .ci-enter-room-btn { display: inline-flex; align-items: center; gap: 10px; background: #1C2B1E; color: #fff; border: none; padding: 12px 24px; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-weight: 500; text-decoration: none; transition: background 0.15s; }
        .ci-enter-room-btn:hover { background: #2A3D2D; }

        /* Two column layout */
        .ci-two-col { display: grid; grid-template-columns: 260px 1fr; gap: 28px; }
        @media (max-width: 750px) { .ci-two-col { grid-template-columns: 1fr; } }

        /* Left: The Circle */
        .ci-circle-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 400; color: #1A1A18; margin-bottom: 16px; }
        .ci-member-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #D8D0C0; }
        .ci-member-item:last-child { border-bottom: none; }
        .ci-member-name { font-size: 13px; font-weight: 500; color: #1A1A18; }
        .ci-member-role { font-size: 11px; color: #8A8578; }
        .ci-member-chapter { font-size: 11px; color: #8A8578; }
        .ci-member-avatars { display: flex; margin-top: 12px; }
        .ci-member-avatar-sm { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #F5F0E8; margin-left: -6px; background: #2A3D2D; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #fff; font-family: 'Playfair Display', serif; overflow: hidden; }
        .ci-member-avatar-sm:first-child { margin-left: 0; }
        .ci-more-count { font-size: 10px; color: #8A8578; margin-left: 8px; align-self: center; }

        /* Next Meeting */
        .ci-meeting-box { background: #EDE7D9; border: 1px solid #D8D0C0; border-radius: 4px; padding: 16px; margin-top: 20px; }
        .ci-meeting-title { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 600; color: #1A1A18; margin-bottom: 4px; }
        .ci-meeting-date { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #C4873A; margin-bottom: 6px; }
        .ci-meeting-desc { font-size: 12px; color: #8A8578; line-height: 1.5; margin-bottom: 12px; }
        .ci-calendar-btn { background: transparent; border: 1px solid #D8D0C0; color: #3D3D38; padding: 7px 14px; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; width: 100%; transition: all 0.15s; }
        .ci-calendar-btn:hover { border-color: #1C2B1E; color: #1C2B1E; }

        /* Right: Reflections */
        .ci-reflections-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .ci-reflections-title { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 400; color: #1A1A18; }
        .ci-reflection-item { padding: 20px 0; border-bottom: 1px solid #D8D0C0; position: relative; }
        .ci-reflection-item:last-child { border-bottom: none; }
        .ci-reflection-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .ci-reflection-dot { width: 6px; height: 6px; border-radius: 50%; background: #4A7C59; flex-shrink: 0; }
        .ci-reflection-author { font-size: 13px; font-weight: 500; color: #1A1A18; }
        .ci-reflection-chapter { font-size: 11px; color: #8A8578; letter-spacing: 0.08em; text-transform: uppercase; }
        .ci-reflection-time { font-size: 11px; color: #8A8578; margin-left: auto; }
        .ci-reflection-text { font-family: 'Libre Baskerville', serif; font-size: 14px; font-style: italic; color: #3D3D38; line-height: 1.8; margin-bottom: 12px; padding-left: 14px; }
        .ci-reflection-actions { display: flex; gap: 14px; padding-left: 14px; }
        .ci-reaction-btn { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #8A8578; background: none; border: none; cursor: pointer; padding: 0; font-family: 'DM Sans', sans-serif; transition: color 0.15s; }
        .ci-reaction-btn:hover { color: #1A1A18; }
        .ci-add-reflection { position: fixed; bottom: 32px; right: 32px; width: 48px; height: 48px; border-radius: 50%; background: #1C2B1E; color: #fff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.2); transition: background 0.15s; z-index: 10; }
        .ci-add-reflection:hover { background: #2A3D2D; }

        /* Tabs */
        .ci-tabs { display: flex; gap: 24px; border-bottom: 1px solid #D8D0C0; margin-bottom: 24px; }
        .ci-tab { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #8A8578; padding-bottom: 10px; border-bottom: 2px solid transparent; cursor: pointer; background: none; border-top: none; border-left: none; border-right: none; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: all 0.15s; margin-bottom: -1px; }
        .ci-tab:hover { color: #1A1A18; }
        .ci-tab.active { color: #1A1A18; border-bottom-color: #1C2B1E; }

        /* No content */
        .ci-empty { text-align: center; padding: 40px 16px; color: #8A8578; font-family: 'Libre Baskerville', serif; font-style: italic; font-size: 13px; }
      `}</style>

      <div className="ci-page">
        {/* Top bar */}
        <div className="ci-topbar">
          <div className="ci-club-name">{clubData.name}</div>
          <div className="ci-topbar-actions">
            <button className="ci-icon-btn"><Search size={14} /></button>
            <button className="ci-icon-btn"><Bell size={14} /></button>
            {isOwner && <SettingsDialog club={clubData} clubId={id} />}
            <InviteMembersDialog clubId={id} />
            {isMember && !isOwner && (
              <button className="ci-btn-outline" onClick={handleLeaveClub}>Leave</button>
            )}
          </div>
        </div>

        {/* Hero — Current Pick */}
        <div className="ci-hero">
          {mySharedBook ? (
            <img
              src={mySharedBook.coverUrl || `https://picsum.photos/seed/${mySharedBook.bookId}/140/200`}
              alt={mySharedBook.title}
              className="ci-book-cover"
            />
          ) : sharedBooks[0] ? (
            <img
              src={sharedBooks[0].coverUrl || `https://picsum.photos/seed/${sharedBooks[0].bookId}/140/200`}
              alt={sharedBooks[0].title}
              className="ci-book-cover"
            />
          ) : (
            <div className="ci-book-cover-placeholder"><BookOpen size={28} /></div>
          )}
          <div>
            <div style={{ marginBottom: 8 }}>
              <span className="ci-pick-label">Current Pick</span>
              {clubData.theme && <span className="ci-pick-genre">{clubData.theme}</span>}
            </div>
            <div className="ci-book-title">
              {mySharedBook?.title || sharedBooks[0]?.title || clubData.name}
            </div>
            <div className="ci-book-author">
              {mySharedBook?.author || sharedBooks[0]?.author || clubData.description}
            </div>
            <div className="ci-progress-label">
              <span>Collective Progress</span>
              <span>{avgProgress}%</span>
            </div>
            <div className="ci-progress-bar">
              <div className="ci-progress-fill" style={{ width: `${avgProgress}%` }} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href={`/clubs/${id}/session`} className="ci-enter-room-btn">
                <BookOpen size={14} />Enter Reading Room →
              </Link>
              {!mySharedBook && <ShareBookDialog clubId={id} onShare={handleShareBook} />}
            </div>
          </div>
        </div>

        {/* Two column layout */}
        <div className="ci-two-col">
          {/* Left: The Circle */}
          <div>
            <div className="ci-circle-title">The Circle</div>
            {clubMembers.length === 0 ? (
              <p style={{ fontSize: 12, color: '#8A8578', fontStyle: 'italic', fontFamily: "'Libre Baskerville', serif" }}>No members yet.</p>
            ) : (
              <>
                {clubMembers.slice(0, 4).map((m) => (
                  <div key={m.userId} className="ci-member-item">
                    <Avatar style={{ width: 36, height: 36 }}>
                      <AvatarImage src={m.avatarUrl} />
                      <AvatarFallback style={{ background: '#2A3D2D', color: '#fff', fontSize: 13, fontFamily: "'Playfair Display', serif" }}>
                        {(m.name || m.userId)?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="ci-member-name">{m.name || m.userId?.slice(0, 12)}</div>
                      <div className="ci-member-role">{m.role === 'owner' ? 'Host & Curator' : `${m.currentChapter ? `Chapter ${m.currentChapter}` : 'Member'}`}</div>
                    </div>
                  </div>
                ))}
                {clubMembers.length > 4 && (
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ display: 'flex' }}>
                      {clubMembers.slice(4, 8).map((m) => (
                        <div key={m.userId} className="ci-member-avatar-sm">
                          {(m.name || m.userId)?.charAt(0)?.toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="ci-more-count">+{clubMembers.length - 4} more</span>
                  </div>
                )}
              </>
            )}

            {/* Next Meeting */}
            <div className="ci-meeting-box">
              <div className="ci-meeting-title">Next Meeting</div>
              <div className="ci-meeting-date">Thursday · 7:00 PM</div>
              <div className="ci-meeting-desc">
                {clubData.vibe || 'Discussing the latest chapters. All members welcome.'}
              </div>
              <button className="ci-calendar-btn">Add to Calendar</button>
            </div>
          </div>

          {/* Right: Reflections + Tabs */}
          <div>
            <div className="ci-tabs">
              <button className={`ci-tab${activeTab === 'reflections' ? ' active' : ''}`} onClick={() => setActiveTab('reflections')}>Reflections</button>
              <button className={`ci-tab${activeTab === 'members' ? ' active' : ''}`} onClick={() => setActiveTab('members')}>Members</button>
              <button className={`ci-tab${activeTab === 'activity' ? ' active' : ''}`} onClick={() => setActiveTab('activity')}>Activity</button>
            </div>

            {activeTab === 'reflections' && (
              <>
                <div className="ci-reflections-header">
                  <div className="ci-reflections-title">Reflections</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="ci-icon-btn" style={{ borderRadius: 2 }}>⚡</button>
                    <button className="ci-icon-btn" style={{ borderRadius: 2 }}>↺</button>
                  </div>
                </div>
                {sharedBooks.length === 0 && clubActivities.length === 0 ? (
                  <div className="ci-empty">No reflections yet. Share what you're reading to begin.</div>
                ) : (
                  <div>
                    {sharedBooks.map((book) => (
                      <div key={book.id} className="ci-reflection-item">
                        <div className="ci-reflection-meta">
                          <span className="ci-reflection-dot" />
                          <span className="ci-reflection-author">{book.userId?.slice(0, 12) || 'Member'}</span>
                          {book.chapter && <span className="ci-reflection-chapter">· Chapter {book.chapter}</span>}
                          <span className="ci-reflection-time">{timeAgo(book.sharedAt)}</span>
                        </div>
                        <div className="ci-reflection-text">
                          Currently reading <em>{book.title}</em>{book.author ? ` by ${book.author}` : ''} — {book.progressPercent ?? 0}% complete.
                        </div>
                        <div className="ci-reflection-actions">
                          <button className="ci-reaction-btn"><Heart size={12} /> {book.likes || 0}</button>
                          <button className="ci-reaction-btn"><MessageCircle size={12} /> {book.comments || 0}</button>
                        </div>
                      </div>
                    ))}
                    {clubActivities.slice(0, 5).map((act) => (
                      <div key={act.id} className="ci-reflection-item">
                        <div className="ci-reflection-meta">
                          <span className="ci-reflection-dot" style={{ background: act.type === 'finished-book' ? '#C4873A' : '#4A7C59' }} />
                          <span className="ci-reflection-author">{act.userName || act.userId?.slice(0, 12) || 'Member'}</span>
                          {act.bookTitle && <span className="ci-reflection-chapter">· {act.bookTitle}</span>}
                          <span className="ci-reflection-time">{timeAgo(act.timestamp)}</span>
                        </div>
                        {act.content && (
                          <div className="ci-reflection-text">"{act.content}"</div>
                        )}
                        <div className="ci-reflection-actions">
                          <button className="ci-reaction-btn"><Heart size={12} /> 0</button>
                          <button className="ci-reaction-btn"><MessageCircle size={12} /> 0</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'members' && (
              <div>
                {clubMembers.length === 0 ? (
                  <div className="ci-empty">No members yet.</div>
                ) : (
                  clubMembers.map((m) => (
                    <div key={m.userId} className="ci-member-item" style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar style={{ width: 40, height: 40 }}>
                          <AvatarImage src={m.avatarUrl} />
                          <AvatarFallback style={{ background: '#2A3D2D', color: '#fff', fontFamily: "'Playfair Display', serif" }}>
                            {(m.name || m.userId)?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="ci-member-name">{m.name || m.userId}</div>
                          <div className="ci-member-role">{m.role}</div>
                        </div>
                      </div>
                      {isOwner && m.userId !== user?.uid && (
                        <button onClick={() => handleRemoveMember(m.userId)} style={{ background: 'none', border: 'none', color: '#8A8578', cursor: 'pointer', padding: 4 }}>
                          <UserMinus size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                {clubActivities.length === 0 ? (
                  <div className="ci-empty">No activity yet.</div>
                ) : (
                  clubActivities.map((act) => (
                    <div key={act.id} className="ci-reflection-item">
                      <div className="ci-reflection-meta">
                        <span className="ci-reflection-dot" />
                        <span className="ci-reflection-author">{act.userName || act.userId?.slice(0, 12)}</span>
                        <span className="ci-reflection-time">{timeAgo(act.timestamp)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#8A8578', paddingLeft: 14 }}>
                        {act.type === 'finished-book' && `Finished ${act.bookTitle}`}
                        {act.type === 'started-book' && `Started reading ${act.bookTitle}`}
                        {act.type === 'joined-club' && 'Joined the circle'}
                        {act.type === 'shared-quote' && `Shared a quote from ${act.bookTitle}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Floating add button */}
        <button className="ci-add-reflection" title="Add reflection">
          <Plus size={20} />
        </button>
      </div>
    </>
  );
}