'use client';
import Image from "next/image";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2, Search, Upload, BookOpen, X, Bookmark, BookCheck,
  ChevronDown, Calendar, Hash, Plus, ExternalLink, ChevronLeft,
  Type, Minus,
} from "lucide-react";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { users as allUsers } from "@/lib/data";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// ── Types ─────────────────────────────────────────────────────────────────────

type CommunityBook = {
  id: string; title: string; author: string;
  coverUrl: string; coverHint: string; uploaderId: string;
  source: 'community' | 'openlibrary';
  publishYear?: number; pageCount?: number; olKey?: string;
};
type BookDetail = { description?: string; subjects?: string[]; firstSentence?: string };
type ReadingEntry = { book: CommunityBook; pagesRead: number; savedAt: number; cfi?: string };
type Tab = 'classics' | 'search' | 'community' | 'readinglist';

// ── Open Library ──────────────────────────────────────────────────────────────

const OL_COVER = (id: number, size: 'M' | 'L' = 'M') =>
  `https://covers.openlibrary.org/b/id/${id}-${size}.jpg`;
const PLACEHOLDER = 'https://placehold.co/400x600/d8d0c0/8a8578?text=No+Cover';

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

async function findGutenbergUrls(title: string, author: string) {
  try {
    const res = await fetch(`/api/gutenberg/search?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`);
    if (!res.ok) return { epubUrl: null, textUrl: null };
    const data = await res.json();
    return { epubUrl: data.epubUrl ?? null, textUrl: data.textUrl ?? null };
  } catch { return { epubUrl: null, textUrl: null }; }
}

// ── Shared style tokens ───────────────────────────────────────────────────────

const S = {
  bg: '#F5F0E8',
  card: '#EDE7D9',
  border: '#D8D0C0',
  text: '#1A1A18',
  muted: '#8A8578',
  faint: '#B0A898',
  green: '#1C2B1E',
  greenHover: '#2A3D2D',
  accent: '#4A7C59',
  serif: "'Playfair Display', serif",
  serifBody: "'Libre Baskerville', serif",
  sans: "'DM Sans', sans-serif",
  btnPrimary: {
    background: '#1C2B1E', color: '#fff', border: 'none',
    padding: '9px 18px', fontSize: '11px', letterSpacing: '0.12em',
    textTransform: 'uppercase' as const, cursor: 'pointer', borderRadius: '2px',
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
    display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'background 0.15s',
  },
  btnOutline: {
    background: 'transparent', color: '#3D3D38', border: '1px solid #D8D0C0',
    padding: '9px 18px', fontSize: '11px', letterSpacing: '0.12em',
    textTransform: 'uppercase' as const, cursor: 'pointer', borderRadius: '2px',
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
    display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
  },
  label: {
    fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#8A8578',
  },
};

// ── Epub Reader Modal ─────────────────────────────────────────────────────────

