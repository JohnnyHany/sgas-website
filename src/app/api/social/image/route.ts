import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

const W = 1080;
const H = 1080;

const C = {
  red: '#B71C1C',
  darkRed: '#8B0000',
  green: '#2E7D32',
  darkGreen: '#1B5E20',
  navy: '#0D47A1',
  darkNavy: '#082B5E',
  white: '#FFFFFF',
  offWhite: '#FAFAFA',
  cream: '#FFF8E1',
  lightGray: '#F0F0F0',
  medGray: '#E0E0E0',
  darkText: '#1A1A1A',
  bodyText: '#333333',
  subText: '#666666',
};

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [];
  const paragraphs = text.split(/\n+/);
  const allLines: string[] = [];
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    const words = trimmed.split(/\s+/);
    let currentLine = '';
    for (const word of words) {
      if (!word) continue;
      if (currentLine.length + word.length + 1 > maxChars && currentLine.length > 0) {
        allLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      }
    }
    if (currentLine) allLines.push(currentLine);
  }
  return allLines;
}

function truncateLines(lines: string[], maxLines: number): string[] {
  if (lines.length <= maxLines) return lines;
  const truncated = lines.slice(0, maxLines);
  const last = truncated[truncated.length - 1];
  truncated[truncated.length - 1] = last.length > 3 ? last.slice(0, -3) + '...' : last;
  return truncated;
}

function textEl(lines: string[], x: number, startY: number, lh: number, fs: number, fill: string, weight: string = 'normal', anchor: string = 'middle'): string {
  return lines.map((line, i) =>
    `<text x="${x}" y="${startY + i * lh}" font-family="DejaVu Sans, Liberation Sans, Arial, Helvetica, sans-serif" font-size="${fs}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escapeXml(line)}</text>`
  ).join('\n    ');
}

interface StyleDef {
  id: string;
  name: string;
  nameAr: string;
  prompt: string;
  overlayStyle: 'gradient' | 'card' | 'split' | 'full-overlay' | 'bottom-strip';
  overlayColors: { bg: string; accent: string };
}

const STYLES: Record<string, StyleDef> = {
  'gradient': {
    id: 'gradient',
    name: 'AI Gradient',
    nameAr: 'جرادينت AI',
    prompt: 'abstract professional gradient background with soft light bokeh, deep red and navy blue tones, smooth clean design, no text no letters no words',
    overlayStyle: 'gradient',
    overlayColors: { bg: 'rgba(0,0,0,0.75)', accent: '#B71C1C' },
  },
  'geometric': {
    id: 'geometric',
    name: 'Geometric',
    nameAr: 'هندسي',
    prompt: 'abstract geometric shapes background, triangles and circles, red and dark blue color palette, modern corporate design, minimalist, no text no letters no words',
    overlayStyle: 'card',
    overlayColors: { bg: 'rgba(255,255,255,0.92)', accent: '#B71C1C' },
  },
  'dark': {
    id: 'dark',
    name: 'Dark Pro',
    nameAr: 'داكن احترافي',
    prompt: 'dark elegant background with subtle red and blue light streaks, professional corporate look, cinematic lighting, no text no letters no words',
    overlayStyle: 'full-overlay',
    overlayColors: { bg: 'rgba(10,10,20,0.7)', accent: '#E53935' },
  },
  'nature': {
    id: 'nature',
    name: 'Nature',
    nameAr: 'طبيعي',
    prompt: 'soft nature inspired background with green and earth tones, subtle leaves pattern, professional clean design, no text no letters no words',
    overlayStyle: 'bottom-strip',
    overlayColors: { bg: 'rgba(255,255,255,0.95)', accent: '#2E7D32' },
  },
  'corporate': {
    id: 'corporate',
    name: 'Corporate',
    nameAr: 'كوربوريت',
    prompt: 'clean corporate abstract background, blue and red professional tones, subtle data visualization elements, modern business style, no text no letters no words',
    overlayStyle: 'split',
    overlayColors: { bg: 'rgba(255,255,255,0.9)', accent: '#0D47A1' },
  },
};

