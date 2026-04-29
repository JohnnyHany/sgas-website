import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';
import { createElement as h, type ReactNode } from 'react';
import { readFile } from 'fs/promises';
import path from 'path';

const W = 1080;
const H = 1080;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const C = {
  red: '#B71C1C', darkRed: '#8B0000', green: '#2E7D32', darkGreen: '#1B5E20',
  navy: '#0D47A1', darkNavy: '#082B5E', white: '#FFFFFF', cream: '#FFF8E1',
  offWhite: '#FAFAFA', lightGray: '#F5F5F5', midGray: '#E0E0E0',
  darkText: '#111111', bodyText: '#333333', subText: '#777777',
};

// ── Fonts ──
interface FontEntry { name: string; data: ArrayBuffer; weight: number; style: string; }
let cachedFonts: FontEntry[] | null = null;

async function getFonts(): Promise<FontEntry[]> {
  if (cachedFonts) return cachedFonts;
  try {
    const css = await fetch('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap').then(r => r.text());
    const urls = [...new Set([...css.matchAll(/url\((https?:\/\/[^)]+)\)/g)].map(m => m[1]))];
    const bufs = await Promise.all(urls.map(u => fetch(u, { signal: AbortSignal.timeout(10000) }).then(r => r.arrayBuffer()).catch(() => null)));
    cachedFonts = [...bufs.filter(Boolean).map(d => ({ name: 'Inter', data: d!, weight: 400, style: 'normal' }))];
  } catch { cachedFonts = []; }
  return cachedFonts;
}

