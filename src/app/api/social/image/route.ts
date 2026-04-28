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
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TOGETHER_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Extract poster text from caption
    const content = extractPosterContent(caption, topic);

    // Generate high-quality background with FLUX.1-schnell (FREE model)
    const bgPrompt = `Clean elegant social media post background for "${content.title}". Soft off-white cream base color with subtle decorative elements in SGAS brand colors: pomegranate red (#B71C1C), navy blue (#0D47A1), and forest green (#2E7D32). Minimalist geometric shapes, faint abstract curves, professional university organization aesthetic. Leave the center and bottom half clean for text overlay. NO text, NO words, NO letters. Square format.`;

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

    if (!imgResponse.ok) {
      const errText = await imgResponse.text();
      console.error('Together API error:', errText);
      throw new Error('Failed to generate image');
    }

    const imgData = await imgResponse.json();
    const imageBase64 = imgData.data?.[0]?.b64_json;
    if (!imageBase64) throw new Error('No image data received');

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Resize to 1080x1080 (Instagram standard)
    const background = await sharp(imageBuffer)
      .resize(1080, 1080, { fit: 'cover' })
      .png()
      .toBuffer();

    // Build SVG text overlay
    const svgOverlay = buildPosterSVG(content);

    // Load logo
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

    // Composite everything
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

// ─── Extract poster text from caption ───
function extractPosterContent(caption: string, topic: string) {
  if (!caption) return { title: topic, lines: [] };

  const cleaned = caption
    .replace(/#\w+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n')
    .trim();

  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 3);

  let title = lines[0] || topic;
  if (title.length > 40) title = title.substring(0, 37) + '...';

  const bodyLines = lines
    .slice(1)
    .filter(l => l.length > 5)
    .slice(0, 4)
    .map(l => l.length > 55 ? l.substring(0, 52) + '...' : l);

  return { title, lines: bodyLines };
}

// ─── Build SVG poster overlay ───
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
      <stop offset="75%" stop-color="rgba(255,255,255,0.3)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.7)" />
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#B71C1C" />
      <stop offset="50%" stop-color="#8B0000" />
      <stop offset="100%" stop-color="#0D47A1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.6)" />
    </filter>
  </defs>

  <!-- Bottom dark gradient for text readability -->
  <rect width="${W}" height="${W}" fill="url(#fade)" />

  <!-- Brand color accent bar -->
  <rect x="80" y="${titleY - 30}" width="180" height="5" rx="3" fill="url(#bar)" />

  <!-- Title -->
  <text x="80" y="${titleY}"
        font-family="'Georgia', 'Times New Roman', serif"
        font-size="54" font-weight="bold" fill="white"
        text-anchor="start" filter="url(#shadow)">
    ${esc(content.title)}
  </text>

  ${content.lines.map((line, i) => `
  <text x="80" y="${bodyStartY + i * lineSpacing}"
        font-family="'Helvetica Neue', 'Arial', sans-serif"
        font-size="26" fill="rgba(255,255,255,0.9)"
        text-anchor="start">
    ${esc(line)}
  </text>`).join('')}

  <!-- Branding -->
  <text x="80" y="${W - 45}"
        font-family="'Helvetica Neue', 'Arial', sans-serif"
        font-size="16" fill="rgba(255,255,255,0.4)"
        text-anchor="start" letter-spacing="3">
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
