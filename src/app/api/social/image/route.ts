import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

const W = 1080;
const H = 1080;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// SGAS Brand Colors
const C = {
  red: '#B71C1C', darkRed: '#8B0000',
  green: '#2E7D32', darkGreen: '#1B5E20',
  navy: '#0D47A1', darkNavy: '#082B5E',
  white: '#FFFFFF', cream: '#FFF8E1',
  offWhite: '#FAFAFA', lightGray: '#F0F0F0',
  midGray: '#E0E0E0', darkText: '#111111',
  bodyText: '#333333', subText: '#777777',
};

const ORG_NAME = 'STRIVE AND GROW IN ACTUARIAL SCIENCE';

// ── AI: Extract poster text ────────────────────────────────

async function extractPosterText(caption: string, topic: string) {
  if (!GROQ_API_KEY) return { title: topic || 'SGAS', body: caption ? [caption.slice(0, 120)] : [] };
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: `Extract poster text. Rules:
1. Extract ONLY the most impactful catchy lines
2. ALWAYS translate to ENGLISH even if caption is Arabic
3. Title: 1 short phrase (max 8 words)
4. Body: 2-3 short powerful lines (max 12 words each)
5. Remove emojis, hashtags, @mentions
6. Return ONLY valid JSON: {"title":"...","body":["line1","line2","line3"]}` },
          { role: 'user', content: `Topic: ${topic}\nCaption: ${caption}` }
        ],
        temperature: 0.7, max_tokens: 300,
      }),
    });
    if (!res.ok) throw new Error('Groq failed');
    const data = await res.json();
    const content = data.choices[0]?.message?.content || '';
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON');
    const p = JSON.parse(match[0]);
    return { title: p.title || topic || 'SGAS', body: Array.isArray(p.body) ? p.body : [] };
  } catch {
    return { title: topic || 'SGAS', body: caption ? caption.split('\n').filter(l => l.trim()).slice(0, 3) : [] };
  }
}

// ── SVG Helpers ────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapText(text: string, max: number): string[] {
  if (!text) return [];
  const lines: string[] = [];
  for (const para of text.split(/\n+/)) {
    const t = para.trim(); if (!t) continue;
    const words = t.split(/\s+/); let line = '';
    for (const w of words) {
      if (!w) continue;
      if (line.length + w.length + 1 > max && line) { lines.push(line); line = w; }
      else line = line ? line + ' ' + w : w;
    }
    if (line) lines.push(line);
  }
  return lines;
}

function txt(lines: string[], x: number, y: number, lh: number, fs: number, fill: string, weight: string = 'normal', anchor: string = 'middle'): string {
  return lines.map((line, i) =>
    `<text x="${x}" y="${y + i * lh}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="${fs}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(line)}</text>`
  ).join('\n    ');
}

// ── Logo Loader ───────────────────────────────────────────

async function loadLogo(): Promise<Buffer | null> {
  try { return await readFile(path.join(process.cwd(), 'public', 'sgas-logo.png')); } catch {}
  try {
    const r = await fetch('https://sgas-website.vercel.app/sgas-logo.png', { signal: AbortSignal.timeout(5000) });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
  } catch {}
  return null;
}

// ── Template Layer Interface ──────────────────────────────
// Each template returns { bg, text } where each is inner SVG content (without <svg> wrapper)

interface TemplateParts { bg: string; text: string; }

interface LogoPos { x: number; y: number; size: number; }

// ── Template 1: Geometric Overlap ──────────────────────────

