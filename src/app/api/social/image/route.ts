import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

const W = 1080;
const H = 1080;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

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

/* ══════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════ */

interface TextBlock {
  type: 'text';
  lines: string[];
  x: number; y: number;
  lineHeight: number;
  fontSize: number;
  fontWeight: string;
  fill: string;
  anchor: string;
}

interface DividerRect {
  type: 'divider';
  x: number; y: number;
  width: number; height: number;
  color: string;
  radius: number;
}

type TextItem = TextBlock | DividerRect;

interface LogoSpot { cx: number; cy: number; d: number; }

interface TemplateResult {
  bgSvg: string;
  items: TextItem[];
}

/* ══════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════════════
   AI: EXTRACT POSTER TEXT VIA GROQ
   ══════════════════════════════════════════════════════════════ */

async function extractPosterText(caption: string, topic: string) {
  if (!GROQ_API_KEY) return { title: topic || 'SGAS', body: caption ? [caption.slice(0, 120)] : [] };
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
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

/* ══════════════════════════════════════════════════════════════
   LOGO SYSTEM
   ══════════════════════════════════════════════════════════════ */

async function loadLogo(): Promise<Buffer | null> {
  try { return await readFile(path.join(process.cwd(), 'public', 'sgas-logo.png')); } catch {}
  try {
    const r = await fetch('https://sgas-website.vercel.app/sgas-logo.png', { signal: AbortSignal.timeout(5000) });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
  } catch {}
  return null;
}

async function makeCircularLogo(raw: Buffer, diameter: number): Promise<Buffer> {
  // Use 80% of diameter for actual logo content → prevents cropping
  const innerD = Math.round(diameter * 0.78);
  const offset = Math.round((diameter - innerD) / 2);

  const mask = Buffer.from(
    `<svg width="${diameter}" height="${diameter}"><circle cx="${diameter / 2}" cy="${diameter / 2}" r="${diameter / 2}"/></svg>`
  );

  const logoInner = await sharp(raw)
    .resize(innerD, innerD, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const padded = await sharp({
    create: { width: diameter, height: diameter, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: logoInner, left: offset, top: offset }])
    .png()
    .toBuffer();

  return sharp(padded)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/* ══════════════════════════════════════════════════════════════
   TEMPLATES — background shapes only, NO text in SVG
   Text layout returned as data for frontend Canvas rendering
   ══════════════════════════════════════════════════════════════ */

// ── 1. Geometric Overlap ──────────────────────────────────────
function tplGeometric(title: string, body: string[]): TemplateResult {
  const tl = wrapText(title, 20).slice(0, 3);
  const bl = body.flatMap(b => wrapText(b, 38)).slice(0, 5);
  const th = tl.length * 56;
  const by = 540 + th;

  const bgSvg = `
    <rect width="${W}" height="${H}" fill="${C.cream}"/>
    <circle cx="120" cy="140" r="200" fill="${C.red}" opacity="0.08"/>
    <circle cx="960" cy="450" r="250" fill="${C.navy}" opacity="0.06"/>
    <circle cx="540" cy="980" r="225" fill="${C.green}" opacity="0.07"/>
    <circle cx="880" cy="780" r="100" fill="${C.red}" opacity="0.1"/>
    <circle cx="200" cy="850" r="80" fill="${C.navy}" opacity="0.06"/>
    <rect x="780" y="80" width="50" height="50" rx="10" fill="${C.red}" opacity="0.15" transform="rotate(15 805 105)"/>
    <rect x="100" y="800" width="35" height="35" rx="7" fill="${C.navy}" opacity="0.12" transform="rotate(-20 117 817)"/>
    <rect x="700" y="650" width="25" height="25" rx="5" fill="${C.green}" opacity="0.1" transform="rotate(30 712 662)"/>
    <rect x="80" y="200" width="${W - 160}" height="680" rx="24" fill="white" opacity="0.9"/>
    <circle cx="${W - 65}" cy="65" r="55" fill="rgba(255,255,255,0.6)" stroke="${C.midGray}" stroke-width="1"/>
    <circle cx="65" cy="${H - 65}" r="40" fill="rgba(255,255,255,0.6)" stroke="${C.midGray}" stroke-width="1"/>
  `;

  const items: TextItem[] = [
    { type: 'text', lines: tl, x: W / 2, y: 360, lineHeight: 56, fontSize: 42, fontWeight: 'bold', fill: C.darkText, anchor: 'middle' },
    { type: 'divider', x: W / 2 - 50, y: 360 + th + 16, width: 100, height: 5, color: C.red, radius: 3 },
    { type: 'text', lines: bl, x: W / 2, y: by + 30, lineHeight: 38, fontSize: 22, fontWeight: 'normal', fill: C.bodyText, anchor: 'middle' },
    { type: 'text', lines: ['@SGAS.CU  \u2022  Cairo University'], x: W / 2, y: H - 45, lineHeight: 20, fontSize: 13, fontWeight: 'normal', fill: C.subText, anchor: 'middle' },
  ];

  return { bgSvg, items };
}

// ── 2. Diagonal Split ─────────────────────────────────────────
function tplDiagonal(title: string, body: string[]): TemplateResult {
  const tl = wrapText(title, 18).slice(0, 3);
  const bl = body.flatMap(b => wrapText(b, 34)).slice(0, 5);
  const th = tl.length * 54;
  const by = 340 + th;

  const bgSvg = `
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
    <rect x="65" y="165" width="${W - 110}" height="740" rx="24" fill="rgba(0,0,0,0.15)"/>
    <rect x="55" y="155" width="${W - 110}" height="740" rx="24" fill="white"/>
    <circle cx="80" cy="80" r="45" fill="rgba(255,255,255,0.12)"/>
    <circle cx="${W - 60}" cy="${H - 60}" r="40" fill="rgba(255,255,255,0.12)"/>
  `;

  const items: TextItem[] = [
    { type: 'text', lines: [ORG_NAME], x: W - 50, y: 85, lineHeight: 20, fontSize: 12, fontWeight: 'normal', fill: 'rgba(255,255,255,0.5)', anchor: 'end' },
    { type: 'text', lines: tl, x: W / 2, y: 290, lineHeight: 54, fontSize: 40, fontWeight: 'bold', fill: C.darkText, anchor: 'middle' },
    { type: 'divider', x: W / 2 - 40, y: 290 + th + 12, width: 80, height: 4, color: C.green, radius: 2 },
    { type: 'text', lines: bl, x: W / 2, y: by + 20, lineHeight: 36, fontSize: 21, fontWeight: 'normal', fill: C.bodyText, anchor: 'middle' },
    { type: 'text', lines: ['@SGAS.CU  \u2022  Cairo University'], x: 80, y: H - 55, lineHeight: 20, fontSize: 12, fontWeight: 'normal', fill: 'rgba(255,255,255,0.4)', anchor: 'start' },
  ];

  return { bgSvg, items };
}

// ── 3. Green Nature ──────────────────────────────────────────
function tplNature(title: string, body: string[]): TemplateResult {
  const tl = wrapText(title, 20).slice(0, 3);
  const bl = body.flatMap(b => wrapText(b, 36)).slice(0, 5);
  const th = tl.length * 52;

  const bgSvg = `
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
    <circle cx="${W / 2}" cy="130" r="55" fill="white" opacity="0.9"/>
    <circle cx="${W - 65}" cy="${H - 65}" r="32" fill="white" stroke="${C.green}" stroke-width="2" opacity="0.7"/>
  `;

  const items: TextItem[] = [
    { type: 'text', lines: [ORG_NAME], x: W / 2, y: 240, lineHeight: 20, fontSize: 13, fontWeight: 'normal', fill: 'rgba(255,255,255,0.7)', anchor: 'middle' },
    { type: 'text', lines: tl, x: W / 2, y: 430, lineHeight: 52, fontSize: 40, fontWeight: 'bold', fill: C.darkGreen, anchor: 'middle' },
    { type: 'divider', x: W / 2 - 40, y: 430 + th + 14, width: 80, height: 4, color: C.green, radius: 2 },
    { type: 'text', lines: bl, x: W / 2, y: 430 + th + 50, lineHeight: 36, fontSize: 22, fontWeight: 'normal', fill: C.bodyText, anchor: 'middle' },
    { type: 'text', lines: ['@SGAS.CU  \u2022  Cairo University'], x: W / 2, y: H - 28, lineHeight: 20, fontSize: 12, fontWeight: 'normal', fill: C.subText, anchor: 'middle' },
  ];

  return { bgSvg, items };
}

// ── 4. Dark Premium ──────────────────────────────────────────
function tplDark(title: string, body: string[]): TemplateResult {
  const tl = wrapText(title, 18).slice(0, 3);
  const bl = body.flatMap(b => wrapText(b, 32)).slice(0, 4);
  const th = tl.length * 56;

  const bgSvg = `
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
    <circle cx="${W / 2}" cy="85" r="42" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <circle cx="55" cy="${H - 55}" r="38" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  `;

  const items: TextItem[] = [
    { type: 'text', lines: [ORG_NAME], x: W / 2, y: 195, lineHeight: 20, fontSize: 14, fontWeight: 'normal', fill: 'rgba(255,255,255,0.35)', anchor: 'middle' },
    { type: 'text', lines: tl, x: W / 2, y: 300, lineHeight: 56, fontSize: 42, fontWeight: 'bold', fill: 'white', anchor: 'middle' },
    { type: 'divider', x: W / 2 - 50, y: 300 + th + 18, width: 100, height: 4, color: C.red, radius: 2 },
    { type: 'text', lines: bl, x: W / 2, y: 300 + th + 55, lineHeight: 36, fontSize: 22, fontWeight: 'normal', fill: 'rgba(255,255,255,0.7)', anchor: 'middle' },
    { type: 'text', lines: ['@SGAS.CU  \u2022  Cairo University'], x: W / 2, y: H - 28, lineHeight: 20, fontSize: 12, fontWeight: 'normal', fill: 'rgba(255,255,255,0.25)', anchor: 'middle' },
  ];

  return { bgSvg, items };
}

// ── 5. Corporate Split ───────────────────────────────────────
function tplCorporate(title: string, body: string[]): TemplateResult {
  const tl = wrapText(title, 17).slice(0, 3);
  const bl = body.flatMap(b => wrapText(b, 32)).slice(0, 5);
  const th = tl.length * 50;

  const bgSvg = `
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
    <circle cx="190" cy="410" r="10" fill="${C.green}"/>
    <rect x="425" y="85" width="590" height="840" rx="20" fill="rgba(0,0,0,0.06)"/>
    <rect x="420" y="80" width="590" height="840" rx="20" fill="white"/>
    <circle cx="${W - 55}" cy="${H - 55}" r="38" fill="${C.lightGray}" opacity="0.5"/>
  `;

  const items: TextItem[] = [
    { type: 'text', lines: ['SGAS'], x: 190, y: 350, lineHeight: 40, fontSize: 32, fontWeight: '900', fill: 'rgba(255,255,255,0.9)', anchor: 'middle' },
    { type: 'text', lines: ['ACTUARIAL SCIENCE'], x: 190, y: 380, lineHeight: 20, fontSize: 10, fontWeight: 'normal', fill: 'rgba(255,255,255,0.4)', anchor: 'middle' },
    { type: 'text', lines: ['FEATURED POST'], x: 715, y: 170, lineHeight: 20, fontSize: 12, fontWeight: 'normal', fill: C.subText, anchor: 'middle' },
    { type: 'text', lines: tl, x: 715, y: 240, lineHeight: 50, fontSize: 36, fontWeight: 'bold', fill: C.darkText, anchor: 'middle' },
    { type: 'divider', x: 685, y: 240 + th + 12, width: 60, height: 4, color: C.navy, radius: 2 },
    { type: 'text', lines: bl, x: 715, y: 240 + th + 45, lineHeight: 34, fontSize: 20, fontWeight: 'normal', fill: C.bodyText, anchor: 'middle' },
    { type: 'text', lines: ['@SGAS.CU  \u2022  Cairo University'], x: 670, y: H - 40, lineHeight: 20, fontSize: 12, fontWeight: 'normal', fill: C.subText, anchor: 'middle' },
  ];

  return { bgSvg, items };
}

/* ══════════════════════════════════════════════════════════════
   REGISTRY
   ══════════════════════════════════════════════════════════════ */

const TEMPLATES: Record<string, (t: string, b: string[]) => TemplateResult> = {
  geometric: tplGeometric,
  diagonal: tplDiagonal,
  nature: tplNature,
  dark: tplDark,
  corporate: tplCorporate,
};

// Logo spots — placed inside the circles drawn in each template's bgSvg
const LOGO_SPOTS: Record<string, LogoSpot[]> = {
  geometric: [
    { cx: W - 65, cy: 65, d: 100 },
    { cx: 65, cy: H - 65, d: 72 },
  ],
  diagonal: [
    { cx: 80, cy: 80, d: 82 },
    { cx: W - 60, cy: H - 60, d: 72 },
  ],
  nature: [
    { cx: W / 2, cy: 130, d: 100 },
    { cx: W - 65, cy: H - 65, d: 58 },
  ],
  dark: [
    { cx: W / 2, cy: 85, d: 78 },
    { cx: 55, cy: H - 55, d: 70 },
  ],
  corporate: [
    { cx: 190, cy: 580, d: 100 },
    { cx: W - 55, cy: H - 55, d: 70 },
  ],
};

/* ══════════════════════════════════════════════════════════════
   GET: STYLE LIST
   ══════════════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════════════
   POST: GENERATE POSTER
   Returns background PNG + logo PNG + text layout data
   Frontend renders text via Canvas API
   ══════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic = body.topic || '';
    const caption = body.caption || '';
    const styleId = body.templateId || body.styleId || 'geometric';
    const customBackground = body.customBackground || null;

    if (!topic && !caption) {
      return NextResponse.json({ error: 'Topic or caption is required' }, { status: 400 });
    }

    const { title, body: posterBody } = await extractPosterText(caption, topic);

    const templateFn = TEMPLATES[styleId] || TEMPLATES['geometric'];
    const result = templateFn(title, posterBody);

    // ── Background PNG ──
    let bgBuffer: Buffer;
    const svgStr = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${result.bgSvg}</svg>`;

    if (customBackground) {
      try {
        let bgImageBuf: Buffer;
        if (customBackground.startsWith('data:')) {
          const base64Data = customBackground.replace(/^data:image\/\w+;base64,/, '');
          bgImageBuf = Buffer.from(base64Data, 'base64');
        } else {
          const r = await fetch(customBackground, { signal: AbortSignal.timeout(15000) });
          if (!r.ok) throw new Error('Failed to fetch custom background');
          bgImageBuf = Buffer.from(await r.arrayBuffer());
        }
        bgBuffer = await sharp(bgImageBuf).resize(W, H, { fit: 'cover' }).png().toBuffer();
        const overlayColor = styleId === 'dark' ? 'rgba(10,10,20,0.55)' : 'rgba(255,255,255,0.65)';
        const overlaySvg = `<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${overlayColor}"/></svg>`;
        const overlayBuf = await sharp(Buffer.from(overlaySvg)).png().toBuffer();
        bgBuffer = await sharp(bgBuffer).composite([{ input: overlayBuf }]).png().toBuffer();
      } catch {
        bgBuffer = await sharp(Buffer.from(svgStr)).resize(W, H).png().toBuffer();
      }
    } else {
      bgBuffer = await sharp(Buffer.from(svgStr)).resize(W, H).png().toBuffer();
    }

    // ── Circular Logo PNG (with padding to prevent cropping) ──
    const logoRaw = await loadLogo();
    let logoBuffer: Buffer | null = null;
    if (logoRaw) {
      logoBuffer = await makeCircularLogo(logoRaw, 200);
    }

    const spots = LOGO_SPOTS[styleId] || LOGO_SPOTS['geometric'];

    return NextResponse.json({
      background: bgBuffer.toString('base64'),
      logo: logoBuffer ? logoBuffer.toString('base64') : null,
      logoSpots: spots,
      textItems: result.items,
      posterTitle: title,
      posterBody: posterBody,
      success: true,
      style: styleId,
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate image' }, { status: 500 });
  }
}
