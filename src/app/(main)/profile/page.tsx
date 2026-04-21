'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Archive, BookOpen, Users, TrendingUp, Flame } from "lucide-react";
import { collection, query, where, doc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import {
  useFirestore, useUser, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking,
} from '@/firebase';

// ── Edit Profile Dialog ───────────────────────────────────────────────────────
function EditProfileDialog({ profile, onSave }: {
  profile: any;
  onSave: (data: { name: string; bio: string; favoriteGenres: string[]; readingStyle: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [genresInput, setGenresInput] = useState((profile?.favoriteGenres ?? []).join(', '));
  const [readingStyle, setReadingStyle] = useState(profile?.readingStyle || '');

  const handleSave = () => {
    const favoriteGenres = genresInput.split(',').map((g: string) => g.trim()).filter(Boolean);
    onSave({ name, bio, favoriteGenres, readingStyle });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="pp-edit-btn">
          <Pencil size={12} style={{ marginRight: 6 }} />Edit Profile
        </button>
      </DialogTrigger>
      <DialogContent style={{ background: '#F5F0E8', border: '1px solid #D8D0C0', maxWidth: 440 }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 20 }}>Edit Profile</DialogTitle>
          <DialogDescription style={{ fontSize: 13, color: '#8A8578' }}>Update your reading identity.</DialogDescription>
        </DialogHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
          <div>
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Display Name</Label>
            <Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Bio</Label>
            <Textarea style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} />
          </div>
          <div>
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Favorite Genres</Label>
            <Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} value={genresInput} onChange={e => setGenresInput(e.target.value)} placeholder="e.g. Philosophy, Fiction, Poetry" />
            <p style={{ fontSize: 11, color: '#8A8578', marginTop: 4 }}>Separate with commas</p>
          </div>
          <div>
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Reading Style</Label>
            <Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13, marginTop: 4 }} value={readingStyle} onChange={e => setReadingStyle(e.target.value)} placeholder="e.g. Night owl reader" />
          </div>
          <button
            style={{ background: '#1C2B1E', color: '#fff', border: 'none', padding: '10px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user?.uid]
  );
  const { data: userProfileRaw } = useDoc(userDocRef);
  const userProfile = userProfileRaw as any;

  const myClubsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'clubs'), where('memberIds', 'array-contains', user.uid));
  }, [firestore, user?.uid]);
  const { data: myClubsRaw } = useCollection(myClubsQuery);
  const myClubs: any[] = myClubsRaw ?? [];

  const finishedBooksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'userBooks'),
      where('userId', '==', user.uid),
      where('status', '==', 'finished')
    );
  }, [firestore, user?.uid]);
  const { data: finishedBooksRaw } = useCollection(finishedBooksQuery);
  const finishedBooks: any[] = finishedBooksRaw ?? [];

  const currentlyReadingQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'userBooks'),
      where('userId', '==', user.uid),
      where('status', '==', 'reading')
    );
  }, [firestore, user?.uid]);
  const { data: currentlyReadingRaw } = useCollection(currentlyReadingQuery);
  const currentlyReading: any[] = currentlyReadingRaw ?? [];

  // Reflections = personal journal entries (user's own reflections across all clubs)
  const reflectionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'userReflections', user.uid, 'entries'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
  }, [firestore, user?.uid]);
  const { data: reflectionsRaw } = useCollection(reflectionsQuery);
  const myReflections: any[] = reflectionsRaw ?? [];

  const handleSaveProfile = (data: { name: string; bio: string; favoriteGenres: string[]; readingStyle: string }) => {
    if (!user) return;
    updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
      ...data, updatedAt: serverTimestamp(),
    });
  };

  if (isUserLoading || !user) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
          <p style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', color: '#8A8578', fontSize: 13 }}>Loading your sanctuary...</p>
        </div>
      </div>
    );
  }

  const displayName = userProfile?.name || user.displayName || 'Reader';
  const avatarUrl = user.photoURL || userProfile?.avatarUrl;
  const bio = userProfile?.bio;
  const favoriteGenres: string[] = userProfile?.favoriteGenres ?? [];
  const memberSince = userProfile?.createdAt?.toDate
    ? new Date(userProfile.createdAt.toDate()).getFullYear()
    : new Date().getFullYear();

  // Stats
  const totalPagesRead = finishedBooks.reduce((sum, b) => sum + (b.pageCount || 0), 0);
  const streak = 12; // would come from a streak tracking system

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .pp-page { font-family: 'DM Sans', sans-serif; color: #1A1A18; max-width: 1000px; }

        /* ── Hero header ── */
        .pp-hero { display: flex; gap: 28px; align-items: flex-start; margin-bottom: 36px; padding-bottom: 32px; border-bottom: 1px solid #D8D0C0; }
        @media (max-width: 600px) { .pp-hero { flex-direction: column; align-items: center; text-align: center; } }
        .pp-avatar { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; flex-shrink: 0; box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
        .pp-avatar-fallback { width: 100px; height: 100px; border-radius: 50%; background: #2A3D2D; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 36px; color: #fff; flex-shrink: 0; }
        .pp-hero-info { flex: 1; }
        .pp-name { font-family: 'Playfair Display', serif; font-size: 44px; font-weight: 400; color: #1A1A18; line-height: 1.05; margin-bottom: 4px; }
        .pp-meta { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #8A8578; margin-bottom: 10px; }
        .pp-bio { font-family: 'Libre Baskerville', serif; font-size: 13px; font-style: italic; color: #5A5550; line-height: 1.7; margin-bottom: 14px; max-width: 480px; }
        .pp-genres { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
        .pp-genre-tag { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #8A8578; border: 1px solid #D8D0C0; padding: 3px 10px; border-radius: 2px; }
        .pp-hero-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .pp-edit-btn { display: inline-flex; align-items: center; background: transparent; border: 1px solid #D8D0C0; color: #3D3D38; padding: 7px 14px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: all 0.15s; }
        .pp-edit-btn:hover { border-color: #1C2B1E; color: #1C2B1E; }
        .pp-archive-btn { display: inline-flex; align-items: center; gap: 6px; background: #1C2B1E; border: none; color: #fff; padding: 7px 14px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: background 0.15s; text-decoration: none; }
        .pp-archive-btn:hover { background: #2A3D2D; }

        /* ── Main grid ── */
        .pp-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
        @media (max-width: 750px) { .pp-grid { grid-template-columns: 1fr; } }

        /* ── Left column ── */
        .pp-section-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 400; color: #1A1A18; margin-bottom: 16px; }
        .pp-section-label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #8A8578; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
        .pp-view-all { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #4A7C59; text-decoration: none; }
        .pp-view-all:hover { text-decoration: underline; }

        /* Club cards */
        .pp-clubs-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
        .pp-club-card { display: flex; align-items: center; gap: 14px; padding: 16px; background: #EDE7D9; border: 1px solid #D8D0C0; border-radius: 4px; text-decoration: none; transition: box-shadow 0.15s; }
        .pp-club-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.07); }
        .pp-club-cover { width: 48px; height: 48px; border-radius: 4px; object-fit: cover; flex-shrink: 0; background: #2A3D2D; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 18px; color: #fff; overflow: hidden; }
        .pp-club-name { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 600; color: #1A1A18; margin-bottom: 2px; }
        .pp-club-meta { font-size: 11px; color: #8A8578; }
        .pp-club-members { display: flex; margin-left: auto; flex-shrink: 0; }
        .pp-member-dot { width: 24px; height: 24px; border-radius: 50%; background: #3D5240; border: 2px solid #F5F0E8; margin-left: -6px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #fff; font-family: 'Playfair Display', serif; overflow: hidden; }
        .pp-member-dot:first-child { margin-left: 0; }

        /* Recent history */
        .pp-history-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 32px; }
        @media (max-width: 600px) { .pp-history-grid { grid-template-columns: repeat(2, 1fr); } }
        .pp-book-item { cursor: pointer; }
        .pp-book-cover-wrap { position: relative; aspect-ratio: 2/3; border-radius: 3px; overflow: hidden; box-shadow: 2px 4px 12px rgba(0,0,0,0.15); margin-bottom: 8px; }
        .pp-book-cover-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s; }
        .pp-book-item:hover .pp-book-cover-wrap img { transform: scale(1.03); }
        .pp-book-rating { position: absolute; bottom: 6px; right: 6px; background: rgba(28,43,30,0.85); color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-weight: 500; }
        .pp-book-title { font-size: 12px; font-weight: 500; color: #1A1A18; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pp-book-author { font-size: 11px; color: #8A8578; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pp-book-date { font-size: 10px; color: #B0A898; margin-top: 1px; }

        /* Journal entries */
        .pp-journal-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
        .pp-journal-count { font-size: 12px; color: #8A8578; font-style: italic; font-family: 'Libre Baskerville', serif; }
        .pp-journal-entry { padding: 18px 0; border-bottom: 1px solid #D8D0C0; }
        .pp-journal-entry:last-child { border-bottom: none; }
        .pp-journal-date { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #8A8578; margin-bottom: 5px; }
        .pp-journal-title { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; color: #1A1A18; margin-bottom: 5px; line-height: 1.3; }
        .pp-journal-excerpt { font-family: 'Libre Baskerville', serif; font-size: 12px; color: #5A5550; line-height: 1.7; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .pp-journal-archive-link { display: block; text-align: center; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #4A7C59; text-decoration: none; margin-top: 20px; padding-top: 16px; border-top: 1px solid #D8D0C0; }
        .pp-journal-archive-link:hover { text-decoration: underline; }

        /* ── Right: Reader's Metric ── */
        .pp-metric-card { background: #1C2B1E; border-radius: 4px; padding: 28px; color: #fff; margin-bottom: 20px; }
        .pp-metric-label { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 20px; }
        .pp-metric-title { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.8); margin-bottom: 24px; }
        .pp-metric-row { margin-bottom: 20px; }
        .pp-metric-value { font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 400; color: #fff; line-height: 1; margin-bottom: 3px; }
        .pp-metric-desc { font-size: 11px; color: rgba(255,255,255,0.45); letter-spacing: 0.06em; text-transform: uppercase; }
        .pp-metric-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 16px 0; }
        .pp-metric-btn { display: block; width: 100%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.7); padding: 10px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; text-align: center; margin-top: 20px; transition: background 0.15s; }
        .pp-metric-btn:hover { background: rgba(255,255,255,0.14); }

        /* Currently reading card */
        .pp-reading-card { background: #EDE7D9; border: 1px solid #D8D0C0; border-radius: 4px; padding: 20px; }
        .pp-reading-inner { display: flex; gap: 14px; align-items: flex-start; }
        .pp-reading-cover { width: 56px; height: 84px; object-fit: cover; border-radius: 2px; box-shadow: 2px 4px 10px rgba(0,0,0,0.15); flex-shrink: 0; }
        .pp-reading-cover-placeholder { width: 56px; height: 84px; background: #2A3D2D; border-radius: 2px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .pp-reading-title { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 600; color: #1A1A18; margin-bottom: 3px; }
        .pp-reading-author { font-size: 12px; color: #8A8578; font-style: italic; font-family: 'Libre Baskerville', serif; margin-bottom: 10px; }
        .pp-reading-progress-bar { height: 2px; background: #D8D0C0; border-radius: 1px; overflow: hidden; }
        .pp-reading-progress-fill { height: 100%; background: #1C2B1E; border-radius: 1px; }
        .pp-reading-pct { font-size: 10px; color: #8A8578; margin-top: 4px; }
        .pp-start-reading-btn { display: block; width: 100%; background: #1C2B1E; border: none; color: #fff; padding: 9px; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-weight: 500; text-align: center; margin-top: 14px; text-decoration: none; transition: background 0.15s; }
        .pp-start-reading-btn:hover { background: #2A3D2D; }

        /* Empty states */
        .pp-empty { text-align: center; padding: 28px 16px; color: #8A8578; font-family: 'Libre Baskerville', serif; font-style: italic; font-size: 13px; }
      `}</style>

      <div className="pp-page">
        {/* ── Hero ── */}
        <div className="pp-hero">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="pp-avatar" />
          ) : (
            <div className="pp-avatar-fallback">{displayName.charAt(0)}</div>
          )}
          <div className="pp-hero-info">
            <h1 className="pp-name">{displayName}</h1>
            <p className="pp-meta">Curator · Member since {memberSince}</p>
            {bio && <p className="pp-bio">{bio}</p>}
            {favoriteGenres.length > 0 && (
              <div className="pp-genres">
                {favoriteGenres.map(g => (
                  <span key={g} className="pp-genre-tag">{g}</span>
                ))}
              </div>
            )}
            <div className="pp-hero-actions">
              <EditProfileDialog profile={userProfile} onSave={handleSaveProfile} />
              <a href="#archive" className="pp-archive-btn">
                <Archive size={11} />Export Archive
              </a>
            </div>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="pp-grid">
          {/* Left column */}
          <div>
            {/* My Clubs */}
            <div className="pp-section-label">
              <span>My Clubs</span>
              <Link href="/clubs" className="pp-view-all">View All Salon →</Link>
            </div>
            {myClubs.length > 0 ? (
              <div className="pp-clubs-list">
                {myClubs.slice(0, 3).map(club => (
                  <Link key={club.id} href={`/clubs/${club.id}`} className="pp-club-card">
                    <div className="pp-club-cover">
                      {club.coverUrl
                        ? <img src={club.coverUrl} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : club.name?.charAt(0)
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="pp-club-name">{club.name}</div>
                      <div className="pp-club-meta">
                        {club.nextMeeting?.date
                          ? `Next meeting: ${new Date(club.nextMeeting.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}${club.nextMeeting.time ? ` · ${club.nextMeeting.time}` : ''}`
                          : `${club.memberIds?.length ?? 0} members`
                        }
                      </div>
                    </div>
                    {/* Member avatars */}
                    <div className="pp-club-members">
                      {(club.memberIds || []).slice(0, 3).map((uid: string, i: number) => (
                        <div key={uid} className="pp-member-dot" style={{ zIndex: 3 - i }}>
                          {uid.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {(club.memberIds?.length ?? 0) > 3 && (
                        <div className="pp-member-dot" style={{ fontSize: 9 }}>
                          +{club.memberIds.length - 3}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="pp-empty" style={{ marginBottom: 32 }}>
                No clubs yet. <Link href="/clubs" style={{ color: '#4A7C59' }}>Explore circles →</Link>
              </div>
            )}

            {/* Recent History */}
            <div className="pp-section-label">
              <span>Recent History</span>
              <span style={{ fontSize: 11, color: '#8A8578', fontStyle: 'italic', fontFamily: "'Libre Baskerville', serif" }}>Chronicles of a Literary Life</span>
            </div>
            {finishedBooks.length > 0 ? (
              <div className="pp-history-grid">
                {finishedBooks.slice(0, 4).map(book => (
                  <div key={book.id} className="pp-book-item">
                    <div className="pp-book-cover-wrap">
                      <img
                        src={book.coverUrl || `https://picsum.photos/seed/${book.bookId}/150/225`}
                        alt={book.title || book.bookId}
                      />
                      {book.rating && (
                        <div className="pp-book-rating">★ {book.rating}</div>
                      )}
                    </div>
                    <div className="pp-book-title">{book.title || book.bookId}</div>
                    <div className="pp-book-author">{book.author || ''}</div>
                    {book.finishedAt && (
                      <div className="pp-book-date">
                        {book.finishedAt.toDate
                          ? new Date(book.finishedAt.toDate()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="pp-empty" style={{ marginBottom: 32 }}>No finished books yet. Keep reading!</div>
            )}

            {/* Journal / Reflections */}
            <div className="pp-journal-header">
              <div className="pp-section-title">Journal Entries</div>
            </div>
            <div className="pp-journal-count">{myReflections.length} Private Reflections</div>
            {myReflections.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                {myReflections.map(r => (
                  <div key={r.id} className="pp-journal-entry">
                    <div className="pp-journal-date">
                      {r.timestamp?.toDate
                        ? new Date(r.timestamp.toDate()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()
                        : ''}
                    </div>
                    <div className="pp-journal-title">
                      {r.bookTitle ? `Reflections on "${r.bookTitle}"` : 'A Reading Reflection'}
                    </div>
                    <div className="pp-journal-excerpt">
                      {r.content}
                    </div>
                  </div>
                ))}
                <a href="#" className="pp-journal-archive-link">Deep Dive Into Archive →</a>
              </div>
            ) : (
              <div className="pp-empty">No journal entries yet. Post reflections in your clubs to build your archive.</div>
            )}
          </div>

          {/* Right column */}
          <div>
            {/* The Reader's Metric */}
            <div className="pp-metric-card">
              <div className="pp-metric-label">The Reader's Metric</div>
              <div className="pp-metric-row">
                <div className="pp-metric-value">{finishedBooks.length}</div>
                <div className="pp-metric-desc">Books finished in {new Date().getFullYear()}</div>
              </div>
              <div className="pp-metric-divider" />
              <div className="pp-metric-row">
                <div className="pp-metric-value">
                  {totalPagesRead > 1000
                    ? `${(totalPagesRead / 1000).toFixed(1)}k`
                    : totalPagesRead || '—'}
                </div>
                <div className="pp-metric-desc">Pages curated</div>
              </div>
              <div className="pp-metric-divider" />
              <div className="pp-metric-row">
                <div className="pp-metric-value">{myClubs.length}</div>
                <div className="pp-metric-desc">Active reading circles</div>
              </div>
              <button className="pp-metric-btn">View Detail & Insights</button>
            </div>

            {/* Currently reading */}
            {currentlyReading.length > 0 && (
              <div className="pp-reading-card">
                <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8A8578', marginBottom: 14 }}>Currently Reading</div>
                <div className="pp-reading-inner">
                  {currentlyReading[0].coverUrl ? (
                    <img src={currentlyReading[0].coverUrl} alt={currentlyReading[0].title} className="pp-reading-cover" />
                  ) : (
                    <div className="pp-reading-cover-placeholder">
                      <BookOpen size={20} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pp-reading-title">{currentlyReading[0].title || currentlyReading[0].bookId}</div>
                    <div className="pp-reading-author">{currentlyReading[0].author || ''}</div>
                    <div className="pp-reading-progress-bar">
                      <div className="pp-reading-progress-fill" style={{ width: `${currentlyReading[0].progressPercent ?? 0}%` }} />
                    </div>
                    <div className="pp-reading-pct">{currentlyReading[0].progressPercent ?? 0}% complete</div>
                  </div>
                </div>
                <Link href="/dashboard" className="pp-start-reading-btn">
                  Continue Reading →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}