function tplGeometric(title: string, body: string[]): TemplateParts {
  const tl = wrapText(title, 20).slice(0, 3);
  const bl = body.flatMap(b => wrapText(b, 38)).slice(0, 5);
  const th = tl.length * 56;
  const by = 540 + th;

  const bg = `
    <rect width="${W}" height="${H}" fill="${C.cream}"/>
    <circle cx="120" cy="140" r="200" fill="${C.red}" opacity="0.08"/>
    <circle cx="960" cy="450" r="250" fill="${C.navy}" opacity="0.06"/>
    <circle cx="540" cy="980" r="225" fill="${C.green}" opacity="0.07"/>
    <circle cx="880" cy="780" r="100" fill="${C.red}" opacity="0.1"/>
    <circle cx="200" cy="850" r="80" fill="${C.navy}" opacity="0.06"/>
    <rect x="780" y="80" width="50" height="50" rx="10" fill="${C.red}" opacity="0.15" transform="rotate(15 805 105)"/>
    <rect x="100" y="800" width="35" height="35" rx="7" fill="${C.navy}" opacity="0.12" transform="rotate(-20 117 817)"/>
    <rect x="700" y="650" width="25" height="25" rx="5" fill="${C.green}" opacity="0.1" transform="rotate(30 712 662)"/>
    <rect x="${W - 165}" y="20" width="135" height="135" rx="22" fill="rgba(255,255,255,0.6)"/>
    <rect x="80" y="200" width="${W - 160}" height="680" rx="24" fill="white" opacity="0.9"/>
    <circle cx="65" cy="${H - 65}" r="40" fill="rgba(255,255,255,0.7)" stroke="${C.midGray}" stroke-width="1"/>
  `;

  const text = `
    ${txt(tl, W / 2, 360, 56, 42, C.darkText, 'bold')}
    <rect x="${W / 2 - 50}" y="${360 + th + 16}" width="100" height="5" rx="3" fill="${C.red}"/>
    ${txt(bl, W / 2, by + 30, 38, 22, C.bodyText)}
    <text x="${W / 2}" y="${H - 45}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="13" fill="${C.subText}" text-anchor="middle" letter-spacing="1">@SGAS.CU  &#x2022;  Cairo University</text>
  `;

  return { bg, text };
}

// ── Template 2: Diagonal Split ─────────────────────────────

function tplDiagonal(title: string, body: string[]): TemplateParts {
  const tl = wrapText(title, 18).slice(0, 3);
  const bl = body.flatMap(b => wrapText(b, 34)).slice(0, 5);
  const th = tl.length * 54;
  const by = 340 + th;

  const bg = `
    <defs>
      <linearGradient id="diagBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${C.red}"/>
        <stop offset="40%" style="stop-color:${C.darkRed}"/>
        <stop offset="100%" style="stop-color:${C.darkNavy}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#diagBg)"/>
    <circle cx="850" cy="200" r="125" fill="rgba(255,255,255,0.06)"/>
    <circle cx="200" cy="850" r="150" fill="rgba(255,255,255,0.04)"/>
    <circle cx="0" cy="500" r="90" fill="${C.green}" opacity="0.15"/>
    <rect x="30" y="30" width="100" height="100" rx="16" fill="rgba(255,255,255,0.15)"/>
    <rect x="65" y="165" width="${W - 110}" height="740" rx="24" fill="rgba(0,0,0,0.15)"/>
    <rect x="55" y="155" width="${W - 110}" height="740" rx="24" fill="white"/>
    <circle cx="${W - 80}" cy="${H - 80}" r="40" fill="rgba(255,255,255,0.12)"/>
  `;

  const text = `
    <text x="${W - 50}" y="85" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.5)" text-anchor="end" letter-spacing="3">${esc(ORG_NAME)}</text>
    ${txt(tl, W / 2, 290, 54, 40, C.darkText, 'bold')}
    <rect x="${W / 2 - 40}" y="${290 + th + 12}" width="80" height="4" rx="2" fill="${C.green}"/>
    ${txt(bl, W / 2, by + 20, 36, 21, C.bodyText)}
    <text x="80" y="${H - 55}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.4)" text-anchor="start" letter-spacing="1">@SGAS.CU  &#x2022;  Cairo University</text>
  `;

  return { bg, text };
}

// ── Template 3: Green Nature ──────────────────────────────

