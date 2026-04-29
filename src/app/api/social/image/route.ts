import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';
import { createElement as h, type ReactNode, type CSSProperties } from 'react';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

const W = 1080;
const H = 1080;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const Colors = {
  red: '#B71C1C',
  darkRed: '#8B0000',
  green: '#2E7D32',
  darkGreen: '#1B5E20',
  navy: '#0D47A1',
  darkNavy: '#082B5E',
  white: '#FFFFFF',
  cream: '#FFF8E1',
  offWhite: '#FAFAFA',
  lightGray: '#F5F5F5',
  midGray: '#E0E0E0',
  darkText: '#111111',
  bodyText: '#333333',
  subText: '#777777',
};

interface FontEntry { name: string; data: ArrayBuffer; weight: number; style: string; }
let cachedFonts: FontEntry[] | null = null;

async function loadFontFiles(family: string): Promise<ArrayBuffer[]> {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@400;600;700;800;900&display=swap`).then(r => r.text());
  const urls = [...new Set([...css.matchAll(/url\((https?:\/\/[^)]+)\)/g)].map(m => m[1]))];
  return Promise.all(urls.map(u => fetch(u, { signal: AbortSignal.timeout(10000) }).then(r => r.arrayBuffer()).catch(() => null)));
}

async function getFonts(): Promise<FontEntry[]> {
  if (cachedFonts) return cachedFonts;
  try {
    const [interFiles] = await Promise.all([loadFontFiles('Inter')]);
    cachedFonts = [...interFiles.filter(Boolean).map(d => ({ name: 'Inter', data: d!, weight: 400, style: 'normal' }))];
  } catch { cachedFonts = []; }
  return cachedFonts;
}

async function extractPosterText(caption: string, topic: string): Promise<{ title: string; body: string[] }> {
  if (!GROQ_API_KEY) return { title: topic || 'SGAS', body: caption ? [caption] : [] };
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: `Extract poster text from captions. Rules:
1. Extract ONLY the most impactful and catchy lines
2. ALWAYS translate to ENGLISH even if caption is Arabic
3. Title: 1 short catchy phrase (max 8 words)
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
    const c = data.choices[0]?.message?.content || '';
    const m = c.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('No JSON');
    const p = JSON.parse(m[0]);
    return { title: p.title || topic || 'SGAS', body: Array.isArray(p.body) ? p.body : [] };
  } catch {
    return { title: topic || 'SGAS', body: caption ? caption.split('\n').filter(l => l.trim()).slice(0, 3) : [] };
  }
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

