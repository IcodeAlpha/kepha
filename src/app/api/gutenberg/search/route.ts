import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') ?? '';
  const author = searchParams.get('author') ?? '';

  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(`https://gutendex.com/books/?search=${query}`, {
      headers: { 'User-Agent': 'BookApp/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return NextResponse.json({ error: 'Search failed' }, { status: 502 });

    const data = await res.json();
    const results = data.results ?? [];
    if (!results.length) return NextResponse.json({ epubUrl: null });

    const exact = results.find((b: any) =>
      b.title.toLowerCase().includes(title.toLowerCase().slice(0, 15))
    );
    const best = exact ?? results[0];
    const formats: Record<string, string> = best.formats ?? {};

    // Priority order — smallest/simplest epub first to avoid timeouts:
    // 1. epub2 no images (smallest, ~300KB)
    // 2. epub2 with images
    // 3. epub3 no images
    // 4. epub3 with images (largest, often 2MB+ — avoid if possible)
    const gutId = best.id;
    const epubUrl =
      formats[`https://www.gutenberg.org/ebooks/${gutId}.epub.noimages`] ??
      // Gutendex uses mime type as key, check by URL pattern
      Object.entries(formats).find(([, url]) =>
        url.includes('.epub.noimages') || url.includes('epub2.noimages')
      )?.[1] ??
      Object.entries(formats).find(([, url]) =>
        url.includes('.epub') && !url.includes('epub3') && !url.includes('images')
      )?.[1] ??
      // Direct cache URL for epub2 no images — reliable fallback
      `https://www.gutenberg.org/cache/epub/${gutId}/pg${gutId}.epub` ??
      Object.entries(formats).find(([k]) => k.includes('epub'))?.[1] ??
      null;

    console.log('[gutenberg/search] formats:', Object.keys(formats));
    console.log('[gutenberg/search] chosen epubUrl:', epubUrl);

    return NextResponse.json({
      id: gutId,
      title: best.title,
      epubUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}