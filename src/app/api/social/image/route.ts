import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';
import { createElement as h, type ReactNode } from 'react';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

const W = 1080;
const H = 1080;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ── Font Cache ─────────────────────────────────────────────

interface FontEntry {
  name: string;
  data: ArrayBuffer;
  weight: number;
  style: string;
}

let cachedFonts: FontEntry[] | null = null;

async function loadFontFiles(family: string): Promise<ArrayBuffer[]> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${family}:wght@400;600;700;800;900&display=swap`;
  const css = await fetch(cssUrl).then(r => r.text());
  const urls = [...new Set([...css.matchAll(/url\((https?:\/\/[^)]+)\)/g)].map(m => m[1]))];
  return Promise.all(urls.map(u => fetch(u, { signal: AbortSignal.timeout(10000) }).then(r => r.arrayBuffer()).catch(() => null)));
}

async function getFonts(): Promise<FontEntry[]> {
  if (cachedFonts) return cachedFonts;
  try {
    const [interFiles] = await Promise.all([loadFontFiles('Inter')]);
    cachedFonts = [
      ...interFiles.filter(Boolean).map(d => ({ name: 'Inter', data: d!, weight: 400, style: 'normal' })),
    ];
    console.log(`Loaded ${cachedFonts.length} font files`);
  } catch (err) {
    console.warn('Font loading failed:', err);
    cachedFonts = [];
  }
  return cachedFonts;
}

// ── Extract & translate caption to English ─────────────────

async function extractPosterText(caption: string, topic: string): Promise<{ title: string; body: string[] }> {
  if (!GROQ_API_KEY) {
    return { title: topic || 'SGAS', body: caption ? [caption] : [] };
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You extract poster text from social media captions. Rules:
1. Extract only the MOST impactful and catchy lines
2. Always translate to ENGLISH even if the caption is in Arabic or any other language
3. Title: 1 short catchy phrase (max 8 words)
4. Body: 2-4 short powerful lines (max 12 words each)
5. Remove emojis, hashtags, and @mentions
6. Make it sound professional and engaging
7. Return ONLY valid JSON, no markdown`
          },
          {
            role: 'user',
            content: `Topic: ${topic}\n\nCaption:\n${caption}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!res.ok) throw new Error('Groq failed');
    const data = await res.json();
    const content = data.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: parsed.title || topic || 'SGAS',
      body: Array.isArray(parsed.body) ? parsed.body : (parsed.body ? [parsed.body] : []),
    };
  } catch (err) {
    console.warn('AI text extraction failed, using raw caption:', err);
    const body = caption ? caption.split('\n').filter(l => l.trim().length > 0).slice(0, 4) : [];
    return { title: topic || 'SGAS', body };
  }
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

// ── Styles ─────────────────────────────────────────────────

const STYLES: Record<string, { colors: string[]; accent: string; textColor: string; bodyColor: string }> = {
  'gradient':  { colors: ['#B71C1C', '#8B0000', '#0D47A1'], accent: '#B71C1C', textColor: '#111111', bodyColor: '#333333' },
  'navy':      { colors: ['#0D47A1', '#082B5E'], accent: '#0D47A1', textColor: '#111111', bodyColor: '#333333' },
  'dark':      { colors: ['#1A1A2E', '#16213E', '#0F3460'], accent: '#E53935', textColor: '#FFFFFF', bodyColor: '#E0E0E0' },
  'nature':    { colors: ['#2E7D32', '#1B5E20'], accent: '#2E7D32', textColor: '#111111', bodyColor: '#333333' },
  'corporate': { colors: ['#B71C1C', '#0D47A1'], accent: '#0D47A1', textColor: '#111111', bodyColor: '#333333' },
};

// ── GET ────────────────────────────────────────────────────

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

// ── POST ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { topic, caption, styleId = 'gradient' } = await request.json();

    if (!topic && !caption) {
      return NextResponse.json({ error: 'Topic or caption is required' }, { status: 400 });
    }

    const style = STYLES[styleId] || STYLES['gradient'];
    const fonts = await getFonts();
    const fontFamily = fonts.length > 0 ? "'Inter', sans-serif" : "sans-serif";

    // AI: extract key text and translate to English
    const { title, body } = await extractPosterText(caption || '', topic || '');

    // Wrap text
    const titleLines = wrapText(title, 18);
    const allBodyLines: string[] = [];
    for (const b of body) {
      allBodyLines.push(...wrapText(b, 38));
    }
    const displayBody = allBodyLines.slice(0, 5);

    // Build poster JSX
    const titleEls: ReactNode[] = titleLines.map((line, i) =>
      h('div', {
        key: 't' + i,
        style: {
          fontSize: '46px',
          fontWeight: '800' as const,
          color: style.textColor,
          textAlign: 'center' as const,
          lineHeight: '1.25',
          letterSpacing: '-0.5px',
        },
      }, line)
    );

    const bodyEls: ReactNode[] = displayBody.map((line, i) =>
      h('div', {
        key: 'b' + i,
        style: {
          fontSize: '24px',
          fontWeight: '400' as const,
          color: style.bodyColor,
          textAlign: 'center' as const,
          lineHeight: '1.6',
          marginTop: i === 0 ? '0px' : '8px',
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
          height: '250px',
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, ' + style.colors.join(', ') + ')',
        },
      },
        h('div', {
          style: { fontSize: '54px', fontWeight: '900' as const, color: '#FFFFFF', letterSpacing: '14px' },
        }, 'SGAS'),
        h('div', {
          style: { fontSize: '13px', color: 'rgba(255,255,255,0.7)', letterSpacing: '4px', marginTop: '10px' },
        }, 'STUDENT GROUP OF ACTUARIAL SCIENCE'),
        h('div', {
          style: { width: '180px', height: '2px', backgroundColor: 'rgba(255,255,255,0.3)', marginTop: '20px' },
        }),
      ),

      // Content
      h('div', {
        style: {
          flex: '1',
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          justifyContent: 'center',
          padding: '50px 90px',
        },
      },
        ...titleEls,
        h('div', {
          style: { width: '180px', height: '4px', backgroundColor: style.accent, borderRadius: '2px', marginTop: '24px', marginBottom: '28px' },
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
          style: { fontSize: '13px', color: '#999999', letterSpacing: '1px' },
        }, '@SGAS.CU  \u2022  Cairo University'),
      ),
    );

    // Render
    const imgResponse = new ImageResponse(poster, {
      width: W,
      height: H,
      fonts,
    });

    const buffer = Buffer.from(await imgResponse.arrayBuffer());

    // Add logo
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
          .composite([{ input: resizedLogo, left: 500, top: 948 }])
          .png()
          .toBuffer();
      }
    } catch (e) {
      console.warn('Logo failed:', e);
    }

    return NextResponse.json({
      image: finalBuffer.toString('base64'),
      success: true,
      style: styleId,
      posterTitle: title,
      posterBody: displayBody,
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
