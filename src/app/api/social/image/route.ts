import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';
import { createElement as h, type ReactNode } from 'react';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

const W = 1080;
const H = 1080;

// ── Font Cache ─────────────────────────────────────────────

interface FontEntry {
  name: string;
  data: ArrayBuffer;
  weight: number;
  style: string;
}

let cachedFonts: FontEntry[] | null = null;

async function loadFontFiles(family: string): Promise<ArrayBuffer[]> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${family}:wght@400;700&display=swap`;
  const css = await fetch(cssUrl).then(r => r.text());
  const urls = [...new Set([...css.matchAll(/url\((https?:\/\/[^)]+)\)/g)].map(m => m[1]))];
  return Promise.all(urls.map(u => fetch(u, { signal: AbortSignal.timeout(10000) }).then(r => r.arrayBuffer()).catch(() => null)));
}

async function getFonts(): Promise<FontEntry[]> {
  if (cachedFonts) return cachedFonts;

  try {
    const [interFiles, arabicFiles] = await Promise.all([
      loadFontFiles('Inter'),
      loadFontFiles('Noto+Sans+Arabic'),
    ]);

    cachedFonts = [
      ...interFiles.filter(Boolean).map(d => ({ name: 'Inter', data: d!, weight: 400, style: 'normal' })),
      ...arabicFiles.filter(Boolean).map(d => ({ name: 'Noto Sans Arabic', data: d!, weight: 400, style: 'normal' })),
    ];

    console.log(`Loaded ${cachedFonts.length} font files`);
  } catch (err) {
    console.warn('Font loading failed, using fallback:', err);
    cachedFonts = [];
  }

  return cachedFonts;
}

// ── Text Utils ─────────────────────────────────────────────

function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [];
  const lines: string[] = [];
  for (const para of text.split(/\n+/)) {
    const t = para.trim();
    if (!t) continue;
    const words = t.split(/\s+/);
    let line = '';
    for (const w of words) {
      if (!w) continue;
      if (line.length + w.length + 1 > maxChars && line) {
        lines.push(line);
        line = w;
      } else {
        line = line ? line + ' ' + w : w;
      }
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

// ── Styles ─────────────────────────────────────────────────

const STYLES: Record<string, { colors: string[]; accent: string }> = {
  'gradient':  { colors: ['#B71C1C', '#8B0000', '#0D47A1'], accent: '#B71C1C' },
  'navy':      { colors: ['#0D47A1', '#082B5E'], accent: '#0D47A1' },
  'dark':      { colors: ['#1A1A2E', '#16213E', '#0F3460'], accent: '#E53935' },
  'nature':    { colors: ['#2E7D32', '#1B5E20'], accent: '#2E7D32' },
  'corporate': { colors: ['#B71C1C', '#0D47A1'], accent: '#0D47A1' },
};

// ── GET: Styles list ───────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    styles: [
      { id: 'gradient', name: 'Classic Red-Blue', nameAr: 'كلاسيك' },
      { id: 'navy', name: 'Navy Blue', nameAr: 'أزرق' },
      { id: 'dark', name: 'Dark Mode', nameAr: 'داكن' },
      { id: 'nature', name: 'Green', nameAr: 'أخضر' },
      { id: 'corporate', name: 'Corporate Mix', nameAr: 'كوربوريت' },
    ],
  });
}

// ── POST: Generate poster ──────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { topic, caption, styleId = 'gradient' } = await request.json();

    if (!topic && !caption) {
      return NextResponse.json({ error: 'Topic or caption is required' }, { status: 400 });
    }

    const title = topic || 'SGAS';
    const body = caption || '';
    const style = STYLES[styleId] || STYLES['gradient'];
    const fonts = await getFonts();
    const fontFamily = fonts.length > 0
      ? "'Inter', 'Noto Sans Arabic', sans-serif"
      : "sans-serif";

    const titleLines = cut(wrapText(title, 20), 3);
    const bodyLines = cut(wrapText(body, 34), 5);

    // Build poster JSX using createElement
    const titleEls: ReactNode[] = titleLines.map((line, i) =>
      h('div', {
        key: 't' + i,
        style: {
          fontSize: '42px',
          fontWeight: '700' as const,
          color: '#1A1A1A',
          textAlign: 'center' as const,
          lineHeight: '1.3',
        },
      }, line)
    );

    const bodyEls: ReactNode[] = bodyLines.map((line, i) =>
      h('div', {
        key: 'b' + i,
        style: {
          fontSize: '22px',
          fontWeight: '400' as const,
          color: '#424242',
          textAlign: 'center' as const,
          lineHeight: '1.6',
        },
      }, line)
    );

    const poster = h('div', {
      style: {
        width: W + 'px',
        height: H + 'px',
        display: 'flex',
        flexDirection: 'column' as const,
        backgroundColor: '#FFFFFF',
        fontFamily,
      },
    },
      // Header
      h('div', {
        style: {
          width: '100%',
          height: '260px',
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, ' + style.colors.join(', ') + ')',
        },
      },
        h('div', {
          style: { fontSize: '52px', fontWeight: '700' as const, color: '#FFFFFF', letterSpacing: '12px' },
        }, 'SGAS'),
        h('div', {
          style: { fontSize: '14px', color: 'rgba(255,255,255,0.75)', letterSpacing: '3px', marginTop: '8px' },
        }, 'STUDENT GROUP OF ACTUARIAL SCIENCE'),
        h('div', {
          style: { width: '180px', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)', marginTop: '18px' },
        }),
      ),

      // Content area
      h('div', {
        style: {
          flex: '1',
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 80px',
        },
      },
        ...titleEls,
        // Accent bar
        h('div', {
          style: { width: '200px', height: '4px', backgroundColor: style.accent, borderRadius: '2px', marginTop: '20px', marginBottom: '24px' },
        }),
        ...bodyEls,
      ),

      // Footer
      h('div', {
        style: {
          width: '100%',
          height: '100px',
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAFAFA',
          borderTop: '1px solid #E0E0E0',
        },
      },
        h('div', {
          style: { fontSize: '13px', color: '#9E9E9E', letterSpacing: '1px' },
        }, '@SGAS.CU  \u2022  Cairo University'),
      ),
    );

    // Render with ImageResponse (satori + sharp)
    const imgResponse = new ImageResponse(poster, {
      width: W,
      height: H,
      fonts,
    });

    const buffer = Buffer.from(await imgResponse.arrayBuffer());

    // Add SGAS logo overlay
    let finalBuffer = buffer;
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
          .resize(80, 80, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();

        finalBuffer = await sharp(buffer)
          .composite([{ input: resizedLogo, left: 500, top: 945 }])
          .png()
          .toBuffer();
      }
    } catch (e) {
      console.warn('Logo overlay failed:', e);
    }

    return NextResponse.json({
      image: finalBuffer.toString('base64'),
      success: true,
      style: styleId,
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
