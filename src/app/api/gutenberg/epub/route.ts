import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const epubUrl = searchParams.get('url');

  if (!epubUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  let parsed: URL;
  try { parsed = new URL(epubUrl); } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!parsed.hostname.endsWith('gutenberg.org')) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
  }

  console.log('[gutenberg/epub] Fetching:', epubUrl);

  try {
    const res = await fetch(epubUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookApp/1.0)',
        'Accept': 'application/epub+zip, */*',
      },
      signal: AbortSignal.timeout(60000),
    });

    console.log('[gutenberg/epub] Status:', res.status, 'Content-Type:', res.headers.get('content-type'), 'Content-Length:', res.headers.get('content-length'));

    if (!res.ok || !res.body) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });
    }

    // Stream the response directly instead of buffering the whole file
    // This prevents timeout on large files
    return new NextResponse(res.body, {
      headers: {
        'Content-Type': 'application/epub+zip',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('[gutenberg/epub] Error:', err?.message);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}