// ── Template 1: Geometric Overlap ──
function template1(title: string, body: string[], logoUrl: string | null): ReactNode {
  const titleLines = wrapText(title, 18);
  const bodyLines = body.flatMap(b => wrapText(b, 36)).slice(0, 5);

  return h('div', { style: { width: W+'px', height: H+'px', display: 'flex', position: 'relative', backgroundColor: Colors.cream, fontFamily: "'Inter', sans-serif" } },
    h('div', { style: { position: 'absolute', top: '-60px', left: '-80px', width: '400px', height: '400px', borderRadius: '50%', backgroundColor: Colors.red, opacity: 0.08 } }),
    h('div', { style: { position: 'absolute', top: '200px', right: '-120px', width: '500px', height: '500px', borderRadius: '50%', backgroundColor: Colors.navy, opacity: 0.06 } }),
    h('div', { style: { position: 'absolute', bottom: '-100px', left: '200px', width: '450px', height: '450px', borderRadius: '50%', backgroundColor: Colors.green, opacity: 0.07 } }),
    h('div', { style: { position: 'absolute', bottom: '100px', right: '50px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: Colors.red, opacity: 0.1 } }),
    h('div', { style: { position: 'absolute', top: '60px', right: '60px', width: '60px', height: '60px', borderRadius: '12px', backgroundColor: Colors.red, opacity: 0.15, transform: 'rotate(15deg)' } }),
    h('div', { style: { position: 'absolute', bottom: '80px', left: '80px', width: '40px', height: '40px', borderRadius: '8px', backgroundColor: Colors.navy, opacity: 0.12, transform: 'rotate(-20deg)' } }),

    logoUrl ? h('div', { style: { position: 'absolute', top: '30px', right: '30px', width: '120px', height: '120px', borderRadius: '20px', overflow: 'hidden', border: '3px solid ' + Colors.white, boxShadow: '0 4px 20px ' + Colors.midGray } },
      h('img', { src: logoUrl, width: 120, height: 120, style: { objectFit: 'contain' as const } })
    ) : null,

    h('div', { style: { position: 'absolute', top: '180px', left: '80px', right: '80px', bottom: '180px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.06)' } },
      ...titleLines.map((line, i) =>
        h('div', { key: 't'+i, style: { fontSize: '44px', fontWeight: '800' as const, color: Colors.darkText, textAlign: 'center' as const, lineHeight: '1.2', letterSpacing: '-0.5px' } }, line)
      ),
      h('div', { style: { width: '100px', height: '5px', borderRadius: '3px', marginTop: '24px', marginBottom: '24px', background: 'linear-gradient(90deg, ' + Colors.red + ', ' + Colors.navy + ')' } }),
      ...bodyLines.map((line, i) =>
        h('div', { key: 'b'+i, style: { fontSize: '22px', color: Colors.bodyText, textAlign: 'center' as const, lineHeight: '1.7', marginTop: i > 0 ? '6px' : '0' } }, line)
      ),
    ),

    logoUrl ? h('div', { style: { position: 'absolute', bottom: '40px', left: '40px', width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', border: '2px solid ' + Colors.white, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' } },
      h('img', { src: logoUrl, width: 70, height: 70, style: { objectFit: 'contain' as const } })
    ) : null,

    h('div', { style: { position: 'absolute', bottom: '55px', left: '0', right: '0', textAlign: 'center' as const, fontSize: '13px', color: Colors.subText, letterSpacing: '1px' } }, '@SGAS.CU  \u2022  Cairo University'),
  );
}

// ── Template 2: Diagonal Split ──
function template2(title: string, body: string[], logoUrl: string | null): ReactNode {
  const titleLines = wrapText(title, 16);
  const bodyLines = body.flatMap(b => wrapText(b, 32)).slice(0, 5);

  return h('div', { style: { width: W+'px', height: H+'px', display: 'flex', position: 'relative', fontFamily: "'Inter', sans-serif" } },
    h('div', { style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, ' + Colors.red + ' 0%, ' + Colors.darkRed + ' 40%, ' + Colors.darkNavy + ' 100%)' } }),
    h('div', { style: { position: 'absolute', top: '60px', right: '80px', width: '250px', height: '250px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)' } }),
    h('div', { style: { position: 'absolute', bottom: '100px', left: '50px', width: '300px', height: '300px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' } }),
    h('div', { style: { position: 'absolute', top: '400px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', backgroundColor: Colors.green, opacity: 0.15 } }),

    logoUrl ? h('div', { style: { position: 'absolute', top: '40px', left: '40px', width: '100px', height: '100px', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      h('img', { src: logoUrl, width: 80, height: 80, style: { objectFit: 'contain' as const } })
    ) : null,

    h('div', { style: { position: 'absolute', top: '55px', right: '50px', fontSize: '14px', color: 'rgba(255,255,255,0.5)', letterSpacing: '3px' } }, 'STUDENT GROUP OF ACTUARIAL SCIENCE'),

    h('div', { style: { position: 'absolute', top: '160px', left: '60px', width: '980px', height: '740px', borderRadius: '24px', backgroundColor: 'rgba(0,0,0,0.15)' } }),
    h('div', { style: { position: 'absolute', top: '150px', left: '50px', width: '980px', height: '740px', borderRadius: '24px', backgroundColor: Colors.white, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '60px' } },
      ...titleLines.map((line, i) =>
        h('div', { key: 't'+i, style: { fontSize: '42px', fontWeight: '800' as const, color: Colors.darkText, textAlign: 'center' as const, lineHeight: '1.25' } }, line)
      ),
      h('div', { style: { width: '80px', height: '4px', borderRadius: '2px', backgroundColor: Colors.green, marginTop: '20px', marginBottom: '20px' } }),
      ...bodyLines.map((line, i) =>
        h('div', { key: 'b'+i, style: { fontSize: '21px', color: Colors.bodyText, textAlign: 'center' as const, lineHeight: '1.7', marginTop: i > 0 ? '8px' : '0' } }, line)
      ),
    ),

    logoUrl ? h('div', { style: { position: 'absolute', bottom: '50px', right: '50px', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      h('img', { src: logoUrl, width: 60, height: 60, style: { objectFit: 'contain' as const } })
    ) : null,

    h('div', { style: { position: 'absolute', bottom: '60px', left: '50px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' } }, '@SGAS.CU  \u2022  Cairo University'),
  );
}

// ── Template 3: Green Nature ──
function template3(title: string, body: string[], logoUrl: string | null): ReactNode {
  const titleLines = wrapText(title, 18);
  const bodyLines = body.flatMap(b => wrapText(b, 34)).slice(0, 5);

  return h('div', { style: { width: W+'px', height: H+'px', display: 'flex', flexDirection: 'column' as const, position: 'relative', backgroundColor: Colors.offWhite, fontFamily: "'Inter', sans-serif" } },
    h('div', { style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '350px', background: 'linear-gradient(180deg, ' + Colors.green + ' 0%, ' + Colors.darkGreen + ' 100%)' } }),
    h('div', { style: { position: 'absolute', top: '300px', left: '-60px', width: '300px', height: '150px', borderRadius: '50%', backgroundColor: Colors.green } }),
    h('div', { style: { position: 'absolute', top: '310px', right: '-80px', width: '350px', height: '160px', borderRadius: '50%', backgroundColor: Colors.green } }),
    h('div', { style: { position: 'absolute', top: '40px', left: '40px', width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)' } }),
    h('div', { style: { position: 'absolute', top: '80px', right: '60px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' } }),
    h('div', { style: { position: 'absolute', bottom: '120px', left: '60px', width: '120px', height: '120px', borderRadius: '50%', backgroundColor: Colors.green, opacity: 0.06 } }),

    logoUrl ? h('div', { style: { position: 'absolute', top: '80px', left: '485px', width: '110px', height: '110px', borderRadius: '50%', backgroundColor: Colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' } },
      h('img', { src: logoUrl, width: 85, height: 85, style: { objectFit: 'contain' as const } })
    ) : null,

    h('div', { style: { position: 'absolute', top: '210px', left: '60px', right: '60px', textAlign: 'center' as const, fontSize: '13px', color: 'rgba(255,255,255,0.7)', letterSpacing: '4px' } }, 'STUDENT GROUP OF ACTUARIAL SCIENCE'),

    h('div', { style: { position: 'absolute', top: '400px', left: '70px', right: '70px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'flex-start' } },
      ...titleLines.map((line, i) =>
        h('div', { key: 't'+i, style: { fontSize: '42px', fontWeight: '800' as const, color: Colors.darkGreen, textAlign: 'center' as const, lineHeight: '1.25', marginTop: i > 0 ? '4px' : '0' } }, line)
      ),
      h('div', { style: { width: '80px', height: '4px', borderRadius: '2px', backgroundColor: Colors.green, marginTop: '20px', marginBottom: '20px' } }),
      ...bodyLines.map((line, i) =>
        h('div', { key: 'b'+i, style: { fontSize: '22px', color: Colors.bodyText, textAlign: 'center' as const, lineHeight: '1.7', marginTop: i > 0 ? '8px' : '0' } }, line)
      ),
    ),

    logoUrl ? h('div', { style: { position: 'absolute', bottom: '50px', right: '50px', width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '2px solid ' + Colors.green, opacity: 0.7 } },
      h('img', { src: logoUrl, width: 56, height: 56, style: { objectFit: 'contain' as const } })
    ) : null,

    h('div', { style: { position: 'absolute', bottom: '30px', left: '0', right: '0', textAlign: 'center' as const, fontSize: '12px', color: Colors.subText } }, '@SGAS.CU  \u2022  Cairo University'),
  );
}

// ── Template 4: Dark Premium ──
function template4(title: string, body: string[], logoUrl: string | null): ReactNode {
  const titleLines = wrapText(title, 16);
  const bodyLines = body.flatMap(b => wrapText(b, 32)).slice(0, 4);

  return h('div', { style: { width: W+'px', height: H+'px', display: 'flex', flexDirection: 'column' as const, position: 'relative', background: 'linear-gradient(160deg, #0F0F1A 0%, #1A1A2E 40%, #16213E 100%)', fontFamily: "'Inter', sans-serif" } },
    h('div', { style: { position: 'absolute', top: '100px', left: '-100px', width: '350px', height: '350px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)' } }),
    h('div', { style: { position: 'absolute', bottom: '50px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.03)' } }),
    h('div', { style: { position: 'absolute', top: '300px', right: '100px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: 'rgba(183,28,28,0.08)' } }),
    h('div', { style: { position: 'absolute', top: '50px', right: '50px', width: '4px', height: '200px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '2px' } }),
    h('div', { style: { position: 'absolute', bottom: '150px', left: '60px', width: '4px', height: '150px', backgroundColor: 'rgba(46,125,50,0.1)', borderRadius: '2px' } }),
    h('div', { style: { position: 'absolute', top: 0, left: 0, width: '120px', height: '4px', background: 'linear-gradient(90deg, ' + Colors.red + ', transparent)' } }),
    h('div', { style: { position: 'absolute', top: 0, left: 0, width: '4px', height: '120px', background: 'linear-gradient(180deg, ' + Colors.red + ', transparent)' } }),
    h('div', { style: { position: 'absolute', bottom: 0, right: 0, width: '120px', height: '4px', background: 'linear-gradient(90deg, transparent, ' + Colors.navy + ')' } }),
    h('div', { style: { position: 'absolute', bottom: 0, right: 0, width: '4px', height: '120px', background: 'linear-gradient(180deg, transparent, ' + Colors.navy + ')' } }),

    logoUrl ? h('div', { style: { position: 'absolute', top: '50px', left: '485px', width: '110px', height: '110px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      h('img', { src: logoUrl, width: 80, height: 80, style: { objectFit: 'contain' as const } })
    ) : null,

    h('div', { style: { position: 'absolute', top: '175px', left: '0', right: '0', textAlign: 'center' as const, fontSize: '14px', color: 'rgba(255,255,255,0.35)', letterSpacing: '4px' } }, 'STUDENT GROUP OF ACTUARIAL SCIENCE'),

    h('div', { style: { position: 'absolute', top: '280px', left: '80px', right: '80px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' } },
      ...titleLines.map((line, i) =>
        h('div', { key: 't'+i, style: { fontSize: '44px', fontWeight: '800' as const, color: Colors.white, textAlign: 'center' as const, lineHeight: '1.25' } }, line)
      ),
      h('div', { style: { width: '100px', height: '4px', borderRadius: '2px', marginTop: '24px', marginBottom: '24px', background: 'linear-gradient(90deg, ' + Colors.red + ', ' + Colors.navy + ')' } }),
      ...bodyLines.map((line, i) =>
        h('div', { key: 'b'+i, style: { fontSize: '22px', color: 'rgba(255,255,255,0.7)', textAlign: 'center' as const, lineHeight: '1.7', marginTop: i > 0 ? '8px' : '0' } }, line)
      ),
    ),

    logoUrl ? h('div', { style: { position: 'absolute', bottom: '50px', left: '50px', width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', opacity: 0.6 } },
      h('img', { src: logoUrl, width: 60, height: 60, style: { objectFit: 'contain' as const } })
    ) : null,

    logoUrl ? h('div', { style: { position: 'absolute', bottom: '50px', right: '50px', width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', opacity: 0.6 } },
      h('img', { src: logoUrl, width: 60, height: 60, style: { objectFit: 'contain' as const } })
    ) : null,

    h('div', { style: { position: 'absolute', bottom: '30px', left: '0', right: '0', textAlign: 'center' as const, fontSize: '12px', color: 'rgba(255,255,255,0.25)' } }, '@SGAS.CU  \u2022  Cairo University'),
  );
}

// ── Template 5: Corporate Split ──
function template5(title: string, body: string[], logoUrl: string | null): ReactNode {
  const titleLines = wrapText(title, 15);
  const bodyLines = body.flatMap(b => wrapText(b, 30)).slice(0, 5);

  return h('div', { style: { width: W+'px', height: H+'px', display: 'flex', position: 'relative', backgroundColor: Colors.lightGray, fontFamily: "'Inter', sans-serif" } },
    h('div', { style: { position: 'absolute', top: 0, left: 0, width: '380px', height: '100%', background: 'linear-gradient(180deg, ' + Colors.red + ' 0%, ' + Colors.darkNavy + ' 100%)' } }),
    h('div', { style: { position: 'absolute', top: '50px', left: '340px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: Colors.red } }),
    h('div', { style: { position: 'absolute', top: '100px', left: '30px', width: '320px', height: '320px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' } }),
    h('div', { style: { position: 'absolute', bottom: '100px', left: '60px', width: '260px', height: '260px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' } }),
    h('div', { style: { position: 'absolute', top: '500px', left: '20px', width: '60px', height: '60px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.08)' } }),

    logoUrl ? h('div', { style: { position: 'absolute', top: '200px', left: '130px', width: '120px', height: '120px', borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      h('img', { src: logoUrl, width: 90, height: 90, style: { objectFit: 'contain' as const } })
    ) : null,

    h('div', { style: { position: 'absolute', top: '345px', left: '0', width: '380px', textAlign: 'center' as const, fontSize: '32px', fontWeight: '900' as const, color: 'rgba(255,255,255,0.9)', letterSpacing: '6px' } }, 'SGAS'),
    h('div', { style: { position: 'absolute', top: '390px', left: '0', width: '380px', textAlign: 'center' as const, fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px' } }, 'ACTUARIAL SCIENCE'),
    h('div', { style: { position: 'absolute', top: '420px', left: '180px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: Colors.green } }),

    h('div', { style: { position: 'absolute', top: '80px', left: '420px', width: '580px', height: '840px', borderRadius: '20px', backgroundColor: Colors.white } }),

    h('div', { style: { position: 'absolute', top: '140px', left: '460px', width: '500px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' } },
      h('div', { style: { fontSize: '12px', color: Colors.subText, letterSpacing: '3px', marginBottom: '40px' } }, 'FEATURED POST'),
      ...titleLines.map((line, i) =>
        h('div', { key: 't'+i, style: { fontSize: '38px', fontWeight: '800' as const, color: Colors.darkText, textAlign: 'center' as const, lineHeight: '1.25', marginTop: i > 0 ? '4px' : '0' } }, line)
      ),
      h('div', { style: { width: '60px', height: '4px', borderRadius: '2px', backgroundColor: Colors.navy, marginTop: '24px', marginBottom: '24px' } }),
      ...bodyLines.map((line, i) =>
        h('div', { key: 'b'+i, style: { fontSize: '20px', color: Colors.bodyText, textAlign: 'center' as const, lineHeight: '1.7', marginTop: i > 0 ? '6px' : '0' } }, line)
      ),
    ),

    logoUrl ? h('div', { style: { position: 'absolute', bottom: '110px', right: '60px', width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', opacity: 0.5 } },
      h('img', { src: logoUrl, width: 50, height: 50, style: { objectFit: 'contain' as const } })
    ) : null,

    h('div', { style: { position: 'absolute', bottom: '40px', left: '420px', right: '40px', textAlign: 'center' as const, fontSize: '12px', color: Colors.subText } }, '@SGAS.CU  \u2022  Cairo University'),
  );
}

const TEMPLATES: Record<string, (title: string, body: string[], logo: string | null) => ReactNode> = {
  'geometric': template1,
  'diagonal': template2,
  'nature': template3,
  'dark': template4,
  'corporate': template5,
};

export async function GET() {
  return NextResponse.json({
    styles: [
      { id: 'geometric', name: 'Geometric Overlap', nameAr: '\u0647\u0646\u062f\u0633\u064a' },
      { id: 'diagonal', name: 'Diagonal Card', nameAr: '\u062f\u064a\u0627\u062c\u0648\u0646\u0627\u0644' },
      { id: 'nature', name: 'Green Nature', nameAr: '\u0637\u0628\u064a\u0639\u064a' },
      { id: 'dark', name: 'Dark Premium', nameAr: '\u062f\u0627\u0643\u0646 \u0641\u0627\u062e\u0631' },
      { id: 'corporate', name: 'Corporate Split', nameAr: '\u0643\u0648\u0631\u0628\u0648\u0631\u064a\u062a' },
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const { topic, caption, styleId = 'geometric' } = await request.json();
    if (!topic && !caption) return NextResponse.json({ error: 'Topic or caption is required' }, { status: 400 });

    const { title, body } = await extractPosterText(caption || '', topic || '');
    const fonts = await getFonts();
    const templateFn = TEMPLATES[styleId] || TEMPLATES['geometric'];

    let logoBase64: string | null = null;
    try {
      let logoBuf: Buffer | null = null;
      try { logoBuf = await readFile(path.join(process.cwd(), 'public', 'sgas-logo.png')); } catch {
        try { const r = await fetch('https://sgas-website.vercel.app/sgas-logo.png', { signal: AbortSignal.timeout(5000) }); if (r.ok) logoBuf = Buffer.from(await r.arrayBuffer()); } catch {}
      }
      if (logoBuf) logoBase64 = 'data:image/png;base64,' + logoBuf.toString('base64');
    } catch { }

    const poster = templateFn(title, body, logoBase64);
    const imgResponse = new ImageResponse(poster, { width: W, height: H, fonts });
    const buffer = Buffer.from(await imgResponse.arrayBuffer());

    return NextResponse.json({
      image: buffer.toString('base64'),
      success: true,
      style: styleId,
      posterTitle: title,
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate image' }, { status: 500 });
  }
}
