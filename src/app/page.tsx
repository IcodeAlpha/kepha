'use client';

import Link from "next/link";
import Image from "next/image";
import { books } from "@/lib/data";
import { BookOpen, Users, Feather, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

// ── Rotating quotes ────────────────────────────────────────────────────────────
const QUOTES = [
  { text: "A reader lives a thousand lives before he dies.", attr: "— George R.R. Martin" },
  { text: "Not all those who wander are lost.", attr: "— J.R.R. Tolkien" },
  { text: "So many books, so little time.", attr: "— Frank Zappa" },
  { text: "There is no friend as loyal as a book.", attr: "— Ernest Hemingway" },
];

function QuoteCarousel() {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % QUOTES.length);
        setFade(true);
      }, 400);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      borderLeft: '2px solid #D8D0C0',
      paddingLeft: 20,
      margin: '40px auto',
      maxWidth: 480,
      textAlign: 'left',
      transition: 'opacity 0.4s',
      opacity: fade ? 1 : 0,
    }}>
      <p style={{
        fontFamily: "'Libre Baskerville', serif",
        fontStyle: 'italic',
        fontSize: 16,
        color: '#3D3D38',
        lineHeight: 1.75,
        marginBottom: 8,
      }}>
        "{QUOTES[idx].text}"
      </p>
      <p style={{
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: '#8A8578',
      }}>
        {QUOTES[idx].attr}
      </p>
    </div>
  );
}

