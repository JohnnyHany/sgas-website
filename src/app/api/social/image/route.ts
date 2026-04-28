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

    const apiKey = process.env.TOGETHER_API_KEY;

    // Check 1: API key missing?
    if (!apiKey) {
      return NextResponse.json(
        { error: 'MISSING_KEY: Go to Vercel Settings > Environment Variables and add TOGETHER_API_KEY' },
        { status: 500 }
      );
    }

    const content = extractPosterContent(caption, topic);

    const bgPrompt = `Clean elegant social media post background. Soft off-white cream base with subtle decorative elements in pomegranate red, navy blue, and forest green. Minimalist geometric shapes, professional university aesthetic. NO text NO words NO letters. Square format.`;

    // Check 2: Call Together API
    const imgResponse = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell',
        prompt: bgPrompt,
        width: 1024,
        height: 1024,
        n: 1,
        response_format: 'b64_json',
      }),
    });

    // Check 3: API returned error?
    if (!imgResponse.ok) {
      const errBody = await imgResponse.text();
      let errorMsg = `API_ERROR: Status ${imgResponse.status}`;
      try {
        const errJson = JSON.parse(errBody);
        errorMsg = `API_ERROR: ${errJson.error?.message || errJson.message || JSON.stringify(errJson)}`;
      } catch {
        errorMsg = `API_ERROR: ${errBody.substring(0, 200)}`;
      }
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    const imgData = await imgResponse.json();

    // Check 4: No image in response?
    const imageBase64 = imgData.data?.[0]?.b64_json;
    if (!imageBase64) {
      return NextResponse.json(
        { error: `NO_IMAGE: ${JSON.stringify(imgData).substring(0, 200)}` },
        { status: 500 }
      );
    }

    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const background = await sharp(imageBuffer)
      .resize(1080, 1080, { fit: 'cover' })
      .png()
      .toBuffer();

    const svgOverlay = buildPosterSVG(content);

    const logoPath = path.join(process.cwd(), 'public', 'sgas-logo.png');
    const composites: any[] = [{ input: Buffer.from(svgOverlay) }];

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

    const finalBuffer = await sharp(background)
      .composite(composites)
      .png()
      .toBuffer();

    return NextResponse.json({ image: finalBuffer.toString('base64'), success: true });

  } catch (error: any) {
    return NextResponse.json(
      { error: `CRASH: ${error.message}` },
      { status: 500 }
    );
  }
}

function extractPosterContent(caption: string, topic: string) {
  if (!caption) return { title: topic, lines: [] };
  const cleaned = caption.replace(/#\w+/g, '').replace(/\*\*/g, '').replace(/\n{3,}/g, '\n').trim();
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 3);
  let title = lines[0] || topic;
  if (title.length > 40) title = title.substring(0, 37) + '...';
  const bodyLines = lines.slice(1).filter(l => l.length > 5).slice(0, 4).map(l => l.length > 55 ? l.substring(0, 52) + '...' : l);
  return { title, lines: bodyLines };
}

function buildPosterSVG(content: { title: string; lines: string[] }): string {
  const W = 1080;
  const esc = escapeXml;
  const titleY = 680;
  const bodyStartY = titleY + 75;
  const lineSpacing = 42;
  return `<svg width="${W}" height="${W}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0)"/>
      <stop offset="40%" stop-color="rgba(255,255,255,0)"/>
      <stop offset="75%" stop-color="rgba(255,255,255,0.3)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.7)"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#B71C1C"/>
      <stop offset="50%" stop-color="#8B0000"/>
      <stop offset="100%" stop-color="#0D47A1"/>
    </linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.6)"/></filter>
  </defs>
  <rect width="${W}" height="${W}" fill="url(#fade)"/>
  <rect x="80" y="${titleY - 30}" width="180" height="5" rx="3" fill="url(#bar)"/>
  <text x="80" y="${titleY}" font-family="'Georgia','Times New Roman',serif" font-size="54" font-weight="bold" fill="white" text-anchor="start" filter="url(#shadow)">${esc(content.title)}</text>
  ${content.lines.map((line, i) => `<text x="80" y="${bodyStartY + i * lineSpacing}" font-family="'Helvetica Neue','Arial',sans-serif" font-size="26" fill="rgba(255,255,255,0.9)" text-anchor="start">${esc(line)}</text>`).join('')}
  <text x="80" y="${W - 45}" font-family="'Helvetica Neue','Arial',sans-serif" font-size="16" fill="rgba(255,255,255,0.4)" text-anchor="start" letter-spacing="3">SGAS  ·  CAIRO UNIVERSITY</text>
</svg>`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
