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

const SGAS_FULL = 'STRIVE AND GROW IN ACTUARIAL SCIENCE';

// ── Clean text: remove anything satori can't render ──
function cleanText(text: string): string {
  return text
    .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '') // Arabic
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{FE0F}]/gu, '') // emojis
    .replace(/[^\x20-\x7E\u00A0-\u024F]/g, '') // keep only Latin + common
    .trim();
}

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

// ── AI Text ──
async function extractPosterText(caption: string, topic: string): Promise<{ title: string; body: string[] }> {
  if (!GROQ_API_KEY) return { title: topic || 'SGAS', body: caption ? [cleanText(caption)] : [] };
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Extract poster text from caption. Translate ALL text to ENGLISH. Remove emojis, hashtags, @mentions. Return ONLY JSON: {"title":"max 6 words catchy phrase","body":["line1","line2","line3"]}' },
          { role: 'user', content: `Topic: ${topic}\nCaption: ${caption}` }
        ],
        temperature: 0.7, max_tokens: 300,
      }),
    });
    if (!res.ok) throw new Error('x');
    const data = await res.json();
    const content = data.choices[0]?.message?.content || '';
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('x');
    const p = JSON.parse(m[0]);
    return {
      title: cleanText(p.title || topic || 'SGAS'),
      body: Array.isArray(p.body) ? p.body.map(cleanText) : [],
    };
  } catch {
    return { title: cleanText(topic || 'SGAS'), body: caption ? [cleanText(caption)] : [] };
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

// ── Logo as base64 ──
let logoCache: string | null = null;
async function getLogoBase64(): Promise<string | null> {
  if (logoCache) return logoCache;
  try {
    let buf: Buffer | null = null;
    try { buf = await readFile(path.join(process.cwd(), 'public', 'sgas-logo.png')); } catch {
      try { const r = await fetch('https://sgas-website.vercel.app/sgas-logo.png', { signal: AbortSignal.timeout(5000) }); if (r.ok) buf = Buffer.from(await r.arrayBuffer()); } catch {}
    }
    if (buf) logoCache = 'data:image/png;base64,' + buf.toString('base64');
  } catch { logoCache = null; }
  return logoCache;
}

// ── Logo component ──
function LogoImg(src: string, size: number, extraStyle: object = {}): ReactNode {
  return h('img', { src, width: size, height: size, style: { display: 'flex', ...extraStyle } });
}

// ── T1: Geometric Overlap ──
function t1(title: string, body: string[], logo: string | null): ReactNode {
  const tl = wrapText(title, 16);
  const bl = body.flatMap(b => wrapText(b, 30)).slice(0, 5);
  const children: ReactNode[] = [];

  // Decorative circles
  children.push(h('div', { key: 'c1', style: { display: 'flex', position: 'absolute', top: '-60px', left: '-80px', width: '400px', height: '400px', borderRadius: '50%', backgroundColor: C.red, opacity: 0.08 } }));
  children.push(h('div', { key: 'c2', style: { display: 'flex', position: 'absolute', top: '200px', right: '-120px', width: '500px', height: '500px', borderRadius: '50%', backgroundColor: C.navy, opacity: 0.06 } }));
  children.push(h('div', { key: 'c3', style: { display: 'flex', position: 'absolute', bottom: '-100px', left: '200px', width: '450px', height: '450px', borderRadius: '50%', backgroundColor: C.green, opacity: 0.07 } }));
  children.push(h('div', { key: 'c4', style: { display: 'flex', position: 'absolute', bottom: '100px', right: '50px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: C.red, opacity: 0.1 } }));
  children.push(h('div', { key: 'c5', style: { display: 'flex', position: 'absolute', top: '60px', right: '60px', width: '60px', height: '60px', borderRadius: '12px', backgroundColor: C.red, opacity: 0.15, transform: 'rotate(15deg)' } }));
  children.push(h('div', { key: 'c6', style: { display: 'flex', position: 'absolute', bottom: '80px', left: '80px', width: '40px', height: '40px', borderRadius: '8px', backgroundColor: C.navy, opacity: 0.12, transform: 'rotate(-20deg)' } }));

  // Logo top right
  if (logo) children.push(h('div', { key: 'lr', style: { display: 'flex', position: 'absolute', top: '30px', right: '30px', width: '130px', height: '130px', borderRadius: '20px', overflow: 'hidden', border: '3px solid ' + C.white } }, LogoImg(logo, 130)));

  // Central card
  const cardKids: ReactNode[] = [];
  tl.forEach((line, i) => cardKids.push(h('div', { key: 't'+i, style: { fontSize: '52px', fontWeight: '800', color: C.darkText, textAlign: 'center', lineHeight: '1.2' } }, line)));
  cardKids.push(h('div', { key: 'bar', style: { width: '120px', height: '6px', borderRadius: '3px', marginTop: '28px', marginBottom: '28px', background: 'linear-gradient(90deg, ' + C.red + ', ' + C.navy + ')' } }));
  bl.forEach((line, i) => cardKids.push(h('div', { key: 'b'+i, style: { fontSize: '28px', color: C.bodyText, textAlign: 'center', lineHeight: '1.7', marginTop: i > 0 ? '10px' : '0' } }, line)));

  children.push(h('div', { key: 'card', style: { display: 'flex', flexDirection: 'column', position: 'absolute', top: '160px', left: '70px', right: '70px', bottom: '170px', alignItems: 'center', justifyContent: 'center', borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.9)' } }, ...cardKids));

  // Logo bottom left
  if (logo) children.push(h('div', { key: 'll', style: { display: 'flex', position: 'absolute', bottom: '35px', left: '35px', width: '75px', height: '75px', borderRadius: '50%', overflow: 'hidden', border: '2px solid ' + C.white } }, LogoImg(logo, 75)));

  // Footer
  children.push(h('div', { key: 'ft', style: { display: 'flex', position: 'absolute', bottom: '45px', justifyContent: 'center', width: '100%', fontSize: '14px', color: C.subText } }, '@SGAS.CU  \u2022  Cairo University'));

  return h('div', { style: { display: 'flex', width: W+'px', height: H+'px', position: 'relative', backgroundColor: C.cream, fontFamily: 'Inter, sans-serif' } }, ...children);
}

// ── T2: Diagonal ──
function t2(title: string, body: string[], logo: string | null): ReactNode {
  const tl = wrapText(title, 14);
  const bl = body.flatMap(b => wrapText(b, 28)).slice(0, 5);
  const children: ReactNode[] = [];

  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, ' + C.red + ' 0%, ' + C.darkRed + ' 40%, ' + C.darkNavy + ' 100%)' } }));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '60px', right: '80px', width: '250px', height: '250px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)' } }));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', bottom: '100px', left: '50px', width: '300px', height: '300px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' } }));

  if (logo) children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '40px', left: '40px', width: '110px', height: '110px', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' } }, LogoImg(logo, 90)));

  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '55px', right: '50px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px' } }, SGAS_FULL));

  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '160px', left: '60px', width: '980px', height: '740px', borderRadius: '24px', backgroundColor: 'rgba(0,0,0,0.15)' } }));

  const cardKids: ReactNode[] = [];
  tl.forEach((line, i) => cardKids.push(h('div', { key: 't'+i, style: { fontSize: '50px', fontWeight: '800', color: C.darkText, textAlign: 'center', lineHeight: '1.2' } }, line)));
  cardKids.push(h('div', { key: 'bar', style: { width: '80px', height: '5px', borderRadius: '2px', backgroundColor: C.green, marginTop: '24px', marginBottom: '24px' } }));
  bl.forEach((line, i) => cardKids.push(h('div', { key: 'b'+i, style: { fontSize: '26px', color: C.bodyText, textAlign: 'center', lineHeight: '1.7', marginTop: i > 0 ? '10px' : '0' } }, line)));

  children.push(h('div', { style: { display: 'flex', flexDirection: 'column', position: 'absolute', top: '150px', left: '50px', width: '980px', height: '740px', borderRadius: '24px', backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', padding: '60px' } }, ...cardKids));

  if (logo) children.push(h('div', { style: { display: 'flex', position: 'absolute', bottom: '45px', right: '45px', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' } }, LogoImg(logo, 60)));

  children.push(h('div', { style: { display: 'flex', position: 'absolute', bottom: '55px', left: '50px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' } }, '@SGAS.CU  \u2022  Cairo University'));

  return h('div', { style: { display: 'flex', width: W+'px', height: H+'px', position: 'relative', fontFamily: 'Inter, sans-serif' } }, ...children);
}

// ── T3: Green Nature ──
function t3(title: string, body: string[], logo: string | null): ReactNode {
  const tl = wrapText(title, 16);
  const bl = body.flatMap(b => wrapText(b, 30)).slice(0, 5);
  const children: ReactNode[] = [];

  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: 0, left: 0, width: '100%', height: '360px', background: 'linear-gradient(180deg, ' + C.green + ' 0%, ' + C.darkGreen + ' 100%)' } }));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '310px', left: '-60px', width: '300px', height: '150px', borderRadius: '50%', backgroundColor: C.green } }));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '320px', right: '-80px', width: '350px', height: '160px', borderRadius: '50%', backgroundColor: C.green } }));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '40px', left: '40px', width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)' } }));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '80px', right: '60px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' } }));

  if (logo) children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '80px', left: '475px', width: '130px', height: '130px', borderRadius: '50%', backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' } }, LogoImg(logo, 100)));

  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '230px', width: '100%', justifyContent: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.7)', letterSpacing: '3px' } }, SGAS_FULL));

  const contentKids: ReactNode[] = [];
  tl.forEach((line, i) => contentKids.push(h('div', { key: 't'+i, style: { fontSize: '50px', fontWeight: '800', color: C.darkGreen, textAlign: 'center', lineHeight: '1.2', marginTop: i > 0 ? '4px' : '0' } }, line)));
  contentKids.push(h('div', { key: 'bar', style: { width: '80px', height: '5px', borderRadius: '2px', backgroundColor: C.green, marginTop: '24px', marginBottom: '24px' } }));
  bl.forEach((line, i) => contentKids.push(h('div', { key: 'b'+i, style: { fontSize: '28px', color: C.bodyText, textAlign: 'center', lineHeight: '1.7', marginTop: i > 0 ? '10px' : '0' } }, line)));

  children.push(h('div', { style: { display: 'flex', flexDirection: 'column', position: 'absolute', top: '400px', left: '70px', right: '70px', alignItems: 'center' } }, ...contentKids));

  if (logo) children.push(h('div', { style: { display: 'flex', position: 'absolute', bottom: '50px', right: '50px', width: '65px', height: '65px', borderRadius: '50%', overflow: 'hidden', border: '2px solid ' + C.green, opacity: 0.7, alignItems: 'center', justifyContent: 'center' } }, LogoImg(logo, 60)));

  children.push(h('div', { style: { display: 'flex', position: 'absolute', bottom: '28px', width: '100%', justifyContent: 'center', fontSize: '13px', color: C.subText } }, '@SGAS.CU  \u2022  Cairo University'));

  return h('div', { style: { display: 'flex', width: W+'px', height: H+'px', position: 'relative', backgroundColor: C.offWhite, fontFamily: 'Inter, sans-serif' } }, ...children);
}