// ── Feature pill ───────────────────────────────────────────────────────────────
function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: '#EDE7D9',
      border: '1px solid #D8D0C0',
      borderRadius: 2,
      padding: '10px 16px',
      fontSize: 11,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: '#3D3D38',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {icon}
      {label}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const featuredBooks = books.slice(0, 4);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #F5F0E8;
          color: #1A1A18;
          font-family: 'DM Sans', sans-serif;
        }

        .lp-wrap {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #F5F0E8;
        }

        /* ── Header ── */
        .lp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          height: 72px;
          border-bottom: 1px solid #D8D0C0;
          background: #F5F0E8;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .lp-logo {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: #1A1A18;
          letter-spacing: -0.01em;
          text-decoration: none;
        }
        .lp-logo em { font-style: italic; color: #4A7C59; }
        .lp-nav { display: flex; align-items: center; gap: 16px; }
        .lp-btn-ghost {
          background: transparent;
          border: none;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8A8578;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
          transition: color 0.15s;
          padding: 8px 0;
        }
        .lp-btn-ghost:hover { color: #1A1A18; }
        .lp-btn-primary {
          background: #1C2B1E;
          color: #fff;
          border: none;
          padding: 10px 22px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.15s;
        }
        .lp-btn-primary:hover { background: #2A3D2D; }
        .lp-btn-outline {
          background: transparent;
          color: #3D3D38;
          border: 1px solid #D8D0C0;
          padding: 10px 22px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: border-color 0.15s;
        }
        .lp-btn-outline:hover { border-color: #3D3D38; }

        /* ── Hero ── */
        .lp-hero {
          max-width: 1000px;
          margin: 0 auto;
          padding: 80px 48px 64px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: start;
        }
        @media (max-width: 700px) {
          .lp-hero { grid-template-columns: 1fr; gap: 40px; padding: 48px 24px; }
          .lp-header { padding: 0 24px; }
        }
        .lp-hero-eyebrow {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #8A8578;
          margin-bottom: 20px;
        }
        .lp-hero-title {
          font-family: 'Playfair Display', serif;
          font-size: 52px;
          font-weight: 400;
          line-height: 1.08;
          letter-spacing: -0.015em;
          color: #1A1A18;
          margin-bottom: 20px;
        }
        .lp-hero-title em { font-style: italic; }
        .lp-hero-body {
          font-size: 14px;
          color: #8A8578;
          line-height: 1.8;
          margin-bottom: 32px;
          max-width: 380px;
        }
        .lp-hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .lp-features {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 32px;
        }

        /* ── Divider ── */
        .lp-divider {
          width: 40px;
          height: 1px;
          background: #D8D0C0;
          margin: 0 auto 48px;
        }

        /* ── Books section ── */
        .lp-books-section {
          background: #EDE7D9;
          border-top: 1px solid #D8D0C0;
          border-bottom: 1px solid #D8D0C0;
          padding: 64px 48px;
        }
        @media (max-width: 700px) { .lp-books-section { padding: 48px 24px; } }
        .lp-books-inner { max-width: 1000px; margin: 0 auto; }
        .lp-section-eyebrow {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #8A8578;
          margin-bottom: 10px;
        }
        .lp-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 600;
          color: #1A1A18;
          margin-bottom: 36px;
        }
        .lp-books-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 700px) { .lp-books-grid { grid-template-columns: repeat(2, 1fr); } }
        .lp-book-item { position: relative; }
        .lp-book-item img {
          width: 100%;
          aspect-ratio: 2/3;
          object-fit: cover;
          border-radius: 2px;
          box-shadow: 4px 6px 18px rgba(0,0,0,0.14);
          display: block;
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .lp-book-item:hover img {
          transform: translateY(-4px);
          box-shadow: 4px 12px 28px rgba(0,0,0,0.2);
        }
        .lp-book-title {
          font-size: 11px;
          color: #3D3D38;
          margin-top: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: 'Libre Baskerville', serif;
        }
        .lp-book-author {
          font-size: 10px;
          color: #8A8578;
          margin-top: 3px;
          font-style: italic;
          font-family: 'Libre Baskerville', serif;
        }
        .lp-books-cta {
          margin-top: 32px;
          text-align: right;
        }

        /* ── Values ── */
        .lp-values-section {
          max-width: 1000px;
          margin: 0 auto;
          padding: 72px 48px;
        }
        @media (max-width: 700px) { .lp-values-section { padding: 48px 24px; } }
        .lp-values-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 36px;
        }
        @media (max-width: 700px) { .lp-values-grid { grid-template-columns: 1fr; } }
        .lp-value-card {
          background: #EDE7D9;
          border: 1px solid #D8D0C0;
          border-radius: 4px;
          padding: 28px;
        }
        .lp-value-icon { color: #8A8578; margin-bottom: 14px; }
        .lp-value-title {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          font-weight: 600;
          color: #1A1A18;
          margin-bottom: 10px;
        }
        .lp-value-body {
          font-size: 13px;
          color: #8A8578;
          line-height: 1.75;
        }

        /* ── CTA banner ── */
        .lp-cta-section {
          background: #1C2B1E;
          padding: 72px 48px;
          text-align: center;
        }
        .lp-cta-eyebrow {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 16px;
        }
        .lp-cta-title {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 400;
          color: #fff;
          line-height: 1.15;
          margin-bottom: 12px;
        }
        .lp-cta-title em { font-style: italic; }
        .lp-cta-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 36px;
          line-height: 1.7;
        }
        .lp-btn-light {
          background: #F5F0E8;
          color: #1C2B1E;
          border: none;
          padding: 12px 28px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.15s;
        }
        .lp-btn-light:hover { background: #EDE7D9; }

        /* ── Footer ── */
        .lp-footer {
          background: #EDE7D9;
          border-top: 1px solid #D8D0C0;
          padding: 32px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        @media (max-width: 700px) {
          .lp-footer { flex-direction: column; gap: 12px; text-align: center; padding: 24px; }
        }
        .lp-footer-logo {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          color: #1A1A18;
          text-decoration: none;
        }
        .lp-footer-copy {
          font-size: 11px;
          color: #8A8578;
          letter-spacing: 0.04em;
        }
      `}</style>

      <div className="lp-wrap">
        {/* Header */}
        <header className="lp-header">
          <a href="/" className="lp-logo">Si<em>pha</em></a>
          <nav className="lp-nav">
            <a href="/discover" className="lp-btn-ghost">Discover</a>
            <a href="/clubs" className="lp-btn-ghost">Clubs</a>
            <Link href="/dashboard" className="lp-btn-primary">
              Enter Sanctuary <ArrowRight size={12} />
            </Link>
          </nav>
        </header>

        <main style={{ flex: 1 }}>
          {/* ── Hero ── */}
          <section className="lp-hero">
            <div>
              <p className="lp-hero-eyebrow">Your private reading sanctuary</p>
              <h1 className="lp-hero-title">
                Read together,<br /><em>grow</em> together.
              </h1>
              <p className="lp-hero-body">
                Sipha is a quiet corner of the internet for readers. Discover books, form intimate reading circles, and grow through shared ideas — at your own pace.
              </p>
              <div className="lp-hero-actions">
                <Link href="/dashboard" className="lp-btn-primary">
                  Enter Sanctuary <ArrowRight size={12} />
                </Link>
                <Link href="/discover" className="lp-btn-outline">
                  Browse Books
                </Link>
              </div>
              <div className="lp-features">
                <FeaturePill icon={<BookOpen size={12} />} label="Reading Tracker" />
                <FeaturePill icon={<Users size={12} />} label="Book Clubs" />
                <FeaturePill icon={<Feather size={12} />} label="Reading Journal" />
              </div>
            </div>

            {/* Quote carousel */}
            <div style={{ paddingTop: 8 }}>
              <p style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#8A8578',
                marginBottom: 20,
              }}>
                Words that linger
              </p>
              <QuoteCarousel />
              <div style={{
                marginTop: 32,
                background: '#EDE7D9',
                border: '1px solid #D8D0C0',
                borderRadius: 4,
                padding: '20px 24px',
              }}>
                <p style={{
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#8A8578',
                  marginBottom: 6,
                }}>
                  At a glance
                </p>
                {[
                  ['Books tracked', '12,400+'],
                  ['Active reading circles', '340+'],
                  ['Journal entries written', '28,000+'],
                ].map(([label, value]) => (
                  <div key={label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    paddingTop: 10,
                    marginTop: 10,
                    borderTop: '1px solid #D8D0C0',
                  }}>
                    <span style={{ fontSize: 12, color: '#8A8578' }}>{label}</span>
                    <span style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 20,
                      fontWeight: 600,
                      color: '#1A1A18',
                    }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Featured Books ── */}
          <section className="lp-books-section">
            <div className="lp-books-inner">
              <p className="lp-section-eyebrow">On the shelves</p>
              <h2 className="lp-section-title">Featured Books</h2>
              <div className="lp-books-grid">
                {featuredBooks.map((book) => (
                  <Link key={book.id} href="/discover" style={{ textDecoration: 'none' }}>
                    <div className="lp-book-item">
                      <Image
                        src={book.coverUrl}
                        alt={`Cover of ${book.title}`}
                        width={300}
                        height={450}
                        data-ai-hint={book.coverHint}
                      />
                      <div className="lp-book-title">{book.title}</div>
                      <div className="lp-book-author">{book.author}</div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="lp-books-cta">
                <Link href="/discover" className="lp-btn-outline">
                  Browse all books <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </section>

          {/* ── Values ── */}
          <section className="lp-values-section">
            <p className="lp-section-eyebrow">What Sipha offers</p>
            <h2 className="lp-section-title">A sanctuary for serious readers</h2>
            <div className="lp-values-grid">
              <div className="lp-value-card">
                <div className="lp-value-icon"><BookOpen size={16} /></div>
                <div className="lp-value-title">Reading Tracker</div>
                <div className="lp-value-body">
                  Log your progress, set quiet reading goals, and build streaks that honour your reading habit — page by page.
                </div>
              </div>
              <div className="lp-value-card">
                <div className="lp-value-icon"><Users size={16} /></div>
                <div className="lp-value-title">Reading Circles</div>
                <div className="lp-value-body">
                  Join intimate book clubs or create your own. Discuss chapters, share interpretations, and think together.
                </div>
              </div>
              <div className="lp-value-card">
                <div className="lp-value-icon"><Feather size={16} /></div>
                <div className="lp-value-title">Private Journal</div>
                <div className="lp-value-body">
                  Capture reflections, quotes, and marginalia in your own private reading journal. Your thoughts, archived beautifully.
                </div>
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="lp-cta-section">
            <p className="lp-cta-eyebrow">Begin your journey</p>
            <h2 className="lp-cta-title">Your sanctuary <em>awaits</em>.</h2>
            <p className="lp-cta-sub">
              Join thousands of readers who have made Sipha their quiet corner of the internet.
            </p>
            <Link href="/dashboard" className="lp-btn-light">
              Enter Sanctuary <ArrowRight size={12} />
            </Link>
          </section>
        </main>

        {/* Footer */}
        <footer className="lp-footer">
          <a href="/" className="lp-footer-logo">Sipha</a>
          <p className="lp-footer-copy">
            &copy; {new Date().getFullYear()} Sipha. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  );
}