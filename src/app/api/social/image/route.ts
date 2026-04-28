import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { topic, caption, platform } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // 1. Extract poster text from the caption
    const posterContent = extractPosterContent(caption, topic);

    // 2. Generate white background with SGAS brand accent elements ONLY
    const bgPrompt = `Clean white background #FFFFFF with subtle decorative elements. Faint pomegranate red #B71C1C and navy blue #0D47A1 soft abstract shapes, very light watercolor-style splashes in the corners, minimal elegant geometric accents in forest green #2E7D32. The background should be predominantly white like a clean canvas. Absolutely NO text, NO words, NO letters, square format`;

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(bgPrompt)}?width=1080&height=1080&nologo=true&seed=${Date.now()}`;

    const bgResponse = await fetch(imageUrl);
    if (!bgResponse.ok) throw new Error('Failed to generate background');
    const imageBuffer = Buffer.from(await bgResponse.arrayBuffer());

    // 3. Resize background
    const background = await sharp(imageBuffer)
      .resize(1080, 1080, { fit: 'cover' })
      .png()
      .toBuffer();

    // 4. Build SVG overlay with English text
    const svgOverlay = buildPosterSVG(posterContent);

    // 5. Load logo
    const logoPath = path.join(process.cwd(), 'public', 'sgas-logo.png');
    const composites: any[] = [
      { input: Buffer.from(svgOverlay) }
    ];

    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoSize = 110;
      composites.push({
        input: await sharp(logoBuffer)
          .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer(),
        top: 1080 - logoSize - 30,
        left: 1080 - logoSize - 30,
      });
    }

    // 6. Composite everything
    const finalBuffer = await sharp(background)
      .composite(composites)
      .png()
      .toBuffer();

    return NextResponse.json({
      image: finalBuffer.toString('base64'),
      success: true
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}

// ─── Extract content from caption ───
function extractPosterContent(caption: string, topic: string) {
  if (!caption) {
    return { title: topic, lines: [] };
  }

  const cleaned = caption
    .replace(/#\w+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n')
    .trim();

  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 3);

  let title = lines[0] || topic;
  if (title.length > 50) title = title.substring(0, 47) + '...';

  const bodyLines = lines
    .slice(1)
    .filter(l => l.length > 5)
    .slice(0, 4)
    .map(l => l.length > 50 ? l.substring(0, 47) + '...' : l);

  return { title, lines: bodyLines };
}

// ─── Build the SVG poster overlay ───
function buildPosterSVG(content: { title: string; lines: string[] }): string {
  const W = 1080;
  const esc = escapeXml;

  const titleY = 680;
  const bodyStartY = titleY + 75;
  const lineSpacing = 42;

  return `<svg width="${W}" height="${W}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0)" />
      <stop offset="40%" stop-color="rgba(255,255,255,0)" />
      <stop offset="75%" stop-color="rgba(255,255,255,0.4)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.75)" />
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#B71C1C" />
      <stop offset="50%" stop-color="#8B0000" />
      <stop offset="100%" stop-color="#0D47A1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.5)" />
    </filter>
  </defs>

  <!-- Bottom dark gradient for text readability -->
  <rect width="${W}" height="${W}" fill="url(#fade)" />

  <!-- Brand color accent bar -->
  <rect x="80" y="${titleY - 30}" width="180" height="5" rx="3" fill="url(#bar)" />

  <!-- Title -->
  <text x="80" y="${titleY}"
        font-family="'Segoe UI', 'Helvetica Neue', 'Arial', sans-serif"
        font-size="46" font-weight="bold" fill="white"
        text-anchor="start" filter="url(#shadow)">
    ${esc(content.title)}
  </text>

  ${content.lines.map((line, i) => `
  <text x="80" y="${bodyStartY + i * lineSpacing}"
        font-family="'Segoe UI', 'Helvetica Neue', 'Arial', sans-serif"
        font-size="26" fill="rgba(255,255,255,0.9)"
        text-anchor="start">
    ${esc(line)}
  </text>`).join('')}

  <!-- SGAS branding -->
  <text x="80" y="${W - 45}"
        font-family="'Segoe UI', 'Helvetica Neue', 'Arial', sans-serif"
        font-size="18" fill="rgba(255,255,255,0.45)"
        text-anchor="start" letter-spacing="4">
    SGAS  ·  CAIRO UNIVERSITY
  </text>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