// ── T4: Dark Premium ──
function t4(title: string, body: string[], logo: string | null): ReactNode {
  const tl = wrapText(title, 14);
  const bl = body.flatMap(b => wrapText(b, 26)).slice(0, 4);
  const children: ReactNode[] = [];

  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '100px', left: '-100px', width: '350px', height: '350px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)' } }));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', bottom: '50px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.03)' } }));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '300px', right: '100px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: 'rgba(183,28,28,0.08)' } }));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: 0, left: 0, width: '120px', height: '4px', background: 'linear-gradient(90deg, ' + C.red + ', transparent)' } }));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: 0, left: 0, width: '4px', height: '120px', background: 'linear-gradient(180deg, ' + C.red + ', transparent)' } }));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', bottom: 0, right: 0, width: '120px', height: '4px', background: 'linear-gradient(90deg, transparent, ' + C.navy + ')' } }));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', bottom: 0, right: 0, width: '4px', height: '120px', background: 'linear-gradient(180deg, transparent, ' + C.navy + ')' } }));

  if (logo) children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '50px', left: '475px', width: '130px', height: '130px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' } }, LogoImg(logo, 100)));

  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '200px', width: '100%', justifyContent: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.35)', letterSpacing: '3px' } }, SGAS_FULL));

  const contentKids: ReactNode[] = [];
  tl.forEach((line, i) => contentKids.push(h('div', { key: 't'+i, style: { fontSize: '52px', fontWeight: '800', color: C.white, textAlign: 'center', lineHeight: '1.2' } }, line)));
  contentKids.push(h('div', { key: 'bar', style: { width: '120px', height: '5px', borderRadius: '2px', marginTop: '28px', marginBottom: '28px', background: 'linear-gradient(90deg, ' + C.red + ', ' + C.navy + ')' } }));
  bl.forEach((line, i) => contentKids.push(h('div', { key: 'b'+i, style: { fontSize: '28px', color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: '1.7', marginTop: i > 0 ? '10px' : '0' } }, line)));

  children.push(h('div', { style: { display: 'flex', flexDirection: 'column', position: 'absolute', top: '280px', left: '80px', right: '80px', alignItems: 'center' } }, ...contentKids));

  if (logo) {
    children.push(h('div', { style: { display: 'flex', position: 'absolute', bottom: '50px', left: '50px', width: '65px', height: '65px', borderRadius: '12px', overflow: 'hidden', opacity: 0.6, alignItems: 'center', justifyContent: 'center' } }, LogoImg(logo, 65)));
    children.push(h('div', { style: { display: 'flex', position: 'absolute', bottom: '50px', right: '50px', width: '65px', height: '65px', borderRadius: '12px', overflow: 'hidden', opacity: 0.6, alignItems: 'center', justifyContent: 'center' } }, LogoImg(logo, 65)));
  }

  children.push(h('div', { style: { display: 'flex', position: 'absolute', bottom: '28px', width: '100%', justifyContent: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.25)' } }, '@SGAS.CU  \u2022  Cairo University'));

  return h('div', { style: { display: 'flex', width: W+'px', height: H+'px', position: 'relative', background: 'linear-gradient(160deg, #0F0F1A 0%, #1A1A2E 40%, #16213E 100%)', fontFamily: 'Inter, sans-serif' } }, ...children);
}

// ── T5: Corporate Split ──
function t5(title: string, body: string[], logo: string | null): ReactNode {
  const tl = wrapText(title, 13);
  const bl = body.flatMap(b => wrapText(b, 26)).slice(0, 5);
  const children: ReactNode[] = [];

  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: 0, left: 0, width: '380px', height: '100%', background: 'linear-gradient(180deg, ' + C.red + ' 0%, ' + C.darkNavy + ' 100%)' } }));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '50px', left: '340px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: C.red } }));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '100px', left: '30px', width: '320px', height: '320px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' } }));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', bottom: '100px', left: '60px', width: '260px', height: '260px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' } }));

  if (logo) children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '180px', left: '120px', width: '140px', height: '140px', borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' } }, LogoImg(logo, 110)));

  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '340px', width: '380px', justifyContent: 'center', fontSize: '36px', fontWeight: '900', color: 'rgba(255,255,255,0.9)', letterSpacing: '6px' } }, 'SGAS'));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '390px', width: '380px', justifyContent: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px' } }, 'STRIVE & GROW'));
  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '425px', left: '180px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: C.green } }));

  children.push(h('div', { style: { display: 'flex', position: 'absolute', top: '80px', left: '420px', width: '580px', height: '860px', borderRadius: '20px', backgroundColor: C.white } }));

  const cardKids: ReactNode[] = [];
  cardKids.push(h('div', { style: { fontSize: '13px', color: C.subText, letterSpacing: '3px', marginBottom: '40px' } }, 'FEATURED POST'));
  tl.forEach((line, i) => cardKids.push(h('div', { key: 't'+i, style: { fontSize: '44px', fontWeight: '800', color: C.darkText, textAlign: 'center', lineHeight: '1.2', marginTop: i > 0 ? '6px' : '0' } }, line)));
  cardKids.push(h('div', { key: 'bar', style: { width: '60px', height: '5px', borderRadius: '2px', backgroundColor: C.navy, marginTop: '24px', marginBottom: '24px' } }));
  bl.forEach((line, i) => cardKids.push(h('div', { key: 'b'+i, style: { fontSize: '24px', color: C.bodyText, textAlign: 'center', lineHeight: '1.7', marginTop: i > 0 ? '8px' : '0' } }, line)));

  children.push(h('div', { style: { display: 'flex', flexDirection: 'column', position: 'absolute', top: '130px', left: '460px', width: '500px', alignItems: 'center' } }, ...cardKids));

  if (logo) children.push(h('div', { style: { display: 'flex', position: 'absolute', bottom: '110px', right: '60px', width: '55px', height: '55px', borderRadius: '50%', overflow: 'hidden', opacity: 0.5, alignItems: 'center', justifyContent: 'center' } }, LogoImg(logo, 55)));

  children.push(h('div', { style: { display: 'flex', position: 'absolute', bottom: '35px', left: '420px', width: '600px', justifyContent: 'center', fontSize: '13px', color: C.subText } }, '@SGAS.CU  \u2022  Cairo University'));

  return h('div', { style: { display: 'flex', width: W+'px', height: H+'px', position: 'relative', backgroundColor: C.lightGray, fontFamily: 'Inter, sans-serif' } }, ...children);
}