// ── AI Text Extract ──
async function extractPosterText(caption: string, topic: string): Promise<{ title: string; body: string[] }> {
  if (!GROQ_API_KEY) return { title: topic || 'SGAS', body: caption ? [caption] : [] };
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Extract poster text. Translate to ENGLISH. Return JSON: {"title":"max 6 words","body":["line1","line2","line3"]}. Remove emojis/hashtags.' },
          { role: 'user', content: `Topic: ${topic}\nCaption: ${caption}` }
        ],
        temperature: 0.7, max_tokens: 300,
      }),
    });
    if (!res.ok) throw new Error('x');
    const data = await res.json();
    const m = (data.choices[0]?.message?.content || '').match(/\{[\s\S]*\}/);
    if (!m) throw new Error('x');
    const p = JSON.parse(m[0]);
    return { title: p.title || topic || 'SGAS', body: Array.isArray(p.body) ? p.body : [] };
  } catch { return { title: topic || 'SGAS', body: caption ? caption.split('\n').filter(l => l.trim()).slice(0, 3) : [] }; }
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
function t1(title: string, body: string[], logo: string | null): ReactNode {
  const tl = wrapText(title, 16);
  const bl = body.flatMap(b => wrapText(b, 30)).slice(0, 5);
  return h('div', { style: { width: W+'px', height: H+'px', display: 'flex', position: 'relative', backgroundColor: C.cream, fontFamily: 'Inter, sans-serif' } },
    h('div', { style: { position: 'absolute', top: '-60px', left: '-80px', width: '400px', height: '400px', borderRadius: '50%', backgroundColor: C.red, opacity: 0.08 } }),
    h('div', { style: { position: 'absolute', top: '200px', right: '-120px', width: '500px', height: '500px', borderRadius: '50%', backgroundColor: C.navy, opacity: 0.06 } }),
    h('div', { style: { position: 'absolute', bottom: '-100px', left: '200px', width: '450px', height: '450px', borderRadius: '50%', backgroundColor: C.green, opacity: 0.07 } }),
    h('div', { style: { position: 'absolute', bottom: '100px', right: '50px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: C.red, opacity: 0.1 } }),
    h('div', { style: { position: 'absolute', top: '60px', right: '60px', width: '60px', height: '60px', borderRadius: '12px', backgroundColor: C.red, opacity: 0.15, transform: 'rotate(15deg)' } }),
    h('div', { style: { position: 'absolute', bottom: '80px', left: '80px', width: '40px', height: '40px', borderRadius: '8px', backgroundColor: C.navy, opacity: 0.12, transform: 'rotate(-20deg)' } }),
    logo ? h('div', { style: { position: 'absolute', top: '30px', right: '30px', width: '130px', height: '130px', borderRadius: '20px', overflow: 'hidden', border: '3px solid ' + C.white } },
      h('img', { src: logo, width: 130, height: 130 })
    ) : null,
    h('div', { style: { position: 'absolute', top: '160px', left: '70px', right: '70px', bottom: '170px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.9)' } },
      ...tl.map((line, i) => h('div', { key: 't'+i, style: { fontSize: '52px', fontWeight: '800', color: C.darkText, textAlign: 'center', lineHeight: '1.2' } }, line)),
      h('div', { style: { width: '120px', height: '6px', borderRadius: '3px', marginTop: '28px', marginBottom: '28px', background: 'linear-gradient(90deg, ' + C.red + ', ' + C.navy + ')' } }),
      ...bl.map((line, i) => h('div', { key: 'b'+i, style: { fontSize: '28px', color: C.bodyText, textAlign: 'center', lineHeight: '1.7', marginTop: i > 0 ? '10px' : '0' } }, line)),
    ),
    logo ? h('div', { style: { position: 'absolute', bottom: '35px', left: '35px', width: '75px', height: '75px', borderRadius: '50%', overflow: 'hidden', border: '2px solid ' + C.white } },
      h('img', { src: logo, width: 75, height: 75 })
    ) : null,
    h('div', { style: { position: 'absolute', bottom: '45px', display: 'flex', justifyContent: 'center', width: '100%', fontSize: '14px', color: C.subText } }, '@SGAS.CU  \u2022  Cairo University'),
  );
}

// ── Template 2: Diagonal ──
function t2(title: string, body: string[], logo: string | null): ReactNode {
  const tl = wrapText(title, 14);
  const bl = body.flatMap(b => wrapText(b, 28)).slice(0, 5);
  return h('div', { style: { width: W+'px', height: H+'px', display: 'flex', position: 'relative', fontFamily: 'Inter, sans-serif' } },
    h('div', { style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, ' + C.red + ' 0%, ' + C.darkRed + ' 40%, ' + C.darkNavy + ' 100%)' } }),
    h('div', { style: { position: 'absolute', top: '60px', right: '80px', width: '250px', height: '250px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)' } }),
    h('div', { style: { position: 'absolute', bottom: '100px', left: '50px', width: '300px', height: '300px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' } }),
    logo ? h('div', { style: { position: 'absolute', top: '40px', left: '40px', width: '110px', height: '110px', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      h('img', { src: logo, width: 90, height: 90 })
    ) : null,
    h('div', { style: { position: 'absolute', top: '55px', right: '50px', fontSize: '14px', color: 'rgba(255,255,255,0.5)', letterSpacing: '3px' } }, 'STUDENT GROUP OF ACTUARIAL SCIENCE'),
    h('div', { style: { position: 'absolute', top: '160px', left: '60px', width: '980px', height: '740px', borderRadius: '24px', backgroundColor: 'rgba(0,0,0,0.15)' } }),
    h('div', { style: { position: 'absolute', top: '150px', left: '50px', width: '980px', height: '740px', borderRadius: '24px', backgroundColor: C.white, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' } },
      ...tl.map((line, i) => h('div', { key: 't'+i, style: { fontSize: '50px', fontWeight: '800', color: C.darkText, textAlign: 'center', lineHeight: '1.2' } }, line)),
      h('div', { style: { width: '80px', height: '5px', borderRadius: '2px', backgroundColor: C.green, marginTop: '24px', marginBottom: '24px' } }),
      ...bl.map((line, i) => h('div', { key: 'b'+i, style: { fontSize: '26px', color: C.bodyText, textAlign: 'center', lineHeight: '1.7', marginTop: i > 0 ? '10px' : '0' } }, line)),
    ),
    logo ? h('div', { style: { position: 'absolute', bottom: '45px', right: '45px', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      h('img', { src: logo, width: 60, height: 60 })
    ) : null,
    h('div', { style: { position: 'absolute', bottom: '55px', left: '50px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' } }, '@SGAS.CU  \u2022  Cairo University'),
  );
}

// ── Template 3: Green Nature ──
function t3(title: string, body: string[], logo: string | null): ReactNode {
  const tl = wrapText(title, 16);
  const bl = body.flatMap(b => wrapText(b, 30)).slice(0, 5);
  return h('div', { style: { width: W+'px', height: H+'px', display: 'flex', position: 'relative', backgroundColor: C.offWhite, fontFamily: 'Inter, sans-serif' } },
    h('div', { style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '360px', background: 'linear-gradient(180deg, ' + C.green + ' 0%, ' + C.darkGreen + ' 100%)' } }),
    h('div', { style: { position: 'absolute', top: '310px', left: '-60px', width: '300px', height: '150px', borderRadius: '50%', backgroundColor: C.green } }),
    h('div', { style: { position: 'absolute', top: '320px', right: '-80px', width: '350px', height: '160px', borderRadius: '50%', backgroundColor: C.green } }),
    h('div', { style: { position: 'absolute', top: '40px', left: '40px', width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)' } }),
    h('div', { style: { position: 'absolute', top: '80px', right: '60px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' } }),
    logo ? h('div', { style: { position: 'absolute', top: '80px', left: '475px', width: '130px', height: '130px', borderRadius: '50%', backgroundColor: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' } },
      h('img', { src: logo, width: 100, height: 100 })
    ) : null,
    h('div', { style: { position: 'absolute', top: '230px', width: '100%', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.7)', letterSpacing: '4px' } }, 'STUDENT GROUP OF ACTUARIAL SCIENCE'),
    h('div', { style: { position: 'absolute', top: '400px', left: '70px', right: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' } },
      ...tl.map((line, i) => h('div', { key: 't'+i, style: { fontSize: '50px', fontWeight: '800', color: C.darkGreen, textAlign: 'center', lineHeight: '1.2', marginTop: i > 0 ? '4px' : '0' } }, line)),
      h('div', { style: { width: '80px', height: '5px', borderRadius: '2px', backgroundColor: C.green, marginTop: '24px', marginBottom: '24px' } }),
      ...bl.map((line, i) => h('div', { key: 'b'+i, style: { fontSize: '28px', color: C.bodyText, textAlign: 'center', lineHeight: '1.7', marginTop: i > 0 ? '10px' : '0' } }, line)),
    ),
    logo ? h('div', { style: { position: 'absolute', bottom: '50px', right: '50px', width: '65px', height: '65px', borderRadius: '50%', overflow: 'hidden', border: '2px solid ' + C.green, opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      h('img', { src: logo, width: 60, height: 60 })
    ) : null,
    h('div', { style: { position: 'absolute', bottom: '28px', width: '100%', textAlign: 'center', fontSize: '13px', color: C.subText } }, '@SGAS.CU  \u2022  Cairo University'),
  );
}

// ── Template 4: Dark Premium ──
function t4(title: string, body: string[], logo: string | null): ReactNode {
  const tl = wrapText(title, 14);
  const bl = body.flatMap(b => wrapText(b, 26)).slice(0, 4);
  return h('div', { style: { width: W+'px', height: H+'px', display: 'flex', position: 'relative', background: 'linear-gradient(160deg, #0F0F1A 0%, #1A1A2E 40%, #16213E 100%)', fontFamily: 'Inter, sans-serif' } },
    h('div', { style: { position: 'absolute', top: '100px', left: '-100px', width: '350px', height: '350px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)' } }),
    h('div', { style: { position: 'absolute', bottom: '50px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.03)' } }),
    h('div', { style: { position: 'absolute', top: '300px', right: '100px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: 'rgba(183,28,28,0.08)' } }),
    h('div', { style: { position: 'absolute', top: 0, left: 0, width: '120px', height: '4px', background: 'linear-gradient(90deg, ' + C.red + ', transparent)' } }),
    h('div', { style: { position: 'absolute', top: 0, left: 0, width: '4px', height: '120px', background: 'linear-gradient(180deg, ' + C.red + ', transparent)' } }),
    h('div', { style: { position: 'absolute', bottom: 0, right: 0, width: '120px', height: '4px', background: 'linear-gradient(90deg, transparent, ' + C.navy + ')' } }),
    h('div', { style: { position: 'absolute', bottom: 0, right: 0, width: '4px', height: '120px', background: 'linear-gradient(180deg, transparent, ' + C.navy + ')' } }),
    logo ? h('div', { style: { position: 'absolute', top: '50px', left: '475px', width: '130px', height: '130px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      h('img', { src: logo, width: 100, height: 100 })
    ) : null,
    h('div', { style: { position: 'absolute', top: '200px', width: '100%', textAlign: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.35)', letterSpacing: '4px' } }, 'STUDENT GROUP OF ACTUARIAL SCIENCE'),
    h('div', { style: { position: 'absolute', top: '280px', left: '80px', right: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center' } },
      ...tl.map((line, i) => h('div', { key: 't'+i, style: { fontSize: '52px', fontWeight: '800', color: C.white, textAlign: 'center', lineHeight: '1.2' } }, line)),
      h('div', { style: { width: '120px', height: '5px', borderRadius: '2px', marginTop: '28px', marginBottom: '28px', background: 'linear-gradient(90deg, ' + C.red + ', ' + C.navy + ')' } }),
      ...bl.map((line, i) => h('div', { key: 'b'+i, style: { fontSize: '28px', color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: '1.7', marginTop: i > 0 ? '10px' : '0' } }, line)),
    ),
    logo ? h('div', { style: { position: 'absolute', bottom: '50px', left: '50px', width: '65px', height: '65px', borderRadius: '12px', overflow: 'hidden', opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      h('img', { src: logo, width: 65, height: 65 })
    ) : null,
    logo ? h('div', { style: { position: 'absolute', bottom: '50px', right: '50px', width: '65px', height: '65px', borderRadius: '12px', overflow: 'hidden', opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      h('img', { src: logo, width: 65, height: 65 })
    ) : null,
    h('div', { style: { position: 'absolute', bottom: '28px', width: '100%', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.25)' } }, '@SGAS.CU  \u2022  Cairo University'),
  );
}

// ── Template 5: Corporate Split ──
function t5(title: string, body: string[], logo: string | null): ReactNode {
  const tl = wrapText(title, 13);
  const bl = body.flatMap(b => wrapText(b, 26)).slice(0, 5);
  return h('div', { style: { width: W+'px', height: H+'px', display: 'flex', position: 'relative', backgroundColor: C.lightGray, fontFamily: 'Inter, sans-serif' } },
    h('div', { style: { position: 'absolute', top: 0, left: 0, width: '380px', height: '100%', background: 'linear-gradient(180deg, ' + C.red + ' 0%, ' + C.darkNavy + ' 100%)' } }),
    h('div', { style: { position: 'absolute', top: '50px', left: '340px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: C.red } }),
    h('div', { style: { position: 'absolute', top: '100px', left: '30px', width: '320px', height: '320px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' } }),
    h('div', { style: { position: 'absolute', bottom: '100px', left: '60px', width: '260px', height: '260px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' } }),
    logo ? h('div', { style: { position: 'absolute', top: '180px', left: '120px', width: '140px', height: '140px', borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      h('img', { src: logo, width: 110, height: 110 })
    ) : null,
    h('div', { style: { position: 'absolute', top: '340px', width: '380px', textAlign: 'center', fontSize: '36px', fontWeight: '900', color: 'rgba(255,255,255,0.9)', letterSpacing: '6px' } }, 'SGAS'),
    h('div', { style: { position: 'absolute', top: '390px', width: '380px', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px' } }, 'ACTUARIAL SCIENCE'),
    h('div', { style: { position: 'absolute', top: '420px', left: '180px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: C.green } }),
    h('div', { style: { position: 'absolute', top: '80px', left: '420px', width: '580px', height: '860px', borderRadius: '20px', backgroundColor: C.white } }),
    h('div', { style: { position: 'absolute', top: '130px', left: '460px', width: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center' } },
      h('div', { style: { fontSize: '13px', color: C.subText, letterSpacing: '3px', marginBottom: '40px' } }, 'FEATURED POST'),
      ...tl.map((line, i) => h('div', { key: 't'+i, style: { fontSize: '44px', fontWeight: '800', color: C.darkText, textAlign: 'center', lineHeight: '1.2', marginTop: i > 0 ? '6px' : '0' } }, line)),
      h('div', { style: { width: '60px', height: '5px', borderRadius: '2px', backgroundColor: C.navy, marginTop: '24px', marginBottom: '24px' } }),
      ...bl.map((line, i) => h('div', { key: 'b'+i, style: { fontSize: '24px', color: C.bodyText, textAlign: 'center', lineHeight: '1.7', marginTop: i > 0 ? '8px' : '0' } }, line)),
    ),
    logo ? h('div', { style: { position: 'absolute', bottom: '110px', right: '60px', width: '55px', height: '55px', borderRadius: '50%', overflow: 'hidden', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      h('img', { src: logo, width: 55, height: 55 })
    ) : null,
    h('div', { style: { position: 'absolute', bottom: '35px', left: '420px', width: '600px', textAlign: 'center', fontSize: '13px', color: C.subText } }, '@SGAS.CU  \u2022  Cairo University'),
  );
}

const TMPL = { geometric: t1, diagonal: t2, nature: t3, dark: t4, corporate: t5 };

export async function GET() {
  return NextResponse.json({ styles: [
    { id: 'geometric', name: 'Geometric Overlap', nameAr: '\u0647\u0646\u062f\u0633\u064a' },
    { id: 'diagonal', name: 'Diagonal Card', nameAr: '\u062f\u064a\u0627\u062c\u0648\u0646\u0627\u0644' },
    { id: 'nature', name: 'Green Nature', nameAr: '\u0637\u0628\u064a\u0639\u064a' },
    { id: 'dark', name: 'Dark Premium', nameAr: '\u062f\u0627\u0643\u0646 \u0641\u0627\u062e\u0631' },
    { id: 'corporate', name: 'Corporate Split', nameAr: '\u0643\u0648\u0631\u0628\u0648\u0631\u064a\u062a' },
  ] });
}

export async function POST(request: NextRequest) {
  try {
    const { topic, caption, styleId = 'geometric' } = await request.json();
    if (!topic && !caption) return NextResponse.json({ error: 'Topic or caption is required' }, { status: 400 });
    const { title, body } = await extractPosterText(caption || '', topic || '');
    const fonts = await getFonts();
    const fn = TMPL[styleId as keyof typeof TMPL] || t1;

    let logoBase64: string | null = null;
    try {
      let buf: Buffer | null = null;
      try { buf = await readFile(path.join(process.cwd(), 'public', 'sgas-logo.png')); } catch {
        try { const r = await fetch('https://sgas-website.vercel.app/sgas-logo.png', { signal: AbortSignal.timeout(5000) }); if (r.ok) buf = Buffer.from(await r.arrayBuffer()); } catch {}
      }
      if (buf) logoBase64 = 'data:image/png;base64,' + buf.toString('base64');
    } catch {}

    const poster = fn(title, body, logoBase64);
    const imgResponse = new ImageResponse(poster, { width: W, height: H, fonts });
    const buffer = Buffer.from(await imgResponse.arrayBuffer());

    return NextResponse.json({ image: buffer.toString('base64'), success: true, style: styleId, posterTitle: title });
  } catch (error: any) {
    console.error('Image error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
