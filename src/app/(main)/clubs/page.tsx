'use client';

import Link from "next/link";
import { useState, useCallback } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Users, BookOpen, Upload, Loader2 } from "lucide-react";
import {
  collection, query, where, doc, serverTimestamp, arrayUnion,
  orderBy, limit, startAfter, getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  useFirestore, useUser, useCollection, useMemoFirebase,
  updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking,
} from '@/firebase';
import { getStorage } from 'firebase/storage';
import { ClubEligibilityGate } from '@/components/club-eligibility-gate';

const GENRE_FILTERS = ['All Genres', 'Philosophy', 'Poetry', 'Fiction', 'History', 'Letters', 'Nature'];
const PAGE_SIZE = 10;

// ── Cover image upload hook ───────────────────────────────────────────────────
function useCoverUpload() {
  const [uploading, setUploading] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');

  const upload = useCallback(async (file: File, clubId: string) => {
    setUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `club-covers/${clubId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setCoverUrl(url);
      return url;
    } catch (err) {
      console.error('Cover upload failed:', err);
      return '';
    } finally {
      setUploading(false);
    }
  }, []);

  return { coverUrl, setCoverUrl, uploading, upload };
}

// ── Create Club Dialog ────────────────────────────────────────────────────────
function CreateClubDialog({ onCreate }: {
  onCreate: (data: {
    name: string; description: string; vibe: string;
    theme: string; isPublic: boolean; coverUrl: string;
  }) => Promise<void>
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vibe, setVibe] = useState('');
  const [theme, setTheme] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const { coverUrl, setCoverUrl, uploading, upload } = useCoverUpload();

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Use a temp ID for upload path
    const tempId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'new-club';
    await upload(file, tempId);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      // Normalize theme to lowercase for consistent filtering
      await onCreate({
        name,
        description,
        vibe,
        theme: theme.toLowerCase(),
        isPublic,
        coverUrl,
      });
      setOpen(false);
      setName(''); setDescription(''); setVibe(''); setTheme('');
      setIsPublic(true); setCoverUrl('');
    } finally {
      setCreating(false);
    }
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
          <DialogDescription style={{ fontSize: 13, color: '#8A8578' }}>Start a literary community.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Cover image upload */}
          <div className="space-y-2">
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Cover Image</Label>
            <div style={{ position: 'relative' }}>
              {coverUrl ? (
                <div style={{ position: 'relative', height: 120, borderRadius: 4, overflow: 'hidden', border: '1px solid #D8D0C0' }}>
                  <img src={coverUrl} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => setCoverUrl('')}
                    style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: 2, padding: '2px 6px', cursor: 'pointer', fontSize: 11 }}
                  >Remove</button>
                </div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 80, border: '1px dashed #D8D0C0', borderRadius: 4, background: '#EDE7D9', cursor: 'pointer', fontSize: 12, color: '#8A8578' }}>
                  {uploading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={16} />}
                  {uploading ? 'Uploading...' : 'Click to upload cover'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverFile} disabled={uploading} />
                </label>
              )}
            </div>
          </div>
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
            <Label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8578' }}>Genre / Theme</Label>
            <select
              style={{ background: '#EDE7D9', fontSize: 13, width: '100%', padding: '8px 10px', border: '1px solid #D8D0C0', borderRadius: 4, color: '#1A1A18', fontFamily: "'DM Sans', sans-serif" }}
              value={theme}
              onChange={e => setTheme(e.target.value)}
            >
              <option value="">Select a genre</option>
              {GENRE_FILTERS.filter(g => g !== 'All Genres').map(g => (
                <option key={g} value={g.toLowerCase()}>{g}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 12, fontWeight: 500 }}>Public Circle</p>
              <p style={{ fontSize: 11, color: '#8A8578' }}>Anyone can find and join</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <button
            className="sc-btn-primary"
            style={{ width: '100%', justifyContent: 'center', opacity: creating || uploading ? 0.6 : 1 }}
            onClick={handleSubmit}
            disabled={creating || uploading}
          >
            {creating ? <Loader2 size={13} style={{ marginRight: 6, animation: 'spin 1s linear infinite' }} /> : null}
            Found This Circle
          </button>
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
        <img src={club.coverUrl || `https://picsum.photos/seed/${coverSeed}/400/240`} alt={club.name} />
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

function ExploreClubCard({ club, onJoin, joining }: { club: any; onJoin: (id: string) => void; joining: boolean }) {
  const coverSeed = club.id || club.name;
  return (
    <div className="sc-explore-card">
      <div className="sc-explore-cover">
        <img src={club.coverUrl || `https://picsum.photos/seed/${coverSeed}x/600/400`} alt={club.name} />
        <div className="sc-explore-overlay" />
        <div className="sc-explore-meta">
          <span className="sc-explore-circle-type">{club.isPublic ? 'Premier Circle' : 'Archive Circle'}</span>
          {club.theme && <span className="sc-explore-genre">· {club.theme}</span>}
        </div>
        <div className="sc-explore-info">
          <div className="sc-explore-name">{club.name}</div>
          <div className="sc-explore-desc">{club.description}</div>
          {club.vibe && <div className="sc-explore-vibe">{club.vibe}</div>}
          <button
            className="sc-explore-join-btn"
            disabled={joining}
            onClick={(e) => { e.preventDefault(); onJoin(club.id); }}
          >
            {joining ? 'Joining...' : 'Request to Join'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SmallClubCard({ club, onJoin, joining }: { club: any; onJoin: (id: string) => void; joining: boolean }) {
  return (
    <div className="sc-small-card">
      <div className="sc-small-circle-type">{club.isPublic ? 'Archive Circle' : 'Private Circle'}</div>
      <div className="sc-small-name">{club.name}</div>
      <div className="sc-small-desc">{club.description}</div>
      {club.theme && (
        <div className="sc-small-tags">
          <span className="sc-small-tag">{club.theme}</span>
          {club.vibe && <span className="sc-small-tag">{club.vibe.split(' ').slice(0, 2).join(' ')}</span>}
        </div>
      )}
      <div className="sc-small-footer">
        <div className="sc-small-members"><Users size={10} style={{ marginRight: 4 }} />{club.memberIds?.length ?? 0}</div>
        <button
          className="sc-enter-btn"
          disabled={joining}
          onClick={() => onJoin(club.id)}
        >
          {joining ? 'Joining...' : '→ Enter Sanctuary'}
        </button>
      </div>
    </div>
  );
}

export default function ClubsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeFilter, setActiveFilter] = useState('All Genres');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [page, setPage] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

  const myClubsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'clubs'), where('memberIds', 'array-contains', user.uid));
  }, [firestore, user?.uid]);
  const { data: myClubsRaw } = useCollection(myClubsQuery);
  const myClubs: any[] = myClubsRaw ?? [];

  const publicClubsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'clubs'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(page)
    );
  }, [firestore, user?.uid, page]);
  const { data: allPublicClubsRaw } = useCollection(publicClubsQuery);
  const allPublicClubs: any[] = allPublicClubsRaw ?? [];

  const myClubIds = new Set(myClubs.map((c) => c.id));

  // ── Normalized genre filter ───────────────────────────────────────────────
  const filteredPublicClubs = allPublicClubs
    .filter((c) => !myClubIds.has(c.id))
    .filter((c) => {
      if (activeFilter === 'All Genres') return true;
      // Normalize both sides to lowercase
      return c.theme?.toLowerCase() === activeFilter.toLowerCase();
    });

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const newPage = page + PAGE_SIZE;
    setPage(newPage);
    // Check if we've loaded everything
    if (allPublicClubs.length < page) {
      setAllLoaded(true);
    }
    setLoadingMore(false);
  };

  const handleCreateClub = async (data: any) => {
    if (!user) return;
    const clubId = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    // Write display name and avatar at create time
    const displayName = user.displayName || user.email?.split('@')[0] || 'Reader';
    const photoURL = user.photoURL || '';

    await setDocumentNonBlocking(doc(firestore, 'clubs', clubId), {
      ...data,
      memberIds: [user.uid],
      ownerId: user.uid,
      createdAt: serverTimestamp(),
    }, { merge: false });

    // ── Write name+avatar into member record ──
    setDocumentNonBlocking(doc(firestore, 'clubs', clubId, 'members', user.uid), {
      userId: user.uid,
      name: displayName,
      avatarUrl: photoURL,
      role: 'owner',
      isOnline: false,
      joinedAt: serverTimestamp(),
    }, { merge: false });

    addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
      userId: user.uid,
      userName: displayName,
      clubId,
      type: 'joined-club',
      timestamp: serverTimestamp(),
    });
  };

  const handleJoinClub = async (clubId: string) => {
    if (!user || joiningId) return;
    setJoiningId(clubId);
    try {
      const displayName = user.displayName || user.email?.split('@')[0] || 'Reader';
      const photoURL = user.photoURL || '';

      updateDocumentNonBlocking(doc(firestore, 'clubs', clubId), {
        memberIds: arrayUnion(user.uid),
      });

      // ── Write name+avatar into member record ──
      setDocumentNonBlocking(doc(firestore, 'clubs', clubId, 'members', user.uid), {
        userId: user.uid,
        name: displayName,
        avatarUrl: photoURL,
        role: 'member',
        isOnline: false,
        joinedAt: serverTimestamp(),
      }, { merge: false });

      addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
        userId: user.uid,
        userName: displayName,
        clubId,
        type: 'joined-club',
        timestamp: serverTimestamp(),
      });
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .sc-page { font-family: 'DM Sans', sans-serif; color: #1A1A18; max-width: 1000px; }
        .sc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
        .sc-section-label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #8A8578; margin-bottom: 6px; }
        .sc-title { font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 400; color: #1A1A18; line-height: 1.1; }
        .sc-subtitle { font-size: 12px; color: #8A8578; margin-top: 4px; font-family: 'Libre Baskerville', serif; font-style: italic; }
        .sc-btn-primary { background: #1C2B1E; color: #fff; border: none; padding: 10px 20px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: background 0.15s; display: inline-flex; align-items: center; }
        .sc-btn-primary:hover:not(:disabled) { background: #2A3D2D; }
        .sc-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
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
        .sc-explore-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; }
        .sc-explore-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400; color: #1A1A18; }
        .sc-explore-subtitle { font-size: 12px; color: #8A8578; margin-top: 2px; }
        .sc-filter-row { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .sc-filter-btn { background: transparent; border: 1px solid #D8D0C0; color: #8A8578; padding: 5px 14px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .sc-filter-btn:hover { border-color: #1C2B1E; color: #1C2B1E; }
        .sc-filter-btn.active { background: #1C2B1E; color: #fff; border-color: #1C2B1E; }
        .sc-explore-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        @media (max-width: 700px) { .sc-explore-grid { grid-template-columns: 1fr; } }
        .sc-explore-grid > *:first-child { grid-column: span 2; }
        @media (max-width: 700px) { .sc-explore-grid > *:first-child { grid-column: span 1; } }
        .sc-explore-card { border-radius: 4px; overflow: hidden; }
        .sc-explore-cover { position: relative; height: 260px; }
        .sc-explore-grid > *:first-child .sc-explore-cover { height: 340px; }
        .sc-explore-cover img { width: 100%; height: 100%; object-fit: cover; }
        .sc-explore-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.88) 100%); }
        .sc-explore-meta { position: absolute; top: 14px; left: 14px; display: flex; gap: 8px; align-items: center; }
        .sc-explore-circle-type { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.6); }
        .sc-explore-genre { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.4); }
        .sc-explore-info { position: absolute; bottom: 20px; left: 20px; right: 20px; }
        .sc-explore-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 6px; line-height: 1.2; }
        .sc-explore-grid > *:first-child .sc-explore-name { font-size: 30px; }
        .sc-explore-desc { font-size: 12px; color: rgba(255,255,255,0.7); line-height: 1.5; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .sc-explore-vibe { font-size: 10px; color: rgba(255,255,255,0.45); font-style: italic; margin-bottom: 14px; font-family: 'Libre Baskerville', serif; }
        .sc-explore-join-btn { background: rgba(255,255,255,0.12); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.25); color: #fff; padding: 8px 18px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: all 0.15s; }
        .sc-explore-join-btn:hover:not(:disabled) { background: rgba(255,255,255,0.22); }
        .sc-explore-join-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sc-small-card { background: #EDE7D9; border: 1px solid #D8D0C0; border-radius: 4px; padding: 20px; display: flex; flex-direction: column; }
        .sc-small-circle-type { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #8A8578; margin-bottom: 8px; }
        .sc-small-name { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; color: #1A1A18; margin-bottom: 6px; }
        .sc-small-desc { font-size: 12px; color: #8A8578; line-height: 1.5; margin-bottom: 10px; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .sc-small-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
        .sc-small-tag { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #8A8578; border: 1px solid #D8D0C0; padding: 3px 8px; border-radius: 2px; }
        .sc-small-footer { display: flex; justify-content: space-between; align-items: center; }
        .sc-small-members { font-size: 11px; color: #8A8578; display: flex; align-items: center; }
        .sc-enter-btn { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #4A7C59; background: none; border: none; cursor: pointer; font-weight: 500; padding: 0; font-family: 'DM Sans', sans-serif; }
        .sc-enter-btn:hover:not(:disabled) { color: #1C2B1E; }
        .sc-enter-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sc-empty { text-align: center; padding: 48px 20px; color: #8A8578; }
        .sc-empty svg { opacity: 0.2; margin: 0 auto 12px; display: block; }
        .sc-empty p { font-size: 13px; font-family: 'Libre Baskerville', serif; font-style: italic; }
        .sc-empty-filter { text-align: center; padding: 40px 20px; color: #8A8578; font-family: 'Libre Baskerville', serif; font-style: italic; font-size: 13px; }
        .sc-divider { border: none; border-top: 1px solid #D8D0C0; margin: 40px 0; }
        .sc-filter-count { font-size: 11px; color: #8A8578; }
        .sc-new-row { margin-top: 32px; }
        .sc-load-more-row { display: flex; justify-content: center; margin-top: 28px; }
        .sc-load-more-btn { background: transparent; border: 1px solid #D8D0C0; color: #8A8578; padding: 9px 24px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }
        .sc-load-more-btn:hover:not(:disabled) { border-color: #1C2B1E; color: #1C2B1E; }
        .sc-load-more-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="sc-page">
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

        {myClubs.length > 0 ? (
          <div className="sc-my-grid">
            {myClubs.map((club) => <MyClubCard key={club.id} club={club} />)}
          </div>
        ) : (
          <div className="sc-empty" style={{ marginBottom: 40 }}>
            <Users size={36} />
            <p>You haven't joined any circles yet.</p>
          </div>
        )}

        <hr className="sc-divider" />

        <div className="sc-explore-header">
          <div>
            <div className="sc-explore-title">Explore New Sanctuaries</div>
            <div className="sc-explore-subtitle">Discover communities shaped by shared curiosities and literary focus.</div>
          </div>
          <span className="sc-filter-count">{filteredPublicClubs.length} circles</span>
        </div>

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

        {filteredPublicClubs.length === 0 ? (
          <div className="sc-empty-filter">
            {activeFilter === 'All Genres'
              ? 'No public circles yet. Be the first to found one.'
              : <>No circles found for "{activeFilter}". <button onClick={() => setActiveFilter('All Genres')} style={{ color: '#4A7C59', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontStyle: 'italic', textDecoration: 'underline' }}>Show all</button></>
            }
          </div>
        ) : (
          <>
            <div className="sc-explore-grid">
              {filteredPublicClubs.slice(0, 1).map((club) => (
                <ExploreClubCard key={club.id} club={club} onJoin={handleJoinClub} joining={joiningId === club.id} />
              ))}
              {filteredPublicClubs.slice(1, 3).map((club) => (
                <SmallClubCard key={club.id} club={club} onJoin={handleJoinClub} joining={joiningId === club.id} />
              ))}
              {filteredPublicClubs.slice(3).map((club) => (
                <ExploreClubCard key={club.id} club={club} onJoin={handleJoinClub} joining={joiningId === club.id} />
              ))}
            </div>

            {/* ── Load more pagination ── */}
            {!allLoaded && allPublicClubs.length >= page && (
              <div className="sc-load-more-row">
                <button
                  className="sc-load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
                  {loadingMore ? 'Loading...' : 'Load More Sanctuaries'}
                </button>
              </div>
            )}
          </>
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