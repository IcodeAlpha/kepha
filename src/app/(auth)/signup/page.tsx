'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';

async function createUserProfile(firestore: any, user: any, displayName?: string) {
  const userRef = doc(firestore, 'users', user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    name: displayName || user.displayName || 'Reader',
    avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
    bio: '',
    favoriteGenres: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

const FLOATING_TITLES = [
  "Middlemarch", "Beloved", "The Waves",
  "Invisible Man", "Anna Karenina", "Jane Eyre",
  "Song of Solomon", "The Stranger",
];

const PERKS = [
  { icon: '📖', label: 'Track every book you read' },
  { icon: '🌿', label: 'Build daily reading streaks' },
  { icon: '✍️', label: 'Keep a private reading journal' },
  { icon: '🫂', label: 'Join intimate reading circles' },
];

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailSignup = async () => {
    setError('');
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await createUserProfile(firestore, cred.user, name);
      router.push('/dashboard');
    } catch (e: any) { setError(e.message); }
  };

  const handleGoogleSignup = async () => {
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      await createUserProfile(firestore, cred.user);
      router.push('/dashboard');
    } catch (e: any) { setError(e.message); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; }

        .su-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #F5F0E8;
          font-family: 'DM Sans', sans-serif;
        }
        @media (max-width: 800px) {
          .su-root { grid-template-columns: 1fr; }
          .su-right-panel { display: none !important; }
        }

        /* ── Left form panel ── */
        .su-left {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          animation: fadeSlideIn 0.5s ease both;
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .su-form-wrap {
          width: 100%;
          max-width: 380px;
        }

        .su-logo {
          display: block;
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: #1A1A18;
          text-decoration: none;
          margin-bottom: 36px;
        }
        .su-logo em { font-style: italic; color: #4A7C59; }

        .su-eyebrow {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #8A8578;
          margin-bottom: 10px;
        }
        .su-title {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 600;
          color: #1A1A18;
          margin-bottom: 32px;
          line-height: 1.15;
        }
        .su-title em { font-style: italic; }

        /* Google */
        .su-google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #EDE7D9;
          border: 1px solid #D8D0C0;
          border-radius: 2px;
          padding: 11px 18px;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #3D3D38;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          transition: border-color 0.15s, background 0.15s;
          margin-bottom: 24px;
        }
        .su-google-btn:hover { border-color: #3D3D38; background: #E5DDD0; }

        /* Divider */
        .su-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .su-divider-line { flex: 1; height: 1px; background: #D8D0C0; }
        .su-divider-text {
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8A8578;
        }

        /* Fields */
        .su-field { margin-bottom: 14px; }
        .su-label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8A8578;
          margin-bottom: 7px;
        }
        .su-input {
          width: 100%;
          background: #EDE7D9;
          border: 1px solid #D8D0C0;
          border-radius: 2px;
          padding: 10px 14px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #1A1A18;
          outline: none;
          transition: border-color 0.15s;
        }
        .su-input:focus { border-color: #1C2B1E; }
        .su-input::placeholder { color: #B0A898; }

        .su-error {
          font-size: 12px;
          color: #8B3A3A;
          background: #F5EAE8;
          border: 1px solid #E0C8C5;
          border-radius: 2px;
          padding: 10px 14px;
          margin-bottom: 14px;
          line-height: 1.5;
        }

        .su-submit {
          width: 100%;
          background: #1C2B1E;
          color: #fff;
          border: none;
          padding: 12px 18px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          transition: background 0.15s;
          margin-bottom: 20px;
          margin-top: 6px;
        }
        .su-submit:hover { background: #2A3D2D; }

        .su-footer-text {
          text-align: center;
          font-size: 12px;
          color: #8A8578;
        }
        .su-footer-text a {
          color: #1C2B1E;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .su-footer-text a:hover { color: #4A7C59; }

        /* ── Right decorative panel ── */
        .su-right-panel {
          background: #1C2B1E;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
        }
        .su-right-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.35;
          pointer-events: none;
          z-index: 0;
        }

        /* Floating titles */
        .su-floaters {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }
        .su-floater {
          position: absolute;
          font-family: 'Libre Baskerville', serif;
          font-style: italic;
          font-size: 11px;
          color: rgba(255,255,255,0.06);
          letter-spacing: 0.06em;
          white-space: nowrap;
          animation: floatUp2 linear infinite;
        }
        @keyframes floatUp2 {
          0%   { transform: translateY(110vh) rotate(-2deg); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-10vh) rotate(2deg); opacity: 0; }
        }

        .su-right-logo {
          position: relative;
          z-index: 2;
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          text-decoration: none;
        }
        .su-right-logo em { font-style: italic; color: #4A7C59; }

        /* Perks list */
        .su-perks {
          position: relative;
          z-index: 2;
        }
        .su-perks-title {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 24px;
        }
        .su-perk {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          animation: perkIn 0.4s ease both;
        }
        .su-perk:first-of-type { border-top: 1px solid rgba(255,255,255,0.07); }
        @keyframes perkIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .su-perk-icon { font-size: 18px; flex-shrink: 0; }
        .su-perk-label {
          font-family: 'Libre Baskerville', serif;
          font-size: 13px;
          color: rgba(255,255,255,0.75);
          line-height: 1.5;
        }

        /* Bottom tagline */
        .su-right-tagline {
          position: relative;
          z-index: 2;
        }
        .su-tagline-text {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-style: italic;
          color: rgba(255,255,255,0.5);
          line-height: 1.5;
        }
        .su-tagline-text strong {
          color: #fff;
          font-style: italic;
          font-weight: 600;
        }
      `}</style>

      <div className="su-root">
        {/* ── Left: form ── */}
        <div className="su-left">
          <div className="su-form-wrap">
            <Link href="/" className="su-logo">Si<em>pha</em></Link>

            <p className="su-eyebrow">Begin your journey</p>
            <h1 className="su-title">Open your<br /><em>sanctuary.</em></h1>

            <button className="su-google-btn" onClick={handleGoogleSignup}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="su-divider">
              <div className="su-divider-line" />
              <span className="su-divider-text">or</span>
              <div className="su-divider-line" />
            </div>

            <div className="su-field">
              <label className="su-label">Display Name</label>
              <input
                className="su-input"
                type="text"
                placeholder="How shall we call you?"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="su-field">
              <label className="su-label">Email</label>
              <input
                className="su-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="su-field">
              <label className="su-label">Password</label>
              <input
                className="su-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="su-error">{error}</div>}

            <button className="su-submit" onClick={handleEmailSignup}>
              Create Account
            </button>

            <p className="su-footer-text">
              Already have an account?{' '}
              <Link href="/login">Sign in</Link>
            </p>
          </div>
        </div>

        {/* ── Right: decorative panel ── */}
        <div className="su-right-panel">
          <div className="su-floaters">
            {FLOATING_TITLES.map((title, i) => (
              <span
                key={title}
                className="su-floater"
                style={{
                  left: `${6 + (i * 13) % 82}%`,
                  animationDuration: `${20 + (i * 3.7) % 12}s`,
                  animationDelay: `${-(i * 2.8) % 18}s`,
                  fontSize: `${10 + (i % 3) * 2}px`,
                }}
              >
                {title}
              </span>
            ))}
          </div>

          <Link href="/" className="su-right-logo">
            Si<em>pha</em>
          </Link>

          <div className="su-perks">
            <p className="su-perks-title">Everything in your sanctuary</p>
            {PERKS.map((p, i) => (
              <div
                key={p.label}
                className="su-perk"
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <span className="su-perk-icon">{p.icon}</span>
                <span className="su-perk-label">{p.label}</span>
              </div>
            ))}
          </div>

          <div className="su-right-tagline">
            <p className="su-tagline-text">
              Your books.<br />
              Your thoughts.<br />
              <strong>Your sanctuary.</strong>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}