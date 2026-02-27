import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const textUrl = searchParams.get('url');

  if (!textUrl) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  // Only allow gutenberg / gutendex domains
  const allowed = ['gutenberg.org', 'gutendex.com', 'aleph.gutenberg.org'];
  const urlHost = new URL(textUrl).hostname;
  if (!allowed.some(d => urlHost.endsWith(d))) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
  }

  try {
    const res = await fetch(textUrl, {
      headers: { 'User-Agent': 'BookApp/1.0' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch text' }, { status: 502 });
    }

    const raw = await res.text();

    // Strip Gutenberg boilerplate header and footer
    let text = raw;

    const startPatterns = [
      '*** START OF THE PROJECT GUTENBERG',
      '***START OF THE PROJECT GUTENBERG',
      '*** START OF THIS PROJECT GUTENBERG',
      '*END*THE SMALL PRINT',
    ];
    const endPatterns = [
      '*** END OF THE PROJECT GUTENBERG',
      '***END OF THE PROJECT GUTENBERG',
      '*** END OF THIS PROJECT GUTENBERG',
      'End of Project Gutenberg',
      'End of the Project Gutenberg',
    ];

    for (const marker of startPatterns) {
      const idx = text.indexOf(marker);
      if (idx !== -1) {
        text = text.slice(text.indexOf('\n', idx) + 1);
        break;
      }
    }
    for (const marker of endPatterns) {
      const idx = text.indexOf(marker);
      if (idx !== -1) {
        text = text.slice(0, idx);
        break;
      }
    }

    return new NextResponse(text.trim(), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}