function tplNature(title: string, body: string[]): TemplateParts {
  const tl = wrapText(title, 20).slice(0, 3);
  const bl = body.flatMap(b => wrapText(b, 36)).slice(0, 5);
  const th = tl.length * 52;

  const bg = `
    <defs>
      <linearGradient id="greenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${C.green}"/>
        <stop offset="100%" style="stop-color:${C.darkGreen}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="${C.offWhite}"/>
    <rect x="0" y="0" width="${W}" height="360" fill="url(#greenGrad)"/>
    <ellipse cx="-30" cy="340" rx="200" ry="80" fill="${C.green}"/>
    <ellipse cx="${W + 50}" cy="345" rx="220" ry="90" fill="${C.green}"/>
    <circle cx="60" cy="60" r="30" fill="rgba(255,255,255,0.12)"/>
    <circle cx="900" cy="100" r="50" fill="rgba(255,255,255,0.08)"/>
    <circle cx="180" cy="${H - 120}" r="70" fill="${C.green}" opacity="0.06"/>
    <circle cx="${W / 2}" cy="130" r="60" fill="white"/>
    <circle cx="${W - 65}" cy="${H - 65}" r="32" fill="white" stroke="${C.green}" stroke-width="2" opacity="0.7"/>
  `;

  const text = `
    <text x="${W / 2}" y="240" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="13" fill="rgba(255,255,255,0.7)" text-anchor="middle" letter-spacing="4">${esc(ORG_NAME)}</text>
    ${txt(tl, W / 2, 430, 52, 40, C.darkGreen, 'bold')}
    <rect x="${W / 2 - 40}" y="${430 + th + 14}" width="80" height="4" rx="2" fill="${C.green}"/>
    ${txt(bl, W / 2, 430 + th + 50, 36, 22, C.bodyText)}
    <text x="${W / 2}" y="${H - 28}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="12" fill="${C.subText}" text-anchor="middle">@SGAS.CU  &#x2022;  Cairo University</text>
  `;

  return { bg, text };
}

// ── Template 4: Dark Premium ───────────────────────────────

function tplDark(title: string, body: string[]): TemplateParts {
  const tl = wrapText(title, 18).slice(0, 3);
  const bl = body.flatMap(b => wrapText(b, 32)).slice(0, 4);
  const th = tl.length * 56;

  const bg = `
    <defs>
      <linearGradient id="darkBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0F0F1A"/>
        <stop offset="40%" style="stop-color:#1A1A2E"/>
        <stop offset="100%" style="stop-color:#16213E"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#darkBg)"/>
    <circle cx="0" cy="280" r="175" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    <circle cx="${W}" cy="${H - 250}" r="200" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    <circle cx="820" cy="400" r="100" fill="rgba(183,28,28,0.08)"/>
    <rect x="${W - 50}" y="60" width="4" height="180" rx="2" fill="rgba(255,255,255,0.06)"/>
    <rect x="80" y="${H - 280}" width="4" height="140" rx="2" fill="rgba(46,125,50,0.1)"/>
    <rect x="0" y="0" width="120" height="4" fill="${C.red}"/>
    <rect x="0" y="0" width="4" height="120" fill="${C.red}"/>
    <rect x="${W - 120}" y="${H - 4}" width="120" height="4" fill="${C.navy}"/>
    <rect x="${W - 4}" y="${H - 120}" width="4" height="120" fill="${C.navy}"/>
    <rect x="${W / 2 - 60}" y="40" width="120" height="120" rx="20" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <rect x="40" y="${H - 85}" width="55" height="55" rx="12" fill="rgba(255,255,255,0.06)" opacity="0.6"/>
    <rect x="${W - 95}" y="${H - 85}" width="55" height="55" rx="12" fill="rgba(255,255,255,0.06)" opacity="0.6"/>
  `;

  const text = `
    <text x="${W / 2}" y="195" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.35)" text-anchor="middle" letter-spacing="4">${esc(ORG_NAME)}</text>
    ${txt(tl, W / 2, 300, 56, 42, 'white', 'bold')}
    <rect x="${W / 2 - 50}" y="${300 + th + 18}" width="100" height="4" rx="2" fill="${C.red}"/>
    ${txt(bl, W / 2, 300 + th + 55, 36, 22, 'rgba(255,255,255,0.7)')}
    <text x="${W / 2}" y="${H - 28}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.25)" text-anchor="middle">@SGAS.CU  &#x2022;  Cairo University</text>
  `;

  return { bg, text };
}

// ── Template 5: Corporate Split ────────────────────────────