async function generateAIBackground(prompt: string): Promise<Buffer> {
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${W}&height=${H}&model=flux&nologo=true&nofeed=true`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error('Failed to generate AI background');
  return Buffer.from(await res.arrayBuffer());
}

function makeOverlaySVG(title: string, body: string, style: StyleDef, hasAIImage: boolean): string {
  const titleLines = truncateLines(wrapText(title, 22), 3);
  const bodyLines = truncateLines(wrapText(body, 36), hasAIImage ? 4 : 6);
  const titleBlockHeight = titleLines.length * 58;

  switch (style.overlayStyle) {
    case 'gradient':
      return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${style.overlayColors.bg};stop-opacity:0.8"/>
      <stop offset="40%" style="stop-color:${style.overlayColors.bg};stop-opacity:0.85"/>
      <stop offset="100%" style="stop-color:${style.overlayColors.bg};stop-opacity:0.95"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${C.red}"/>
      <stop offset="100%" style="stop-color:${C.navy}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#overlay)"/>
  <rect x="440" y="80" width="200" height="48" rx="24" fill="rgba(255,255,255,0.12)"/>
  <text x="540" y="111" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="6">SGAS</text>
  ${textEl(titleLines, 540, 240, 58, 44, 'white', 'bold')}
  <rect x="440" y="${240 + titleBlockHeight + 12}" width="200" height="4" rx="2" fill="url(#accent)"/>
  ${textEl(bodyLines, 540, 240 + titleBlockHeight + 60, 40, 24, 'rgba(255,255,255,0.85)')}
  <rect x="0" y="${H - 110}" width="${W}" height="110" fill="rgba(0,0,0,0.5)"/>
  <line x1="0" y1="${H - 110}" x2="${W}" y2="${H - 110}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
  <rect x="470" y="${H - 100}" width="140" height="90" fill="rgba(0,0,0,0)"/>
  <text x="540" y="${H - 25}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="13" fill="rgba(255,255,255,0.5)" text-anchor="middle" letter-spacing="1">@SGAS.CU  •  Cairo University</text>
</svg>`;

    case 'card':
      return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect x="60" y="100" width="${W - 120}" height="${H - 200}" rx="20" fill="white" filter="url(#cardShadow)"/>
  <rect x="440" y="140" width="200" height="48" rx="24" fill="${C.red}"/>
  <text x="540" y="171" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="6">SGAS</text>
  ${textEl(titleLines, 540, 260, 58, 40, C.darkText, 'bold')}
  <rect x="470" y="${260 + titleBlockHeight + 12}" width="140" height="4" rx="2" fill="${C.red}"/>
  ${textEl(bodyLines, 540, 260 + titleBlockHeight + 60, 40, 24, C.bodyText)}
  <line x1="200" y1="${H - 200}" x2="880" y2="${H - 200}" stroke="${C.lightGray}" stroke-width="1"/>
  <rect x="470" y="${H - 190}" width="140" height="70" fill="rgba(0,0,0,0)"/>
  <text x="540" y="${H - 130}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="13" fill="${C.subText}" text-anchor="middle" letter-spacing="1">@SGAS.CU  •  Cairo University</text>
</svg>`;

    case 'full-overlay':
      return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="darkOv" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(10,10,25,0.65)"/>
      <stop offset="100%" style="stop-color:rgba(10,10,25,0.88)"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#darkOv)"/>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="8" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <text x="540" y="150" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="56" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="14">SGAS</text>
  <text x="540" y="190" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.4)" text-anchor="middle" letter-spacing="4">STUDENT GROUP OF ACTUARIAL SCIENCE</text>
  <rect x="460" y="215" width="160" height="3" fill="${C.red}"/>
  ${textEl(titleLines, 540, 300, 56, 42, 'white', 'bold')}
  <rect x="490" y="${300 + titleBlockHeight + 12}" width="100" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/>
  ${textEl(bodyLines, 540, 300 + titleBlockHeight + 55, 40, 24, 'rgba(255,255,255,0.8)')}
  <rect x="0" y="${H - 100}" width="${W}" height="100" fill="rgba(0,0,0,0.4)"/>
  <rect x="470" y="${H - 95}" width="140" height="80" fill="rgba(0,0,0,0)"/>
  <text x="540" y="${H - 20}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.35)" text-anchor="middle">@SGAS.CU  •  Cairo University</text>
</svg>`;

    case 'bottom-strip':
      return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="${H - 500}" width="${W}" height="500" fill="rgba(255,255,255,0.93)"/>
  <rect x="0" y="${H - 500}" width="${W}" height="5" fill="${C.green}"/>
  <text x="540" y="${H - 430}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="40" font-weight="bold" fill="${C.darkGreen}" text-anchor="middle" letter-spacing="8">SGAS</text>
  ${textEl(titleLines, 540, H - 370, 54, 38, C.darkText, 'bold')}
  <rect x="470" y="${H - 370 + titleBlockHeight + 10}" width="140" height="4" rx="2" fill="${C.green}"/>
  ${textEl(bodyLines, 540, H - 370 + titleBlockHeight + 50, 38, 22, C.bodyText)}
  <rect x="0" y="${H - 80}" width="${W}" height="80" fill="rgba(0,0,0,0.04)"/>
  <rect x="470" y="${H - 75}" width="140" height="60" fill="rgba(0,0,0,0)"/>
  <text x="540" y="${H - 15}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="12" fill="${C.subText}" text-anchor="middle">@SGAS.CU  •  Cairo University</text>
</svg>`;

    case 'split':
      return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="580" height="${H}" fill="rgba(255,255,255,0.94)"/>
  <rect x="576" y="0" width="4" height="${H}" fill="${C.navy}"/>
  <text x="290" y="120" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="36" font-weight="bold" fill="${C.navy}" text-anchor="middle" letter-spacing="6">SGAS</text>
  <text x="290" y="150" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="11" fill="${C.subText}" text-anchor="middle" letter-spacing="2">ACTUARIAL SCIENCE • CAIRO UNIVERSITY</text>
  ${textEl(titleLines, 290, 250, 54, 36, C.darkText, 'bold')}
  <rect x="210" y="${250 + titleBlockHeight + 10}" width="160" height="4" rx="2" fill="${C.navy}"/>
  ${textEl(bodyLines, 290, 250 + titleBlockHeight + 50, 38, 22, C.bodyText)}
  <rect x="220" y="${H - 100}" width="140" height="80" fill="rgba(0,0,0,0)"/>
  <text x="290" y="${H - 25}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="12" fill="${C.subText}" text-anchor="middle">@SGAS.CU</text>
</svg>`;

    default:
      return makeOverlaySVG(title, body, STYLES['gradient'], hasAIImage);
  }
}