function EpubReaderModal({ book, open, onClose, onSaveCfi, savedCfi }: {
  book: CommunityBook | null; open: boolean; onClose: () => void;
  onSaveCfi: (bookId: string, cfi: string) => void; savedCfi?: string;
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
      if (!epubUrl) { setError("This book wasn't found on Project Gutenberg."); setLoading(false); return; }
      setEpubProxyUrl(`/api/gutenberg/epub?url=${encodeURIComponent(epubUrl)}`);
      setLoading(false);
    })();
  }, [book, open]);

  const sendMsg = (msg: object) => iframeRef.current?.contentWindow?.postMessage(msg, '*');
  useEffect(() => {
    const h = (e: MessageEvent) => { if (e.data?.type === 'cfi-update' && book) onSaveCfi(book.id, e.data.cfi); };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, [book, onSaveCfi]);
  useEffect(() => { sendMsg({ type: 'set-theme', theme }); }, [theme]);
  useEffect(() => { sendMsg({ type: 'set-font-size', size: fontSize }); }, [fontSize]);

  if (!book) return null;
  const themes = {
    light: { bg: '#ffffff', text: '#1a1a18', label: 'White' },
    sepia: { bg: '#F5F0E8', text: '#3D3D38', label: 'Sepia' },
    dark:  { bg: '#1C2B1E', text: '#D8D0C0', label: 'Dark' },
  };

  const iframeHtml = epubProxyUrl ? `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;background:${themes[theme].bg};}
#viewer{width:100%;height:100%;}
.arrow{position:fixed;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.05);border:none;cursor:pointer;width:44px;height:80px;border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:24px;color:${themes[theme].text};z-index:100;transition:background 0.2s;}
.arrow:hover{background:rgba(0,0,0,0.1);}
#prev{left:8px;}#next{right:8px;}
#info{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);font-family:Georgia,serif;font-size:10px;letter-spacing:0.1em;color:${themes[theme].text};opacity:0.35;pointer-events:none;}
</style></head><body>
<div id="viewer"></div>
<button class="arrow" id="prev">&#8249;</button>
<button class="arrow" id="next">&#8250;</button>
<div id="info"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js"></script>
<script>
const EU=${JSON.stringify(epubProxyUrl)},SC=${JSON.stringify(savedCfi??null)};
let r=null;
fetch(EU).then(x=>x.arrayBuffer()).then(buf=>{
  const b=ePub(buf);
  r=b.renderTo('viewer',{width:'100%',height:'100%',spread:'none',flow:'paginated'});
  r.themes.default({body:{background:${JSON.stringify(themes[theme].bg)}+' !important',color:${JSON.stringify(themes[theme].text)}+' !important','font-family':'"Libre Baskerville",Georgia,serif !important','font-size':${fontSize}+'% !important','line-height':'1.85 !important','padding':'0 3em !important'},p:{'text-align':'justify !important','margin-bottom':'1em !important'}});
  SC?r.display(SC):r.display();
  document.getElementById('prev').onclick=()=>r.prev();
  document.getElementById('next').onclick=()=>r.next();
  r.on('relocated',loc=>{
    if(loc?.start?.cfi)window.parent.postMessage({type:'cfi-update',cfi:loc.start.cfi},'*');
    const el=document.getElementById('info');
    if(el&&loc?.start?.percentage!=null)el.textContent=Math.round(loc.start.percentage*100)+'% complete';
  });
}).catch(e=>{document.body.innerHTML='<p style="padding:2rem;color:#8A8578;font-family:Georgia,serif;font-style:italic;">'+e.message+'</p>';});
document.onkeydown=e=>{if(!r)return;if(e.key==='ArrowRight'||e.key==='ArrowDown')r.next();if(e.key==='ArrowLeft'||e.key==='ArrowUp')r.prev();};
window.onmessage=e=>{
  if(e.data?.type==='prev')r?.prev();
  if(e.data?.type==='next')r?.next();
  if(e.data?.type==='set-theme'){const m={light:{bg:'#fff',text:'#1a1a18'},sepia:{bg:'#F5F0E8',text:'#3D3D38'},dark:{bg:'#1C2B1E',text:'#D8D0C0'}};const c=m[e.data.theme]||m.sepia;document.body.style.background=c.bg;r?.themes.default({body:{background:c.bg+' !important',color:c.text+' !important'}});}
  if(e.data?.type==='set-font-size')r?.themes.fontSize(e.data.size+'%');
};
</script></body></html>` : '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden"
        style={{ borderRadius: '4px', border: '1px solid #D8D0C0', background: themes[theme].bg }}>
        <DialogTitle className="sr-only">{book.title}</DialogTitle>
        <DialogDescription className="sr-only">Reading {book.title}</DialogDescription>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #D8D0C0', background: '#EDE7D9', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8578', padding: '2px', display: 'flex' }}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: S.serif, fontSize: '14px', fontWeight: 600, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{book.title}</p>
              <p style={{ fontFamily: S.serifBody, fontStyle: 'italic', fontSize: '11px', color: S.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={() => setFontSize(s => Math.max(70, s - 10))} style={{ ...S.btnOutline, padding: '5px 8px' }}><Minus size={11} /></button>
            <span style={{ fontSize: '11px', color: S.muted, minWidth: '34px', textAlign: 'center', letterSpacing: '0.04em' }}>{fontSize}%</span>
            <button onClick={() => setFontSize(s => Math.min(150, s + 10))} style={{ ...S.btnOutline, padding: '5px 8px' }}><Type size={11} /></button>
            <div style={{ width: '1px', height: '14px', background: S.border, margin: '0 4px' }} />
            {(['light', 'sepia', 'dark'] as const).map(t => (
              <button key={t} onClick={() => setTheme(t)} title={themes[t].label}
                style={{ width: '16px', height: '16px', borderRadius: '50%', background: themes[t].bg, border: theme === t ? `2px solid ${S.green}` : `1px solid ${S.border}`, cursor: 'pointer', transition: 'transform 0.15s', transform: theme === t ? 'scale(1.2)' : 'scale(1)' }} />
            ))}
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: themes[theme].bg }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <Loader2 size={24} className="animate-spin" style={{ color: S.faint }} />
              <p style={{ fontFamily: S.serifBody, fontStyle: 'italic', color: S.muted, fontSize: '13px' }}>Opening book...</p>
            </div>
          )}
          {!loading && error && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '32px', textAlign: 'center' }}>
              <BookOpen size={36} strokeWidth={1} style={{ color: S.faint }} />
              <p style={{ fontFamily: S.serifBody, fontStyle: 'italic', color: S.muted, fontSize: '13px' }}>{error}</p>
              {book.olKey && (
                <a href={`https://openlibrary.org${book.olKey}`} target="_blank" rel="noopener noreferrer">
                  <button style={S.btnOutline}><ExternalLink size={12} /> Open Library</button>
                </a>
              )}
            </div>
          )}
          {!loading && !error && epubProxyUrl && (
            <iframe ref={iframeRef} srcDoc={iframeHtml} style={{ width: '100%', height: '100%', border: 'none' }}
              title={`Reading ${book.title}`} sandbox="allow-scripts allow-same-origin" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Upload Dialog ─────────────────────────────────────────────────────────────

function UploadBookDialog({ onBookUploaded }: { onBookUploaded: (book: CommunityBook) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]; setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (title && author && preview) {
      onBookUploaded({ id: `community-${Date.now()}`, title, author, coverUrl: preview, coverHint: 'custom upload', uploaderId: allUsers[0].id, source: 'community', pageCount: pageCount ? parseInt(pageCount) : undefined });
      setTitle(''); setAuthor(''); setPageCount(''); setImage(null); setPreview(null); setOpen(false);
    }
  };

  const inputStyle = { width: '100%', background: '#EDE7D9', border: '1px solid #D8D0C0', borderRadius: '2px', padding: '8px 12px', fontSize: '13px', color: S.text, outline: 'none', fontFamily: S.sans };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button style={S.btnPrimary}
          onMouseEnter={e => (e.currentTarget.style.background = S.greenHover)}
          onMouseLeave={e => (e.currentTarget.style.background = S.green)}>
          <Upload size={13} /> Share a Book
        </button>
      </DialogTrigger>
      <DialogContent style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: '4px' }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: S.serif, fontSize: '20px', fontWeight: 400, color: S.text }}>Share What You&apos;re Reading</DialogTitle>
          <DialogDescription style={{ fontSize: '13px', color: S.muted }}>Upload a book cover and share with the community.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {([['title', 'Book Title', title, setTitle, 'e.g. Dune', 'text'], ['author', 'Author', author, setAuthor, 'e.g. Frank Herbert', 'text'], ['pages', 'Total Pages', pageCount, setPageCount, 'e.g. 320', 'number']] as const).map(([id, label, val, setter, ph, type]) => (
            <div key={id} className="space-y-1">
              <label htmlFor={id} style={S.label}>{label}</label>
              <input id={id} type={type} value={val} onChange={e => (setter as any)(e.target.value)} placeholder={ph} style={inputStyle} />
            </div>
          ))}
          <div className="space-y-1">
            <label style={S.label}>Cover Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: '12px', color: S.muted, width: '100%' }} />
          </div>
          {preview && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Image src={preview} alt="preview" width={90} height={135} style={{ borderRadius: '2px', boxShadow: '4px 6px 16px rgba(0,0,0,0.15)' }} />
            </div>
          )}
          <button onClick={handleSubmit} disabled={!title || !author || !image}
            style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center', opacity: (!title || !author || !image) ? 0.4 : 1 }}>
            Upload Book
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Book Detail Modal ─────────────────────────────────────────────────────────

