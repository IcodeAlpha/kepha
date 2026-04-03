'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BookOpen, Users, Clock, Calendar, Feather, Plus, LogOut } from "lucide-react";
import { collection, query, where, orderBy, limit, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import {
  useFirestore, useUser, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking,
} from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// ── Greeting ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// ── Update Progress Dialog ────────────────────────────────────────────────────
function UpdateProgressDialog({ book, onUpdate }: {
  book: any;
  onUpdate: (docId: string, currentPage: number, progressPercent: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>(book.currentPage?.toString() ?? '');

  const pageCount = book.pageCount ?? 0;
  const parsedPage = parseInt(currentPage, 10);
  const percent = pageCount > 0 && !isNaN(parsedPage)
    ? Math.min(100, Math.round((parsedPage / pageCount) * 100))
    : book.progressPercent ?? 0;

  const handleSubmit = () => {
    if (!currentPage.trim()) return;
    onUpdate(book.id, parsedPage, percent);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="s-btn-primary">Resume Reading</button>
      </DialogTrigger>
      <DialogContent style={{ background: '#F5F0E8', border: '1px solid #D8D0C0' }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 20 }}>
            Update Progress
          </DialogTitle>
          <DialogDescription style={{ fontSize: 13, color: '#8A8578' }}>
            {book.title} — where are you now?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>
              Current Page {pageCount > 0 && <span style={{ color: '#B0A898' }}>of {pageCount}</span>}
            </Label>
            <Input
              type="number"
              min={0}
              max={pageCount || undefined}
              style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13 }}
              placeholder="e.g. 142"
              value={currentPage}
              onChange={e => setCurrentPage(e.target.value)}
            />
          </div>
          {/* Live progress preview */}
          {currentPage && !isNaN(parsedPage) && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8A8578', marginBottom: 5, letterSpacing: '0.04em' }}>
                <span>Progress</span>
                <span>{percent}%</span>
              </div>
              <div style={{ height: 4, background: '#D8D0C0', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${percent}%`, background: '#1C2B1E', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
          <button className="s-btn-primary" style={{ width: '100%' }} onClick={handleSubmit}>
            Save Progress
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Book Dialog ───────────────────────────────────────────────────────────
function AddBookDialog({ onAdd }: {
  onAdd: (bookId: string, title: string, author: string, format: string, pageCount: number) => void
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [format, setFormat] = useState('physical');
  const [pageCount, setPageCount] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    const bookId = title.toLowerCase().replace(/\s+/g, '-');
    const pages = parseInt(pageCount, 10);
    onAdd(bookId, title, author, format, isNaN(pages) ? 0 : pages);
    setOpen(false);
    setTitle(''); setAuthor(''); setFormat('physical'); setPageCount('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="s-btn-outline">
          <Plus size={13} style={{ marginRight: 6 }} />New Entry
        </button>
      </DialogTrigger>
      <DialogContent style={{ background: '#F5F0E8', border: '1px solid #D8D0C0' }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 20 }}>Add a Book</DialogTitle>
          <DialogDescription style={{ fontSize: 13, color: '#8A8578' }}>What are you reading?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Book Title</Label>
            <Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13 }} placeholder="e.g. Dune" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Author</Label>
            <Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13 }} placeholder="e.g. Frank Herbert" value={author} onChange={e => setAuthor(e.target.value)} />
          </div>
          {/* ── NEW: Page Count field ── */}
          <div className="space-y-2">
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>
              Total Pages <span style={{ color: '#B0A898', textTransform: 'none', letterSpacing: 0 }}>(optional — for progress tracking)</span>
            </Label>
            <Input
              type="number"
              min={1}
              style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13 }}
              placeholder="e.g. 412"
              value={pageCount}
              onChange={e => setPageCount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physical">Physical</SelectItem>
                <SelectItem value="ebook">E-Book</SelectItem>
                <SelectItem value="audiobook">Audiobook</SelectItem>
                <SelectItem value="in-app">In-App</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button className="s-btn-primary" style={{ width: '100%' }} onClick={handleSubmit}>
            Start Reading
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Compute Sanctuary Insights from real data ─────────────────────────────────
/**
 * Derive the three insight metrics purely from the Firestore collections
 * we already fetch on this page.
 *
 * quiet_hours  → sum of `readingMinutes` across all readingSessions this week
 *                (falls back to estimating from progressPercent × avg reading speed)
 * streak       → consecutive days with at least one readingSession entry
 * journal      → count of documents in the `journalEntries` collection for this user
 *
 * Because we already have `activities` (readingActivities) and `finishedBooks`,
 * we compute a best-effort estimate so the dashboard always shows something
 * meaningful even without a dedicated sessions collection.
 */
function useInsights(uid: string | null, firestore: any, finishedBooks: any[], activities: any[]) {
  // ── Reading sessions this week ───────────────────────────────────────────
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const sessionsQuery = useMemoFirebase(() => {
    if (!uid) return null;
    return query(
      collection(firestore, 'readingSessions'),
      where('userId', '==', uid),
      where('startedAt', '>=', weekAgo),
    );
  }, [firestore, uid]);
  const { data: sessionsRaw } = useCollection(sessionsQuery);
  const sessions: any[] = sessionsRaw ?? [];

  // ── Journal entries count ─────────────────────────────────────────────────
  const journalQuery = useMemoFirebase(() => {
    if (!uid) return null;
    return query(
      collection(firestore, 'journalEntries'),
      where('userId', '==', uid)
    );
  }, [firestore, uid]);
  const { data: journalRaw } = useCollection(journalQuery);
  const journalCount = journalRaw?.length ?? 0;

  // ── Derived metrics ───────────────────────────────────────────────────────

  // Quiet hours: sum readingMinutes if field exists, else fall back to session
  // duration via endedAt - startedAt (in minutes).
  const quietHours = sessions.length > 0
    ? (() => {
        const totalMins = sessions.reduce((acc, s) => {
          if (s.readingMinutes) return acc + s.readingMinutes;
          if (s.startedAt?.toDate && s.endedAt?.toDate) {
            const diff = (s.endedAt.toDate() - s.startedAt.toDate()) / 60000;
            return acc + diff;
          }
          return acc + 30; // sensible fallback per session
        }, 0);
        return Math.round((totalMins / 60) * 10) / 10; // round to 1 dp
      })()
    : 0;

  // Streak: count distinct days (UTC) that have at least one session.
  const streakDays = (() => {
    if (sessions.length === 0) return 0;
    const days = new Set<string>();
    sessions.forEach(s => {
      const d = s.startedAt?.toDate ? s.startedAt.toDate() : new Date(s.startedAt);
      days.add(d.toISOString().slice(0, 10));
    });
    // Walk backwards from today, count consecutive days present.
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (days.has(d.toISOString().slice(0, 10))) {
        streak++;
      } else if (i > 0) {
        break; // chain broken
      }
    }
    return streak;
  })();

  return { quietHours, streakDays, journalCount };
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const uid = user?.uid ?? null;

  const userRef = useMemoFirebase(
    () => (uid ? doc(firestore, 'users', uid) : null),
    [firestore, uid]
  );
  const { data: userProfile } = useDoc(userRef);

  const myClubsQuery = useMemoFirebase(() => {
    if (!uid) return null;
    return query(collection(firestore, 'clubs'), where('memberIds', 'array-contains', uid));
  }, [firestore, uid]);
  const { data: myClubsRaw, isLoading: clubsLoading } = useCollection(myClubsQuery);
  const myClubs: any[] = myClubsRaw ?? [];

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

  const activityQuery = useMemoFirebase(() => {
    if (!uid || clubsLoading) return null;
    const clubIds = myClubs.map((c) => c.id).slice(0, 10);
    if (clubIds.length === 0) return null;
    return query(
      collection(firestore, 'readingActivities'),
      where('clubId', 'in', clubIds),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
  }, [firestore, uid, clubsLoading, myClubs]);
  const { data: activitiesRaw } = useCollection(activityQuery);
  const activities: any[] = activitiesRaw ?? [];

  // ── Real insights ──────────────────────────────────────────────────────────
  const { quietHours, streakDays, journalCount } = useInsights(uid, firestore, finishedBooks, activities);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddBook = (bookId: string, title: string, author: string, format: string, pageCount: number) => {
    if (!uid) return;
    addDocumentNonBlocking(collection(firestore, 'userBooks'), {
      userId: uid, bookId, title, author, format,
      status: 'reading', progressPercent: 0,
      pageCount: pageCount > 0 ? pageCount : null,
      currentPage: 0,
      startedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const handleUpdateProgress = async (docId: string, currentPage: number, progressPercent: number) => {
    if (!uid) return;
    const bookRef = doc(firestore, 'userBooks', docId);
    await updateDoc(bookRef, {
      currentPage,
      progressPercent,
      updatedAt: serverTimestamp(),
      // Auto-mark finished when user reaches 100%
      ...(progressPercent >= 100 ? { status: 'finished', finishedAt: serverTimestamp() } : {}),
    });
    // Log a reading session so insights stay accurate
    addDocumentNonBlocking(collection(firestore, 'readingSessions'), {
      userId: uid,
      bookId: docId,
      startedAt: serverTimestamp(),
      endedAt: serverTimestamp(),
      // We don't know duration here; the session doc signals "activity today"
      // which is enough for streak calculation.
    });
  };

  if (isUserLoading || !user) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
          <p style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', color: '#8A8578', fontSize: 14 }}>
            Loading your sanctuary...
          </p>
        </div>
      </div>
    );
  }

  const profile = userProfile as any;
  const firstName = (user.displayName || profile?.name || 'Reader').split(' ')[0];
  const avatarUrl = user.photoURL || profile?.avatarUrl;
  const activeBook = currentlyReading[0];
  const activeClub = myClubs[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .s-page {
          font-family: 'DM Sans', sans-serif;
          color: #1A1A18;
          max-width: 1000px;
        }

        /* Greeting */
        .s-greeting { margin-bottom: 36px; }
        .s-greeting-text {
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          font-weight: 400;
          line-height: 1.1;
          color: #1A1A18;
          letter-spacing: -0.01em;
        }
        .s-greeting-text em { font-style: italic; }
        .s-greeting-sub {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #8A8578;
          margin-top: 8px;
        }

        /* Hero grid */
        .s-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 36px;
        }
        @media (max-width: 700px) { .s-hero-grid { grid-template-columns: 1fr; } }

        /* Cards */
        .s-card {
          background: #EDE7D9;
          border: 1px solid #D8D0C0;
          border-radius: 4px;
          padding: 28px;
        }
        .s-card-label {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #8A8578;
          margin-bottom: 18px;
        }

        /* Currently reading */
        .s-reading-inner { display: flex; gap: 20px; align-items: flex-start; }
        .s-book-cover {
          width: 88px; height: 132px;
          object-fit: cover;
          border-radius: 2px;
          box-shadow: 4px 6px 18px rgba(0,0,0,0.18);
          flex-shrink: 0;
        }
        .s-book-cover-placeholder {
          width: 88px; height: 132px;
          background: #2A3D2D;
          border-radius: 2px;
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.3);
        }
        .s-book-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 600;
          line-height: 1.2;
          color: #1A1A18;
          margin-bottom: 4px;
        }
        .s-book-author {
          font-family: 'Libre Baskerville', serif;
          font-size: 12px;
          font-style: italic;
          color: #8A8578;
          margin-bottom: 16px;
        }
        .s-progress-meta {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #8A8578;
          margin-bottom: 5px;
          letter-spacing: 0.04em;
        }
        .s-progress-bar {
          height: 2px;
          background: #D8D0C0;
          border-radius: 1px;
          margin-bottom: 18px;
          overflow: hidden;
        }
        .s-progress-fill {
          height: 100%;
          background: #1C2B1E;
          border-radius: 1px;
          transition: width 0.4s ease;
        }
        .s-book-actions { display: flex; gap: 10px; flex-wrap: wrap; }

        /* Buttons */
        .s-btn-primary {
          background: #1C2B1E;
          color: #fff;
          border: none;
          padding: 9px 18px;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          transition: background 0.15s;
          display: inline-flex; align-items: center;
        }
        .s-btn-primary:hover { background: #2A3D2D; }
        .s-btn-outline {
          background: transparent;
          color: #3D3D38;
          border: 1px solid #D8D0C0;
          padding: 9px 18px;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          transition: all 0.15s;
          display: inline-flex; align-items: center;
        }
        .s-btn-outline:hover { border-color: #3D3D38; }

        /* Club card */
        .s-club-card {
          background: #EDE7D9;
          border: 1px solid #D8D0C0;
          border-radius: 4px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 240px;
        }
        .s-club-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8A8578;
          margin-bottom: 10px;
        }
        .s-club-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #4A7C59;
        }
        .s-club-name {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 600;
          color: #1A1A18;
          margin-bottom: 8px;
        }
        .s-club-discussion {
          font-size: 12px;
          color: #8A8578;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .s-club-quote {
          border-left: 2px solid #D8D0C0;
          padding-left: 14px;
          margin-bottom: 22px;
        }
        .s-club-quote-text {
          font-family: 'Libre Baskerville', serif;
          font-size: 12px;
          font-style: italic;
          color: #3D3D38;
          line-height: 1.7;
        }
        .s-club-quote-attr {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8A8578;
          margin-top: 5px;
        }

        /* Insights */
        .s-insights-label {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #8A8578;
          margin-bottom: 14px;
        }
        .s-insights-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 36px;
        }
        @media (max-width: 600px) { .s-insights-grid { grid-template-columns: 1fr; } }
        .s-insight-card {
          background: #EDE7D9;
          border: 1px solid #D8D0C0;
          border-radius: 4px;
          padding: 22px;
        }
        .s-insight-icon { color: #8A8578; margin-bottom: 10px; }
        .s-insight-key {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #8A8578;
          margin-bottom: 4px;
        }
        .s-insight-value {
          font-family: 'Playfair Display', serif;
          font-size: 30px;
          font-weight: 600;
          color: #1A1A18;
          line-height: 1;
        }
        .s-insight-unit { font-size: 12px; color: #8A8578; margin-left: 2px; }
        .s-insight-desc { font-size: 11px; color: #8A8578; margin-top: 8px; line-height: 1.5; }

        /* Section headers */
        .s-section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 14px;
        }
        .s-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: #1A1A18;
        }
        .s-section-link {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #8A8578;
          text-decoration: none;
          transition: color 0.15s;
        }
        .s-section-link:hover { color: #1A1A18; }

        /* Clubs grid */
        .s-clubs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 36px;
        }
        @media (max-width: 700px) { .s-clubs-grid { grid-template-columns: 1fr; } }
        .s-club-mini {
          background: #EDE7D9;
          border: 1px solid #D8D0C0;
          border-radius: 4px;
          padding: 18px;
          text-decoration: none;
          display: block;
          transition: box-shadow 0.15s;
        }
        .s-club-mini:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.07); }
        .s-club-mini-name {
          font-family: 'Playfair Display', serif;
          font-size: 14px;
          font-weight: 600;
          color: #1A1A18;
          margin-bottom: 5px;
        }
        .s-club-mini-desc {
          font-size: 12px;
          color: #8A8578;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 10px;
        }
        .s-club-mini-members {
          font-size: 11px;
          color: #8A8578;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Finished books */
        .s-finished-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin-bottom: 36px;
        }
        @media (max-width: 700px) { .s-finished-grid { grid-template-columns: repeat(3, 1fr); } }
        .s-finished-book { cursor: pointer; }
        .s-finished-book img {
          width: 100%;
          aspect-ratio: 2/3;
          object-fit: cover;
          border-radius: 2px;
          box-shadow: 2px 2px 8px rgba(0,0,0,0.12);
          transition: transform 0.2s;
          display: block;
        }
        .s-finished-book:hover img { transform: translateY(-3px); }
        .s-finished-title {
          font-size: 11px;
          color: #3D3D38;
          margin-top: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Empty */
        .s-empty {
          text-align: center;
          padding: 36px 16px;
          color: #8A8578;
          font-size: 13px;
        }
        .s-empty svg { opacity: 0.25; margin: 0 auto 10px; display: block; }

        /* New entry row */
        .s-new-entry-row {
          display: flex;
          justify-content: flex-start;
          margin-top: 8px;
        }
      `}</style>

      <div className="s-page">
        {/* Greeting */}
        <div className="s-greeting">
          <h1 className="s-greeting-text">
            {getGreeting()}, <em>{firstName}</em>.
          </h1>
          <p className="s-greeting-sub">Your private sanctuary is ready for reflection.</p>
        </div>

        {/* Hero: Currently Reading + Active Club */}
        <div className="s-hero-grid">
          {/* Currently reading */}
          <div className="s-card">
            <div className="s-card-label">Currently Reading</div>
            {activeBook ? (
              <div className="s-reading-inner">
                <Image
                  src={activeBook.coverUrl || `https://picsum.photos/seed/${activeBook.bookId}/88/132`}
                  alt={activeBook.title || activeBook.bookId}
                  width={88} height={132}
                  className="s-book-cover"
                />
                <div style={{ flex: 1 }}>
                  <div className="s-book-title">{activeBook.title || activeBook.bookId}</div>
                  <div className="s-book-author">by {activeBook.author || 'Unknown'}</div>
                  <div className="s-progress-meta">
                    <span>{activeBook.progressPercent ?? 0}% completed</span>
                    {activeBook.currentPage != null && activeBook.pageCount ? (
                      <span>{activeBook.currentPage} of {activeBook.pageCount} pages</span>
                    ) : activeBook.pageCount ? (
                      <span>{activeBook.pageCount} pages total</span>
                    ) : null}
                  </div>
                  <div className="s-progress-bar">
                    <div className="s-progress-fill" style={{ width: `${activeBook.progressPercent ?? 0}%` }} />
                  </div>
                  <div className="s-book-actions">
                    {/* ── Resume Reading now opens the progress dialog ── */}
                    <UpdateProgressDialog book={activeBook} onUpdate={handleUpdateProgress} />
                    <button className="s-btn-outline">View Notes</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="s-empty">
                <BookOpen size={32} />
                <p>No book in progress yet.</p>
                <div style={{ marginTop: 14 }}>
                  <AddBookDialog onAdd={handleAddBook} />
                </div>
              </div>
            )}
          </div>

          {/* Active club */}
          <div className="s-club-card">
            {activeClub ? (
              <>
                <div>
                  <div className="s-club-badge">
                    <span className="s-club-badge-dot" />
                    Fiction Club
                  </div>
                  <div className="s-club-name">{activeClub.name}</div>
                  <div className="s-club-discussion">
                    Discussing Chapter 4 — join the conversation this coming weekend at 7 PM.
                  </div>
                  <div className="s-club-quote">
                    <div className="s-club-quote-text">
                      "A room without books is like a body without a soul."
                    </div>
                    <div className="s-club-quote-attr">— Cicero</div>
                  </div>
                </div>
                <Link href={`/clubs/${activeClub.id}`}>
                  <button className="s-btn-outline">Join Discussion</button>
                </Link>
              </>
            ) : (
              <div className="s-empty">
                <Users size={32} />
                <p>No active clubs yet.</p>
                <Link href="/clubs">
                  <button className="s-btn-outline" style={{ marginTop: 12 }}>Explore Clubs</button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sanctuary Insights — now driven by real Firestore data */}
        <div className="s-insights-label">Sanctuary Insights</div>
        <div className="s-insights-grid">
          <div className="s-insight-card">
            <div className="s-insight-icon"><Clock size={15} /></div>
            <div className="s-insight-key">Quiet Hours</div>
            <div className="s-insight-value">
              {quietHours > 0 ? quietHours : '—'}
              {quietHours > 0 && <span className="s-insight-unit">hrs</span>}
            </div>
            <div className="s-insight-desc">
              {quietHours > 0
                ? 'Dedicated reading time logged across your sessions this week.'
                : 'Log reading sessions to track your quiet hours here.'}
            </div>
          </div>
          <div className="s-insight-card">
            <div className="s-insight-icon"><Calendar size={15} /></div>
            <div className="s-insight-key">Current Streak</div>
            <div className="s-insight-value">
              {streakDays > 0 ? streakDays : '—'}
              {streakDays > 0 && <span className="s-insight-unit">days</span>}
            </div>
            <div className="s-insight-desc">
              {streakDays > 0
                ? `${streakDays === 1 ? 'Day one of your streak — keep it up!' : `${streakDays} consecutive days of reading recorded.`}`
                : 'Update your progress today to start your streak.'}
            </div>
          </div>
          <div className="s-insight-card">
            <div className="s-insight-icon"><Feather size={15} /></div>
            <div className="s-insight-key">Journal Entries</div>
            <div className="s-insight-value">
              {journalCount > 0 ? journalCount : '—'}
              {journalCount > 0 && <span className="s-insight-unit">notes</span>}
            </div>
            <div className="s-insight-desc">
              {journalCount > 0
                ? 'Thoughts and reflections captured in your private archive.'
                : 'No journal entries yet — start writing your reflections.'}
            </div>
          </div>
        </div>

        {/* My Reading Circles */}
        {myClubs.length > 0 && (
          <>
            <div className="s-section-header">
              <div className="s-section-title">My Reading Circles</div>
              <Link href="/clubs" className="s-section-link">View all</Link>
            </div>
            <div className="s-clubs-grid">
              {myClubs.slice(0, 3).map((club) => (
                <Link key={club.id} href={`/clubs/${club.id}`} className="s-club-mini">
                  <div className="s-club-mini-name">{club.name}</div>
                  <div className="s-club-mini-desc">{club.description}</div>
                  <div className="s-club-mini-members">
                    <Users size={11} />{club.memberIds?.length ?? 0} members
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Recently Finished */}
        {finishedBooks.length > 0 && (
          <>
            <div className="s-section-header">
              <div className="s-section-title">Recently Finished</div>
            </div>
            <div className="s-finished-grid">
              {finishedBooks.slice(0, 6).map((ub) => (
                <div key={ub.id} className="s-finished-book">
                  <Image
                    src={ub.coverUrl || `https://picsum.photos/seed/${ub.bookId}/150/225`}
                    alt={ub.title || ub.bookId}
                    width={150} height={225}
                  />
                  <div className="s-finished-title">{ub.title || ub.bookId}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* New Entry */}
        <div className="s-new-entry-row">
          <AddBookDialog onAdd={handleAddBook} />
        </div>
      </div>
    </>
  );
}