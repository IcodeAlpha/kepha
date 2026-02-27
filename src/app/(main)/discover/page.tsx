'use client';
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2, Search, Upload, BookOpen, TrendingUp, BookMarked,
  X, Bookmark, BookCheck, ChevronDown, Calendar, Hash, User,
  Tag, Plus, ExternalLink, ChevronLeft, ChevronRight, List,
  Sun, Moon, Type, Minus,
} from "lucide-react";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { users as allUsers } from "@/lib/data";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// ── Types ────────────────────────────────────────────────────────────────────

type CommunityBook = {
  id: string; title: string; author: string;
  coverUrl: string; coverHint: string; uploaderId: string;
  source: 'community' | 'openlibrary';
  publishYear?: number; pageCount?: number; olKey?: string;
};
type BookDetail = { description?: string; subjects?: string[]; firstSentence?: string };
type ReadingEntry = { book: CommunityBook; pagesRead: number; savedAt: number; cfi?: string };
type Tab = 'trending' | 'classics' | 'search' | 'community' | 'readinglist';

// ── Open Library ─────────────────────────────────────────────────────────────

const OL_COVER = (id: number, size: 'M' | 'L' = 'M') =>
  `https://covers.openlibrary.org/b/id/${id}-${size}.jpg`;
const PLACEHOLDER = 'https://placehold.co/400x600/e8e0d5/8b7355?text=No+Cover';

function mapOLDoc(doc: any): CommunityBook {
  return {
    id: `ol-${doc.key}`, title: doc.title ?? 'Untitled',
    author: doc.author_name?.[0] ?? 'Unknown Author',
    coverUrl: doc.cover_i ? OL_COVER(doc.cover_i) : PLACEHOLDER,
    coverHint: 'open library book cover', uploaderId: '',
    source: 'openlibrary', publishYear: doc.first_publish_year,
    pageCount: doc.number_of_pages_median, olKey: doc.key,
  };
}

async function fetchOL(params: string, page = 1): Promise<{ books: CommunityBook[]; total: number }> {
  const offset = (page - 1) * 18;
  const res = await fetch(
    `https://openlibrary.org/search.json?${params}&limit=18&offset=${offset}&fields=key,title,author_name,cover_i,first_publish_year,number_of_pages_median`
  );
  if (!res.ok) throw new Error('Open Library fetch failed');
  const data = await res.json();
  return { books: (data.docs ?? []).map(mapOLDoc), total: data.numFound ?? 0 };
}

async function fetchBookDetail(olKey: string): Promise<BookDetail> {
  try {
    const res = await fetch(`https://openlibrary.org${olKey}.json`);
    if (!res.ok) return {};
    const data = await res.json();
    const description = typeof data.description === 'string' ? data.description : data.description?.value;
    const firstSentence = typeof data.first_sentence === 'string' ? data.first_sentence : data.first_sentence?.value;
    return { description, firstSentence, subjects: data.subjects?.slice(0, 8) };
  } catch { return {}; }
}

// ── Gutenberg search ──────────────────────────────────────────────────────────

async function findGutenbergUrls(title: string, author: string): Promise<{ epubUrl: string | null; textUrl: string | null }> {
  try {
    const res = await fetch(
      `/api/gutenberg/search?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`
    );
    if (!res.ok) return { epubUrl: null, textUrl: null };
    const data = await res.json();
    return { epubUrl: data.epubUrl ?? null, textUrl: data.textUrl ?? null };
  } catch { return { epubUrl: null, textUrl: null }; }
}

// ── Epub Reader Modal ─────────────────────────────────────────────────────────
// Uses epub.js loaded inside an iframe via inline HTML to avoid SSR/import issues

