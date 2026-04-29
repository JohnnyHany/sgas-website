'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

type Step = 'topic' | 'ideas' | 'caption' | 'image' | 'review';

interface Idea {
  id: number; title: string; description: string;
  type: string; suggestedHashtags: string[];
}

interface StyleOption {
  id: string; name: string; nameAr: string; colors: string[];
}

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
  color: string; radius: number;
}

interface LogoSpot { cx: number; cy: number; d: number; }

interface ImageData {
  full: string;
  background: string;
  textLayer: string;
  logo: string | null;
}

const CANVAS_SIZE = 1080;

/* ══════════════════════════════════════════════════════════════
   CANVAS RENDERING — text rendered with browser fonts
   ══════════════════════════════════════════════════════════════ */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function renderToCanvas(
  bgImg: HTMLImageElement | null,
  logoImg: HTMLImageElement | null,
  textItems: (TextBlock | DividerRect)[],
  logoSpots: LogoSpot[],
  textOnly: boolean = false
): string {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Draw background
  if (!textOnly && bgImg) {
    ctx.drawImage(bgImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }

  // Draw text items
  for (const item of textItems) {
    if (item.type === 'divider') {
      ctx.fillStyle = item.color;
      drawRoundRect(ctx, item.x, item.y, item.width, item.height, item.radius);
    } else {
      ctx.font = `${item.fontWeight} ${item.fontSize}px 'Inter', 'Segoe UI', Arial, sans-serif`;
      ctx.fillStyle = item.fill;
      ctx.textAlign = item.anchor === 'middle' ? 'center' : item.anchor === 'end' ? 'right' : 'left';

      for (let i = 0; i < item.lines.length; i++) {
        ctx.fillText(item.lines[i], item.x, item.y + i * item.lineHeight);
      }
    }
  }

  // Draw logos (skip for text-only layer)
  if (!textOnly && logoImg && logoSpots) {
    for (const spot of logoSpots) {
      const left = spot.cx - spot.d / 2;
      const top = spot.cy - spot.d / 2;
      ctx.drawImage(logoImg, left, top, spot.d, spot.d);
    }
  }

  return canvas.toDataURL('image/png');
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════ */

export default function SocialMediaPage() {
  const [step, setStep] = useState<Step>('topic');
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [language, setLanguage] = useState('arabic');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [styleId, setStyleId] = useState('geometric');
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [styleOptions, setStyleOptions] = useState<StyleOption[]>([
    { id: 'geometric', name: 'Geometric Overlap', nameAr: 'هندسي', colors: ['#B71C1C', '#0D47A1', '#FFF8E1'] },
    { id: 'diagonal', name: 'Diagonal Card', nameAr: 'دياجونال', colors: ['#B71C1C', '#082B5E', '#FFFFFF'] },
    { id: 'nature', name: 'Green Nature', nameAr: 'طبيعي', colors: ['#2E7D32', '#FAFAFA', '#1B5E20'] },
    { id: 'dark', name: 'Dark Premium', nameAr: 'داكن فاخر', colors: ['#0F0F1A', '#B71C1C', '#0D47A1'] },
    { id: 'corporate', name: 'Corporate Split', nameAr: 'كوربوريت', colors: ['#B71C1C', '#0D47A1', '#F0F0F0'] },
  ]);

  // Load Inter font + fetch styles
  useEffect(() => {
    // Load Google Font for Canvas
    if (!document.querySelector('link[data-font="inter-poster"]')) {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap';
      link.rel = 'stylesheet';
      link.setAttribute('data-font', 'inter-poster');
      document.head.appendChild(link);
    }

    fetch('/api/social/image')
      .then(r => r.json())
      .then(data => {
        if (data.styles?.length > 0) {
          setStyleOptions(data.styles);
          if (!data.styles.find((s: StyleOption) => s.id === styleId)) {
            setStyleId(data.styles[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const generateIdeas = async () => {
    if (!topic.trim()) { setError('اكتب الموضوع الأول'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/social', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ideas', topic, platform, language }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIdeas(data.ideas); setStep('ideas');
    } catch (err: any) { setError(err.message || 'حصل مشكلة'); }
    finally { setLoading(false); }
  };

  const generateCaption = async () => {
    if (!selectedIdea) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/social', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'caption', topic, platform, language,
          selectedIdea: selectedIdea.title + '. ' + selectedIdea.description,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCaption(data.caption); setHashtags(data.hashtags || []); setStep('caption');
    } catch (err: any) { setError(err.message || 'حصل مشكلة'); }
    finally { setLoading(false); }
  };

  const generateImage = async () => {
    setLoading(true); setError(''); setImageData(null);
    try {
      // Wait for font to be ready for Canvas rendering
      try {
        await document.fonts.load('bold 42px Inter');
        await document.fonts.load('400 22px Inter');
      } catch { /* font already loaded or fallback */ }

      const res = await fetch('/api/social/image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedIdea?.title || topic,
          caption,
          templateId: styleId,
          customBackground: customBg,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Load images from base64
      const bgSrc = 'data:image/png;base64,' + data.background;
      const bgImg = await loadImage(bgSrc);
      const logoImg = data.logo ? await loadImage('data:image/png;base64,' + data.logo) : null;

      const textItems: (TextBlock | DividerRect)[] = data.textItems || [];
      const logoSpots: LogoSpot[] = data.logoSpots || [];

      // Render full composite on Canvas
      const fullDataUrl = renderToCanvas(bgImg, logoImg, textItems, logoSpots, false);

      // Render text-only layer (transparent background)
      const textDataUrl = renderToCanvas(null, null, textItems, [], true);

      setImageData({
        full: fullDataUrl,
        background: bgSrc,
        textLayer: textDataUrl,
        logo: data.logo ? 'data:image/png;base64,' + data.logo : null,
      });
      setStep('image');
    } catch (err: any) { setError(err.message || 'حصل مشكلة'); }
    finally { setLoading(false); }
  };

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllLayers = () => {
    if (!imageData) return;
    const p = `sgas-${styleId}-${Date.now()}`;
    downloadDataUrl(imageData.background, `${p}-background.png`);
    setTimeout(() => downloadDataUrl(imageData.textLayer, `${p}-text.png`), 400);
    if (imageData.logo) {
      setTimeout(() => downloadDataUrl(imageData.logo, `${p}-logo.png`), 800);
    }
    setTimeout(() => downloadDataUrl(imageData.full, `${p}-full.png`), 1200);
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCustomBg(reader.result as string);
    reader.readAsDataURL(file);
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(caption + '\n\n' + hashtags.join(' '));
  };

  const resetAll = () => {
    setStep('topic'); setTopic(''); setIdeas([]); setSelectedIdea(null);
    setCaption(''); setHashtags([]); setImageData(null); setError('');
    setStyleId('geometric'); setCustomBg(null);
  };

  const stepsList: { key: Step; label: string; num: number }[] = [
    { key: 'topic', label: 'الموضوع', num: 1 },
    { key: 'ideas', label: 'الأفكار', num: 2 },
    { key: 'caption', label: 'الكابشن', num: 3 },
    { key: 'image', label: 'الصورة', num: 4 },
    { key: 'review', label: 'المراجعة', num: 5 },
  ];
  const currentStepIndex = ['topic', 'ideas', 'caption', 'image', 'review'].indexOf(step);

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
            &rarr; الرجوع للادمن
          </Link>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-l from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Social Media Manager
            </h1>
            <p className="text-gray-500 text-sm">انشاء بوستات انستا مع طبقات Canva</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-10 px-4">
          {stepsList.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i <= currentStepIndex
                    ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-gray-800 text-gray-500'
                }`}>
                  {i < currentStepIndex ? '\u2713' : s.num}
                </div>
                <span className={`text-xs mt-2 ${i <= currentStepIndex ? 'text-white' : 'text-gray-600'}`}>{s.label}</span>
              </div>
              {i < stepsList.length - 1 && (
                <div className={`w-16 sm:w-24 h-0.5 mx-2 mt-[-20px] ${i < currentStepIndex ? 'bg-purple-500' : 'bg-gray-800'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400 text-center">{error}</div>
        )}

        {/* Step 1: Topic */}
        {step === 'topic' && (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
            <h2 className="text-xl font-bold mb-6">ايه موضوع البوست?</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-gray-400 mb-2 text-sm">الموضوع</label>
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="مثلاً: تعريف بالـ SGAS، ورشة عمل جديدة..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  onKeyDown={(e) => e.key === 'Enter' && generateIdeas()} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2 text-sm">المنصة</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2 text-sm">اللغة</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="arabic">العربية</option>
                    <option value="english">English</option>
                    <option value="both">عربي + انجليزي</option>
                  </select>
                </div>
              </div>
              <button onClick={generateIdeas} disabled={loading}
                className="w-full bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 text-lg">
                {loading ? 'بتولد الأفكار...' : 'ولّد أفكار للبوست'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Ideas */}
        {step === 'ideas' && (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">اختار فكرة البوست</h2>
              <button onClick={generateIdeas} disabled={loading} className="text-sm text-purple-400 hover:text-purple-300">
                {loading ? 'بتولد...' : 'ولّد أفكار جديدة'}
              </button>
            </div>
            <div className="space-y-4">
              {ideas.map((idea) => (
                <button key={idea.id} onClick={() => setSelectedIdea(idea)}
                  className={`w-full text-right p-5 rounded-xl border transition-all ${
                    selectedIdea?.id === idea.id
                      ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {idea.type === 'engagement' && '\uD83D\uDCAC'}
                      {idea.type === 'educational' && '\uD83D\uDCDA'}
                      {idea.type === 'announcement' && '\uD83D\uDCE2'}
                      {idea.type === 'motivational' && '\uD83D\uDCAA'}
                      {idea.type === 'fun' && '\uD83C\uDF89'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{idea.title}</h3>
                      <p className="text-gray-400 text-sm mb-2">{idea.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {idea.suggestedHashtags?.map((tag) => (
                          <span key={tag} className="text-xs bg-gray-700 text-purple-300 px-2 py-1 rounded-full">#{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedIdea?.id === idea.id ? 'border-purple-500 bg-purple-500' : 'border-gray-600'
                    }`}>{selectedIdea?.id === idea.id && '\u2713'}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('topic')} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl">&rarr; رجوع</button>
              <button onClick={generateCaption} disabled={!selectedIdea || loading}
                className="flex-1 bg-gradient-to-l from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
                {loading ? 'بيكتب الكابشن...' : 'اكتب الكابشن'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Caption + Style */}
        {step === 'caption' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <h2 className="text-xl font-bold mb-4">الكابشن</h2>
              <div className="bg-gray-800 rounded-xl p-5 mb-6">
                <pre className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed font-sans">{caption}</pre>
              </div>
              {hashtags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm text-gray-400 mb-2">الهاشتاجات</h3>
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag) => (
                      <span key={tag} className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 mb-2">
                <button onClick={() => setStep('ideas')} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl">&rarr; رجوع</button>
                <button onClick={generateCaption} disabled={loading} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl">
                  {loading ? '\u23F3' : 'كابشن تاني'}
                </button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <h2 className="text-xl font-bold mb-2">اختار ستايل الصورة</h2>
              <p className="text-gray-400 text-sm mb-6">اللوجو الدائري هيتحط فوق وتحت تلقائي</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {styleOptions.map((s) => (
                  <button key={s.id} onClick={() => setStyleId(s.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-center ${
                      styleId === s.id
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
                    }`}>
                    <div className="flex gap-1 justify-center mb-3">
                      {s.colors.map((color, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border border-gray-600" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <p className="font-bold text-sm text-white">{s.nameAr}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.name}</p>
                    {styleId === s.id && (
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">{'\u2713'}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Background */}
              <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                <h3 className="text-sm font-bold text-gray-300 mb-2">خلفية مخصصة (اختياري)</h3>
                <div className="flex items-center gap-4">
                  <label className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm cursor-pointer transition-colors">
                    ارفع خلفية
                    <input type="file" accept="image/*" onChange={handleCustomBgUpload} className="hidden" />
                  </label>
                  {customBg && (
                    <div className="flex items-center gap-3">
                      <img src={customBg} alt="Custom BG" className="w-12 h-12 rounded-lg object-cover border border-gray-600" />
                      <button onClick={() => setCustomBg(null)} className="text-red-400 hover:text-red-300 text-sm">
                        شيل الخلفية
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button onClick={generateImage} disabled={loading}
                className="w-full bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 text-lg">
                {loading ? 'بيعمل الصورة...' : 'اعمل صورة للبوست'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Image + Canva Layers */}
        {step === 'image' && imageData && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <h2 className="text-xl font-bold mb-4">صورة البوست</h2>
              <div className="flex justify-center mb-6">
                <img src={imageData.full} alt="Post"
                  className="w-80 h-80 object-cover rounded-2xl shadow-2xl shadow-purple-500/20" />
              </div>
            </div>

            {/* Canva Layers */}
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <h2 className="text-xl font-bold mb-2">طبقات Canva</h2>
              <p className="text-gray-400 text-sm mb-6">حمّل كل طبقة لوحدها وركبها في Canva</p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <button onClick={() => downloadDataUrl(imageData.background, `sgas-${styleId}-background.png`)}
                  className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-purple-500 rounded-xl p-4 transition-all text-center">
                  <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 bg-gray-700">
                    <img src={imageData.background} alt="BG" className="w-full h-full object-cover" />
                  </div>
                  <p className="font-bold text-sm">Background</p>
                  <p className="text-xs text-gray-400">الخلفية</p>
                </button>

                <button onClick={() => downloadDataUrl(imageData.textLayer, `sgas-${styleId}-text.png`)}
                  className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-purple-500 rounded-xl p-4 transition-all text-center">
                  <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 checkerboard">
                    <img src={imageData.textLayer} alt="Text" className="w-full h-full object-cover" />
                  </div>
                  <p className="font-bold text-sm">Text Layer</p>
                  <p className="text-xs text-gray-400">الكلام</p>
                </button>

                {imageData.logo && (
                  <button onClick={() => downloadDataUrl(imageData.logo, 'sgas-logo-circle.png')}
                    className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-purple-500 rounded-xl p-4 transition-all text-center">
                    <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 checkerboard">
                      <img src={imageData.logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <p className="font-bold text-sm">Logo</p>
                    <p className="text-xs text-gray-400">اللوجو الدائري</p>
                  </button>
                )}

                <button onClick={() => downloadDataUrl(imageData.full, `sgas-${styleId}-full.png`)}
                  className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-green-500 rounded-xl p-4 transition-all text-center">
                  <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 bg-gray-700">
                    <img src={imageData.full} alt="Full" className="w-full h-full object-cover" />
                  </div>
                  <p className="font-bold text-sm">Full Image</p>
                  <p className="text-xs text-gray-400">الكاملة</p>
                </button>
              </div>

              <button onClick={downloadAllLayers}
                className="w-full bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl transition-all">
                حمّل كل الطبقات دفعة واحدة
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('caption')} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl">&rarr; رجوع</button>
              <button onClick={generateImage} disabled={loading} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl">
                {loading ? '\u23F3' : 'صورة تانية'}
              </button>
              <button onClick={() => setStep('review')} className="flex-1 bg-gradient-to-l from-green-600 to-emerald-600 text-white font-bold py-3 rounded-xl">
                مراجعة ونشر
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 'review' && imageData && (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
            <h2 className="text-xl font-bold mb-6 text-center">مراجعة البوست</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-sm text-gray-400 mb-3">الصورة</h3>
                <img src={imageData.full} alt="Post" className="w-full aspect-square object-cover rounded-xl" />
                <button onClick={() => downloadDataUrl(imageData.full, `sgas-${Date.now()}.png`)}
                  className="mt-2 w-full bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm">تحميل الصورة</button>
              </div>
              <div>
                <h3 className="text-sm text-gray-400 mb-3">الكابشن</h3>
                <div className="bg-gray-800 rounded-xl p-4 mb-4 max-h-[300px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed font-sans">{caption}</pre>
                </div>
                <button onClick={copyCaption} className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded-lg text-sm">نسخ الكابشن + الهاشتاجات</button>
              </div>
            </div>
            {hashtags.length > 0 && (
              <div className="mb-8">
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <span key={tag} className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-purple-500/30"
                      onClick={() => navigator.clipboard.writeText('#' + tag)}>#{tag}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="font-bold mb-4 text-center">نشر البوست</h3>
              <p className="text-gray-400 text-sm text-center mb-4">انسخ الكابشن وحمل الصورة واذهب لنشرها يدوياً</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href="https://www.instagram.com/sgas.cu" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gradient-to-l from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl">
                  نشر على انستا
                </a>
                <a href="https://www.linkedin.com/company/sgas-cu" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 rounded-xl">
                  نشر على لينكدإن
                </a>
              </div>
            </div>
            <button onClick={resetAll} className="w-full mt-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl">بوست جديد</button>
          </div>
        )}
      </div>

      {/* Checkerboard CSS for transparent layer preview */}
      <style jsx>{`
        .checkerboard {
          background-image:
            linear-gradient(45deg, #444 25%, transparent 25%),
            linear-gradient(-45deg, #444 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #444 75%),
            linear-gradient(-45deg, transparent 75%, #444 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0;
        }
      `}</style>
    </div>
  );
}