const LOGO_POS: Record<string, { x: number; y: number; size: number }> = {
  'gradient':   { x: 470, y: H - 100, size: 80 },
  'geometric':  { x: 470, y: H - 195, size: 60 },
  'dark':       { x: 470, y: H - 95, size: 70 },
  'nature':     { x: 470, y: H - 75, size: 50 },
  'corporate':  { x: 220, y: H - 100, size: 60 },
};

export async function GET() {
  return NextResponse.json({
    styles: Object.values(STYLES).map(s => ({
      id: s.id,
      name: s.name,
      nameAr: s.nameAr,
    })),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { topic, caption, styleId = 'gradient' } = await request.json();

    if (!topic && !caption) {
      return NextResponse.json({ error: 'Topic or caption is required' }, { status: 400 });
    }

    const style = STYLES[styleId] || STYLES['gradient'];
    const title = topic || 'SGAS';
    const body = caption || '';

    let bgBuffer: Buffer;
    let hasAIImage = false;

    try {
      const bgPrompt = `${style.prompt}. Professional, high quality, 4K resolution, clean aesthetic.`;
      bgBuffer = await generateAIBackground(bgPrompt);
      hasAIImage = true;
    } catch (aiErr) {
      console.warn('AI background failed, using fallback:', aiErr);
      const fallbackSVG = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fbg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${C.red}"/>
            <stop offset="50%" style="stop-color:${C.darkRed}"/>
            <stop offset="100%" style="stop-color:${C.darkNavy}"/>
          </linearGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="url(#fbg)"/>
      </svg>`;
      bgBuffer = Buffer.from(fallbackSVG);
    }

    const overlaySVG = makeOverlaySVG(title, body, style, hasAIImage);
    const overlayBuffer = Buffer.from(overlaySVG);

    let pipeline = sharp(bgBuffer).resize(W, H, { fit: 'fill' });

    const overlayImg = await sharp(overlayBuffer, { density: 150 })
      .resize(W, H, { fit: 'fill' })
      .png()
      .toBuffer();

    pipeline = pipeline.composite([{ input: overlayImg }]);

    try {
      let logoBuffer: Buffer | null = null;
      try {
        logoBuffer = await readFile(path.join(process.cwd(), 'public', 'sgas-logo.png'));
      } catch {
        const res = await fetch('https://sgas-website.vercel.app/sgas-logo.png', { signal: AbortSignal.timeout(5000) });
        if (res.ok) logoBuffer = Buffer.from(await res.arrayBuffer());
      }

      if (logoBuffer) {
        const pos = LOGO_POS[styleId] || LOGO_POS['gradient'];
        const resizedLogo = await sharp(logoBuffer)
          .resize(pos.size, pos.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();

        pipeline = pipeline.composite([{ input: resizedLogo, left: pos.x, top: pos.y }]);
      }
    } catch (logoErr) {
      console.warn('Logo overlay failed:', logoErr);
    }

    const outputBuffer = await pipeline.png().toBuffer();
    const base64 = outputBuffer.toString('base64');

    return NextResponse.json({
      image: base64,
      success: true,
      style: styleId,
      hasAIImage,
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