function EpubReaderModal({ book, open, onClose, onSaveCfi, savedCfi }: {
  book: CommunityBook | null;
  open: boolean;
  onClose: () => void;
  onSaveCfi: (bookId: string, cfi: string) => void;
  savedCfi?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [epubProxyUrl, setEpubProxyUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('sepia');
  const [fontSize, setFontSize] = useState(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!book || !open) return;
    setError(null); setEpubProxyUrl(null); setLoading(true);

    (async () => {
      const { epubUrl } = await findGutenbergUrls(book.title, book.author);
      if (!epubUrl) {
        setError("This book wasn't found on Project Gutenberg.");
        setLoading(false); return;
      }
      // Use our proxy to serve the epub (avoids CORS)
      setEpubProxyUrl(`/api/gutenberg/epub?url=${encodeURIComponent(epubUrl)}`);
      setLoading(false);
    })();
  }, [book, open]);

  // Send messages to iframe to control the reader
  const sendMsg = (msg: object) => {
    iframeRef.current?.contentWindow?.postMessage(msg, '*');
  };

  // Listen for CFI updates from iframe (saved reading position)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'cfi-update' && book) {
        onSaveCfi(book.id, e.data.cfi);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [book, onSaveCfi]);

  // Send theme/font changes to iframe
  useEffect(() => { sendMsg({ type: 'set-theme', theme }); }, [theme]);
  useEffect(() => { sendMsg({ type: 'set-font-size', size: fontSize }); }, [fontSize]);

  if (!book) return null;

  const themes = {
    light: { bg: '#ffffff', text: '#1a1a1a', label: 'White' },
    sepia: { bg: '#f4ede4', text: '#3b2f1e', label: 'Sepia' },
    dark:  { bg: '#1a1a2e', text: '#e8e0d5', label: 'Dark'  },
  };

  // The iframe renders epub.js entirely client-side
  const iframeHtml = epubProxyUrl ? `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: ${themes[theme].bg}; }
  #viewer { width: 100%; height: 100%; }
  .arrow {
    position: fixed; top: 50%; transform: translateY(-50%);
    background: rgba(0,0,0,0.08); border: none; cursor: pointer;
    width: 44px; height: 80px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; color: ${themes[theme].text}; z-index: 100;
    transition: background 0.2s;
  }
  .arrow:hover { background: rgba(0,0,0,0.15); }
  #prev { left: 8px; }
  #next { right: 8px; }
  #page-info {
    position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%);
    font-family: Georgia, serif; font-size: 12px;
    color: ${themes[theme].text}; opacity: 0.5; pointer-events: none;
  }
</style>
</head>
<body>
<div id="viewer"></div>
<button class="arrow" id="prev">&#8249;</button>
<button class="arrow" id="next">&#8250;</button>
<div id="page-info"></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js"></script>
<script>
  const EPUB_URL = ${JSON.stringify(epubProxyUrl)};
  const SAVED_CFI = ${JSON.stringify(savedCfi ?? null)};
  const INIT_BG = ${JSON.stringify(themes[theme].bg)};
  const INIT_FG = ${JSON.stringify(themes[theme].text)};
  const INIT_FS = ${JSON.stringify(fontSize)};

  let rendition = null;

  // Fetch the epub as ArrayBuffer so epub.js never makes its own HTTP requests
  fetch(EPUB_URL)
    .then(r => r.arrayBuffer())
    .then(buffer => {
      const book = ePub(buffer);
      rendition = book.renderTo('viewer', {
        width: '100%',
        height: '100%',
        spread: 'none',
        flow: 'paginated',
      });

      rendition.themes.default({
        body: {
          background: INIT_BG + ' !important',
          color: INIT_FG + ' !important',
          'font-family': 'Georgia, "Times New Roman", serif !important',
          'font-size': INIT_FS + '% !important',
          'line-height': '1.8 !important',
          'padding': '0 2em !important',
        },
        p: { 'text-align': 'justify !important', 'margin-bottom': '1em !important' },
      });

      if (SAVED_CFI) {
        rendition.display(SAVED_CFI);
      } else {
        rendition.display();
      }

      // Page navigation
      document.getElementById('prev').addEventListener('click', () => rendition.prev());
      document.getElementById('next').addEventListener('click', () => rendition.next());

      // Report CFI position to parent
      rendition.on('relocated', location => {
        const cfi = location?.start?.cfi;
        if (cfi) window.parent.postMessage({ type: 'cfi-update', cfi }, '*');
        const info = document.getElementById('page-info');
        if (info && location?.start?.percentage != null) {
          info.textContent = Math.round(location.start.percentage * 100) + '% complete';
        }
      });

      window.parent.postMessage({ type: 'ready' }, '*');
    })
    .catch(err => {
      document.body.innerHTML = '<p style="padding:2rem;color:#888;font-family:Georgia,serif;">Failed to load book: ' + err.message + '</p>';
    });

  // Keyboard navigation (outside fetch, always active)
  document.addEventListener('keydown', e => {
    if (!rendition) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') rendition.next();
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   rendition.prev();
  });

  // Listen for control messages from parent
  window.addEventListener('message', e => {
    if (e.data?.type === 'prev') rendition.prev();
    if (e.data?.type === 'next') rendition.next();
    if (e.data?.type === 'goto-cfi') rendition.display(e.data.cfi);
    if (e.data?.type === 'set-theme') {
      const t = e.data.theme;
      const themes = {
        light: { bg: '#ffffff', text: '#1a1a1a' },
        sepia: { bg: '#f4ede4', text: '#3b2f1e' },
        dark:  { bg: '#1a1a2e', text: '#e8e0d5' },
      };
      const c = themes[t] || themes.sepia;
      document.body.style.background = c.bg;
      rendition.themes.default({
        body: { background: c.bg + ' !important', color: c.text + ' !important' },
      });
    }
    if (e.data?.type === 'set-font-size') {
      const sz = e.data.size;
      rendition.themes.fontSize(sz + '%');
    }
  });
</script>
</body>
</html>` : '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogTitle className="sr-only">{book.title}</DialogTitle>
        <DialogDescription className="sr-only">Reading {book.title} by {book.author}</DialogDescription>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1 rounded transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-0">
              <p className="font-semibold text-stone-800 text-sm truncate leading-tight">{book.title}</p>
              <p className="text-xs text-stone-400 truncate">{book.author}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Font size */}
            <button onClick={() => setFontSize(s => Math.max(70, s - 10))}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-500 transition-colors" title="Smaller text">
              <Minus size={14} />
            </button>
            <span className="text-xs text-stone-400 w-8 text-center">{fontSize}%</span>
            <button onClick={() => setFontSize(s => Math.min(150, s + 10))}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-500 transition-colors" title="Larger text">
              <Type size={14} />
            </button>

            <div className="w-px h-5 bg-stone-200 mx-1" />

            {/* Theme switcher */}
            {(['light', 'sepia', 'dark'] as const).map(t => (
              <button key={t} onClick={() => setTheme(t)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${theme === t ? 'border-amber-600 scale-110' : 'border-stone-300'}`}
                style={{ background: themes[t].bg }}
                title={themes[t].label}
              />
            ))}
          </div>
        </div>

        {/* Reader area */}
        <div className="flex-1 relative overflow-hidden" style={{ background: themes[theme].bg }}>
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: themes[theme].bg }}>
              <Loader2 size={36} className="animate-spin text-amber-700" />
              <p className="text-sm" style={{ color: themes[theme].text, opacity: 0.6 }}>
                Loading book...
              </p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
              <BookOpen size={40} strokeWidth={1} className="text-stone-400" />
              <p className="text-stone-500">{error}</p>
              {book.olKey && (
                <a href={`https://openlibrary.org${book.olKey}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2 text-sm">
                    <ExternalLink size={14} /> Open on Open Library
                  </Button>
                </a>
              )}
            </div>
          ) : epubProxyUrl ? (
            <iframe
              ref={iframeRef}
              srcDoc={iframeHtml}
              className="w-full h-full border-0"
              title={`Reading ${book.title}`}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Upload Dialog ─────────────────────────────────────────────────────────────

function UploadBookDialog({ onBookUploaded }: { onBookUploaded: (book: CommunityBook) => void }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (title && author && preview) {
      onBookUploaded({
        id: `community-${Date.now()}`, title, author, coverUrl: preview,
        coverHint: 'custom upload', uploaderId: allUsers[0].id,
        source: 'community', pageCount: pageCount ? parseInt(pageCount) : undefined,
      });
      setTitle(''); setAuthor(''); setPageCount(''); setImage(null); setPreview(null); setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-700 hover:bg-amber-800 text-white">
          <Upload className="mr-2 h-4 w-4" /> Share a Book
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share What You&apos;re Reading</DialogTitle>
          <DialogDescription>Upload a picture of a book and share it with the community.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="col-span-3" placeholder="Book title" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="author" className="text-right">Author</Label>
            <Input id="author" value={author} onChange={e => setAuthor(e.target.value)} className="col-span-3" placeholder="Author name" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pages" className="text-right text-xs leading-tight">Total<br />Pages</Label>
            <Input id="pages" type="number" min="1" value={pageCount}
              onChange={e => setPageCount(e.target.value)} className="col-span-3"
              placeholder="e.g. 320" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="picture" className="text-right">Cover</Label>
            <Input id="picture" type="file" onChange={handleImageChange} className="col-span-3" accept="image/*" />
          </div>
          {preview && (
            <div className="col-span-4 flex justify-center">
              <Image src={preview} alt="Book cover preview" width={150} height={225} className="rounded-md shadow" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!title || !author || !image} className="bg-amber-700 hover:bg-amber-800">
            Upload Book
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Book Detail Modal ─────────────────────────────────────────────────────────

function BookDetailModal({ book, open, onClose, onSave, isSaved, onRead }: {
  book: CommunityBook | null; open: boolean; onClose: () => void;
  onSave: (book: CommunityBook) => void; isSaved: boolean;
  onRead: (book: CommunityBook) => void;
}) {
  const [detail, setDetail] = useState<BookDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!book || !open) return;
    setDetail(null); setImgError(false);
    if (book.olKey) {
      setLoadingDetail(true);
      fetchBookDetail(book.olKey).then(setDetail).finally(() => setLoadingDetail(false));
    }
  }, [book, open]);

  if (!book) return null;
  const isClassic = book.source === 'openlibrary' && book.publishYear && book.publishYear < 1928;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">{book.title}</DialogTitle>
        <DialogDescription className="sr-only">{book.author}</DialogDescription>
        <div className="flex gap-6 pt-2">
          <div className="flex-shrink-0">
            <div className="relative w-32 h-48 rounded-lg overflow-hidden shadow-lg bg-stone-100">
              <Image src={imgError ? PLACEHOLDER : book.coverUrl} alt={book.title} fill
                className="object-cover" onError={() => setImgError(true)} sizes="128px" />
            </div>
            {isClassic && (
              <Badge className="mt-2 w-full justify-center bg-amber-700 hover:bg-amber-700 text-white text-xs">Classic</Badge>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-stone-900 leading-tight">{book.title}</h2>
            <p className="text-stone-500 mt-1 flex items-center gap-1.5 text-sm"><User size={13} /> {book.author}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-stone-500">
              {book.publishYear && <span className="flex items-center gap-1"><Calendar size={13} /> {book.publishYear}</span>}
              {book.pageCount && <span className="flex items-center gap-1"><Hash size={13} /> {book.pageCount} pages</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={() => onSave(book)}
                className={`gap-2 text-sm ${isSaved ? 'bg-green-700 hover:bg-red-600 text-white' : 'bg-amber-700 hover:bg-amber-800 text-white'}`}>
                {isSaved ? <BookCheck size={15} /> : <Bookmark size={15} />}
                {isSaved ? 'Saved' : 'Save to Reading List'}
              </Button>
              {isClassic ? (
                <Button onClick={() => { onClose(); onRead(book); }}
                  variant="outline" className="gap-2 text-sm border-amber-300 text-amber-800 hover:bg-amber-50">
                  <BookOpen size={15} /> Read Now
                </Button>
              ) : book.olKey ? (
                <a href={`https://openlibrary.org${book.olKey}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2 text-sm border-stone-300 text-stone-600 hover:bg-stone-50">
                    <ExternalLink size={15} /> Read on Open Library
                  </Button>
                </a>
              ) : null}
            </div>
            {isClassic && (
              <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                <BookOpen size={11} /> Full ebook via Project Gutenberg
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {loadingDetail ? (
            <div className="flex items-center gap-2 text-stone-400 text-sm">
              <Loader2 size={14} className="animate-spin" /> Loading details...
            </div>
          ) : detail ? (
            <>
              {(detail.description || detail.firstSentence) && (
                <div>
                  <h3 className="font-semibold text-stone-700 mb-1.5">About</h3>
                  <p className="text-sm text-stone-600 leading-relaxed line-clamp-6">
                    {detail.description ?? detail.firstSentence}
                  </p>
                </div>
              )}
              {detail.subjects && detail.subjects.length > 0 && (
                <div>
                  <h3 className="font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5"><Tag size={13} /> Subjects</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.subjects.map(s => (
                      <Badge key={s} variant="outline" className="text-xs border-stone-300 text-stone-500">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : book.source === 'community' ? (
            <p className="text-sm text-stone-400 italic">Community shared book — no additional details available.</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Reading Progress Modal ────────────────────────────────────────────────────

function ReadingProgressModal({ entry, open, onClose, onUpdate, onRemove, onRead }: {
  entry: ReadingEntry | null; open: boolean; onClose: () => void;
  onUpdate: (bookId: string, pages: number) => void;
  onRemove: (bookId: string) => void;
  onRead: (book: CommunityBook) => void;
}) {
  const [pagesInput, setPagesInput] = useState('');
  useEffect(() => { if (entry) setPagesInput(String(entry.pagesRead)); }, [entry]);
  if (!entry) return null;

  const { book } = entry;
  const total = book.pageCount;
  const percent = total ? Math.min(100, Math.round((entry.pagesRead / total) * 100)) : null;
  const isClassic = book.source === 'openlibrary' && book.publishYear && book.publishYear < 1928;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="leading-tight">{book.title}</DialogTitle>
          <DialogDescription>{book.author}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {total && (
            <div>
              <div className="flex justify-between text-sm text-stone-600 mb-1.5">
                <span>Progress</span><span className="font-semibold">{percent}%</span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2.5">
                <div className="bg-amber-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-xs text-stone-400 mt-1.5 text-right">{entry.pagesRead} / {total} pages</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="pagesRead">{total ? `Update pages read (out of ${total})` : 'Pages read so far'}</Label>
            <div className="flex gap-2">
              <Input id="pagesRead" type="number" min="0" max={total} value={pagesInput}
                onChange={e => setPagesInput(e.target.value)} placeholder="e.g. 120" />
              <Button onClick={() => {
                const val = parseInt(pagesInput);
                if (!isNaN(val) && val >= 0) { onUpdate(book.id, val); onClose(); }
              }} className="bg-amber-700 hover:bg-amber-800 text-white">Save</Button>
            </div>
          </div>
          {isClassic && (
            <Button onClick={() => { onClose(); onRead(book); }}
              className="w-full gap-2 bg-amber-700 hover:bg-amber-800 text-white">
              <BookOpen size={15} /> Continue Reading
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onRemove(book.id); onClose(); }}
            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
            Remove from list
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Book Card ─────────────────────────────────────────────────────────────────

function BookCard({ book, isSaved, onSave, onClick }: {
  book: CommunityBook; isSaved: boolean;
  onSave: (e: React.MouseEvent, book: CommunityBook) => void;
  onClick: (book: CommunityBook) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const uploader = book.uploaderId ? allUsers.find(u => u.id === book.uploaderId) : null;
  const isClassic = book.source === 'openlibrary' && book.publishYear && book.publishYear < 1928;

  return (
    <div className="group cursor-pointer rounded-xl overflow-hidden border border-stone-200 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onClick={() => onClick(book)}>
      {uploader && (
        <div className="flex items-center gap-2 p-3 pb-0">
          <Avatar className="h-7 w-7">
            <AvatarImage src={uploader.avatarUrl} alt={uploader.name} />
            <AvatarFallback>{uploader.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <p className="text-xs font-medium text-stone-600 truncate">{uploader.name}</p>
        </div>
      )}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-stone-100 mt-2">
        <Image src={imgError ? PLACEHOLDER : book.coverUrl} alt={`Cover of ${book.title}`} fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImgError(true)} data-ai-hint={book.coverHint}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw" />
        {isClassic && (
          <span className="absolute top-2 left-2 bg-amber-700/90 text-white text-xs px-2 py-0.5 rounded-full font-medium">Classic</span>
        )}
        <button onClick={e => onSave(e, book)}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all ${isSaved ? 'bg-green-600/90 text-white' : 'bg-black/30 text-white opacity-0 group-hover:opacity-100'}`}>
          {isSaved ? <BookCheck size={13} /> : <Bookmark size={13} />}
        </button>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-sm truncate leading-tight">{book.title}</h3>
        <p className="text-xs text-stone-400 mt-0.5 truncate">{book.author}</p>
        {book.pageCount && <p className="text-xs text-stone-300 mt-0.5">{book.pageCount} pages</p>}
      </div>
    </div>
  );
}

// ── Reading List Card ─────────────────────────────────────────────────────────

function ReadingListCard({ entry, onClick }: { entry: ReadingEntry; onClick: (entry: ReadingEntry) => void }) {
  const [imgError, setImgError] = useState(false);
  const { book } = entry;
  const total = book.pageCount;
  const percent = total ? Math.min(100, Math.round((entry.pagesRead / total) * 100)) : null;

  return (
    <div className="group cursor-pointer rounded-xl overflow-hidden border border-stone-200 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onClick={() => onClick(entry)}>
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-stone-100">
        <Image src={imgError ? PLACEHOLDER : book.coverUrl} alt={book.title} fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImgError(true)} sizes="(max-width: 640px) 50vw, 16vw" />
        {percent !== null && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-2 py-1.5">
            <div className="w-full bg-white/30 rounded-full h-1.5">
              <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${percent}%` }} />
            </div>
            <p className="text-white text-xs mt-1 text-center">{percent}%</p>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-bold text-sm truncate">{book.title}</h3>
        <p className="text-xs text-stone-400 truncate">{book.author}</p>
        <p className="text-xs text-amber-600 mt-1 font-medium flex items-center gap-1"><Plus size={11} /> Update progress</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-stone-400 gap-3">
      <BookOpen size={48} strokeWidth={1} />
      <p className="text-lg">{message}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<Tab>('trending');
  const [communityBooks, setCommunityBooks] = useState<CommunityBook[]>([]);
  const [apiBooks, setApiBooks] = useState<CommunityBook[]>([]);
  const [readingList, setReadingList] = useState<ReadingEntry[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentParams, setCurrentParams] = useState('q=fiction&sort=rating');

  const [selectedBook, setSelectedBook] = useState<CommunityBook | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [progressEntry, setProgressEntry] = useState<ReadingEntry | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const [readerBook, setReaderBook] = useState<CommunityBook | null>(null);
  const [readerOpen, setReaderOpen] = useState(false);

  const loadBooks = useCallback(async (params: string, pg = 1, append = false) => {
    if (pg === 1) setIsLoading(true); else setIsLoadingMore(true);
    setError(null);
    try {
      const { books, total } = await fetchOL(params, pg);
      setApiBooks(prev => append ? [...prev, ...books] : books);
      setHasMore(pg * 18 < total);
      setPage(pg);
    } catch { setError('Could not load books. Please try again.'); }
    finally { setIsLoading(false); setIsLoadingMore(false); }
  }, []);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'trending') { const p = 'q=fiction&sort=rating'; setCurrentParams(p); loadBooks(p, 1); }
    else if (tab === 'classics') { const p = 'subject=classics&sort=editions'; setCurrentParams(p); loadBooks(p, 1); }
  };

  useEffect(() => { const p = 'q=fiction&sort=rating'; setCurrentParams(p); loadBooks(p, 1); }, [loadBooks]);

  const handleSearch = () => {
    if (!inputValue.trim()) return;
    const q = inputValue.trim(); setSearchQuery(q); setActiveTab('search');
    const p = `q=${encodeURIComponent(q)}&sort=relevance`; setCurrentParams(p); loadBooks(p, 1);
  };

  const clearSearch = () => { setInputValue(''); setSearchQuery(''); switchTab('trending'); };
  const toggleSave = (book: CommunityBook) => {
    setReadingList(prev => {
      const exists = prev.find(e => e.book.id === book.id);
      return exists ? prev.filter(e => e.book.id !== book.id) : [...prev, { book, pagesRead: 0, savedAt: Date.now() }];
    });
  };
  const isSaved = (bookId: string) => readingList.some(e => e.book.id === bookId);
  const openReader = (book: CommunityBook) => { setReaderBook(book); setReaderOpen(true); };
  const saveCfi = (bookId: string, cfi: string) =>
    setReadingList(prev => prev.map(e => e.book.id === bookId ? { ...e, cfi } : e));

  const showApiGrid = activeTab === 'trending' || activeTab === 'classics' || activeTab === 'search';

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'trending', label: 'Trending', icon: <TrendingUp size={15} /> },
    { key: 'classics', label: 'Classics', icon: <BookMarked size={15} /> },
    { key: 'community', label: 'Community', icon: <Upload size={15} /> },
    { key: 'readinglist', label: 'Reading List', icon: <Bookmark size={15} /> },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Discover</h1>
          <p className="text-stone-500 text-sm mt-1">Explore millions of books from Open Library</p>
        </div>
        <UploadBookDialog onBookUploaded={book => { setCommunityBooks(prev => [book, ...prev]); setActiveTab('community'); }} />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input placeholder="Search any book or author..." value={inputValue}
            onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-9 pr-9 border-stone-300 focus-visible:ring-amber-600" />
          {inputValue && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"><X size={15} /></button>
          )}
        </div>
        <Button onClick={handleSearch} className="bg-amber-700 hover:bg-amber-800 text-white px-5">Search</Button>
      </div>

      {activeTab === 'search' && searchQuery && (
        <div className="flex items-center gap-2 text-sm text-stone-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          <Search size={14} /> Results for <span className="font-semibold">&ldquo;{searchQuery}&rdquo;</span>
          <button onClick={clearSearch} className="ml-auto text-amber-700 hover:underline text-xs">Clear</button>
        </div>
      )}

      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => switchTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.key ? 'bg-white text-amber-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
            {tab.icon} {tab.label}
            {tab.key === 'community' && communityBooks.length > 0 && (
              <span className="bg-amber-700 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{communityBooks.length}</span>
            )}
            {tab.key === 'readinglist' && readingList.length > 0 && (
              <span className="bg-green-700 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{readingList.length}</span>
            )}
          </button>
        ))}
      </div>

      {showApiGrid && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {isLoading ? (
              <div className="col-span-full flex justify-center items-center py-24"><Loader2 size={36} className="animate-spin text-amber-700" /></div>
            ) : error ? <EmptyState message={error} />
              : apiBooks.length === 0 ? <EmptyState message="No results found." />
              : apiBooks.map(book => (
                <BookCard key={book.id} book={book} isSaved={isSaved(book.id)}
                  onSave={(e, b) => { e.stopPropagation(); toggleSave(b); }}
                  onClick={b => { setSelectedBook(b); setDetailOpen(true); }} />
              ))}
          </div>
          {!isLoading && apiBooks.length > 0 && hasMore && (
            <div className="flex justify-center pt-4">
              <Button onClick={() => loadBooks(currentParams, page + 1, true)} disabled={isLoadingMore}
                variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-50 gap-2">
                {isLoadingMore ? <><Loader2 size={15} className="animate-spin" /> Loading...</> : <><ChevronDown size={15} /> Load more books</>}
              </Button>
            </div>
          )}
        </>
      )}

      {activeTab === 'community' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {communityBooks.length === 0 ? <EmptyState message="No community books yet — be the first to share one!" />
            : communityBooks.map(book => (
              <BookCard key={book.id} book={book} isSaved={isSaved(book.id)}
                onSave={(e, b) => { e.stopPropagation(); toggleSave(b); }}
                onClick={b => { setSelectedBook(b); setDetailOpen(true); }} />
            ))}
        </div>
      )}

      {activeTab === 'readinglist' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {readingList.length === 0 ? <EmptyState message="Your reading list is empty — save books to track your progress!" />
            : readingList.map(entry => (
              <ReadingListCard key={entry.book.id} entry={entry}
                onClick={e => { setProgressEntry(e); setProgressOpen(true); }} />
            ))}
        </div>
      )}

      <BookDetailModal book={selectedBook} open={detailOpen} onClose={() => setDetailOpen(false)}
        onSave={toggleSave} isSaved={selectedBook ? isSaved(selectedBook.id) : false} onRead={openReader} />

      <ReadingProgressModal entry={progressEntry} open={progressOpen} onClose={() => setProgressOpen(false)}
        onUpdate={(bookId, pages) => setReadingList(prev => prev.map(e => e.book.id === bookId ? { ...e, pagesRead: pages } : e))}
        onRemove={bookId => setReadingList(prev => prev.filter(e => e.book.id !== bookId))}
        onRead={openReader} />

      <EpubReaderModal
        book={readerBook}
        open={readerOpen}
        onClose={() => setReaderOpen(false)}
        onSaveCfi={saveCfi}
        savedCfi={readerBook ? readingList.find(e => e.book.id === readerBook.id)?.cfi : undefined}
      />
    </div>
  );
}