import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

const W = 1080;
const H = 1080;

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrap(text: string, max: number): string[] {
  if (!text) return [];
  const lines: string[] = [];
  for (const para of text.split(/\n+/)) {
    const t = para.trim();
    if (!t) continue;
    const words = t.split(/\s+/);
    let line = '';
    for (const w of words) {
      if (!w) continue;
      if (line.length + w.length + 1 > max && line) { lines.push(line); line = w; }
      else line = line ? line + ' ' + w : w;
    }
    if (line) lines.push(line);
  }
  return lines;
}

function cut(lines: string[], n: number): string[] {
  if (lines.length <= n) return lines;
  const r = lines.slice(0, n);
  r[n - 1] = r[n - 1].length > 3 ? r[n - 1].slice(0, -3) + '...' : r[n - 1];
  return r;
}

function txt(lines: string[], x: number, y: number, lh: number, fs: number, fill: string, bold: boolean = false, anchor: string = 'middle'): string {
  const font = `font-family="Arial, Helvetica, DejaVu Sans, sans-serif" font-size="${fs}" fill="${fill}" text-anchor="${anchor}"${bold ? ' font-weight="bold"' : ''}`;
  return lines.map((l, i) => `<text x="${x}" y="${y + i * lh}" ${font}>${esc(l)}</text>`).join('\n    ');
}

