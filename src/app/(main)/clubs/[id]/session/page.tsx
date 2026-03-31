'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { collection, query, orderBy, limit, serverTimestamp, doc } from 'firebase/firestore';
import {
  useFirestore, useUser, useDoc, useCollection, useMemoFirebase,
  addDocumentNonBlocking, updateDocumentNonBlocking,
} from '@/firebase';
import { ArrowLeft, Send } from 'lucide-react';

export default function ReadingSessionPage() {
  const params = useParams();
  const clubId = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const [isInSession, setIsInSession] = useState(false);
  const [message, setMessage] = useState('');
  const [activeNav, setActiveNav] = useState('SALON');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const clubRef = useMemoFirebase(() => (clubId ? doc(firestore, 'clubs', clubId) : null), [firestore, clubId]);
  const { data: club, isLoading: isClubLoading } = useDoc(clubRef);

  const membersRef = useMemoFirebase(() => (clubId ? collection(firestore, 'clubs', clubId, 'members') : null), [firestore, clubId]);
  const { data: membersRaw } = useCollection(membersRef);
  const members: any[] = membersRaw ?? [];

  const sharedBooksRef = useMemoFirebase(() => (clubId ? collection(firestore, 'clubs', clubId, 'sharedBooks') : null), [firestore, clubId]);
  const { data: sharedBooksRaw } = useCollection(sharedBooksRef);
  const sharedBooks: any[] = sharedBooksRaw ?? [];

  const messagesQuery = useMemoFirebase(() => {
    if (!clubId) return null;
    return query(collection(firestore, 'readingSessions', clubId, 'messages'), orderBy('timestamp', 'asc'), limit(50));
  }, [firestore, clubId]);
  const { data: chatMessagesRaw } = useCollection(messagesQuery);
  const chatMessages: any[] = chatMessagesRaw ?? [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (isClubLoading || !club) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D1A10' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', fontSize: 13 }}>Preparing the reading room...</p>
        </div>
      </div>
    );
  }

  const clubData = club as any;
  const mySharedBook = sharedBooks.find(b => b.userId === user?.uid) || sharedBooks[0];
  const onlineCount = members.filter(m => m.isOnline).length;

  const handleSendMessage = (content: string) => {
    if (!user || !content.trim()) return;
    addDocumentNonBlocking(collection(firestore, 'readingSessions', clubId, 'messages'), {
      userId: user.uid, userName: user.displayName || user.email?.split('@')[0] || 'Reader',
      content, timestamp: serverTimestamp(), type: 'text',
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
    if (!message.trim()) return;
    handleSendMessage(message);
    setMessage('');
  };

  function timeAgo(ts: any): string {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return 'now';
    if (diff < 60) return `${diff}m`;
    return `${Math.floor(diff / 60)}h`;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .rs-root {
          display: flex;
          height: calc(100vh - 56px);
          background: #0D1A10;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
          margin: -16px -24px;
          overflow: hidden;
        }
        @media (max-width: 768px) { .rs-root { margin: -16px; } }

        /* Left nav */
        .rs-left-nav {
          width: 160px;
          background: rgba(0,0,0,0.3);
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          padding: 20px 0;
          flex-shrink: 0;
        }
        .rs-club-name {
          font-family: 'Playfair Display', serif;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          padding: 0 16px 4px;
        }
        .rs-session-badge {
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #4A7C59;
          padding: 0 16px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 12px;
        }
        .rs-new-reflection-btn {
          margin: 0 12px 16px;
          background: #4A7C59;
          color: #fff;
          border: none;
          padding: 8px 10px;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          text-align: center;
          transition: background 0.15s;
        }
        .rs-new-reflection-btn:hover { background: #3D6B4A; }
        .rs-nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          transition: all 0.15s;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-family: 'DM Sans', sans-serif;
        }
        .rs-nav-item:hover { color: rgba(255,255,255,0.7); }
        .rs-nav-item.active { color: rgba(255,255,255,0.9); }
        .rs-nav-item svg { opacity: 0.5; width: 12px; height: 12px; }
        .rs-nav-item.active svg { opacity: 0.8; }
        .rs-left-bottom {
          margin-top: auto;
          padding: 12px 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .rs-back-link {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          text-decoration: none;
          transition: color 0.15s;
        }
        .rs-back-link:hover { color: rgba(255,255,255,0.6); }

        /* Center: Book immersion */
        .rs-center {
          flex: 1;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .rs-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(0,0,0,0.2);
          z-index: 2;
          flex-shrink: 0;
        }
        .rs-top-bar-tabs {
          display: flex;
          gap: 20px;
        }
        .rs-top-tab {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          padding: 0;
          transition: color 0.15s;
        }
        .rs-top-tab:hover, .rs-top-tab.active { color: rgba(255,255,255,0.9); }
        .rs-leave-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.6);
          padding: 6px 14px;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .rs-leave-btn:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
        .rs-join-btn {
          background: #4A7C59;
          border: none;
          color: #fff;
          padding: 8px 20px;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          transition: background 0.15s;
        }
        .rs-join-btn:hover { background: #3D6B4A; }

        /* Book center piece */
        .rs-book-stage {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .rs-book-bg {
          position: absolute;
          inset: 0;
          object-fit: cover;
          width: 100%;
          height: 100%;
          opacity: 0.4;
          filter: blur(2px);
        }
        .rs-book-bg-fallback {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, #1C3A22 0%, #0D1A10 70%);
        }
        .rs-book-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(13,26,16,0.3) 0%, rgba(13,26,16,0.6) 100%); }
        .rs-progress-ring-wrap {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .rs-progress-ring {
          position: relative;
          width: 120px;
          height: 120px;
        }
        .rs-progress-ring svg {
          transform: rotate(-90deg);
        }
        .rs-progress-pct {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 400;
          color: #fff;
        }
        .rs-floating-quote {
          position: absolute;
          z-index: 2;
          font-family: 'Libre Baskerville', serif;
          font-style: italic;
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          line-height: 1.7;
          text-align: center;
          max-width: 360px;
          padding: 0 20px;
        }
        .rs-floating-quote-top { top: 15%; }
        .rs-floating-quote-bottom { bottom: 18%; }
        .rs-readers-count {
          position: absolute;
          z-index: 2;
          bottom: 10%;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
        }
        .rs-book-title-display {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 600;
          color: #fff;
          text-align: center;
          position: absolute;
          bottom: 14%;
          z-index: 2;
        }
        .rs-book-chapter {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          text-align: center;
          position: absolute;
          bottom: 11%;
          z-index: 2;
        }

        /* Bottom controls */
        .rs-controls {
          display: flex;
          justify-content: center;
          gap: 24px;
          align-items: center;
          padding: 12px 20px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(0,0,0,0.2);
          flex-shrink: 0;
        }
        .rs-ctrl-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: color 0.15s;
          padding: 0;
        }
        .rs-ctrl-btn:hover { color: rgba(255,255,255,0.8); }

        /* Right: Chat */
        .rs-right {
          width: 280px;
          background: rgba(0,0,0,0.25);
          border-left: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .rs-chat-header {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .rs-chat-title {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          margin-bottom: 2px;
        }
        .rs-chat-subtitle {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
        }
        .rs-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .rs-chat-messages::-webkit-scrollbar { width: 3px; }
        .rs-chat-messages::-webkit-scrollbar-track { background: transparent; }
        .rs-chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .rs-msg { display: flex; flex-direction: column; gap: 3px; }
        .rs-msg-meta { display: flex; align-items: center; gap: 6px; }
        .rs-msg-author { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.7); }
        .rs-msg-time { font-size: 10px; color: rgba(255,255,255,0.25); }
        .rs-msg-text { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.5; }
        .rs-msg-quote { font-family: 'Libre Baskerville', serif; font-style: italic; font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.6; padding-left: 10px; border-left: 2px solid rgba(255,255,255,0.15); }
        .rs-chat-input-wrap {
          padding: 12px 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .rs-chat-form { display: flex; gap: 8px; align-items: center; }
        .rs-chat-input {
          flex: 1;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
          padding: 8px 12px;
          font-size: 12px;
          border-radius: 2px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
        }
        .rs-chat-input::placeholder { color: rgba(255,255,255,0.25); }
        .rs-chat-input:focus { border-color: rgba(255,255,255,0.2); }
        .rs-send-btn {
          width: 32px; height: 32px;
          background: #4A7C59;
          border: none;
          border-radius: 2px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #fff;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .rs-send-btn:hover { background: #3D6B4A; }

        /* Settings icon at bottom */
        .rs-settings-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .rs-settings-btn {
          font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.25); background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 4px;
          transition: color 0.15s;
        }
        .rs-settings-btn:hover { color: rgba(255,255,255,0.5); }
      `}</style>

      <div className="rs-root">
        {/* Left nav */}
        <div className="rs-left-nav">
          <div className="rs-club-name">{clubData.name}</div>
          <div className="rs-session-badge">Active Session</div>
          <button className="rs-new-reflection-btn">+ New Reflection</button>
          {['LIBRARY', 'SALON', 'FOCUS', 'ARCHIVES'].map(nav => (
            <button
              key={nav}
              className={`rs-nav-item${activeNav === nav ? ' active' : ''}`}
              onClick={() => setActiveNav(nav)}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeNav === nav ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)', display: 'inline-block', flexShrink: 0 }} />
              {nav}
            </button>
          ))}
          <div className="rs-left-bottom">
            <Link href={`/clubs/${clubId}`} className="rs-back-link">
              <ArrowLeft size={10} />Back
            </Link>
          </div>
        </div>

        {/* Center */}
        <div className="rs-center">
          {/* Top bar */}
          <div className="rs-top-bar">
            <div className="rs-top-bar-tabs">
              <button className="rs-top-tab active">Overview</button>
              <button className="rs-top-tab">Immersion</button>
              <button className="rs-top-tab">Realtime Reflections</button>
            </div>
            {isInSession ? (
              <button className="rs-leave-btn" onClick={handleLeaveSession}>Leave Session</button>
            ) : (
              <button className="rs-join-btn" onClick={handleJoinSession}>Join Session</button>
            )}
          </div>

          {/* Book stage */}
          <div className="rs-book-stage">
            {mySharedBook?.coverUrl ? (
              <img src={mySharedBook.coverUrl} alt={mySharedBook.title} className="rs-book-bg" />
            ) : (
              <div className="rs-book-bg-fallback" />
            )}
            <div className="rs-book-overlay" />

            {/* Floating quotes */}
            {chatMessages.slice(-3, -1).map((msg, i) => (
              <div key={msg.id} className={`rs-floating-quote ${i === 0 ? 'rs-floating-quote-top' : ''}`} style={{ top: i === 0 ? '12%' : '20%', opacity: 0.6 - i * 0.1 }}>
                {msg.content}
              </div>
            ))}

            {/* Progress ring */}
            <div className="rs-progress-ring-wrap">
              <div className="rs-progress-ring">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - (mySharedBook?.progressPercent ?? 0) / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="rs-progress-pct">{mySharedBook?.progressPercent ?? 0}%</div>
              </div>
            </div>

            {/* Book title */}
            <div className="rs-book-title-display">
              {mySharedBook?.title || clubData.name}
            </div>
            {mySharedBook?.chapter && (
              <div className="rs-book-chapter">Chapter {mySharedBook.chapter} · The Long Goodbye</div>
            )}

            {/* Readers count */}
            {onlineCount > 0 && (
              <div className="rs-readers-count">· {onlineCount + 1} others reading now</div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="rs-controls">
            <button className="rs-ctrl-btn">🔇 Mute</button>
            <button className="rs-ctrl-btn">🌙 Ambience</button>
            <button className="rs-ctrl-btn">⚡ Focus Mode</button>
          </div>
        </div>

        {/* Right: Chat / Reflections */}
        <div className="rs-right">
          <div className="rs-chat-header">
            <div className="rs-chat-title">Realtime Reflections</div>
            <div className="rs-chat-subtitle">{onlineCount} reading with you</div>
          </div>

          <div className="rs-chat-messages">
            {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, fontStyle: 'italic', fontFamily: "'Libre Baskerville', serif", marginTop: 20 }}>
                The room is quiet. Share a reflection.
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

          <div className="rs-chat-input-wrap">
            <form className="rs-chat-form" onSubmit={handleSubmitMessage}>
              <input
                className="rs-chat-input"
                placeholder="Share a reflection..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={!isInSession}
              />
              <button type="submit" className="rs-send-btn" disabled={!isInSession || !message.trim()}>
                <Send size={12} />
              </button>
            </form>
          </div>

          <div className="rs-settings-row">
            <button className="rs-settings-btn">⚙ Settings</button>
            <button className="rs-settings-btn">Focus Mode →</button>
          </div>
        </div>
      </div>
    </>
  );
}