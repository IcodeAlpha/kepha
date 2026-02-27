import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') ?? '';
  const author = searchParams.get('author') ?? '';

  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(`https://gutendex.com/books/?search=${query}`, {
      headers: { 'User-Agent': 'BookApp/1.0' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Gutenberg search failed' }, { status: 502 });
    }

    const data = await res.json();
    const results = data.results ?? [];

    if (!results.length) {
      return NextResponse.json({ id: null });
    }

    // Prefer exact title match
    const exact = results.find((b: any) =>
      b.title.toLowerCase().includes(title.toLowerCase().slice(0, 15))
    );
    const best = exact ?? results[0];

    // Find a plain text format URL
    const formats = best.formats ?? {};
    const textUrl =
      formats['text/plain; charset=utf-8'] ??
      formats['text/plain; charset=us-ascii'] ??
      formats['text/plain'] ??
      Object.entries(formats).find(([k]) => k.startsWith('text/plain'))?.[1] ??
      null;

    return NextResponse.json({ id: best.id, textUrl, title: best.title });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}