function BookDetailModal({ book, open, onClose, onSave, isSaved, onRead }: {
  book: CommunityBook | null; open: boolean; onClose: () => void;
  onSave: (b: CommunityBook) => void; isSaved: boolean; onRead: (b: CommunityBook) => void;
}) {
  const [detail, setDetail] = useState<BookDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!book || !open) return;
    setDetail(null); setImgError(false);
    if (book.olKey) { setLoadingDetail(true); fetchBookDetail(book.olKey).then(setDetail).finally(() => setLoadingDetail(false)); }
  }, [book, open]);

  if (!book) return null;
  const isClassic = book.source === 'openlibrary' && book.publishYear && book.publishYear < 1928;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0"
        style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: '4px' }}>
        <DialogTitle className="sr-only">{book.title}</DialogTitle>
        <DialogDescription className="sr-only">{book.author}</DialogDescription>
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ flexShrink: 0, width: '100px' }}>
              <div style={{ width: '100px', height: '150px', position: 'relative', borderRadius: '2px', overflow: 'hidden', boxShadow: '4px 6px 20px rgba(0,0,0,0.18)' }}>
                <Image src={imgError ? PLACEHOLDER : book.coverUrl} alt={book.title} fill className="object-cover" onError={() => setImgError(true)} sizes="100px" />
              </div>
              {isClassic && <p style={{ marginTop: '8px', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: S.accent, textAlign: 'center' }}>Classic</p>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {isClassic && <p style={{ ...S.label, color: S.muted, marginBottom: '8px' }}>Public Domain</p>}
              <h2 style={{ fontFamily: S.serif, fontSize: '22px', fontWeight: 600, color: S.text, lineHeight: 1.2, marginBottom: '6px' }}>{book.title}</h2>
              <p style={{ fontFamily: S.serifBody, fontStyle: 'italic', fontSize: '13px', color: S.muted, marginBottom: '16px' }}>{book.author}</p>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', fontSize: '11px', color: S.muted }}>
                {book.publishYear && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} />{book.publishYear}</span>}
                {book.pageCount && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span>&#35;</span>{book.pageCount} pages</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                <button onClick={() => onSave(book)}
                  style={{ ...(!isSaved ? S.btnOutline : { ...S.btnOutline, background: S.green, color: '#fff', border: `1px solid ${S.green}` }) }}>
                  {isSaved ? <BookCheck size={13} /> : <Bookmark size={13} />}
                  {isSaved ? 'Saved' : 'Save to List'}
                </button>
                {isClassic
                  ? <button onClick={() => { onClose(); onRead(book); }} style={S.btnOutline}><BookOpen size={13} />Read Now</button>
                  : book.olKey
                    ? <a href={`https://openlibrary.org${book.olKey}`} target="_blank" rel="noopener noreferrer">
                        <button style={S.btnOutline}><ExternalLink size={13} />Open Library</button>
                      </a>
                    : null}
              </div>
              {isClassic && <p style={{ fontSize: '11px', color: S.muted, marginTop: '10px' }}>Full ebook available via Project Gutenberg</p>}
            </div>
          </div>
          <div style={{ height: '1px', background: S.border, margin: '24px 0' }} />
          {loadingDetail ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: S.muted, fontSize: '13px' }}><Loader2 size={13} className="animate-spin" />Loading details...</div>
          ) : detail ? (
            <div className="space-y-5">
              {(detail.description || detail.firstSentence) && (
                <div>
                  <p style={{ ...S.label, marginBottom: '10px' }}>About</p>
                  <p style={{ fontFamily: S.serifBody, fontSize: '13px', color: '#3D3D38', lineHeight: 1.85 }} className="line-clamp-6">
                    {detail.description ?? detail.firstSentence}
                  </p>
                </div>
              )}
              {detail.subjects && detail.subjects.length > 0 && (
                <div>
                  <p style={{ ...S.label, marginBottom: '10px' }}>Subjects</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                    {detail.subjects.map(s => (
                      <span key={s} style={{ background: S.card, border: `1px solid ${S.border}`, color: S.muted, fontSize: '11px', padding: '4px 10px', borderRadius: '2px' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : book.source === 'community' ? (
            <p style={{ fontFamily: S.serifBody, fontStyle: 'italic', fontSize: '13px', color: S.muted }}>Community shared book — no additional details available.</p>
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
      <DialogContent style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: '4px' }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: S.serif, fontSize: '20px', fontWeight: 400, color: S.text, lineHeight: 1.2 }}>{book.title}</DialogTitle>
          <DialogDescription style={{ fontFamily: S.serifBody, fontStyle: 'italic', fontSize: '13px', color: S.muted }}>{book.author}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {total && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: S.muted, letterSpacing: '0.08em', marginBottom: '6px' }}>
                <span>Progress</span><span>{percent}%</span>
              </div>
              <div style={{ height: '2px', background: S.border, borderRadius: '1px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${percent}%`, background: S.green, transition: 'width 0.4s ease' }} />
              </div>
              <p style={{ fontSize: '10px', color: S.faint, marginTop: '5px', textAlign: 'right', letterSpacing: '0.04em' }}>{entry.pagesRead} / {total} pages</p>
            </div>
          )}
          <div className="space-y-2">
            <label style={S.label}>{total ? `Current Page (of ${total})` : 'Pages Read'}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="number" min="0" max={total} value={pagesInput} onChange={e => setPagesInput(e.target.value)} placeholder="e.g. 120"
                style={{ flex: 1, background: S.card, border: `1px solid ${S.border}`, borderRadius: '2px', padding: '8px 12px', fontSize: '13px', color: S.text, outline: 'none' }} />
              <button onClick={() => { const v = parseInt(pagesInput); if (!isNaN(v) && v >= 0) { onUpdate(book.id, v); onClose(); } }} style={S.btnPrimary}>Save</button>
            </div>
          </div>
          {isClassic && (
            <button onClick={() => { onClose(); onRead(book); }} style={{ ...S.btnOutline, width: '100%', justifyContent: 'center' }}>
              <BookOpen size={13} /> Continue Reading
            </button>
          )}
        </div>
        <DialogFooter>
          <button onClick={() => { onRemove(book.id); onClose(); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: S.faint }}>
            Remove from List
          </button>
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
  const [hovered, setHovered] = useState(false);
  const uploader = book.uploaderId ? allUsers.find(u => u.id === book.uploaderId) : null;
  const isClassic = book.source === 'openlibrary' && book.publishYear && book.publishYear < 1928;

  return (
    <div onClick={() => onClick(book)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer', background: S.card, border: `1px solid ${S.border}`, borderRadius: '2px', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 6px rgba(0,0,0,0.05)', transform: hovered ? 'translateY(-2px)' : 'none' }}>
      {uploader && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 12px 0' }}>
          <Avatar style={{ width: '20px', height: '20px' }}>
            <AvatarImage src={uploader.avatarUrl} alt={uploader.name} />
            <AvatarFallback style={{ background: S.border, color: S.muted, fontSize: '9px' }}>{uploader.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <p style={{ fontSize: '10px', color: S.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploader.name}</p>
        </div>
      )}
      <div style={{ position: 'relative', aspectRatio: '2/3', background: S.border, marginTop: uploader ? '8px' : 0 }}>
        <Image src={imgError ? PLACEHOLDER : book.coverUrl} alt={`Cover of ${book.title}`} fill className="object-cover"
          style={{ transition: 'transform 0.4s', transform: hovered ? 'scale(1.03)' : 'scale(1)' }}
          onError={() => setImgError(true)} data-ai-hint={book.coverHint}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw" />
        {isClassic && (
          <span style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(28,43,30,0.88)', color: '#fff', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: '2px' }}>
            Classic
          </span>
        )}
        <button onClick={e => onSave(e, book)}
          style={{ position: 'absolute', top: '8px', right: '8px', background: isSaved ? 'rgba(28,43,30,0.9)' : 'rgba(0,0,0,0.3)', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: '2px', color: '#fff', display: 'flex', opacity: isSaved ? 1 : (hovered ? 1 : 0), transition: 'opacity 0.2s' }}>
          {isSaved ? <BookCheck size={12} /> : <Bookmark size={12} />}
        </button>
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <h3 style={{ fontFamily: S.serif, fontSize: '13px', fontWeight: 600, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{book.title}</h3>
        <p style={{ fontFamily: S.serifBody, fontStyle: 'italic', fontSize: '11px', color: S.muted, marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author}</p>
        {book.pageCount && <p style={{ fontSize: '10px', color: S.faint, marginTop: '3px' }}>{book.pageCount}p</p>}
      </div>
    </div>
  );
}

// ── Reading List Card ─────────────────────────────────────────────────────────

function ReadingListCard({ entry, onClick }: { entry: ReadingEntry; onClick: (e: ReadingEntry) => void }) {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { book } = entry;
  const total = book.pageCount;
  const percent = total ? Math.min(100, Math.round((entry.pagesRead / total) * 100)) : null;

  return (
    <div onClick={() => onClick(entry)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer', background: S.card, border: `1px solid ${S.border}`, borderRadius: '2px', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 6px rgba(0,0,0,0.05)', transform: hovered ? 'translateY(-2px)' : 'none' }}>
      <div style={{ position: 'relative', aspectRatio: '2/3', background: S.border }}>
        <Image src={imgError ? PLACEHOLDER : book.coverUrl} alt={book.title} fill className="object-cover"
          style={{ transition: 'transform 0.4s', transform: hovered ? 'scale(1.03)' : 'scale(1)' }}
          onError={() => setImgError(true)} sizes="(max-width: 640px) 50vw, 16vw" />
        {percent !== null && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 10px 8px', background: 'linear-gradient(to top, rgba(28,43,30,0.88) 0%, transparent 100%)' }}>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${percent}%`, background: '#fff' }} />
            </div>
            <p style={{ color: '#fff', fontSize: '10px', letterSpacing: '0.08em', textAlign: 'center', marginTop: '4px', opacity: 0.8 }}>{percent}%</p>
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <h3 style={{ fontFamily: S.serif, fontSize: '13px', fontWeight: 600, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</h3>
        <p style={{ fontFamily: S.serifBody, fontStyle: 'italic', fontSize: '11px', color: S.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '3px' }}>{book.author}</p>
        <p style={{ fontSize: '10px', color: S.accent, marginTop: '6px', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Plus size={10} /> Update progress
        </p>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full" style={{ textAlign: 'center', padding: '60px 16px' }}>
      <BookOpen size={32} strokeWidth={1} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block', color: S.muted }} />
      <p style={{ fontFamily: S.serifBody, fontStyle: 'italic', fontSize: '13px', color: S.muted }}>{message}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<Tab>('classics');
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
  const [currentParams, setCurrentParams] = useState('subject=classics&sort=editions');
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
      setHasMore(pg * 18 < total); setPage(pg);
    } catch { setError('Could not load books. Please try again.'); }
    finally { setIsLoading(false); setIsLoadingMore(false); }
  }, []);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'classics') { const p = 'subject=classics&sort=editions'; setCurrentParams(p); loadBooks(p, 1); }
  };

  useEffect(() => { loadBooks('subject=classics&sort=editions', 1); }, [loadBooks]);

  const handleSearch = () => {
    if (!inputValue.trim()) return;
    const q = inputValue.trim(); setSearchQuery(q); setActiveTab('search');
    const p = `q=${encodeURIComponent(q)}&sort=relevance`; setCurrentParams(p); loadBooks(p, 1);
  };
  const clearSearch = () => { setInputValue(''); setSearchQuery(''); switchTab('classics'); };
  const toggleSave = (book: CommunityBook) => {
    setReadingList(prev => prev.find(e => e.book.id === book.id) ? prev.filter(e => e.book.id !== book.id) : [...prev, { book, pagesRead: 0, savedAt: Date.now() }]);
  };
  const isSaved = (bookId: string) => readingList.some(e => e.book.id === bookId);
  const openReader = (book: CommunityBook) => { setReaderBook(book); setReaderOpen(true); };
  const saveCfi = (bookId: string, cfi: string) => setReadingList(prev => prev.map(e => e.book.id === bookId ? { ...e, cfi } : e));

  const showApiGrid = activeTab === 'classics' || activeTab === 'search';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'classics', label: 'Classics' },
    { key: 'community', label: 'Community' },
    { key: 'readinglist', label: 'Reading List' },
  ];

  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');`}</style>

      <div style={{ fontFamily: S.sans, color: S.text, maxWidth: '1100px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ ...S.label, marginBottom: '8px' }}>Personal Library</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' as const }}>
            <div>
              <h1 style={{ fontFamily: S.serif, fontSize: '42px', fontWeight: 400, color: S.text, lineHeight: 1.1, letterSpacing: '-0.01em', margin: 0 }}>Discover</h1>
              <p style={{ fontFamily: S.serifBody, fontStyle: 'italic', fontSize: '13px', color: S.muted, marginTop: '6px' }}>Explore classic books and community recommendations</p>
            </div>
            <UploadBookDialog onBookUploaded={book => { setCommunityBooks(prev => [book, ...prev]); setActiveTab('community'); }} />
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: S.faint, pointerEvents: 'none' }} />
            <input placeholder="Search any book or author..." value={inputValue}
              onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ width: '100%', paddingLeft: '36px', paddingRight: inputValue ? '36px' : '12px', paddingTop: '10px', paddingBottom: '10px', background: S.card, border: `1px solid ${S.border}`, borderRadius: '2px', fontSize: '13px', color: S.text, outline: 'none', fontFamily: S.sans }}
              onFocus={e => (e.currentTarget.style.borderColor = S.faint)}
              onBlur={e => (e.currentTarget.style.borderColor = S.border)} />
            {inputValue && (
              <button onClick={clearSearch} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: S.faint, display: 'flex', padding: '2px' }}>
                <X size={13} />
              </button>
            )}
          </div>
          <button onClick={handleSearch}
            style={S.btnPrimary}
            onMouseEnter={e => (e.currentTarget.style.background = S.greenHover)}
            onMouseLeave={e => (e.currentTarget.style.background = S.green)}>
            Search
          </button>
        </div>

        {/* Search banner */}
        {activeTab === 'search' && searchQuery && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: S.card, border: `1px solid ${S.border}`, borderRadius: '2px', padding: '10px 16px', marginBottom: '24px', fontSize: '13px', color: S.muted }}>
            <Search size={12} style={{ color: S.faint, flexShrink: 0 }} />
            Results for <em style={{ fontFamily: S.serifBody, color: '#3D3D38' }}>&ldquo;{searchQuery}&rdquo;</em>
            <button onClick={clearSearch} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: S.muted }}>Clear</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${S.border}`, marginBottom: '28px' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => switchTab(tab.key)}
              style={{ background: 'transparent', border: 'none', borderBottom: activeTab === tab.key ? `1px solid ${S.green}` : '1px solid transparent', cursor: 'pointer', padding: '10px 0', marginRight: '28px', marginBottom: '-1px', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase' as const, fontFamily: S.sans, fontWeight: 500, color: activeTab === tab.key ? S.text : S.muted, transition: 'color 0.15s', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {tab.label}
              {tab.key === 'community' && communityBooks.length > 0 && (
                <span style={{ background: S.green, color: '#fff', fontSize: '9px', borderRadius: '2px', padding: '1px 5px', lineHeight: 1.5 }}>{communityBooks.length}</span>
              )}
              {tab.key === 'readinglist' && readingList.length > 0 && (
                <span style={{ background: S.accent, color: '#fff', fontSize: '9px', borderRadius: '2px', padding: '1px 5px', lineHeight: 1.5 }}>{readingList.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* API Grid */}
        {showApiGrid && (
          <>
            <div style={gridStyle}>
              {isLoading ? (
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '14px' }}>
                  <Loader2 size={24} className="animate-spin" style={{ color: S.faint }} />
                  <p style={{ fontFamily: S.serifBody, fontStyle: 'italic', color: S.muted, fontSize: '13px' }}>Finding books...</p>
                </div>
              ) : error ? <EmptyState message={error} />
                : apiBooks.length === 0 ? <EmptyState message="No results found." />
                : apiBooks.map(book => (
                  <BookCard key={book.id} book={book} isSaved={isSaved(book.id)}
                    onSave={(e, b) => { e.stopPropagation(); toggleSave(b); }}
                    onClick={b => { setSelectedBook(b); setDetailOpen(true); }} />
                ))}
            </div>
            {!isLoading && apiBooks.length > 0 && hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '32px' }}>
                <button onClick={() => loadBooks(currentParams, page + 1, true)} disabled={isLoadingMore}
                  style={{ ...S.btnOutline, opacity: isLoadingMore ? 0.6 : 1 }}>
                  {isLoadingMore ? <><Loader2 size={13} className="animate-spin" />Loading...</> : <><ChevronDown size={13} />Load More Books</>}
                </button>
              </div>
            )}
          </>
        )}

        {/* Community Grid */}
        {activeTab === 'community' && (
          <div style={gridStyle}>
            {communityBooks.length === 0
              ? <EmptyState message="No community books yet — be the first to share one!" />
              : communityBooks.map(book => (
                <BookCard key={book.id} book={book} isSaved={isSaved(book.id)}
                  onSave={(e, b) => { e.stopPropagation(); toggleSave(b); }}
                  onClick={b => { setSelectedBook(b); setDetailOpen(true); }} />
              ))}
          </div>
        )}

        {/* Reading List Grid */}
        {activeTab === 'readinglist' && (
          <div style={gridStyle}>
            {readingList.length === 0
              ? <EmptyState message="Your reading list is empty — save books to track your progress!" />
              : readingList.map(entry => (
                <ReadingListCard key={entry.book.id} entry={entry}
                  onClick={e => { setProgressEntry(e); setProgressOpen(true); }} />
              ))}
          </div>
        )}

        {/* Modals */}
        <BookDetailModal book={selectedBook} open={detailOpen} onClose={() => setDetailOpen(false)}
          onSave={toggleSave} isSaved={selectedBook ? isSaved(selectedBook.id) : false} onRead={openReader} />
        <ReadingProgressModal entry={progressEntry} open={progressOpen} onClose={() => setProgressOpen(false)}
          onUpdate={(bookId, pages) => setReadingList(prev => prev.map(e => e.book.id === bookId ? { ...e, pagesRead: pages } : e))}
          onRemove={bookId => setReadingList(prev => prev.filter(e => e.book.id !== bookId))}
          onRead={openReader} />
        <EpubReaderModal book={readerBook} open={readerOpen} onClose={() => setReaderOpen(false)}
          onSaveCfi={saveCfi}
          savedCfi={readerBook ? readingList.find(e => e.book.id === readerBook.id)?.cfi : undefined} />
      </div>
    </>
  );
}