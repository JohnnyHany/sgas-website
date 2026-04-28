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

    // Extract poster text from the caption
    const content = extractPosterContent(caption, topic);
    const esc = escapeXml;

    // Load logo
    const logoPath = path.join(process.cwd(), 'public', 'sgas-logo.png');
    let logoBase64 = '';
    let logoWidth = 80;
    let logoHeight = 80;

    if (fs.existsSync(logoPath)) {
      logoBase64 = fs.readFileSync(logoPath).toString('base64');
      const meta = await sharp(logoPath).metadata();
      if (meta.width && meta.height) {
        logoWidth = meta.width;
        logoHeight = meta.height;
      }
    }

    // Build the entire poster as SVG
    const W = 1080;
    const svg = `
<svg width="${W}" height="${W}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="accentBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#B71C1C"/>
      <stop offset="50%" stop-color="#8B0000"/>
      <stop offset="100%" stop-color="#0D47A1"/>
    </linearGradient>
    <linearGradient id="shapeGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#B71C1C" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#0D47A1" stop-opacity="0.08"/>
    </linearGradient>
  </defs>

  <!-- ─── Background: off-white cream ─── -->
  <rect width="${W}" height="${W}" fill="#FAFAF8"/>

  <!-- ─── Subtle geometric shapes (like reference) ─── -->
  <rect x="0" y="0" width="280" height="280" rx="0" fill="#B71C1C" opacity="0.08"/>
  <rect x="0" y="280" width="160" height="160" rx="0" fill="#0D47A1" opacity="0.06"/>
  <rect x="${W - 200}" y="${W - 200}" width="200" height="200" rx="0" fill="#2E7D32" opacity="0.06"/>
  <rect x="${W - 350}" y="${W - 100}" width="150" height="100" rx="0" fill="#B71C1C" opacity="0.05"/>

  <!-- ─── Thin decorative lines ─── -->
  <line x1="60" y1="120" x2="${W - 60}" y2="120" stroke="#E0E0E0" stroke-width="1"/>
  <line x1="60" y1="${W - 140}" x2="${W - 60}" y2="${W - 140}" stroke="#E0E0E0" stroke-width="1"/>

  ${logoBase64 ? `
  <!-- ─── SGAS Logo (top-right) ─── -->
  <image href="data:image/png;base64,${logoBase64}" 
         x="${W - 180}" y="40" width="120" height="120" 
         preserveAspectRatio="xMidYMid meet"/>
  ` : ''}

  <!-- ─── SGAS text next to logo ─── -->
  <text x="${W - 195}" y="75"
        font-family="'Helvetica Neue', 'Arial', sans-serif"
        font-size="14" fill="#666666"
        text-anchor="end" letter-spacing="3" font-weight="500">
    STUDENT GROUP OF
  </text>
  <text x="${W - 195}" y="100"
        font-family="'Helvetica Neue', 'Arial', sans-serif"
        font-size="18" fill="#0D47A1"
        text-anchor="end" letter-spacing="2" font-weight="700">
    ACTUARIAL SCIENCE
  </text>
  <text x="${W - 195}" y="120"
        font-family="'Helvetica Neue', 'Arial', sans-serif"
        font-size="12" fill="#999999"
        text-anchor="end" letter-spacing="2">
    CAIRO UNIVERSITY
  </text>

  <!-- ─── Accent color bar ─── -->
  <rect x="80" y="520" width="100" height="6" rx="3" fill="url(#accentBar)"/>

  <!-- ─── Main Title ─── -->
  <text x="80" y="590"
        font-family="'Georgia', 'Times New Roman', serif"
        font-size="62" font-weight="bold" fill="#1A1A1A"
        text-anchor="start">
    ${esc(content.title)}
  </text>

  <!-- ─── Body lines ─── -->
  ${content.lines.map((line, i) => `
  <text x="80" y="${660 + i * 52}"
        font-family="'Helvetica Neue', 'Arial', sans-serif"
        font-size="26" fill="#555555"
        text-anchor="start" font-weight="400">
    ${esc(line)}
  </text>`).join('')}

  <!-- ─── Bottom accent shapes (like reference) ─── -->
  <rect x="60" y="${W - 120}" width="50" height="50" rx="4" fill="#B71C1C" opacity="0.7"/>
  <rect x="120" y="${W - 120}" width="35" height="35" rx="4" fill="#0D47A1" opacity="0.5"/>
  <rect x="165" y="${W - 120}" width="20" height="20" rx="4" fill="#2E7D32" opacity="0.6"/>

  <!-- ─── Footer line ─── -->
  <rect x="60" y="${W - 60}" width="${W - 120}" height="1" fill="#E0E0E0"/>

  <!-- ─── Footer text ─── -->
  <text x="80" y="${W - 30}"
        font-family="'Helvetica Neue', 'Arial', sans-serif"
        font-size="14" fill="#AAAAAA"
        text-anchor="start" letter-spacing="2">
    SGAS  ·  @SGAS.CU
  </text>
</svg>`;

    // Render SVG to PNG using sharp
    const finalBuffer = await sharp(Buffer.from(svg))
      .resize(1080, 1080)
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
  if (title.length > 40) title = title.substring(0, 37) + '...';

  const bodyLines = lines
    .slice(1)
    .filter(l => l.length > 5)
    .slice(0, 4)
    .map(l => l.length > 55 ? l.substring(0, 52) + '...' : l);

  return { title, lines: bodyLines };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