function generatePoster(title: string, body: string, styleId: string): string {
  const titleLines = cut(wrap(title, 20), 3);
  const bodyLines = cut(wrap(body, 34), 5);
  const th = titleLines.length * 56;

  const configs: Record<string, {
    headerBg: string; headerH: number;
    titleColor: string; titleY: number; titleLh: number; titleFs: number;
    bodyColor: string; bodyY: number; bodyLh: number; bodyFs: number;
    accentColor: string; accentY: number;
    logoY: number;
  }> = {
    'gradient': {
      headerBg: 'linear-gradient(135deg, #B71C1C 0%, #8B0000 50%, #0D47A1 100%)',
      headerH: 260,
      titleColor: '#1A1A1A', titleY: 340, titleLh: 56, titleFs: 40,
      bodyColor: '#424242', bodyY: 340 + 3 * 56 + 40, bodyLh: 38, bodyFs: 22,
      accentColor: '#B71C1C', accentY: 340 + 3 * 56 + 20,
      logoY: 940,
    },
    'geometric': {
      headerBg: 'linear-gradient(180deg, #0D47A1 0%, #082B5E 100%)',
      headerH: 300,
      titleColor: '#1A1A1A', titleY: 370, titleLh: 56, titleFs: 40,
      bodyColor: '#424242', bodyY: 370 + 3 * 56 + 40, bodyLh: 38, bodyFs: 22,
      accentColor: '#0D47A1', accentY: 370 + 3 * 56 + 20,
      logoY: 940,
    },
    'dark': {
      headerBg: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
      headerH: 320,
      titleColor: '#FFFFFF', titleY: 390, titleLh: 56, titleFs: 40,
      bodyColor: '#E0E0E0', bodyY: 390 + 3 * 56 + 40, bodyLh: 38, bodyFs: 22,
      accentColor: '#E53935', accentY: 390 + 3 * 56 + 20,
      logoY: 940,
    },
    'nature': {
      headerBg: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
      headerH: 250,
      titleColor: '#1A1A1A', titleY: 330, titleLh: 56, titleFs: 40,
      bodyColor: '#424242', bodyY: 330 + 3 * 56 + 40, bodyLh: 38, bodyFs: 22,
      accentColor: '#2E7D32', accentY: 330 + 3 * 56 + 20,
      logoY: 940,
    },
    'corporate': {
      headerBg: 'linear-gradient(135deg, #B71C1C 0%, #0D47A1 100%)',
      headerH: 280,
      titleColor: '#1A1A1A', titleY: 360, titleLh: 56, titleFs: 40,
      bodyColor: '#424242', bodyY: 360 + 3 * 56 + 40, bodyLh: 38, bodyFs: 22,
      accentColor: '#0D47A1', accentY: 360 + 3 * 56 + 20,
      logoY: 940,
    },
  };

  const c = configs[styleId] || configs['gradient'];

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#B71C1C"/>
      <stop offset="100%" style="stop-color:#0D47A1"/>
    </linearGradient>
  </defs>

  <!-- White background (like SGAS logo background) -->
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>

  <!-- Header -->
  <rect width="${W}" height="${c.headerH}" fill="url(#hg)"/>

  <!-- Header decorative circles -->
  <circle cx="100" cy="180" r="180" fill="rgba(255,255,255,0.04)"/>
  <circle cx="980" cy="40" r="120" fill="rgba(255,255,255,0.06)"/>
  <circle cx="900" cy="200" r="80" fill="rgba(255,255,255,0.03)"/>

  <!-- SGAS text in header -->
  <text x="540" y="120" font-family="Arial, Helvetica, DejaVu Sans, sans-serif" font-size="52" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="12">SGAS</text>
  <text x="540" y="165" font-family="Arial, Helvetica, DejaVu Sans, sans-serif" font-size="14" fill="rgba(255,255,255,0.7)" text-anchor="middle" letter-spacing="3">STUDENT GROUP OF ACTUARIAL SCIENCE</text>
  <line x1="440" y1="190" x2="640" y2="190" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>

  <!-- Title -->
  ${txt(titleLines, 540, c.titleY, c.titleLh, c.titleFs, c.titleColor, true)}

  <!-- Accent bar -->
  <rect x="440" y="${c.accentY}" width="200" height="4" rx="2" fill="${c.accentColor}"/>

  <!-- Body / Caption -->
  ${txt(bodyLines, 540, c.bodyY, c.bodyLh, c.bodyFs, c.bodyColor)}

  <!-- Footer -->
  <rect x="0" y="${H - 100}" width="${W}" height="100" fill="#FAFAFA"/>
  <line x1="0" y1="${H - 100}" x2="${W}" y2="${H - 100}" stroke="#E0E0E0" stroke-width="1"/>

  <!-- Footer text -->
  <text x="540" y="${H - 35}" font-family="Arial, Helvetica, DejaVu Sans, sans-serif" font-size="13" fill="#9E9E9E" text-anchor="middle" letter-spacing="1">@SGAS.CU  •  Cairo University</text>
</svg>`;
}

export async function GET() {
  return NextResponse.json({
    styles: [
      { id: 'gradient', name: 'Classic Red-Blue', nameAr: 'كلاسيك' },
      { id: 'geometric', name: 'Navy Blue', nameAr: 'أزرق' },
      { id: 'dark', name: 'Dark Mode', nameAr: 'داكن' },
      { id: 'nature', name: 'Green', nameAr: 'أخضر' },
      { id: 'corporate', name: 'Corporate Mix', nameAr: 'كوربوريت' },
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const { topic, caption, styleId = 'gradient' } = await request.json();

    if (!topic && !caption) {
      return NextResponse.json({ error: 'Topic or caption is required' }, { status: 400 });
    }

    const title = topic || 'SGAS';
    const body = caption || '';

    // Step 1: Generate poster SVG
    const svgString = generatePoster(title, body, styleId);
    const svgBuffer = Buffer.from(svgString);

    // Step 2: Convert SVG to PNG
    let pipeline = sharp(svgBuffer, { density: 150 })
      .resize(W, H, { fit: 'fill' });

    // Step 3: Add SGAS logo
    try {
      let logoBuffer: Buffer | null = null;
      try {
        logoBuffer = await readFile(path.join(process.cwd(), 'public', 'sgas-logo.png'));
      } catch {
        try {
          const res = await fetch('https://sgas-website.vercel.app/sgas-logo.png', { signal: AbortSignal.timeout(5000) });
          if (res.ok) logoBuffer = Buffer.from(await res.arrayBuffer());
        } catch {}
      }

      if (logoBuffer) {
        const resizedLogo = await sharp(logoBuffer)
          .resize(90, 90, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();

        pipeline = pipeline.composite([{
          input: resizedLogo,
          left: 495,
          top: 950,
        }]);
      }
    } catch (logoErr) {
      console.warn('Logo failed:', logoErr);
    }

    // Step 4: Output PNG
    const outputBuffer = await pipeline.png().toBuffer();
    const base64 = outputBuffer.toString('base64');

    return NextResponse.json({ image: base64, success: true, style: styleId });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate image' }, { status: 500 });
  }
}
