'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth, initiateEmailSignIn } from '@/firebase';
import { BookOpen, Feather, Users } from 'lucide-react';

const QUOTES = [
  { text: "A reader lives a thousand lives before he dies.", attr: "George R.R. Martin" },
  { text: "Not all those who wander are lost.", attr: "J.R.R. Tolkien" },
  { text: "There is no friend as loyal as a book.", attr: "Ernest Hemingway" },
  { text: "One must always be careful of books.", attr: "Cassandra Clare" },
];

const FLOATING_TITLES = [
  "Dune", "Middlemarch", "The Master & Margarita",
  "Beloved", "Invisible Man", "The God of Small Things",
  "One Hundred Years of Solitude", "To The Lighthouse",
];

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailLogin = () => {
    setError('');
    initiateEmailSignIn(auth, email, password);
    router.push('/dashboard');
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; }

        .auth-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #F5F0E8;
          font-family: 'DM Sans', sans-serif;
        }
        @media (max-width: 800px) {
          .auth-root { grid-template-columns: 1fr; }
          .auth-left { display: none !important; }
        }

        /* ── Left panel ── */
        .auth-left {
          background: #1C2B1E;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
        }

        /* Animated grain overlay */
        .auth-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.35;
          pointer-events: none;
          z-index: 0;
        }

        /* Floating book titles */
        .auth-floaters {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }
        .auth-floater {
          position: absolute;
          font-family: 'Libre Baskerville', serif;
          font-style: italic;
          font-size: 11px;
          color: rgba(255,255,255,0.07);
          letter-spacing: 0.06em;
          white-space: nowrap;
          animation: floatUp linear infinite;
        }
        @keyframes floatUp {
          0%   { transform: translateY(110vh) rotate(-3deg); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-10vh) rotate(3deg); opacity: 0; }
        }

        .auth-left-logo {
          position: relative;
          z-index: 2;
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          text-decoration: none;
          letter-spacing: -0.01em;
        }
        .auth-left-logo em { font-style: italic; color: #4A7C59; }

        .auth-left-body {
          position: relative;
          z-index: 2;
        }
        .auth-left-eyebrow {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 20px;
        }
        .auth-left-quote {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 400;
          font-style: italic;
          color: #fff;
          line-height: 1.4;
          margin-bottom: 16px;
        }
        .auth-left-attr {
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 14px;
          margin-top: 14px;
        }

        .auth-left-stats {
          position: relative;
          z-index: 2;
          display: flex;
          gap: 32px;
        }
        .auth-left-stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 600;
          color: #fff;
        }
        .auth-left-stat-label {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-top: 2px;
        }

        /* ── Right panel (form) ── */
        .auth-right {
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

        .auth-form-wrap {
          width: 100%;
          max-width: 380px;
        }

        .auth-mobile-logo {
          display: none;
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: #1A1A18;
          text-decoration: none;
          margin-bottom: 36px;
        }
        .auth-mobile-logo em { font-style: italic; color: #4A7C59; }
        @media (max-width: 800px) { .auth-mobile-logo { display: block; } }

        .auth-eyebrow {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #8A8578;
          margin-bottom: 10px;
        }
        .auth-title {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 600;
          color: #1A1A18;
          margin-bottom: 32px;
          line-height: 1.15;
        }
        .auth-title em { font-style: italic; }

        /* Google button */
        .auth-google-btn {
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
        .auth-google-btn:hover { border-color: #3D3D38; background: #E5DDD0; }

        /* Divider */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .auth-divider-line { flex: 1; height: 1px; background: #D8D0C0; }
        .auth-divider-text {
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8A8578;
        }

        /* Fields */
        .auth-field { margin-bottom: 16px; }
        .auth-label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8A8578;
          margin-bottom: 7px;
        }
        .auth-input {
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
        .auth-input:focus { border-color: #1C2B1E; }
        .auth-input::placeholder { color: #B0A898; }

        .auth-error {
          font-size: 12px;
          color: #8B3A3A;
          background: #F5EAE8;
          border: 1px solid #E0C8C5;
          border-radius: 2px;
          padding: 10px 14px;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        /* Submit */
        .auth-submit {
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
        }
        .auth-submit:hover { background: #2A3D2D; }

        .auth-footer-text {
          text-align: center;
          font-size: 12px;
          color: #8A8578;
        }
        .auth-footer-text a {
          color: #1C2B1E;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .auth-footer-text a:hover { color: #4A7C59; }
      `}</style>

      <div className="auth-root">
        {/* ── Left decorative panel ── */}
        <div className="auth-left">
          {/* Floating book titles */}
          <div className="auth-floaters">
            {FLOATING_TITLES.map((title, i) => (
              <span
                key={title}
                className="auth-floater"
                style={{
                  left: `${8 + (i * 11) % 80}%`,
                  animationDuration: `${18 + (i * 4.3) % 14}s`,
                  animationDelay: `${-(i * 3.1) % 16}s`,
                  fontSize: `${10 + (i % 3) * 2}px`,
                }}
              >
                {title}
              </span>
            ))}
          </div>

          <Link href="/" className="auth-left-logo">
            Si<em>pha</em>
          </Link>

          <div className="auth-left-body">
            <p className="auth-left-eyebrow">Words to carry with you</p>
            <p className="auth-left-quote">
              "{QUOTES[1].text}"
            </p>
            <p className="auth-left-attr">— {QUOTES[1].attr}</p>
          </div>

          <div className="auth-left-stats">
            {[['12k+', 'Books'], ['340+', 'Circles'], ['28k+', 'Notes']].map(([v, l]) => (
              <div key={l}>
                <div className="auth-left-stat-value">{v}</div>
                <div className="auth-left-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="auth-right">
          <div className="auth-form-wrap">
            <Link href="/" className="auth-mobile-logo">Si<em>pha</em></Link>

            <p className="auth-eyebrow">Welcome back</p>
            <h1 className="auth-title">Return to your<br /><em>sanctuary.</em></h1>

            <button className="auth-google-btn" onClick={handleGoogleLogin}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or</span>
              <div className="auth-divider-line" />
            </div>

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-submit" onClick={handleEmailLogin}>
              Sign In
            </button>

            <p className="auth-footer-text">
              No account?{' '}
              <Link href="/signup">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}