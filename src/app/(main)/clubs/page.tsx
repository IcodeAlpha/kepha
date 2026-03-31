'use client';

import Link from "next/link";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
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
import { ClubEligibilityGate } from '@/components/club-eligibility-gate';

const GENRE_FILTERS = ['Philosophy', 'Poetry', 'All Genres', 'Fiction', 'History', 'Letters'];

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
        <button className="sc-btn-primary">
          <Plus size={13} style={{ marginRight: 6 }} />New Sanctuary
        </button>
      </DialogTrigger>
      <DialogContent style={{ background: '#F5F0E8', border: '1px solid #D8D0C0', maxWidth: 440 }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 20 }}>Create a Reading Circle</DialogTitle>
          <DialogDescription style={{ fontSize: 13, color: '#8A8578' }}>Start a literary community. Everyone reads their own book, together.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Circle Name</Label>
            <Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13 }} placeholder="e.g. The Existentialists" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Description</Label>
            <Textarea style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13 }} placeholder="What's this circle about?" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Vibe</Label>
            <Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13 }} placeholder="e.g. Rigorous debates" value={vibe} onChange={e => setVibe(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Theme</Label>
            <Input style={{ background: '#EDE7D9', borderColor: '#D8D0C0', fontSize: 13 }} placeholder="e.g. Philosophy" value={theme} onChange={e => setTheme(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 12, fontWeight: 500 }}>Public Circle</p>
              <p style={{ fontSize: 11, color: '#8A8578' }}>Anyone can find and join</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <button className="sc-btn-primary" style={{ width: '100%' }} onClick={handleSubmit}>Found This Circle</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MyClubCard({ club }: { club: any }) {
  const coverSeed = club.id || club.name;
  return (
    <Link href={`/clubs/${club.id}`} className="sc-my-club-card">
      <div className="sc-my-club-cover">
        <img
          src={club.coverUrl || `https://picsum.photos/seed/${coverSeed}/400/240`}
          alt={club.name}
        />
        <div className="sc-my-club-overlay" />
        <div className="sc-my-club-badge-row">
          {club.theme && <span className="sc-genre-tag">{club.theme}</span>}
          {club.isPublic && <span className="sc-genre-tag">Public</span>}
        </div>
        <div className="sc-my-club-info">
          <div className="sc-my-club-name">{club.name}</div>
          <div className="sc-my-club-desc">{club.description}</div>
          <div className="sc-my-club-members">
            <Users size={11} style={{ marginRight: 4 }} />{club.memberIds?.length ?? 0} Active
          </div>
        </div>
      </div>
      <div className="sc-my-club-footer">
        <span className="sc-open-salon">Open Salon →</span>
      </div>
    </Link>
  );
}

function ExploreClubCard({ club, onJoin }: { club: any; onJoin: (id: string) => void }) {
  const coverSeed = club.id || club.name;
  const isLarge = false;

  return (
    <div className="sc-explore-card">
      <div className="sc-explore-cover">
        <img src={club.coverUrl || `https://picsum.photos/seed/${coverSeed}x/600/400`} alt={club.name} />
        <div className="sc-explore-overlay" />
        <div className="sc-explore-meta">
          {club.theme && <span className="sc-explore-circle-type">{club.isPublic ? 'Premier Circle' : 'Archive Circle'}</span>}
          {club.theme && <span className="sc-explore-genre">{club.theme}</span>}
        </div>
        <div className="sc-explore-info">
          <div className="sc-explore-name">{club.name}</div>
          <div className="sc-explore-desc">{club.description}</div>
          {club.vibe && <div className="sc-explore-vibe">{club.vibe}</div>}
          <button className="sc-explore-join-btn" onClick={() => onJoin(club.id)}>
            Request to Join
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClubsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeFilter, setActiveFilter] = useState('All Genres');

  const myClubsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'clubs'), where('memberIds', 'array-contains', user.uid));
  }, [firestore, user?.uid]);
  const { data: myClubsRaw } = useCollection(myClubsQuery);
  const myClubs: any[] = myClubsRaw ?? [];

  const publicClubsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'clubs'), where('isPublic', '==', true));
  }, [firestore, user?.uid]);
  const { data: allPublicClubsRaw } = useCollection(publicClubsQuery);
  const allPublicClubs: any[] = allPublicClubsRaw ?? [];

  const myClubIds = new Set(myClubs.map((c) => c.id));
  const publicClubs = allPublicClubs.filter((c) => !myClubIds.has(c.id));

  const handleCreateClub = async (data: any) => {
    if (!user) return;
    const clubId = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await setDocumentNonBlocking(doc(firestore, 'clubs', clubId), {
      ...data, memberIds: [user.uid], ownerId: user.uid, createdAt: serverTimestamp(),
    }, { merge: false });
    setDocumentNonBlocking(doc(firestore, 'clubs', clubId, 'members', user.uid), {
      userId: user.uid, role: 'owner', isOnline: false, joinedAt: serverTimestamp(),
    }, { merge: false });
    addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
      userId: user.uid, clubId, type: 'joined-club', timestamp: serverTimestamp(),
    });
  };

  const handleJoinClub = (clubId: string) => {
    if (!user) return;
    updateDocumentNonBlocking(doc(firestore, 'clubs', clubId), { memberIds: arrayUnion(user.uid) });
    setDocumentNonBlocking(doc(firestore, 'clubs', clubId, 'members', user.uid), {
      userId: user.uid, role: 'member', isOnline: false, joinedAt: serverTimestamp(),
    }, { merge: false });
    addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
      userId: user.uid, clubId, type: 'joined-club', timestamp: serverTimestamp(),
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .sc-page { font-family: 'DM Sans', sans-serif; color: #1A1A18; max-width: 1000px; }

        /* Header */
        .sc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
        .sc-section-label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #8A8578; margin-bottom: 6px; }
        .sc-title { font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 400; color: #1A1A18; line-height: 1.1; }
        .sc-subtitle { font-size: 12px; color: #8A8578; margin-top: 4px; font-family: 'Libre Baskerville', serif; font-style: italic; }

        /* Buttons */
        .sc-btn-primary {
          background: #1C2B1E; color: #fff; border: none;
          padding: 10px 20px; font-size: 11px; letter-spacing: 0.12em;
          text-transform: uppercase; cursor: pointer; border-radius: 2px;
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          transition: background 0.15s; display: inline-flex; align-items: center;
        }
        .sc-btn-primary:hover { background: #2A3D2D; }

        /* My Circles section */
        .sc-my-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 48px; }
        @media (max-width: 700px) { .sc-my-grid { grid-template-columns: 1fr; } }

        .sc-my-club-card { display: block; text-decoration: none; border: 1px solid #D8D0C0; border-radius: 4px; overflow: hidden; background: #EDE7D9; transition: box-shadow 0.2s; }
        .sc-my-club-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
        .sc-my-club-cover { position: relative; height: 180px; overflow: hidden; }
        .sc-my-club-cover img { width: 100%; height: 100%; object-fit: cover; }
        .sc-my-club-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%); }
        .sc-my-club-badge-row { position: absolute; top: 12px; left: 12px; right: 12px; display: flex; gap: 6px; }
        .sc-genre-tag { background: rgba(255,255,255,0.15); backdrop-filter: blur(4px); color: #fff; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; padding: 3px 8px; border-radius: 2px; border: 1px solid rgba(255,255,255,0.2); }
        .sc-my-club-info { position: absolute; bottom: 14px; left: 14px; right: 14px; }
        .sc-my-club-name { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 3px; }
        .sc-my-club-desc { font-size: 11px; color: rgba(255,255,255,0.7); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 6px; }
        .sc-my-club-members { font-size: 10px; color: rgba(255,255,255,0.6); display: flex; align-items: center; letter-spacing: 0.08em; text-transform: uppercase; }
        .sc-my-club-footer { padding: 12px 16px; display: flex; justify-content: flex-end; }
        .sc-open-salon { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #4A7C59; font-weight: 500; }

        /* Explore section */
        .sc-explore-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .sc-explore-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400; color: #1A1A18; }
        .sc-explore-subtitle { font-size: 12px; color: #8A8578; margin-top: 2px; }
        .sc-filter-row { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .sc-filter-btn { background: transparent; border: 1px solid #D8D0C0; color: #8A8578; padding: 5px 14px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .sc-filter-btn:hover, .sc-filter-btn.active { background: #1C2B1E; color: #fff; border-color: #1C2B1E; }

        .sc-explore-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        @media (max-width: 700px) { .sc-explore-grid { grid-template-columns: 1fr; } }
        .sc-explore-grid > *:first-child { grid-column: span 2; }
        @media (max-width: 700px) { .sc-explore-grid > *:first-child { grid-column: span 1; } }

        .sc-explore-card { border-radius: 4px; overflow: hidden; }
        .sc-explore-cover { position: relative; height: 260px; }
        .sc-explore-grid > *:first-child .sc-explore-cover { height: 340px; }
        .sc-explore-cover img { width: 100%; height: 100%; object-fit: cover; }
        .sc-explore-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.85) 100%); }
        .sc-explore-meta { position: absolute; top: 14px; left: 14px; display: flex; gap: 8px; align-items: center; }
        .sc-explore-circle-type { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.7); }
        .sc-explore-genre { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.5); }
        .sc-explore-info { position: absolute; bottom: 20px; left: 20px; right: 20px; }
        .sc-explore-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 6px; line-height: 1.2; }
        .sc-explore-grid > *:first-child .sc-explore-name { font-size: 30px; }
        .sc-explore-desc { font-size: 12px; color: rgba(255,255,255,0.7); line-height: 1.5; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .sc-explore-vibe { font-size: 10px; color: rgba(255,255,255,0.5); font-style: italic; margin-bottom: 14px; font-family: 'Libre Baskerville', serif; }
        .sc-explore-join-btn { background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.3); color: #fff; padding: 8px 18px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: all 0.15s; }
        .sc-explore-join-btn:hover { background: rgba(255,255,255,0.25); }

        /* Small card variant */
        .sc-small-card { background: #EDE7D9; border: 1px solid #D8D0C0; border-radius: 4px; padding: 20px; }
        .sc-small-circle-type { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #8A8578; margin-bottom: 8px; }
        .sc-small-name { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; color: #1A1A18; margin-bottom: 6px; }
        .sc-small-desc { font-size: 12px; color: #8A8578; line-height: 1.5; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .sc-small-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
        .sc-small-tag { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #8A8578; border: 1px solid #D8D0C0; padding: 3px 8px; border-radius: 2px; }
        .sc-small-footer { display: flex; justify-content: space-between; align-items: center; }
        .sc-small-current { font-size: 10px; color: #8A8578; }
        .sc-small-current span { color: #3D3D38; font-style: italic; font-family: 'Libre Baskerville', serif; }
        .sc-enter-btn { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #4A7C59; background: none; border: none; cursor: pointer; font-weight: 500; padding: 0; font-family: 'DM Sans', sans-serif; }

        /* Empty */
        .sc-empty { text-align: center; padding: 48px 20px; color: #8A8578; }
        .sc-empty svg { opacity: 0.2; margin: 0 auto 12px; display: block; }
        .sc-empty p { font-size: 13px; font-family: 'Libre Baskerville', serif; font-style: italic; }

        /* Divider */
        .sc-divider { border: none; border-top: 1px solid #D8D0C0; margin: 40px 0; }

        /* New entry row */
        .sc-new-row { margin-top: 32px; }
      `}</style>

      <div className="sc-page">
        {/* Header */}
        <div className="sc-header">
          <div>
            <div className="sc-section-label">Personal Library</div>
            <h1 className="sc-title">My Reading Circles</h1>
            <p className="sc-subtitle">"A book is a heart that only beats in the chest of another."</p>
          </div>
          <ClubEligibilityGate>
            <CreateClubDialog onCreate={handleCreateClub} />
          </ClubEligibilityGate>
        </div>

        {/* My Clubs */}
        {myClubs.length > 0 ? (
          <div className="sc-my-grid">
            {myClubs.map((club) => (
              <MyClubCard key={club.id} club={club} />
            ))}
          </div>
        ) : (
          <div className="sc-empty" style={{ marginBottom: 40 }}>
            <Users size={36} />
            <p>You haven't joined any circles yet.</p>
          </div>
        )}

        <hr className="sc-divider" />

        {/* Explore */}
        <div className="sc-explore-header">
          <div>
            <div className="sc-explore-title">Explore New Sanctuaries</div>
            <div className="sc-explore-subtitle">Discover communities shaped by shared curiosities and literary focus.</div>
          </div>
        </div>

        {/* Genre filters */}
        <div className="sc-filter-row">
          {GENRE_FILTERS.map(f => (
            <button
              key={f}
              className={`sc-filter-btn${activeFilter === f ? ' active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {publicClubs.length > 0 ? (
          <div className="sc-explore-grid">
            {publicClubs.slice(0, 1).map((club) => (
              <ExploreClubCard key={club.id} club={club} onJoin={handleJoinClub} />
            ))}
            {publicClubs.slice(1, 3).map((club) => (
              <div key={club.id} className="sc-small-card">
                <div className="sc-small-circle-type">{club.isPublic ? 'Archive Circle' : 'Private Circle'}</div>
                <div className="sc-small-name">{club.name}</div>
                <div className="sc-small-desc">{club.description}</div>
                {club.theme && (
                  <div className="sc-small-tags">
                    {club.theme.split(',').slice(0, 3).map((t: string) => (
                      <span key={t} className="sc-small-tag">{t.trim()}</span>
                    ))}
                  </div>
                )}
                <div className="sc-small-footer">
                  {club.vibe && (
                    <div className="sc-small-current">Vibe <span>{club.vibe}</span></div>
                  )}
                  <button className="sc-enter-btn" onClick={() => handleJoinClub(club.id)}>
                    → Enter Sanctuary
                  </button>
                </div>
              </div>
            ))}
            {publicClubs.slice(3).map((club) => (
              <ExploreClubCard key={club.id} club={club} onJoin={handleJoinClub} />
            ))}
          </div>
        ) : (
          <div className="sc-empty">
            <BookOpen size={36} />
            <p>No public sanctuaries yet. Be the first to found one.</p>
          </div>
        )}

        <div className="sc-new-row">
          <ClubEligibilityGate>
            <CreateClubDialog onCreate={handleCreateClub} />
          </ClubEligibilityGate>
        </div>
      </div>
    </>
  );
}