function tplCorporate(title: string, body: string[]): TemplateParts {
  const tl = wrapText(title, 17).slice(0, 3);
  const bl = body.flatMap(b => wrapText(b, 32)).slice(0, 5);
  const th = tl.length * 50;

  const bg = `
    <defs>
      <linearGradient id="corpPanel" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${C.red}"/>
        <stop offset="100%" style="stop-color:${C.darkNavy}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="${C.lightGray}"/>
    <rect x="0" y="0" width="380" height="${H}" fill="url(#corpPanel)"/>
    <circle cx="380" cy="90" r="40" fill="${C.red}"/>
    <circle cx="190" cy="260" r="160" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <circle cx="190" cy="${H - 190}" r="130" fill="rgba(255,255,255,0.04)"/>
    <rect x="30" y="520" width="50" height="50" rx="10" fill="rgba(255,255,255,0.08)"/>
    <rect x="130" y="180" width="120" height="120" rx="24" fill="rgba(255,255,255,0.12)"/>
    <circle cx="190" cy="410" r="10" fill="${C.green}"/>
    <rect x="425" y="85" width="590" height="840" rx="20" fill="rgba(0,0,0,0.06)"/>
    <rect x="420" y="80" width="590" height="840" rx="20" fill="white"/>
    <circle cx="${W - 80}" cy="${H - 130}" r="28" fill="${C.lightGray}" opacity="0.5"/>
  `;

  const text = `
    <text x="190" y="350" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="32" font-weight="900" fill="rgba(255,255,255,0.9)" text-anchor="middle" letter-spacing="6">SGAS</text>
    <text x="190" y="380" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.4)" text-anchor="middle" letter-spacing="2">ACTUARIAL SCIENCE</text>
    <text x="715" y="170" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="12" fill="${C.subText}" text-anchor="middle" letter-spacing="3">FEATURED POST</text>
    ${txt(tl, 715, 240, 50, 36, C.darkText, 'bold')}
    <rect x="685" y="${240 + th + 12}" width="60" height="4" rx="2" fill="${C.navy}"/>
    ${txt(bl, 715, 240 + th + 45, 34, 20, C.bodyText)}
    <text x="670" y="${H - 40}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="12" fill="${C.subText}" text-anchor="middle">@SGAS.CU  &#x2022;  Cairo University</text>
  `;

  return { bg, text };
}

// ── Template Registry ──────────────────────────────────────

const TEMPLATES: Record<string, (title: string, body: string[]) => TemplateParts> = {
  'geometric': tplGeometric,
  'diagonal': tplDiagonal,
  'nature': tplNature,
  'dark': tplDark,
  'corporate': tplCorporate,
};

// Logo positions per template
const LOGO_POS: Record<string, LogoPos[]> = {
  'geometric': [
    { x: W - 155, y: 30, size: 110 },     // top-right big
    { x: 30, y: H - 110, size: 70 },       // bottom-left small
  ],
  'diagonal': [
    { x: 30, y: 30, size: 90 },            // top-left medium
    { x: W - 95, y: H - 95, size: 70 },    // bottom-right small
  ],
  'nature': [
    { x: W / 2 - 55, y: 70, size: 110 },   // top-center big
    { x: W - 80, y: H - 80, size: 55 },    // bottom-right small
  ],
  'dark': [
    { x: W / 2 - 60, y: 40, size: 120 },   // top-center big
    { x: 40, y: H - 80, size: 55 },        // bottom-left small
    { x: W - 95, y: H - 80, size: 55 },    // bottom-right small
  ],
  'corporate': [
    { x: 130, y: 180, size: 130 },          // left panel big
    { x: W - 80, y: H - 100, size: 55 },    // bottom-right small
  ],
};

// ── Render SVG string to PNG buffer ───────────────────────

async function svgToPng(svgStr: string, width = W, height = H): Promise<Buffer> {
  return sharp(Buffer.from(svgStr), { density: 150 })
    .resize(width, height, { fit: 'fill' })
    .png()
    .toBuffer();
}

// ── Build SVG from parts ──────────────────────────────────

function buildSvg(bg: string, text: string): string {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${bg}${text}</svg>`;
}

function buildBgOnly(bg: string): string {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${bg}</svg>`;
}