const TMPL: Record<string, (title: string, body: string[], logo: string | null) => ReactNode> = {
  geometric: t1, diagonal: t2, nature: t3, dark: t4, corporate: t5,
};

export async function GET() {
  return NextResponse.json({ styles: [
    { id: 'geometric', name: 'Geometric Overlap', nameAr: 'هندسي' },
    { id: 'diagonal', name: 'Diagonal Card', nameAr: 'دياجونال' },
    { id: 'nature', name: 'Green Nature', nameAr: 'طبيعي' },
    { id: 'dark', name: 'Dark Premium', nameAr: 'داكن فاخر' },
    { id: 'corporate', name: 'Corporate Split', nameAr: 'كوربوريت' },
  ] });
}

export async function POST(request: NextRequest) {
  try {
    const { topic, caption, styleId = 'geometric' } = await request.json();
    if (!topic && !caption) return NextResponse.json({ error: 'Topic or caption is required' }, { status: 400 });

    const { title, body } = await extractPosterText(caption || '', topic || '');
    const fonts = await getFonts();
    const logo = await getLogoBase64();
    const fn = TMPL[styleId] || t1;

    const poster = fn(title, body, logo);
    const imgResponse = new ImageResponse(poster, { width: W, height: H, fonts });
    const buffer = Buffer.from(await imgResponse.arrayBuffer());

    return NextResponse.json({ image: buffer.toString('base64'), success: true, style: styleId, posterTitle: title });
  } catch (error: any) {
    console.error('Image error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
