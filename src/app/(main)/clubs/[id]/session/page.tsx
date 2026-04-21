'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { collection, query, orderBy, limit, serverTimestamp, doc } from 'firebase/firestore';
import {
  useFirestore, useUser, useDoc, useCollection, useMemoFirebase,
  addDocumentNonBlocking, updateDocumentNonBlocking,
} from '@/firebase';
import { ArrowLeft, Send, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';

function timeAgo(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return 'now';
  if (diff < 60) return `${diff}m`;
  return `${Math.floor(diff / 60)}h`;
}

// ── Ambience sounds via MyNoise iframes ───────────────────────────────────
const AMBIENCE_OPTIONS = [
  { id: 'rain', label: '🌧 Rain', url: 'https://mynoise.net/NoiseMachines/rainNoiseGenerator.php?c=0&l=25252525252525252525&am=&o=30' },
  { id: 'fireplace', label: '🔥 Fireplace', url: 'https://mynoise.net/NoiseMachines/fireplaceNoiseGenerator.php?c=0&l=25252525252525252525&am=&o=30' },
  { id: 'cafe', label: '☕ Café', url: 'https://mynoise.net/NoiseMachines/cafeRestaurantNoiseGenerator.php?c=0&l=25252525252525252525&am=&o=30' },
  { id: 'forest', label: '🌿 Forest', url: 'https://mynoise.net/NoiseMachines/jungleNoiseGenerator.php?c=0&l=25252525252525252525&am=&o=30' },
];

export default function ReadingSessionPage() {
  const params = useParams();
  const clubId = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isInSession, setIsInSession] = useState(false);
  const [message, setMessage] = useState('');
  // ── SALON = chat+reflections, FOCUS = book only ──
  const [activeNav, setActiveNav] = useState<'SALON' | 'FOCUS'>('SALON');
  const [focusMode, setFocusMode] = useState(false);
  const [showProgressUpdate, setShowProgressUpdate] = useState(false);
  const [progressInput, setProgressInput] = useState(0);
  const [chapterInput, setChapterInput] = useState('');
  const [pageInput, setPageInput] = useState('');
  const [chatTab, setChatTab] = useState<'chat' | 'reflection'>('chat');
  const [ambienceId, setAmbienceId] = useState<string | null>(null);
  const [showAmbiencePicker, setShowAmbiencePicker] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Auto-focus ref for reflection textarea
  const reflectionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Firestore ─────────────────────────────────────────────────────────────
  const clubRef = useMemoFirebase(() => (clubId ? doc(firestore, 'clubs', clubId) : null), [firestore, clubId]);
  const { data: club, isLoading: isClubLoading } = useDoc(clubRef);

  const membersRef = useMemoFirebase(() => (clubId ? collection(firestore, 'clubs', clubId, 'members') : null), [firestore, clubId]);
  const { data: membersRaw } = useCollection(membersRef);
  const members: any[] = membersRaw ?? [];

  const sharedBooksRef = useMemoFirebase(() => (clubId ? collection(firestore, 'clubs', clubId, 'sharedBooks') : null), [firestore, clubId]);
  const { data: sharedBooksRaw } = useCollection(sharedBooksRef);
  const sharedBooks: any[] = sharedBooksRaw ?? [];

  // ── Real reflections for floating quotes ─────────────────────────────────
  const reflectionsQuery = useMemoFirebase(() => {
    if (!clubId) return null;
    return query(collection(firestore, 'clubs', clubId, 'reflections'), orderBy('timestamp', 'desc'), limit(5));
  }, [firestore, clubId]);
  const { data: reflectionsRaw } = useCollection(reflectionsQuery);
  const reflections: any[] = reflectionsRaw ?? [];

  // ── Chat messages ─────────────────────────────────────────────────────────
  const messagesQuery = useMemoFirebase(() => {
    if (!clubId) return null;
    return query(collection(firestore, 'readingSessions', clubId, 'messages'), orderBy('timestamp', 'asc'), limit(50));
  }, [firestore, clubId]);
  const { data: chatMessagesRaw } = useCollection(messagesQuery);
  const chatMessages: any[] = chatMessagesRaw ?? [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const mySharedBook = sharedBooks.find(b => b.userId === user?.uid) || sharedBooks[0];

  // Sync progress ONLY when overlay opens — not on every render
  const prevShowProgress = useRef(false);
  useEffect(() => {
    if (showProgressUpdate && !prevShowProgress.current && mySharedBook) {
      setProgressInput(mySharedBook.progressPercent ?? 0);
      setChapterInput(mySharedBook.chapter ?? '');
      setPageInput(mySharedBook.currentPage?.toString() ?? '');
    }
    prevShowProgress.current = showProgressUpdate;
  }, [showProgressUpdate]);

  // ── Auto-focus reflection textarea when tab switches ──────────────────────
  useEffect(() => {
    if (chatTab === 'reflection') {
      setTimeout(() => reflectionTextareaRef.current?.focus(), 80);
    }
  }, [chatTab]);

  // ── FOCUS mode activates when nav = FOCUS ─────────────────────────────────
  useEffect(() => {
    setFocusMode(activeNav === 'FOCUS');
  }, [activeNav]);

  if (isClubLoading || !club) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D1A10' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', fontSize: 13, fontFamily: "'Libre Baskerville', serif" }}>Preparing the reading room...</p>
        </div>
      </div>
    );
  }

  const clubData = club as any;
  const onlineMembers = members.filter(m => m.isOnline);
  const onlineCount = onlineMembers.length;
  const currentAmbience = AMBIENCE_OPTIONS.find(a => a.id === ambienceId);

  const handleSendMessage = (content: string) => {
    if (!user || !content.trim()) return;
    addDocumentNonBlocking(collection(firestore, 'readingSessions', clubId, 'messages'), {
      userId: user.uid,
      userName: user.displayName || user.email?.split('@')[0] || 'Reader',
      content, timestamp: serverTimestamp(), type: 'text',
    });
  };

  const handlePostReflection = (content: string, chapter: string) => {
    if (!user) return;
    const userName = user.displayName || user.email?.split('@')[0] || 'Reader';
  
    // Existing write to club reflections
    addDocumentNonBlocking(collection(firestore, 'clubs', id, 'reflections'), {
      userId: user.uid, userName, content, chapter,
      timestamp: serverTimestamp(), likes: 0, likedBy: [], commentCount: 0,
      bookTitle: mySharedBook?.title || null,
    });
  
    // ── Mirror to user's personal journal ──
    addDocumentNonBlocking(collection(firestore, 'userReflections', user.uid, 'entries'), {
      userId: user.uid,
      content,
      chapter: chapter || null,
      bookTitle: mySharedBook?.title || null,
      clubId: id,
      clubName: clubData.name || null,
      timestamp: serverTimestamp(),
    });
  
    // Existing activity log
    addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
      userId: user.uid, userName, clubId: id, type: 'shared-quote',
      content, bookTitle: mySharedBook?.title || null, timestamp: serverTimestamp(),
    });
  };

  const handleJoinSession = () => {
    setIsInSession(true);
    handleSendMessage('Joined the reading session 📚');
    if (user) updateDocumentNonBlocking(doc(firestore, 'clubs', clubId, 'members', user.uid), { isOnline: true, lastSeen: serverTimestamp() });
  };

  const handleLeaveSession = () => {
    setIsInSession(false);
    handleSendMessage('Taking a break ✨');
    if (user) updateDocumentNonBlocking(doc(firestore, 'clubs', clubId, 'members', user.uid), { isOnline: false, lastSeen: serverTimestamp() });
  };

  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isInSession) return;
    handleSendMessage(message);
    setMessage('');
  };

  const handlePageChange = (val: string) => {
    setPageInput(val);
    if (val && mySharedBook?.pageCount) {
      const pct = Math.min(100, Math.round((parseInt(val) / mySharedBook.pageCount) * 100));
      setProgressInput(pct);
    }
  };

  const handleSaveProgress = () => {
    if (!user || !mySharedBook) return;
    updateDocumentNonBlocking(doc(firestore, 'clubs', clubId, 'sharedBooks', user.uid), {
      progressPercent: progressInput, chapter: chapterInput,
      currentPage: pageInput ? parseInt(pageInput) : null,
    });
    updateDocumentNonBlocking(doc(firestore, 'clubs', clubId, 'members', user.uid), { currentChapter: chapterInput });
    if (progressInput === 100) {
      addDocumentNonBlocking(collection(firestore, 'readingActivities'), {
        userId: user.uid, clubId, type: 'finished-book',
        bookId: mySharedBook.bookId, bookTitle: mySharedBook.title, timestamp: serverTimestamp(),
      });
    }
    setShowProgressUpdate(false);
    handleSendMessage(`Updated progress: ${progressInput}%${chapterInput ? ` · ${chapterInput}` : ''}`);
  };

  const floatingQuotes = reflections.slice(0, 2).map(r => r.content);

  // ── SALON content: members list + reading info (goes into right panel) ─────
  // FOCUS: hides right panel entirely

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .rs-root { display: flex; height: calc(100vh - 56px); background: #0D1A10; font-family: 'DM Sans', sans-serif; color: #fff; margin: -16px -24px; overflow: hidden; }
        @media (max-width: 768px) { .rs-root { margin: -16px; } }

        /* Left nav */
        .rs-left-nav { width: 160px; background: rgba(0,0,0,0.3); border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; padding: 20px 0; flex-shrink: 0; }
        .rs-club-name { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 600; color: #fff; padding: 0 16px 4px; }
        .rs-session-badge { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #4A7C59; padding: 0 16px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px; }
        .rs-new-reflection-btn { margin: 0 12px 16px; background: #4A7C59; color: #fff; border: none; padding: 8px 10px; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-weight: 500; text-align: center; transition: background 0.15s; }
        .rs-new-reflection-btn:hover:not(:disabled) { background: #3D6B4A; }
        .rs-new-reflection-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .rs-nav-item { display: flex; align-items: center; gap: 8px; padding: 10px 16px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.15s; border: none; background: none; width: 100%; text-align: left; font-family: 'DM Sans', sans-serif; border-left: 2px solid transparent; }
        .rs-nav-item:hover { color: rgba(255,255,255,0.7); }
        .rs-nav-item.active { color: rgba(255,255,255,0.9); border-left-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.03); }
        .rs-left-bottom { margin-top: auto; padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.06); }
        .rs-back-link { display: flex; align-items: center; gap: 6px; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.3); text-decoration: none; transition: color 0.15s; }
        .rs-back-link:hover { color: rgba(255,255,255,0.6); }

        /* Center */
        .rs-center { flex: 1; position: relative; overflow: hidden; display: flex; flex-direction: column; }
        .rs-top-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.2); z-index: 2; flex-shrink: 0; }
        .rs-top-bar-left { font-family: 'Playfair Display', serif; font-size: 14px; color: rgba(255,255,255,0.7); }
        .rs-top-bar-right { display: flex; gap: 8px; align-items: center; }
        .rs-leave-btn { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.6); padding: 6px 14px; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .rs-leave-btn:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
        .rs-join-btn { background: #4A7C59; border: none; color: #fff; padding: 8px 20px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: background 0.15s; }
        .rs-join-btn:hover { background: #3D6B4A; }

        /* Book stage */
        .rs-book-stage { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .rs-book-bg { position: absolute; inset: 0; object-fit: cover; width: 100%; height: 100%; opacity: 0.4; filter: blur(2px); }
        .rs-book-bg-fallback { position: absolute; inset: 0; background: radial-gradient(ellipse at center, #1C3A22 0%, #0D1A10 70%); }
        .rs-book-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(13,26,16,0.3) 0%, rgba(13,26,16,0.6) 100%); }
        .rs-floating-quote { position: absolute; z-index: 2; font-family: 'Libre Baskerville', serif; font-style: italic; font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.7; text-align: center; max-width: 280px; padding: 0 20px; pointer-events: none; }
        .rs-progress-ring-wrap { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .rs-progress-ring { position: relative; width: 120px; height: 120px; cursor: pointer; }
        .rs-progress-ring svg { transform: rotate(-90deg); }
        .rs-progress-pct { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400; color: #fff; }
        .rs-progress-hint { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.3); text-align: center; }
        .rs-book-title-display { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 600; color: #fff; text-align: center; position: absolute; bottom: 14%; z-index: 2; }
        .rs-book-chapter-display { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.4); text-align: center; position: absolute; bottom: 11%; z-index: 2; }
        .rs-readers-count { position: absolute; z-index: 2; bottom: 8%; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.3); }

        /* Progress overlay */
        .rs-progress-overlay { position: absolute; inset: 0; z-index: 10; background: rgba(13,26,16,0.88); display: flex; align-items: center; justify-content: center; }
        .rs-progress-panel { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 28px; width: 320px; }
        .rs-progress-panel-title { font-family: 'Playfair Display', serif; font-size: 18px; color: #fff; margin-bottom: 20px; }
        .rs-plabel { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 6px; display: flex; justify-content: space-between; }
        .rs-pinput { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); padding: 8px 12px; font-size: 12px; border-radius: 2px; font-family: 'DM Sans', sans-serif; outline: none; margin-bottom: 12px; box-sizing: border-box; }
        .rs-pinput::placeholder { color: rgba(255,255,255,0.25); }
        .rs-save-btn { width: 100%; background: #4A7C59; border: none; color: #fff; padding: 10px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; margin-bottom: 8px; transition: background 0.15s; }
        .rs-save-btn:hover { background: #3D6B4A; }
        .rs-cancel-btn-small { width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); padding: 8px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; }

        /* Controls */
        .rs-controls { display: flex; justify-content: center; gap: 20px; align-items: center; padding: 10px 20px; border-top: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.2); flex-shrink: 0; flex-wrap: wrap; }
        .rs-ctrl-btn { background: none; border: none; color: rgba(255,255,255,0.35); cursor: pointer; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 4px; transition: color 0.15s; padding: 0; }
        .rs-ctrl-btn:hover { color: rgba(255,255,255,0.8); }
        .rs-ctrl-btn.active { color: #4A7C59; }

        /* Ambience picker */
        .rs-ambience-picker { position: absolute; bottom: 52px; left: 50%; transform: translateX(-50%); background: rgba(13,26,16,0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 12px; display: flex; gap: 8px; z-index: 20; }
        .rs-ambience-opt { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); padding: 6px 12px; font-size: 11px; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; transition: all 0.15s; white-space: nowrap; }
        .rs-ambience-opt:hover { background: rgba(255,255,255,0.12); }
        .rs-ambience-opt.active { border-color: #4A7C59; color: #4A7C59; }

        /* Mynoise iframe */
        .rs-ambience-iframe { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

        /* Right: Salon panel */
        .rs-right { width: 280px; background: rgba(0,0,0,0.25); border-left: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; flex-shrink: 0; transition: width 0.3s ease; overflow: hidden; }
        .rs-right.hidden { width: 0; }
        .rs-chat-header { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
        .rs-chat-title { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 2px; }
        .rs-chat-subtitle { font-size: 11px; color: rgba(255,255,255,0.25); }

        /* Salon members list */
        .rs-members-list { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
        .rs-members-label { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 8px; }
        .rs-member-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .rs-member-dot { width: 6px; height: 6px; border-radius: 50%; background: #4A7C59; flex-shrink: 0; }
        .rs-member-dot.offline { background: rgba(255,255,255,0.2); }
        .rs-member-name-sm { font-size: 11px; color: rgba(255,255,255,0.6); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .rs-member-progress { font-size: 10px; color: rgba(255,255,255,0.3); flex-shrink: 0; }

        .rs-chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .rs-chat-messages::-webkit-scrollbar { width: 3px; }
        .rs-chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        .rs-msg { display: flex; flex-direction: column; gap: 3px; }
        .rs-msg-meta { display: flex; align-items: center; gap: 6px; }
        .rs-msg-author { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.65); }
        .rs-msg-time { font-size: 10px; color: rgba(255,255,255,0.2); }
        .rs-msg-text { font-size: 12px; color: rgba(255,255,255,0.55); line-height: 1.5; }
        .rs-msg-quote { font-family: 'Libre Baskerville', serif; font-style: italic; font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.6; padding-left: 10px; border-left: 2px solid rgba(255,255,255,0.12); }
        .rs-chat-bottom { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
        .rs-chat-tabs { display: flex; gap: 12px; margin-bottom: 10px; }
        .rs-chat-tab { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.3); background: none; border: none; cursor: pointer; padding: 0 0 4px; border-bottom: 1px solid transparent; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .rs-chat-tab.active { color: rgba(255,255,255,0.7); border-bottom-color: rgba(255,255,255,0.3); }
        .rs-chat-form { display: flex; gap: 8px; align-items: flex-end; }
        .rs-chat-input { flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); padding: 8px 12px; font-size: 12px; border-radius: 2px; font-family: 'DM Sans', sans-serif; outline: none; resize: none; line-height: 1.4; }
        .rs-chat-input::placeholder { color: rgba(255,255,255,0.2); }
        .rs-chat-input:focus { border-color: rgba(255,255,255,0.18); }
        .rs-send-btn { width: 32px; height: 32px; background: #4A7C59; border: none; border-radius: 2px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; flex-shrink: 0; transition: background 0.15s; }
        .rs-send-btn:hover:not(:disabled) { background: #3D6B4A; }
        .rs-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .rs-reflection-textarea { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); padding: 8px 12px; font-size: 13px; border-radius: 2px; font-family: 'Libre Baskerville', serif; font-style: italic; outline: none; resize: none; line-height: 1.6; margin-bottom: 8px; box-sizing: border-box; }
        .rs-reflection-textarea::placeholder { color: rgba(255,255,255,0.2); }
        .rs-reflection-post-btn { width: 100%; background: #4A7C59; border: none; color: #fff; padding: 8px; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: 'DM Sans', sans-serif; transition: background 0.15s; }
        .rs-reflection-post-btn:hover:not(:disabled) { background: #3D6B4A; }
        .rs-reflection-post-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div className="rs-root">
        {/* Invisible mynoise iframe for ambience */}
        {currentAmbience && (
          <iframe
            key={currentAmbience.id}
            src={currentAmbience.url}
            className="rs-ambience-iframe"
            title="ambience"
            allow="autoplay"
          />
        )}

        {/* Left nav — SALON and FOCUS only */}
        <div className="rs-left-nav">
          <div className="rs-club-name">{clubData.name}</div>
          <div className="rs-session-badge">{isInSession ? 'Active Session' : 'Not in session'}</div>
          {/* + New Reflection — switches to reflection tab AND focuses textarea */}
          <button
            className="rs-new-reflection-btn"
            disabled={!isInSession}
            onClick={() => {
              setChatTab('reflection');
              setActiveNav('SALON');
              setTimeout(() => reflectionTextareaRef.current?.focus(), 150);
            }}
          >
            + New Reflection
          </button>

          <button
            className={`rs-nav-item${activeNav === 'SALON' ? ' active' : ''}`}
            onClick={() => setActiveNav('SALON')}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeNav === 'SALON' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)', display: 'inline-block', flexShrink: 0 }} />
            SALON
          </button>
          <button
            className={`rs-nav-item${activeNav === 'FOCUS' ? ' active' : ''}`}
            onClick={() => setActiveNav('FOCUS')}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeNav === 'FOCUS' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)', display: 'inline-block', flexShrink: 0 }} />
            FOCUS
          </button>

          <div className="rs-left-bottom">
            <Link href={`/clubs/${clubId}`} className="rs-back-link">
              <ArrowLeft size={10} />Back to Circle
            </Link>
          </div>
        </div>

        {/* Center */}
        <div className="rs-center">
          <div className="rs-top-bar">
            <div className="rs-top-bar-left">
              {activeNav === 'FOCUS' ? 'Focus Mode — Read in peace' : 'The Salon — Reading together'}
            </div>
            <div className="rs-top-bar-right">
              {isInSession ? (
                <button className="rs-leave-btn" onClick={handleLeaveSession}>Leave Session</button>
              ) : (
                <button className="rs-join-btn" onClick={handleJoinSession}>Join Session</button>
              )}
            </div>
          </div>

          <div className="rs-book-stage">
            {mySharedBook?.coverUrl ? (
              <img src={mySharedBook.coverUrl} alt={mySharedBook.title} className="rs-book-bg" />
            ) : (
              <div className="rs-book-bg-fallback" />
            )}
            <div className="rs-book-overlay" />

            {floatingQuotes.map((q, i) => (
              <div key={i} className="rs-floating-quote"
                style={{ top: i === 0 ? '12%' : '22%', left: i === 0 ? '8%' : '12%', opacity: 0.5 - i * 0.1 }}>
                {q.length > 100 ? q.slice(0, 100) + '...' : q}
              </div>
            ))}

            <div className="rs-progress-ring-wrap">
              <div
                className="rs-progress-ring"
                onClick={() => mySharedBook && setShowProgressUpdate(true)}
                title={mySharedBook ? 'Click to update progress' : ''}
              >
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - (mySharedBook?.progressPercent ?? 0) / 100)}`}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                </svg>
                <div className="rs-progress-pct">{mySharedBook?.progressPercent ?? 0}%</div>
              </div>
              {mySharedBook && <div className="rs-progress-hint">Tap to update</div>}
            </div>

            {mySharedBook && (
              <>
                <div className="rs-book-title-display">{mySharedBook.title}</div>
                {mySharedBook.chapter && <div className="rs-book-chapter-display">{mySharedBook.chapter}</div>}
              </>
            )}
            {onlineCount > 0 && <div className="rs-readers-count">· {onlineCount} others reading now</div>}

            {/* Progress update overlay */}
            {showProgressUpdate && (
              <div className="rs-progress-overlay">
                <div className="rs-progress-panel">
                  <div className="rs-progress-panel-title">Update Progress</div>
                  <div className="rs-plabel"><span>Chapter</span></div>
                  <input className="rs-pinput" placeholder="e.g. Chapter 14" value={chapterInput} onChange={e => setChapterInput(e.target.value)} />
                  {mySharedBook?.pageCount && (
                    <>
                      <div className="rs-plabel"><span>Current Page</span><span style={{ color: 'rgba(255,255,255,0.5)' }}>of {mySharedBook.pageCount}</span></div>
                      <input type="number" className="rs-pinput" placeholder={`1–${mySharedBook.pageCount}`} value={pageInput} onChange={e => handlePageChange(e.target.value)} min={0} max={mySharedBook.pageCount} />
                    </>
                  )}
                  <div className="rs-plabel">
                    <span>Progress</span>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#fff' }}>{progressInput}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={progressInput}
                    onChange={e => { setProgressInput(Number(e.target.value)); setPageInput(''); }}
                    style={{ width: '100%', accentColor: '#4A7C59', marginBottom: 12 }} />
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 1, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ height: '100%', background: '#4A7C59', width: `${progressInput}%`, transition: 'width 0.2s' }} />
                  </div>
                  <button className="rs-save-btn" onClick={handleSaveProgress}>Save Progress</button>
                  <button className="rs-cancel-btn-small" onClick={() => setShowProgressUpdate(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="rs-controls" style={{ position: 'relative' }}>
            {/* Ambience picker */}
            {showAmbiencePicker && (
              <div className="rs-ambience-picker">
                {AMBIENCE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    className={`rs-ambience-opt${ambienceId === opt.id ? ' active' : ''}`}
                    onClick={() => { setAmbienceId(ambienceId === opt.id ? null : opt.id); setShowAmbiencePicker(false); }}
                  >
                    {opt.label}
                  </button>
                ))}
                <button className="rs-ambience-opt" onClick={() => { setAmbienceId(null); setShowAmbiencePicker(false); }}>✕ Off</button>
              </div>
            )}

            <button
              className={`rs-ctrl-btn${ambienceId ? ' active' : ''}`}
              onClick={() => setShowAmbiencePicker(s => !s)}
            >
              {ambienceId ? <Volume2 size={12} /> : <VolumeX size={12} />}
              {ambienceId ? currentAmbience?.label : 'Ambience'}
            </button>
            <button className="rs-ctrl-btn" onClick={() => mySharedBook && setShowProgressUpdate(true)}>
              📖 Progress
            </button>
            <button
              className={`rs-ctrl-btn${activeNav === 'FOCUS' ? ' active' : ''}`}
              onClick={() => setActiveNav(activeNav === 'FOCUS' ? 'SALON' : 'FOCUS')}
            >
              ⚡ {activeNav === 'FOCUS' ? 'Exit Focus' : 'Focus Mode'}
            </button>
          </div>
        </div>

        {/* Right: Salon panel — hidden in FOCUS mode */}
        <div className={`rs-right${activeNav === 'FOCUS' ? ' hidden' : ''}`}>
          <div className="rs-chat-header">
            <div className="rs-chat-title">The Salon</div>
            <div className="rs-chat-subtitle">{onlineCount > 0 ? `${onlineCount} reading with you` : 'Join to read together'}</div>
          </div>

          {/* Members currently reading */}
          {members.length > 0 && (
            <div className="rs-members-list">
              <div className="rs-members-label">In the room</div>
              {members.slice(0, 5).map(m => {
                const mBook = sharedBooks.find(b => b.userId === m.userId);
                return (
                  <div key={m.userId} className="rs-member-row">
                    <div className={`rs-member-dot${m.isOnline ? '' : ' offline'}`} />
                    <span className="rs-member-name-sm">{m.name || m.userId?.slice(0, 12)}</span>
                    {mBook && <span className="rs-member-progress">{mBook.progressPercent ?? 0}%</span>}
                  </div>
                );
              })}
            </div>
          )}

          <div className="rs-chat-messages">
            {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, fontStyle: 'italic', fontFamily: "'Libre Baskerville', serif", marginTop: 20 }}>
                The salon is quiet. Share a thought.
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className="rs-msg">
                  <div className="rs-msg-meta">
                    <span className="rs-msg-author">{msg.userName || msg.userId?.slice(0, 10)}</span>
                    <span className="rs-msg-time">{timeAgo(msg.timestamp)}</span>
                  </div>
                  {msg.content?.startsWith('"') || msg.content?.startsWith('\u201c') ? (
                    <div className="rs-msg-quote">{msg.content}</div>
                  ) : (
                    <div className="rs-msg-text">{msg.content}</div>
                  )}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="rs-chat-bottom">
            <div className="rs-chat-tabs">
              <button className={`rs-chat-tab${chatTab === 'chat' ? ' active' : ''}`} onClick={() => setChatTab('chat')}>Chat</button>
              <button className={`rs-chat-tab${chatTab === 'reflection' ? ' active' : ''}`} onClick={() => setChatTab('reflection')}>Reflection</button>
            </div>

            {chatTab === 'reflection' ? (
              <div>
                <textarea
                  ref={reflectionTextareaRef}
                  className="rs-reflection-textarea"
                  placeholder='"A thought about what you just read..."'
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  disabled={!isInSession}
                />
                <button
                  className="rs-reflection-post-btn"
                  onClick={() => { handlePostReflection(message); setMessage(''); }}
                  disabled={!isInSession || !message.trim()}
                >
                  Post Reflection
                </button>
              </div>
            ) : (
              <form className="rs-chat-form" onSubmit={handleSubmitMessage}>
                <textarea
                  className="rs-chat-input"
                  placeholder={isInSession ? 'Share a thought...' : 'Join session to chat'}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  disabled={!isInSession}
                  rows={2}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (message.trim() && isInSession) { handleSendMessage(message); setMessage(''); }
                    }
                  }}
                />
                <button type="submit" className="rs-send-btn" disabled={!isInSession || !message.trim()}>
                  <Send size={12} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}