function buildTextOnly(text: string): string {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${text}</svg>`;
}

// ── GET: Return style list ────────────────────────────────

export async function GET() {
  return NextResponse.json({
    styles: [
      { id: 'geometric', name: 'Geometric Overlap', nameAr: 'هندسي', colors: ['#B71C1C', '#0D47A1', '#FFF8E1'] },
      { id: 'diagonal', name: 'Diagonal Card', nameAr: 'دياجونال', colors: ['#B71C1C', '#082B5E', '#FFFFFF'] },
      { id: 'nature', name: 'Green Nature', nameAr: 'طبيعي', colors: ['#2E7D32', '#FAFAFA', '#1B5E20'] },
      { id: 'dark', name: 'Dark Premium', nameAr: 'داكن فاخر', colors: ['#0F0F1A', '#B71C1C', '#0D47A1'] },
      { id: 'corporate', name: 'Corporate Split', nameAr: 'كوربوريت', colors: ['#B71C1C', '#0D47A1', '#F0F0F0'] },
    ],
  });
}

// ── POST: Generate poster with separate layers ────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic = body.topic || '';
    const caption = body.caption || '';
    const styleId = body.templateId || body.styleId || 'geometric';
    const customBackground = body.customBackground || null; // base64 data URI or URL

    if (!topic && !caption) {
      return NextResponse.json({ error: 'Topic or caption is required' }, { status: 400 });
    }

    // Step 1: Extract poster text
    const { title, body: posterBody } = await extractPosterText(caption, topic);

    // Step 2: Generate template layers
    const templateFn = TEMPLATES[styleId] || TEMPLATES['geometric'];
    const parts = templateFn(title, posterBody);

    let bgBuffer: Buffer;
    let textBuffer: Buffer;
    let fullBuffer: Buffer;

    // Step 3a: If custom background provided, use it instead of SVG bg
    if (customBackground) {
      try {
        let bgImageBuf: Buffer;
        if (customBackground.startsWith('data:')) {
          // base64 data URI
          const base64Data = customBackground.replace(/^data:image\/\w+;base64,/, '');
          bgImageBuf = Buffer.from(base64Data, 'base64');
        } else {
          // URL
          const r = await fetch(customBackground, { signal: AbortSignal.timeout(15000) });
          if (!r.ok) throw new Error('Failed to fetch custom background');
          bgImageBuf = Buffer.from(await r.arrayBuffer());
        }

        // Resize custom background
        bgBuffer = await sharp(bgImageBuf)
          .resize(W, H, { fit: 'cover' })
          .png()
          .toBuffer();

        // Add semi-transparent overlay on custom bg for readability
        const overlayColor = ['dark'].includes(styleId) ? 'rgba(10,10,20,0.55)' : 'rgba(255,255,255,0.65)';
        const overlaySvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="${overlayColor}"/></svg>`;
        const overlayBuf = await svgToPng(overlaySvg);
        bgBuffer = await sharp(bgBuffer).composite([{ input: overlayBuf }]).png().toBuffer();

      } catch (bgErr: any) {
        console.warn('Custom background failed, using default SVG bg:', bgErr.message);
        bgBuffer = await svgToPng(buildBgOnly(parts.bg));
      }
    } else {
      // Use SVG background
      bgBuffer = await svgToPng(buildBgOnly(parts.bg));
    }

    // Step 3b: Text layer (transparent PNG)
    textBuffer = await svgToPng(buildTextOnly(parts.text));

    // Step 3c: Full composite = bg + text
    fullBuffer = await sharp(bgBuffer).composite([{ input: textBuffer }]).png().toBuffer();

    // Step 4: Load logo and composite
    const logoRaw = await loadLogo();
    let logoLayer: Buffer | null = null;
    const positions = LOGO_POS[styleId] || LOGO_POS['geometric'];

    if (logoRaw) {
      // Create a clean logo layer (transparent bg, just the logo)
      const logoSize = 200;
      logoLayer = await sharp(logoRaw)
        .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      // Composite logos onto full image
      let pipeline = sharp(fullBuffer);
      for (const pos of positions) {
        try {
          const resized = await sharp(logoRaw)
            .resize(pos.size, pos.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
          pipeline = pipeline.composite([{ input: resized, left: pos.x, top: pos.y }]);
        } catch (e) {
          console.warn('Logo composite failed for position:', pos, e);
        }
      }
      fullBuffer = await pipeline.png().toBuffer();
    }

    return NextResponse.json({
      image: fullBuffer.toString('base64'),
      background: bgBuffer.toString('base64'),
      textLayer: textBuffer.toString('base64'),
      logo: logoLayer ? logoLayer.toString('base64') : null,
      success: true,
      style: styleId,
      posterTitle: title,
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
