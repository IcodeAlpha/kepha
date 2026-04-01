'use client';

import { useParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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
  Copy, Check, Loader2, Heart, MessageCircle, Bell, Search,
  Plus, ChevronDown, ChevronUp, Send,
} from "lucide-react";
import {
  doc, collection, query, where, orderBy, serverTimestamp, deleteDoc,
  arrayRemove, arrayUnion, increment, runTransaction,
} from 'firebase/firestore';
import {
  useFirestore, useUser, useDoc, useCollection, useMemoFirebase,
  addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking,
} from '@/firebase';
import { useRouter } from "next/navigation";

function timeAgo(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

// ── Bell / Notifications dropdown ─────────────────────────────────────────
function NotificationsBell({ clubId }: { clubId: string }) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const ref = useRef<HTMLDivElement>(null);

  // Real activity from this club
  const activityQuery = useMemoFirebase(() => {
    if (!clubId) return null;
    return query(
      collection(firestore, 'readingActivities'),
      where('clubId', '==', clubId),
      orderBy('timestamp', 'desc'),
    );
  }, [firestore, clubId]);
  const { data: activitiesRaw } = useCollection(activityQuery);
  const activities: any[] = (activitiesRaw ?? []).slice(0, 10);

  // Real reflections from this club
  const reflectionsQuery = useMemoFirebase(() => {
    if (!clubId) return null;
    return query(
      collection(firestore, 'clubs', clubId, 'reflections'),
      orderBy('timestamp', 'desc'),
    );
  }, [firestore, clubId]);
  const { data: reflectionsRaw } = useCollection(reflectionsQuery);
  const recentReflections: any[] = (reflectionsRaw ?? []).slice(0, 5);

  // Merge and sort both into a single feed
  const feed = [
    ...activities.map(a => ({ ...a, _type: 'activity' })),
    ...recentReflections.map(r => ({ ...r, _type: 'reflection' })),
  ].sort((a, b) => {
    const aTime = a.timestamp?.toDate?.()?.getTime() ?? 0;
    const bTime = b.timestamp?.toDate?.()?.getTime() ?? 0;
    return bTime - aTime;
  }).slice(0, 12);

  const unreadCount = feed.filter(item => {
    if (!item.timestamp) return false;
    const date = item.timestamp.toDate?.() ?? new Date(item.timestamp);
    return Date.now() - date.getTime() < 3600000; // last hour
  }).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function getNotifText(item: any): string {
    const name = item.userName || item.userId?.slice(0, 10) || 'Someone';
    if (item._type === 'reflection') return `${name} shared a reflection`;
    switch (item.type) {
      case 'finished-book': return `${name} finished ${item.bookTitle || 'a book'}`;
      case 'started-book': return `${name} started ${item.bookTitle || 'a book'}`;
      case 'joined-club': return `${name} joined the circle`;
      case 'shared-quote': return `${name} shared a quote`;
      default: return `${name} did something`;
    }
  }

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="ci-icon-btn" onClick={() => setOpen(o => !o)}>
        <Bell size={14} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, background: '#C4873A', borderRadius: '50%', fontSize: 9, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 40, right: 0, width: 300, background: '#F5F0E8', border: '1px solid #D8D0C0', borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #D8D0C0' }}>
            <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A8578', margin: 0 }}>Circle Activity</p>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {feed.length === 0 ? (
              <p style={{ fontSize: 12, color: '#8A8578', fontStyle: 'italic', fontFamily: "'Libre Baskerville', serif", padding: '20px 16px', textAlign: 'center' }}>No activity yet.</p>
            ) : (
              feed.map((item, i) => (
                <div key={item.id || i} style={{ padding: '10px 16px', borderBottom: '1px solid #EDE7D9', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: item._type === 'reflection' ? '#4A7C59' : '#C4873A', flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: '#3D3D38', margin: 0, lineHeight: 1.4 }}>{getNotifText(item)}</p>
                    {item._type === 'reflection' && item.content && (
                      <p style={{ fontSize: 11, color: '#8A8578', fontStyle: 'italic', fontFamily: "'Libre Baskerville', serif", margin: '3px 0 0', lineHeight: 1.4 }}>
                        "{item.content.slice(0, 80)}{item.content.length > 80 ? '...' : ''}"
                      </p>
                    )}
                    <p style={{ fontSize: 10, color: '#8A8578', margin: '3px 0 0' }}>{timeAgo(item.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Book Dialog — with page count ─────────────────────────────────────
function ShareBookDialog({ clubId, onShare }: { clubId: string; onShare: (book: any) => void }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'shelf' | 'manual'>('shelf');
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualPages, setManualPages] = useState('');
  const [manualFormat, setManualFormat] = useState('physical');
  const firestore = useFirestore();
  const { user } = useUser();

  const userBooksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'userBooks'), where('userId', '==', user.uid));
  }, [firestore, user?.uid]);
  const { data: userBooksRaw, isLoading } = useCollection(userBooksQuery);
  const userBooks: any[] = (userBooksRaw ?? []).filter(b => b.status === 'reading' || b.status === 'want-to-read');

  const handleManualShare = () => {
    if (!manualTitle.trim()) return;
    onShare({
      bookId: manualTitle.toLowerCase().replace(/\s+/g, '-'),
      title: manualTitle,
      author: manualAuthor,
      pageCount: manualPages ? parseInt(manualPages) : null,
      format: manualFormat,
      progressPercent: 0,
    });
    setOpen(false);
    setManualTitle(''); setManualAuthor(''); setManualPages('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="ci-btn-outline"><BookOpen size={13} style={{ marginRight: 6 }} />Share a Book</button>
      </DialogTrigger>
      <DialogContent style={{ background: '#F5F0E8', border: '1px solid #D8D0C0', maxWidth: 440 }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Share a Book</DialogTitle>
        </DialogHeader>
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #D8D0C0', marginBottom: 16 }}>
          {(['shelf', 'manual'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #1C2B1E' : '2px solid transparent', color: tab === t ? '#1A1A18' : '#8A8578', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: -1 }}>
              {t === 'shelf' ? 'From My Shelf' : 'Add Manually'}
            </button>
          ))}
        </div>

        {tab === 'shelf' ? (
          isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><Loader2 size={20} style={{ color: '#8A8578' }} /></div>
          ) : userBooks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: 13, color: '#8A8578', fontStyle: 'italic', fontFamily: "'Libre Baskerville', serif", marginBottom: 12 }}>No books on your shelf yet.</p>
              <button onClick={() => setTab('manual')} style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A7C59', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Add one manually →</button>
            </div>
          ) : (
            <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {userBooks.map(book => (
                <button key={book.id} onClick={() => { onShare(book); setOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 4, border: '1px solid #D8D0C0', background: '#EDE7D9', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                  <div style={{ width: 32, height: 48, background: '#2A3D2D', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1A1A18', fontFamily: "'Playfair Display', serif", margin: 0 }}>{book.title}</p>
                    <p style={{ fontSize: 11, color: '#8A8578', fontStyle: 'italic', fontFamily: "'Libre Baskerville', serif", margin: 0 }}>{book.author}</p>
                    {book.pageCount && <p style={{ fontSize: 10, color: '#8A8578', margin: 0 }}>{book.pageCount} pages</p>}
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Title</Label>
              <Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} placeholder="e.g. Things Fall Apart" value={manualTitle} onChange={e => setManualTitle(e.target.value)} />
            </div>
            <div>
              <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Author</Label>
              <Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} placeholder="e.g. Chinua Achebe" value={manualAuthor} onChange={e => setManualAuthor(e.target.value)} />
            </div>
            <div>
              <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>
                Total Pages <span style={{ color: '#B0A898', fontWeight: 400 }}>(for tracking progress)</span>
              </Label>
              <Input
                type="number"
                style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }}
                placeholder="e.g. 340"
                value={manualPages}
                onChange={e => setManualPages(e.target.value)}
              />
            </div>
            <div>
              <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Format</Label>
              <select style={{ background: '#EDE7D9', fontSize: 13, width: '100%', padding: '8px 10px', border: '1px solid #D8D0C0', borderRadius: 4, color: '#1A1A18', fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}
                value={manualFormat} onChange={e => setManualFormat(e.target.value)}>
                <option value="physical">Physical</option>
                <option value="ebook">E-Book</option>
                <option value="audiobook">Audiobook</option>
              </select>
            </div>
            <button
              style={{ background: '#1C2B1E', color: '#fff', border: 'none', padding: '10px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, opacity: !manualTitle.trim() ? 0.5 : 1 }}
              onClick={handleManualShare}
              disabled={!manualTitle.trim()}
            >
              Share This Book
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Update Progress Dialog — with page-based tracking ──────────────────────
function UpdateProgressDialog({ sharedBook, clubId }: { sharedBook: any; clubId: string }) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();

  // ── Fix: initialize from prop when dialog opens, not at mount ──
  const [progress, setProgress] = useState(0);
  const [chapter, setChapter] = useState('');
  const [currentPage, setCurrentPage] = useState('');

  // Sync when dialog opens
  useEffect(() => {
    if (open) {
      setProgress(sharedBook?.progressPercent ?? 0);
      setChapter(sharedBook?.chapter ?? '');
      setCurrentPage(sharedBook?.currentPage?.toString() ?? '');
    }
  }, [open]);

  // Auto-calculate % when page number is entered
  const handlePageChange = (val: string) => {
    setCurrentPage(val);
    if (val && sharedBook?.pageCount) {
      const pct = Math.min(100, Math.round((parseInt(val) / sharedBook.pageCount) * 100));
      setProgress(pct);
    }
  };

  const handleSave = () => {
    if (!user) return;
    updateDocumentNonBlocking(doc(firestore, 'clubs', clubId, 'sharedBooks', user.uid), {
      progressPercent: Number(progress),
      chapter,
      currentPage: currentPage ? parseInt(currentPage) : null,
    });
    updateDocumentNonBlocking(doc(firestore, 'clubs', clubId, 'members', user.uid), {
      currentChapter: chapter,
    });
    if (Number(progress) === 100) {
      addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
        userId: user.uid, clubId, type: 'finished-book',
        bookId: sharedBook?.bookId, bookTitle: sharedBook?.title, timestamp: serverTimestamp(),
      });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="ci-btn-outline" style={{ fontSize: 10 }}>Update Progress</button>
      </DialogTrigger>
      <DialogContent style={{ background: '#F5F0E8', border: '1px solid #D8D0C0', maxWidth: 360 }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Update Progress</DialogTitle>
          {sharedBook?.title && <DialogDescription style={{ fontSize: 12, color: '#8A8578', fontStyle: 'italic', fontFamily: "'Libre Baskerville', serif" }}>{sharedBook.title}</DialogDescription>}
        </DialogHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
          <div>
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Chapter</Label>
            <Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} placeholder="e.g. Chapter 12" value={chapter} onChange={e => setChapter(e.target.value)} />
          </div>

          {/* Page-based input if pageCount exists */}
          {sharedBook?.pageCount ? (
            <div>
              <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>
                Current Page <span style={{ color: '#B0A898', fontWeight: 400 }}>of {sharedBook.pageCount}</span>
              </Label>
              <Input
                type="number"
                style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }}
                placeholder={`1 – ${sharedBook.pageCount}`}
                value={currentPage}
                onChange={e => handlePageChange(e.target.value)}
                min={0}
                max={sharedBook.pageCount}
              />
              <p style={{ fontSize: 10, color: '#8A8578', marginTop: 4 }}>Auto-calculates percentage</p>
            </div>
          ) : null}

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Progress</Label>
              <span style={{ fontSize: 14, fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>{progress}%</span>
            </div>
            <input type="range" min={0} max={100} value={progress}
              onChange={e => { setProgress(Number(e.target.value)); setCurrentPage(''); }}
              style={{ width: '100%', accentColor: '#1C2B1E' }} />
            <div style={{ height: 2, background: '#D8D0C0', borderRadius: 1, overflow: 'hidden', marginTop: 6 }}>
              <div style={{ height: '100%', background: '#1C2B1E', width: `${progress}%`, transition: 'width 0.2s' }} />
            </div>
          </div>

          <button
            style={{ background: '#1C2B1E', color: '#fff', border: 'none', padding: '10px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
            onClick={handleSave}
          >
            Save Progress
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Comments inline component ──────────────────────────────────────────────
function ReflectionComments({ clubId, reflectionId, commentCount }: {
  clubId: string; reflectionId: string; commentCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const firestore = useFirestore();
  const { user } = useUser();

  const commentsQuery = useMemoFirebase(() => {
    if (!open || !reflectionId) return null;
    return query(
      collection(firestore, 'clubs', clubId, 'reflections', reflectionId, 'comments'),
      orderBy('timestamp', 'asc')
    );
  }, [firestore, clubId, reflectionId, open]);
  const { data: commentsRaw } = useCollection(commentsQuery);
  const comments: any[] = commentsRaw ?? [];

  const handlePost = () => {
    if (!user || !text.trim()) return;
    const userName = user.displayName || user.email?.split('@')[0] || 'Reader';
    addDocumentNonBlocking(
      collection(firestore, 'clubs', clubId, 'reflections', reflectionId, 'comments'),
      { userId: user.uid, userName, content: text, timestamp: serverTimestamp() }
    );
    // Increment comment count on reflection
    updateDocumentNonBlocking(doc(firestore, 'clubs', clubId, 'reflections', reflectionId), {
      commentCount: increment(1),
    });
    setText('');
  };

  return (
    <div>
      <button
        className="ci-reaction-btn"
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <MessageCircle size={12} />
        {commentCount || 0}
        {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>

      {open && (
        <div style={{ marginTop: 10, paddingLeft: 14 }}>
          {comments.length === 0 ? (
            <p style={{ fontSize: 12, color: '#8A8578', fontStyle: 'italic', fontFamily: "'Libre Baskerville', serif", marginBottom: 10 }}>No comments yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#2A3D2D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontFamily: "'Playfair Display', serif", flexShrink: 0 }}>
                    {(c.userName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#1A1A18' }}>{c.userName}</span>
                      <span style={{ fontSize: 10, color: '#8A8578' }}>{timeAgo(c.timestamp)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#3D3D38', margin: 0, lineHeight: 1.5 }}>{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Comment input */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
              placeholder="Add a comment..."
              style={{ flex: 1, background: '#EDE7D9', border: '1px solid #D8D0C0', borderRadius: 2, padding: '6px 10px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: 'none', color: '#1A1A18' }}
            />
            <button
              onClick={handlePost}
              disabled={!text.trim()}
              style={{ width: 28, height: 28, background: text.trim() ? '#1C2B1E' : '#D8D0C0', border: 'none', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: text.trim() ? 'pointer' : 'default', flexShrink: 0, transition: 'background 0.15s' }}
            >
              <Send size={12} style={{ color: '#fff' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Post Reflection Dialog ─────────────────────────────────────────────────
function PostReflectionDialog({ clubId, onPost }: {
  clubId: string;
  onPost: (content: string, chapter: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [chapter, setChapter] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onPost(content, chapter);
    setOpen(false);
    setContent('');
    setChapter('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="ci-add-reflection" title="Add reflection">
          <Plus size={20} />
        </button>
      </DialogTrigger>
      <DialogContent style={{ background: '#F5F0E8', border: '1px solid #D8D0C0', maxWidth: 480 }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 20 }}>Share a Reflection</DialogTitle>
          <DialogDescription style={{ fontSize: 13, color: '#8A8578' }}>What are you thinking about right now?</DialogDescription>
        </DialogHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
          <div>
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Chapter / Location (optional)</Label>
            <Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} placeholder="e.g. Chapter 14" value={chapter} onChange={e => setChapter(e.target.value)} />
          </div>
          <div>
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Your Reflection</Label>
            <textarea
              ref={textareaRef}
              style={{ width: '100%', background: '#EDE7D9', border: '1px solid #D8D0C0', borderRadius: 4, padding: '10px 12px', fontSize: 14, fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', lineHeight: 1.8, resize: 'none', outline: 'none', color: '#1A1A18', marginTop: 4, boxSizing: 'border-box' }}
              placeholder='"The contrast between the two worlds felt heartbreaking here..."'
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
            />
          </div>
          <button
            style={{ background: content.trim() ? '#1C2B1E' : '#D8D0C0', color: '#fff', border: 'none', padding: '10px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: content.trim() ? 'pointer' : 'default', borderRadius: 2, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, transition: 'background 0.15s' }}
            onClick={handleSubmit}
            disabled={!content.trim()}
          >
            Post Reflection
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Next Meeting Editor ────────────────────────────────────────────────────
function NextMeetingEditor({ clubId, meeting }: { clubId: string; meeting: any }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(meeting?.date ?? '');
  const [time, setTime] = useState(meeting?.time ?? '');
  const [description, setDescription] = useState(meeting?.description ?? '');
  const [meetingLink, setMeetingLink] = useState(meeting?.meetingLink ?? '');
  const firestore = useFirestore();

  useEffect(() => {
    if (open) {
      setDate(meeting?.date ?? '');
      setTime(meeting?.time ?? '');
      setDescription(meeting?.description ?? '');
      setMeetingLink(meeting?.meetingLink ?? '');
    }
  }, [open]);

  const handleSave = () => {
    updateDocumentNonBlocking(doc(firestore, 'clubs', clubId), {
      nextMeeting: { date, time, description, meetingLink },
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="ci-calendar-btn">{meeting?.date ? 'Edit Meeting' : 'Schedule Meeting'}</button>
      </DialogTrigger>
      <DialogContent style={{ background: '#F5F0E8', border: '1px solid #D8D0C0', maxWidth: 380 }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Schedule Next Meeting</DialogTitle>
        </DialogHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
          <div>
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Date</Label>
            <Input type="date" style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Time</Label>
            <Input type="time" style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <div>
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Agenda</Label>
            <Textarea style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} placeholder="e.g. Discussing Part Two: The Exile" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div>
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>
              Meeting Link <span style={{ color: '#B0A898', fontWeight: 400 }}>(Zoom, Google Meet, etc.)</span>
            </Label>
            <Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} placeholder="https://meet.google.com/..." value={meetingLink} onChange={e => setMeetingLink(e.target.value)} />
          </div>
          <button style={{ background: '#1C2B1E', color: '#fff', border: 'none', padding: '10px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }} onClick={handleSave}>
            Save Meeting
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Invite + Settings dialogs (unchanged) ─────────────────────────────────
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
          <DialogDescription style={{ fontSize: 12, color: '#8A8578' }}>Share this link.</DialogDescription>
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
    updateDocumentNonBlocking(doc(firestore, 'clubs', clubId), { name, description, vibe, theme: theme.toLowerCase(), isPublic });
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
          <DialogHeader><DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Circle Settings</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
            <div><Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Name</Label><Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Description</Label><Textarea style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
            <div><Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Vibe</Label><Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} value={vibe} onChange={e => setVibe(e.target.value)} /></div>
            <div><Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Theme</Label><Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} value={theme} onChange={e => setTheme(e.target.value)} /></div>
            <div className="flex items-center justify-between"><p style={{ fontSize: 12 }}>Public</p><Switch checked={isPublic} onCheckedChange={setIsPublic} /></div>
            <button style={{ background: '#1C2B1E', color: '#fff', border: 'none', padding: '10px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }} onClick={handleSave}>Save</button>
            <button style={{ background: 'transparent', border: '1px solid #E57373', color: '#C62828', padding: '9px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => { setOpen(false); setShowDeleteConfirm(true); }}>
              <Trash2 size={12} />Delete Circle
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent style={{ background: '#F5F0E8', border: '1px solid #D8D0C0' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>Delete this circle?</AlertDialogTitle>
            <AlertDialogDescription style={{ fontSize: 13, color: '#8A8578' }}>This will permanently delete <strong>{club.name}</strong>.</AlertDialogDescription>
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

// ── Main Page ──────────────────────────────────────────────────────────────
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
  const reflectionsQuery = useMemoFirebase(() => {
    if (!id) return null;
    return query(collection(firestore, 'clubs', id, 'reflections'), orderBy('timestamp', 'desc'));
  }, [firestore, id]);
  const { data: reflectionsRaw } = useCollection(reflectionsQuery);
  const reflections: any[] = reflectionsRaw ?? [];
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
  const avgProgress = sharedBooks.length > 0
    ? Math.round(sharedBooks.reduce((sum, b) => sum + (b.progressPercent ?? 0), 0) / sharedBooks.length)
    : 0;
  const nextMeeting = clubData.nextMeeting;

  const handleShareBook = (book: any) => {
    if (!user) return;
    setDocumentNonBlocking(doc(firestore, 'clubs', id, 'sharedBooks', user.uid), {
      userId: user.uid, bookId: book.bookId, title: book.title, author: book.author,
      progressPercent: book.progressPercent ?? 0, chapter: '',
      pageCount: book.pageCount || null,
      currentPage: book.currentPage || null,
      sharedAt: serverTimestamp(),
    }, { merge: false });
    addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
      userId: user.uid, clubId: id, type: 'started-book',
      bookId: book.bookId, bookTitle: book.title,
      userName: user.displayName || user.email?.split('@')[0] || 'Reader',
      timestamp: serverTimestamp(),
    });
  };

  const handlePostReflection = (content: string, chapter: string) => {
    if (!user) return;
    const userName = user.displayName || user.email?.split('@')[0] || 'Reader';
    addDocumentNonBlocking(collection(firestore, 'clubs', id, 'reflections'), {
      userId: user.uid, userName, content, chapter,
      timestamp: serverTimestamp(), likes: 0, likedBy: [], commentCount: 0,
      bookTitle: mySharedBook?.title || null,
    });
    addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
      userId: user.uid, userName, clubId: id, type: 'shared-quote',
      content, bookTitle: mySharedBook?.title, timestamp: serverTimestamp(),
    });
  };

  const handleLikeReflection = async (reflectionId: string, likedBy: string[]) => {
    if (!user) return;
    const alreadyLiked = likedBy?.includes(user.uid);
    // Use transaction to prevent race conditions
    try {
      await runTransaction(firestore, async (tx) => {
        const ref = doc(firestore, 'clubs', id, 'reflections', reflectionId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data();
        const currentLikedBy: string[] = data.likedBy || [];
        const isLiked = currentLikedBy.includes(user.uid);
        tx.update(ref, {
          likes: (data.likes || 0) + (isLiked ? -1 : 1),
          likedBy: isLiked
            ? currentLikedBy.filter(uid => uid !== user.uid)
            : [...currentLikedBy, user.uid],
        });
      });
    } catch (e) {
      console.error('Like transaction failed:', e);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (!isOwner || memberId === user?.uid) return;
    updateDocumentNonBlocking(doc(firestore, 'clubs', id), { memberIds: arrayRemove(memberId) });
    deleteDoc(doc(firestore, 'clubs', id, 'members', memberId)).catch(console.error);
  };

  const handleLeaveClub = () => {
    if (!user || isOwner) return;
    updateDocumentNonBlocking(doc(firestore, 'clubs', id), { memberIds: arrayRemove(user.uid) });
    deleteDoc(doc(firestore, 'clubs', id, 'members', user.uid)).catch(console.error);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .ci-page { font-family: 'DM Sans', sans-serif; color: #1A1A18; max-width: 1000px; }
        .ci-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 1px solid #D8D0C0; }
        .ci-club-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 400; color: #1A1A18; }
        .ci-topbar-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .ci-icon-btn { position: relative; width: 32px; height: 32px; border: 1px solid #D8D0C0; background: transparent; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #8A8578; transition: all 0.15s; }
        .ci-icon-btn:hover { border-color: #3D3D38; color: #3D3D38; }
        .ci-btn-primary { background: #1C2B1E; color: #fff; border: none; padding: 10px 20px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: background 0.15s; display: inline-flex; align-items: center; }
        .ci-btn-primary:hover { background: #2A3D2D; }
        .ci-btn-outline { background: transparent; color: #3D3D38; border: 1px solid #D8D0C0; padding: 8px 16px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: all 0.15s; display: inline-flex; align-items: center; }
        .ci-btn-outline:hover { border-color: #3D3D38; }
        .ci-hero { display: grid; grid-template-columns: auto 1fr; gap: 32px; background: #EDE7D9; border: 1px solid #D8D0C0; border-radius: 4px; padding: 32px; margin-bottom: 32px; align-items: start; }
        @media (max-width: 600px) { .ci-hero { grid-template-columns: 1fr; } }
        .ci-book-cover { width: 140px; height: 200px; object-fit: cover; border-radius: 2px; box-shadow: 6px 8px 24px rgba(0,0,0,0.2); display: block; }
        .ci-book-cover-placeholder { width: 140px; height: 200px; background: #2A3D2D; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3); }
        .ci-pick-label { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: #C4873A; background: rgba(196,135,58,0.12); padding: 3px 8px; border-radius: 2px; display: inline-block; margin-bottom: 8px; }
        .ci-pick-genre { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #8A8578; margin-left: 8px; }
        .ci-book-title { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: #1A1A18; line-height: 1.1; margin-bottom: 6px; }
        .ci-book-author { font-family: 'Libre Baskerville', serif; font-size: 13px; font-style: italic; color: #8A8578; margin-bottom: 20px; }
        .ci-progress-label { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #8A8578; margin-bottom: 6px; display: flex; justify-content: space-between; }
        .ci-progress-bar { height: 2px; background: #D8D0C0; border-radius: 1px; margin-bottom: 20px; overflow: hidden; }
        .ci-progress-fill { height: 100%; background: #1C2B1E; border-radius: 1px; transition: width 0.4s ease; }
        .ci-enter-room-btn { display: inline-flex; align-items: center; gap: 10px; background: #1C2B1E; color: #fff; border: none; padding: 12px 24px; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-weight: 500; text-decoration: none; transition: background 0.15s; }
        .ci-enter-room-btn:hover { background: #2A3D2D; }
        .ci-hero-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .ci-two-col { display: grid; grid-template-columns: 260px 1fr; gap: 28px; }
        @media (max-width: 750px) { .ci-two-col { grid-template-columns: 1fr; } }
        .ci-circle-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 400; color: #1A1A18; margin-bottom: 16px; }
        .ci-member-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #D8D0C0; }
        .ci-member-item:last-child { border-bottom: none; }
        .ci-member-name { font-size: 13px; font-weight: 500; color: #1A1A18; }
        .ci-member-role { font-size: 11px; color: #8A8578; }
        .ci-member-chapter { font-size: 10px; color: #4A7C59; letter-spacing: 0.06em; margin-top: 1px; }
        .ci-meeting-box { background: #EDE7D9; border: 1px solid #D8D0C0; border-radius: 4px; padding: 16px; margin-top: 20px; }
        .ci-meeting-title { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 600; color: #1A1A18; margin-bottom: 4px; }
        .ci-meeting-date { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #C4873A; margin-bottom: 6px; }
        .ci-meeting-desc { font-size: 12px; color: #8A8578; line-height: 1.5; margin-bottom: 8px; }
        .ci-meeting-link { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #4A7C59; text-decoration: none; letter-spacing: 0.08em; margin-bottom: 10px; }
        .ci-meeting-link:hover { text-decoration: underline; }
        .ci-calendar-btn { background: transparent; border: 1px solid #D8D0C0; color: #3D3D38; padding: 7px 14px; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; width: 100%; transition: all 0.15s; }
        .ci-calendar-btn:hover { border-color: #1C2B1E; color: #1C2B1E; }
        .ci-tabs { display: flex; gap: 24px; border-bottom: 1px solid #D8D0C0; margin-bottom: 24px; }
        .ci-tab { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #8A8578; padding-bottom: 10px; border-bottom: 2px solid transparent; cursor: pointer; background: none; border-top: none; border-left: none; border-right: none; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: all 0.15s; margin-bottom: -1px; }
        .ci-tab:hover { color: #1A1A18; }
        .ci-tab.active { color: #1A1A18; border-bottom-color: #1C2B1E; }
        .ci-reflections-title { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 400; color: #1A1A18; margin-bottom: 20px; }
        .ci-reflection-item { padding: 20px 0; border-bottom: 1px solid #D8D0C0; }
        .ci-reflection-item:last-child { border-bottom: none; }
        .ci-reflection-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
        .ci-reflection-dot { width: 6px; height: 6px; border-radius: 50%; background: #4A7C59; flex-shrink: 0; }
        .ci-reflection-author { font-size: 13px; font-weight: 500; color: #1A1A18; }
        .ci-reflection-chapter { font-size: 11px; color: #8A8578; letter-spacing: 0.08em; text-transform: uppercase; }
        .ci-reflection-time { font-size: 11px; color: #8A8578; margin-left: auto; }
        .ci-reflection-text { font-family: 'Libre Baskerville', serif; font-size: 14px; font-style: italic; color: #3D3D38; line-height: 1.8; margin-bottom: 12px; padding-left: 14px; }
        .ci-reflection-actions { display: flex; gap: 14px; padding-left: 14px; align-items: flex-start; flex-direction: column; }
        .ci-reaction-btns { display: flex; gap: 14px; }
        .ci-reaction-btn { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #8A8578; background: none; border: none; cursor: pointer; padding: 0; font-family: 'DM Sans', sans-serif; transition: color 0.15s; }
        .ci-reaction-btn:hover { color: #1A1A18; }
        .ci-reaction-btn.liked { color: #C4873A; }
        .ci-add-reflection { position: fixed; bottom: 32px; right: 32px; width: 48px; height: 48px; border-radius: 50%; background: #1C2B1E; color: #fff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.2); transition: background 0.15s; z-index: 50; }
        .ci-add-reflection:hover { background: #2A3D2D; }
        .ci-empty { text-align: center; padding: 40px 16px; color: #8A8578; font-family: 'Libre Baskerville', serif; font-style: italic; font-size: 13px; }
      `}</style>

      <div className="ci-page">
        <div className="ci-topbar">
          <div className="ci-club-name">{clubData.name}</div>
          <div className="ci-topbar-actions">
            <button className="ci-icon-btn"><Search size={14} /></button>
            <NotificationsBell clubId={id} />
            {isOwner && <SettingsDialog club={clubData} clubId={id} />}
            <InviteMembersDialog clubId={id} />
            {isMember && !isOwner && (
              <button className="ci-btn-outline" onClick={handleLeaveClub}>Leave</button>
            )}
          </div>
        </div>

        <div className="ci-hero">
          {mySharedBook ? (
            <img src={mySharedBook.coverUrl || `https://picsum.photos/seed/${mySharedBook.bookId}/140/200`} alt={mySharedBook.title} className="ci-book-cover" />
          ) : sharedBooks[0] ? (
            <img src={sharedBooks[0].coverUrl || `https://picsum.photos/seed/${sharedBooks[0].bookId}/140/200`} alt={sharedBooks[0].title} className="ci-book-cover" />
          ) : (
            <div className="ci-book-cover-placeholder"><BookOpen size={28} /></div>
          )}
          <div>
            <div style={{ marginBottom: 8 }}>
              <span className="ci-pick-label">Current Pick</span>
              {clubData.theme && <span className="ci-pick-genre">{clubData.theme}</span>}
            </div>
            <div className="ci-book-title">{mySharedBook?.title || sharedBooks[0]?.title || clubData.name}</div>
            <div className="ci-book-author">{mySharedBook?.author || sharedBooks[0]?.author || clubData.description}</div>
            <div className="ci-progress-label">
              <span>Collective Progress</span>
              <span>{avgProgress}%</span>
            </div>
            <div className="ci-progress-bar">
              <div className="ci-progress-fill" style={{ width: `${avgProgress}%` }} />
            </div>
            <div className="ci-hero-actions">
              <Link href={`/clubs/${id}/session`} className="ci-enter-room-btn">
                <BookOpen size={14} />Enter Reading Room →
              </Link>
              {!mySharedBook ? (
                <ShareBookDialog clubId={id} onShare={handleShareBook} />
              ) : (
                <UpdateProgressDialog sharedBook={mySharedBook} clubId={id} />
              )}
            </div>
          </div>
        </div>

        <div className="ci-two-col">
          <div>
            <div className="ci-circle-title">The Circle</div>
            {clubMembers.length === 0 ? (
              <p style={{ fontSize: 12, color: '#8A8578', fontStyle: 'italic', fontFamily: "'Libre Baskerville', serif" }}>No members yet.</p>
            ) : (
              clubMembers.map((m) => {
                const memberBook = sharedBooks.find(b => b.userId === m.userId);
                return (
                  <div key={m.userId} className="ci-member-item">
                    <Avatar style={{ width: 36, height: 36, flexShrink: 0 }}>
                      {/* Real avatarUrl from member record */}
                      <AvatarImage src={m.avatarUrl || ''} />
                      <AvatarFallback style={{ background: '#2A3D2D', color: '#fff', fontSize: 13, fontFamily: "'Playfair Display', serif" }}>
                        {(m.name || m.userId)?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Real name from member record */}
                      <div className="ci-member-name">{m.name || m.userId?.slice(0, 14)}</div>
                      <div className="ci-member-role">{m.role === 'owner' ? 'Host & Curator' : 'Member'}</div>
                      {(memberBook?.chapter || m.currentChapter) && (
                        <div className="ci-member-chapter">{memberBook?.chapter || m.currentChapter}</div>
                      )}
                      {memberBook?.pageCount && memberBook?.currentPage && (
                        <div style={{ fontSize: 10, color: '#8A8578' }}>p. {memberBook.currentPage} / {memberBook.pageCount}</div>
                      )}
                    </div>
                    {isOwner && m.userId !== user?.uid && (
                      <button onClick={() => handleRemoveMember(m.userId)} style={{ background: 'none', border: 'none', color: '#D8D0C0', cursor: 'pointer', padding: 4, flexShrink: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#C62828')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#D8D0C0')}>
                        <UserMinus size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}

            <div className="ci-meeting-box">
              <div className="ci-meeting-title">Next Meeting</div>
              {nextMeeting?.date ? (
                <>
                  <div className="ci-meeting-date">
                    {new Date(nextMeeting.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    {nextMeeting.time && ` · ${nextMeeting.time}`}
                  </div>
                  {nextMeeting.description && <div className="ci-meeting-desc">{nextMeeting.description}</div>}
                  {/* ── Meeting link — visible to ALL members ── */}
                  {nextMeeting.meetingLink && (
                    <a href={nextMeeting.meetingLink} target="_blank" rel="noopener noreferrer" className="ci-meeting-link">
                      🔗 Join Meeting →
                    </a>
                  )}
                </>
              ) : (
                <p style={{ fontSize: 12, color: '#8A8578', fontStyle: 'italic', marginBottom: 10 }}>No meeting scheduled yet.</p>
              )}
              {isOwner ? (
                <NextMeetingEditor clubId={id} meeting={nextMeeting} />
              ) : nextMeeting?.date ? (
                <button
                  className="ci-calendar-btn"
                  onClick={() => {
                    const title = encodeURIComponent(`${clubData.name} Meeting`);
                    const details = encodeURIComponent(nextMeeting.description || '');
                    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`, '_blank');
                  }}
                >
                  Add to Calendar
                </button>
              ) : null}
            </div>
          </div>

          <div>
            <div className="ci-tabs">
              <button className={`ci-tab${activeTab === 'reflections' ? ' active' : ''}`} onClick={() => setActiveTab('reflections')}>
                Reflections {reflections.length > 0 && `(${reflections.length})`}
              </button>
              <button className={`ci-tab${activeTab === 'members' ? ' active' : ''}`} onClick={() => setActiveTab('members')}>
                Members ({clubMembers.length})
              </button>
              <button className={`ci-tab${activeTab === 'activity' ? ' active' : ''}`} onClick={() => setActiveTab('activity')}>Activity</button>
            </div>

            {activeTab === 'reflections' && (
              <>
                <div className="ci-reflections-title">Reflections</div>
                {reflections.length === 0 ? (
                  <div className="ci-empty">No reflections yet.<br />Press + to share your first thought.</div>
                ) : (
                  reflections.map((r) => {
                    const liked = r.likedBy?.includes(user?.uid);
                    return (
                      <div key={r.id} className="ci-reflection-item">
                        <div className="ci-reflection-meta">
                          <span className="ci-reflection-dot" />
                          <span className="ci-reflection-author">{r.userName || r.userId?.slice(0, 12)}</span>
                          {r.chapter && <span className="ci-reflection-chapter">· {r.chapter}</span>}
                          {r.bookTitle && <span style={{ fontSize: 11, color: '#8A8578', fontStyle: 'italic', fontFamily: "'Libre Baskerville', serif" }}>· {r.bookTitle}</span>}
                          <span className="ci-reflection-time">{timeAgo(r.timestamp)}</span>
                        </div>
                        <div className="ci-reflection-text">"{r.content}"</div>
                        <div className="ci-reflection-actions">
                          <div className="ci-reaction-btns">
                            <button
                              className={`ci-reaction-btn${liked ? ' liked' : ''}`}
                              onClick={() => handleLikeReflection(r.id, r.likedBy || [])}
                            >
                              <Heart size={12} style={{ fill: liked ? 'currentColor' : 'none' }} />
                              {r.likes || 0}
                            </button>
                            {/* ── Real comments ── */}
                            <ReflectionComments clubId={id} reflectionId={r.id} commentCount={r.commentCount || 0} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {activeTab === 'members' && (
              <div>
                {clubMembers.length === 0 ? (
                  <div className="ci-empty">No members yet.</div>
                ) : (
                  clubMembers.map((m) => {
                    const memberBook = sharedBooks.find(b => b.userId === m.userId);
                    return (
                      <div key={m.userId} className="ci-member-item" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar style={{ width: 40, height: 40 }}>
                            <AvatarImage src={m.avatarUrl || ''} />
                            <AvatarFallback style={{ background: '#2A3D2D', color: '#fff', fontFamily: "'Playfair Display', serif" }}>
                              {(m.name || m.userId)?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="ci-member-name">{m.name || m.userId}</div>
                            <div className="ci-member-role">{m.role}</div>
                            {memberBook && (
                              <div style={{ fontSize: 11, color: '#8A8578', marginTop: 2 }}>
                                {memberBook.title} · {memberBook.progressPercent ?? 0}%
                                {memberBook.pageCount && memberBook.currentPage && ` · p.${memberBook.currentPage}/${memberBook.pageCount}`}
                              </div>
                            )}
                          </div>
                        </div>
                        {isOwner && m.userId !== user?.uid && (
                          <button onClick={() => handleRemoveMember(m.userId)} style={{ background: 'none', border: 'none', color: '#D8D0C0', cursor: 'pointer', padding: 4 }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#C62828')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#D8D0C0')}>
                            <UserMinus size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })
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
                        <span className="ci-reflection-dot" style={{ background: act.type === 'finished-book' ? '#C4873A' : '#4A7C59' }} />
                        <span className="ci-reflection-author">{act.userName || act.userId?.slice(0, 12)}</span>
                        <span className="ci-reflection-time">{timeAgo(act.timestamp)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#8A8578', paddingLeft: 14, fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic' }}>
                        {act.type === 'finished-book' && `Finished ${act.bookTitle}`}
                        {act.type === 'started-book' && `Started reading ${act.bookTitle}`}
                        {act.type === 'joined-club' && 'Joined the circle'}
                        {act.type === 'shared-quote' && `Shared a reflection${act.bookTitle ? ` from ${act.bookTitle}` : ''}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {isMember && <PostReflectionDialog clubId={id} onPost={handlePostReflection} />}
      </div>
    </>
  );
}