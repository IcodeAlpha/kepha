"use client";

import { useState } from "react";
import { Search } from "lucide-react";

const FILTERS = ["ALL", "PHILOSOPHY", "POETRY", "HISTORIES"];

const BOOKS = [
  {
    id: 1,
    title: "Meditations on First Philosophy",
    author: "René Descartes",
    category: "PHILOSOPHY",
    rating: 4.8,
    finished: "Mar 12, 2024",
    quote:
      "A foundational text that challenges the very nature of certainty. Found the section on the argument particularly illuminating for modern cognitive science.",
    color: "#C0392B",
  },
  {
    id: 2,
    title: "The Waste Land and Other Poems",
    author: "T.S. Eliot",
    category: "POETRY",
    rating: 5.0,
    finished: "Feb 06, 2024",
    quote:
      "The fragmentation of the modern world perfectly captured. April is the cruellest month hits different in the city landscape.",
    color: "#1a1a1a",
  },
  {
    id: 3,
    title: "A History of the World in 6 Glasses",
    author: "Tom Standage",
    category: "HISTORIES",
    rating: 4.2,
    finished: "Jan 28, 2024",
    quote:
      "Fascinating how beer, coffee, and wine practically built modern commerce. Makes every sip a historical reflection.",
    color: "#0E7C6B",
  },
  {
    id: 4,
    title: "Ethics",
    author: "Baruch Spinoza",
    category: "PHILOSOPHY",
    rating: 4.9,
    finished: "Jan 05, 2024",
    quote:
      "Geometrically structured proof of God and existence. Exhausting yet deeply rewarding. A re-read is necessary.",
    color: "#2a5f8f",
  },
];

function BookCover({ book }: { book: typeof BOOKS[0] }) {
  return (
    <div
      style={{
        width: 130,
        height: 180,
        backgroundColor: book.color,
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 10px",
        position: "relative",
        flexShrink: 0,
        boxShadow: "4px 6px 16px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 10,
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: "rgba(255,255,255,0.12)",
        }}
      />
      <p
        style={{
          color: "#fff",
          fontSize: 9,
          fontFamily: "'Playfair Display', serif",
          textAlign: "center",
          lineHeight: 1.5,
          letterSpacing: "0.04em",
          margin: 0,
          opacity: 0.92,
          wordBreak: "break-word",
          textTransform: "uppercase",
        }}
      >
        {book.title}
      </p>
      <div
        style={{
          width: "55%",
          height: 1,
          backgroundColor: "rgba(255,255,255,0.3)",
          margin: "8px 0",
        }}
      />
      <p
        style={{
          color: "#fff",
          fontSize: 7.5,
          fontFamily: "'Playfair Display', serif",
          textAlign: "center",
          margin: 0,
          opacity: 0.55,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {book.author}
      </p>
    </div>
  );
}

function BookCard({ book }: { book: typeof BOOKS[0] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ position: "relative", alignSelf: "flex-start" }}>
        <BookCover book={book} />
        {/* Rating badge */}
        <div
          style={{
            position: "absolute",
            bottom: -8,
            right: -8,
            backgroundColor: "#E8905A",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 4,
            padding: "2px 7px",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {book.rating.toFixed(1)}
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.12em",
              color: "#E8905A",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {book.category}
          </span>
          <span style={{ fontSize: 9, color: "#9a9489", fontFamily: "'DM Sans', sans-serif" }}>
            Finished {book.finished}
          </span>
        </div>

        <h3
          style={{
            fontSize: 15,
            fontWeight: 400,
            margin: "0 0 3px",
            color: "#1A1A18",
            lineHeight: 1.3,
            fontFamily: "'Playfair Display', serif",
          }}
        >
          {book.title}
        </h3>
        <p
          style={{
            fontSize: 12,
            color: "#8A8578",
            margin: "0 0 12px",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {book.author}
        </p>

        <div
          style={{
            backgroundColor: "#fff",
            border: "0.5px solid #D8D0C0",
            borderRadius: 6,
            padding: "10px 12px",
            fontSize: 11.5,
            lineHeight: 1.65,
            color: "#6B6560",
            fontStyle: "italic",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          "{book.quote}"
        </div>
      </div>
    </div>
  );
}

export default function ArchivePage() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filtered = BOOKS.filter((b) => {
    const matchesFilter = activeFilter === "ALL" || b.category === activeFilter;
    const matchesSearch =
      search === "" ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ fontFamily: "'Playfair Display', serif", maxWidth: 1100 }}>
      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 42,
            fontWeight: 400,
            color: "#1A1A18",
            margin: "0 0 10px",
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}
        >
          The Personal
          <br />
          Archive
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#8A8578",
            fontFamily: "'DM Sans', sans-serif",
            maxWidth: 420,
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          A curated history of your intellectual journeys. Here lie the texts
          that shaped your perspective, preserved in digital permanence.
        </p>
      </div>

      {/* Search + Filters */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 36,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#fff",
            border: "0.5px solid #D8D0C0",
            borderRadius: 6,
            padding: "8px 14px",
            width: 240,
          }}
        >
          <Search size={13} color="#C0B9AE" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or author"
            style={{
              border: "none",
              outline: "none",
              fontSize: 12,
              color: "#555",
              backgroundColor: "transparent",
              fontFamily: "'DM Sans', sans-serif",
              width: "100%",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: "6px 12px",
                fontSize: 10,
                letterSpacing: "0.1em",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                border: "0.5px solid",
                borderRadius: 4,
                cursor: "pointer",
                transition: "all 0.15s",
                backgroundColor: activeFilter === f ? "#1C2B1E" : "#fff",
                borderColor: activeFilter === f ? "#1C2B1E" : "#D8D0C0",
                color: activeFilter === f ? "#fff" : "#8A8578",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Book grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "44px 32px",
          marginBottom: 60,
        }}
      >
        {filtered.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
        {filtered.length === 0 && (
          <p
            style={{
              color: "#9a9489",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontStyle: "italic",
              gridColumn: "1 / -1",
            }}
          >
            No books found.
          </p>
        )}
      </div>

      {/* Continue Exploration */}
      <div
        style={{
          border: "0.5px solid #D8D0C0",
          borderRadius: 10,
          padding: "32px 36px",
          backgroundColor: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 9,
              letterSpacing: "0.16em",
              color: "#B0A89E",
              fontFamily: "'DM Sans', sans-serif",
              textTransform: "uppercase",
              margin: "0 0 6px",
            }}
          >
            Expand Your Horizon
          </p>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: "#1A1A18",
              margin: "0 0 10px",
            }}
          >
            Continue Exploration
          </h2>
          <p
            style={{
              fontSize: 12,
              color: "#8A8578",
              fontFamily: "'DM Sans', sans-serif",
              maxWidth: 360,
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            Your archive is a living entity. There are countless worlds still
            waiting to be curated and conversations waiting to be joined in the
            Clubs section.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            style={{
              backgroundColor: "#1C2B1E",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "12px 24px",
              fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
            }}
          >
            Discover New Clubs
          </button>
          <button
            style={{
              backgroundColor: "#fff",
              color: "#1A1A18",
              border: "0.5px solid #D8D0C0",
              borderRadius: 6,
              padding: "12px 24px",
              fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              cursor: "pointer",
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
            }}
          >
            Browse Recommendation Engine
          </button>
        </div>
      </div>
    </div>
  );
}