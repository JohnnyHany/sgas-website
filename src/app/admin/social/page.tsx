'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
   CANVAS RENDERING
   ══════════════════════════════════════════════════════════════ */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
  textOnly: boolean = false,
  highlightIndex: number = -1
): string {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;

  if (!textOnly && bgImg) {
    ctx.drawImage(bgImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }

  // Draw text items
  for (let idx = 0; idx < textItems.length; idx++) {
    const item = textItems[idx];
    if (item.type === 'divider') {
      ctx.fillStyle = item.color;
      drawRoundRect(ctx, item.x, item.y, item.width, item.height, item.radius);
    } else {
      ctx.font = `${item.fontWeight} ${item.fontSize}px 'Inter','Segoe UI',Arial,sans-serif`;
      ctx.fillStyle = item.fill;
      ctx.textAlign = item.anchor === 'middle' ? 'center' : item.anchor === 'end' ? 'right' : 'left';
      ctx.textBaseline = 'top';

      for (let i = 0; i < item.lines.length; i++) {
        ctx.fillText(item.lines[i], item.x, item.y + i * item.lineHeight);
      }

      // Draw highlight box around selected item
      if (highlightIndex === idx) {
        ctx.save();
        const maxW = item.lines.reduce((mx, ln) => Math.max(mx, ctx.measureText(ln).width), 0);
        let bx = item.x;
        if (item.anchor === 'middle') bx = item.x - maxW / 2;
        else if (item.anchor === 'end') bx = item.x - maxW;

        ctx.strokeStyle = '#FF6B00';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(bx - 6, item.y - 6, maxW + 12, item.lines.length * item.lineHeight + 12);
        ctx.setLineDash([]);

        // Small circle at anchor point
        ctx.fillStyle = '#FF6B00';
        ctx.beginPath();
        ctx.arc(item.x, item.y - 3, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  if (!textOnly && logoImg && logoSpots) {
    for (const spot of logoSpots) {
      ctx.drawImage(logoImg, spot.cx - spot.d / 2, spot.cy - spot.d / 2, spot.d, spot.d);
    }
  }

  return canvas.toDataURL('image/png');
}

/* ══════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════ */

function toHex(color: string): string {
  if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
    if (color.length === 4) {
      return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    return color;
  }
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    return '#' + [m[1], m[2], m[3]].map(v => parseInt(v).toString(16).padStart(2, '0')).join('');
  }
  return '#000000';
}

function getLabelForItem(item: TextBlock | DividerRect, index: number): string {
  if (item.type === 'divider') return `خط فاصل ${index + 1}`;
  const text = item.lines.join(' ').slice(0, 30);
  if (item.fontSize >= 30) return `عنوان: "${text}"`;
  if (item.fontSize >= 18) return `نص: "${text}"`;
  return `تذييل: "${text}"`;
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

  // ── Edit Mode State ──
  const [editMode, setEditMode] = useState(false);
  const [editItems, setEditItems] = useState<(TextBlock | DividerRect)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Refs for canvas re-rendering
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const logoSpotsRef = useRef<LogoSpot[]>([]);
  const textItemsRef = useRef<(TextBlock | DividerRect)[]>([]);
  const dragRef = useRef({ startX: 0, startY: 0, itemX: 0, itemY: 0 });
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  // Load font + styles
  useEffect(() => {
    if (!document.querySelector('link[data-font="inter-poster"]')) {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap';
      link.rel = 'stylesheet';
      link.setAttribute('data-font', 'inter-poster');
      document.head.appendChild(link);
    }
    fetch('/api/social/image').then(r => r.json()).then(data => {
      if (data.styles?.length > 0) {
        setStyleOptions(data.styles);
        if (!data.styles.find((s: StyleOption) => s.id === styleId)) setStyleId(data.styles[0].id);
      }
    }).catch(() => {});
  }, []);

  // Re-render preview when edit changes
  useEffect(() => {
    if (!editMode || !bgImgRef.current) return;
    const preview = renderToCanvas(bgImgRef.current, logoImgRef.current, editItems, logoSpotsRef.current, false, selectedIndex);
    setEditPreview(preview);
  }, [editItems, editMode, selectedIndex]);

  // Global mouseup for drag
  useEffect(() => {
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, []);

  /* ══════════════════════════════════════════════════════════════
     EDIT HELPERS
     ══════════════════════════════════════════════════════════════ */

  const enterEditMode = () => {
    const copy = JSON.parse(JSON.stringify(textItemsRef.current)) as (TextBlock | DividerRect)[];
    setEditItems(copy);
    setSelectedIndex(0);
    setEditMode(true);
  };

  const saveEdit = () => {
    if (!bgImgRef.current) return;
    const full = renderToCanvas(bgImgRef.current, logoImgRef.current, editItems, logoSpotsRef.current, false, -1);
    const txtOnly = renderToCanvas(null, null, editItems, [], true, -1);
    textItemsRef.current = JSON.parse(JSON.stringify(editItems));
    setImageData(prev => prev ? { ...prev, full, textLayer: txtOnly } : prev);
    setEditMode(false);
    setSelectedIndex(-1);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setSelectedIndex(-1);
    setEditItems([]);
  };

  const updateItem = (index: number, changes: Record<string, any>) => {
    setEditItems(prev => prev.map((it, i) => (i === index ? { ...it, ...changes } : it)));
  };

  const deleteItem = (index: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== index));
    if (selectedIndex === index) setSelectedIndex(-1);
    else if (selectedIndex > index) setSelectedIndex(prev => prev - 1);
  };

  const addTextItem = () => {
    setEditItems(prev => [...prev, {
      type: 'text' as const,
      lines: ['New Text'],
      x: 540, y: 540,
      lineHeight: 36,
      fontSize: 24,
      fontWeight: 'bold',
      fill: '#000000',
      anchor: 'middle',
    }]);
    setSelectedIndex(editItems.length);
  };

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editMode || selectedIndex < 0) return;
    const item = editItems[selectedIndex];
    if (item.type !== 'text') return;
    const rect = canvasWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = CANVAS_SIZE / rect.width;
    const cx = (e.clientX - rect.left) * scale;
    const cy = (e.clientY - rect.top) * scale;
    dragRef.current = { startX: cx, startY: cy, itemX: item.x, itemY: item.y };
    setIsDragging(true);
  }, [editMode, selectedIndex, editItems]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || selectedIndex < 0) return;
    e.preventDefault();
    const rect = canvasWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = CANVAS_SIZE / rect.width;
    const cx = (e.clientX - rect.left) * scale;
    const cy = (e.clientY - rect.top) * scale;
    const nx = Math.round(dragRef.current.itemX + (cx - dragRef.current.startX));
    const ny = Math.round(dragRef.current.itemY + (cy - dragRef.current.startY));
    updateItem(selectedIndex, { x: nx, y: ny });
  }, [isDragging, selectedIndex]);

  /* ══════════════════════════════════════════════════════════════
     API CALLS
     ══════════════════════════════════════════════════════════════ */

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
        body: JSON.stringify({ action: 'caption', topic, platform, language, selectedIdea: selectedIdea.title + '. ' + selectedIdea.description }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCaption(data.caption); setHashtags(data.hashtags || []); setStep('caption');
    } catch (err: any) { setError(err.message || 'حصل مشكلة'); }
    finally { setLoading(false); }
  };

  const generateImage = async () => {
    setLoading(true); setError(''); setImageData(null); setEditMode(false);
    try {
      try { await document.fonts.load('bold 42px Inter'); await document.fonts.load('400 22px Inter'); } catch {}
      const res = await fetch('/api/social/image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selectedIdea?.title || topic, caption, templateId: styleId, customBackground: customBg }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const bgImg = await loadImage('data:image/png;base64,' + data.background);
      const logoImg = data.logo ? await loadImage('data:image/png;base64,' + data.logo) : null;
      const textItems: (TextBlock | DividerRect)[] = data.textItems || [];
      const logoSpots: LogoSpot[] = data.logoSpots || [];

      bgImgRef.current = bgImg;
      logoImgRef.current = logoImg;
      logoSpotsRef.current = logoSpots;
      textItemsRef.current = textItems;

      const fullDataUrl = renderToCanvas(bgImg, logoImg, textItems, logoSpots, false);
      const textDataUrl = renderToCanvas(null, null, textItems, [], true);

      setImageData({
        full: fullDataUrl,
        background: 'data:image/png;base64,' + data.background,
        textLayer: textDataUrl,
        logo: data.logo ? 'data:image/png;base64,' + data.logo : null,
      });
      setStep('image');
    } catch (err: any) { setError(err.message || 'حصل مشكلة'); }
    finally { setLoading(false); }
  };

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl; link.download = filename;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const downloadAllLayers = () => {
    if (!imageData) return;
    const p = `sgas-${styleId}-${Date.now()}`;
    downloadDataUrl(imageData.background, `${p}-background.png`);
    setTimeout(() => downloadDataUrl(imageData.textLayer, `${p}-text.png`), 400);
    if (imageData.logo) setTimeout(() => downloadDataUrl(imageData.logo, `${p}-logo.png`), 800);
    setTimeout(() => downloadDataUrl(imageData.full, `${p}-full.png`), 1200);
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCustomBg(reader.result as string);
    reader.readAsDataURL(file);
  };

  const copyCaption = () => navigator.clipboard.writeText(caption + '\n\n' + hashtags.join(' '));

  const resetAll = () => {
    setStep('topic'); setTopic(''); setIdeas([]); setSelectedIdea(null);
    setCaption(''); setHashtags([]); setImageData(null); setError('');
    setStyleId('geometric'); setCustomBg(null); setEditMode(false);
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
          <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">&rarr; الرجوع للادمن</Link>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-l from-blue-400 to-purple-400 bg-clip-text text-transparent">AI Social Media Manager</h1>
            <p className="text-gray-500 text-sm">انشاء بوستات انستا مع تعديل الكلام و طبقات Canva</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Progress */}
        <div className="flex items-center justify-between mb-10 px-4">
          {stepsList.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i <= currentStepIndex ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-purple-500/25' : 'bg-gray-800 text-gray-500'
                }`}>{i < currentStepIndex ? '\u2713' : s.num}</div>
                <span className={`text-xs mt-2 ${i <= currentStepIndex ? 'text-white' : 'text-gray-600'}`}>{s.label}</span>
              </div>
              {i < stepsList.length - 1 && <div className={`w-16 sm:w-24 h-0.5 mx-2 mt-[-20px] ${i < currentStepIndex ? 'bg-purple-500' : 'bg-gray-800'}`} />}
            </div>
          ))}
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400 text-center">{error}</div>}

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
              <button onClick={generateIdeas} disabled={loading} className="text-sm text-purple-400 hover:text-purple-300">{loading ? 'بتولد...' : 'ولّد أفكار جديدة'}</button>
            </div>
            <div className="space-y-4">
              {ideas.map((idea) => (
                <button key={idea.id} onClick={() => setSelectedIdea(idea)}
                  className={`w-full text-right p-5 rounded-xl border transition-all ${
                    selectedIdea?.id === idea.id ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
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
                        {idea.suggestedHashtags?.map((tag) => (<span key={tag} className="text-xs bg-gray-700 text-purple-300 px-2 py-1 rounded-full">#{tag}</span>))}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedIdea?.id === idea.id ? 'border-purple-500 bg-purple-500' : 'border-gray-600'}`}>
                      {selectedIdea?.id === idea.id && '\u2713'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('topic')} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl">&rarr; رجوع</button>
              <button onClick={generateCaption} disabled={!selectedIdea || loading} className="flex-1 bg-gradient-to-l from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
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
                    {hashtags.map((tag) => (<span key={tag} className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">#{tag}</span>))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 mb-2">
                <button onClick={() => setStep('ideas')} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl">&rarr; رجوع</button>
                <button onClick={generateCaption} disabled={loading} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl">{loading ? '\u23F3' : 'كابشن تاني'}</button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <h2 className="text-xl font-bold mb-2">اختار ستايل الصورة</h2>
              <p className="text-gray-400 text-sm mb-6">اللوجو الدائري هيتحط تلقائي</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {styleOptions.map((s) => (
                  <button key={s.id} onClick={() => setStyleId(s.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-center ${
                      styleId === s.id ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10' : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
                    }`}>
                    <div className="flex gap-1 justify-center mb-3">
                      {s.colors.map((color, i) => (<div key={i} className="w-6 h-6 rounded-full border border-gray-600" style={{ backgroundColor: color }} />))}
                    </div>
                    <p className="font-bold text-sm text-white">{s.nameAr}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.name}</p>
                    {styleId === s.id && (<div className="absolute -top-2 -left-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"><span className="text-xs text-white">{'\u2713'}</span></div>)}
                  </button>
                ))}
              </div>
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
                      <button onClick={() => setCustomBg(null)} className="text-red-400 hover:text-red-300 text-sm">شيل الخلفية</button>
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

        {/* Step 4: Image + Edit + Canva Layers */}
        {step === 'image' && imageData && (
          <div className="space-y-6">
            {/* Image Preview + Edit Button */}
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">صورة البوست</h2>
                {!editMode && (
                  <button onClick={enterEditMode}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-bold transition-colors">
                    تعديل الكلام
                  </button>
                )}
              </div>
              <div className="flex justify-center">
                <div
                  ref={canvasWrapRef}
                  className={`relative w-80 h-80 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20 ${editMode ? 'cursor-crosshair' : ''}`}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                >
                  <img
                    src={editMode && editPreview ? editPreview : imageData.full}
                    alt="Post"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {editMode && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {isDragging ? 'اسحب...' : 'اختار عنصر واسحبه'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Mode Panel */}
            {editMode && (
              <div className="bg-gray-900 rounded-2xl p-8 border border-orange-500/30">
                <h2 className="text-xl font-bold mb-2">تعديل الكلام على الصورة</h2>
                <p className="text-gray-400 text-sm mb-6">
                  اختار عنصر من القائمة وعدّله - أو اسحبه على الصورة لتغيير المكان
                </p>

                <div className="space-y-3 mb-6">
                  {editItems.map((item, index) => (
                    <div key={index} onClick={() => setSelectedIndex(index)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedIndex === index ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
                      }`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-orange-300">
                          {getLabelForItem(item, index)}
                        </span>
                        <div className="flex gap-2">
                          {selectedIndex === index && (
                            <button onClick={(e) => { e.stopPropagation(); deleteItem(index); }}
                              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-500/10 rounded">
                              حذف
                            </button>
                          )}
                        </div>
                      </div>

                      {selectedIndex === index && (
                        <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                          {item.type === 'text' ? (
                            <>
                              {/* Text Content */}
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">المحتوى</label>
                                <textarea
                                  value={item.lines.join('\n')}
                                  onChange={(e) => updateItem(index, { lines: e.target.value.split('\n') })}
                                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-orange-500"
                                  rows={Math.max(2, item.lines.length)}
                                />
                              </div>

                              {/* Font Size + Bold */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">حجم الخط: {item.fontSize}px</label>
                                  <input type="range" min="10" max="80" value={item.fontSize}
                                    onChange={(e) => updateItem(index, {
                                      fontSize: parseInt(e.target.value),
                                      lineHeight: Math.round(parseInt(e.target.value) * 1.35),
                                    })}
                                    className="w-full accent-orange-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">غامق</label>
                                  <button onClick={() => updateItem(index, { fontWeight: item.fontWeight === 'bold' ? 'normal' : 'bold' })}
                                    className={`w-full py-1.5 rounded-lg text-sm font-bold transition-colors ${
                                      item.fontWeight === 'bold' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'
                                    }`}>
                                    {item.fontWeight === 'bold' ? 'Bold ON' : 'Bold OFF'}
                                  </button>
                                </div>
                              </div>

                              {/* Color */}
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">اللون</label>
                                <div className="flex gap-2 items-center">
                                  <input type="color" value={toHex(item.fill)}
                                    onChange={(e) => updateItem(index, { fill: e.target.value })}
                                    className="w-8 h-8 rounded cursor-pointer border border-gray-600"
                                  />
                                  <input type="text" value={item.fill}
                                    onChange={(e) => updateItem(index, { fill: e.target.value })}
                                    className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg px-2 py-1 text-xs font-mono"
                                  />
                                </div>
                              </div>

                              {/* Position */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">X (موقع أفقي)</label>
                                  <input type="number" value={Math.round(item.x)}
                                    onChange={(e) => updateItem(index, { x: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-2 py-1 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">Y (موقع رأسي)</label>
                                  <input type="number" value={Math.round(item.y)}
                                    onChange={(e) => updateItem(index, { y: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-2 py-1 text-sm"
                                  />
                                </div>
                              </div>

                              {/* Alignment */}
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">المحاذاة</label>
                                <div className="flex gap-2">
                                  {[
                                    { val: 'start', label: 'يمين' },
                                    { val: 'middle', label: 'وسط' },
                                    { val: 'end', label: 'شمال' },
                                  ].map(a => (
                                    <button key={a.val} onClick={() => updateItem(index, { anchor: a.val })}
                                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                        item.anchor === a.val ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'
                                      }`}>
                                      {a.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          ) : (
                            /* Divider controls */
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">اللون</label>
                                <input type="color" value={toHex(item.color)}
                                  onChange={(e) => updateItem(index, { color: e.target.value })}
                                  className="w-full h-8 rounded cursor-pointer border border-gray-600"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">العرض</label>
                                <input type="number" value={item.width}
                                  onChange={(e) => updateItem(index, { width: parseInt(e.target.value) || 10 })}
                                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-2 py-1 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">الارتفاع</label>
                                <input type="number" value={item.height}
                                  onChange={(e) => updateItem(index, { height: parseInt(e.target.value) || 2 })}
                                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-2 py-1 text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add New Text */}
                <button onClick={addTextItem}
                  className="w-full py-3 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 rounded-xl text-blue-300 text-sm font-bold mb-4 transition-colors">
                  + إضافة كلام جديد
                </button>

                {/* Save / Cancel */}
                <div className="flex gap-3">
                  <button onClick={saveEdit}
                    className="flex-1 py-3 bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all">
                    حفظ التغييرات
                  </button>
                  <button onClick={cancelEdit}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors">
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* Canva Layers */}
            {!editMode && (
              <>
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
                  <button onClick={generateImage} disabled={loading} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl">{loading ? '\u23F3' : 'صورة تانية'}</button>
                  <button onClick={() => setStep('review')} className="flex-1 bg-gradient-to-l from-green-600 to-emerald-600 text-white font-bold py-3 rounded-xl">مراجعة ونشر</button>
                </div>
              </>
            )}
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
                  className="flex items-center justify-center gap-2 bg-gradient-to-l from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl">نشر على انستا</a>
                <a href="https://www.linkedin.com/company/sgas-cu" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 rounded-xl">نشر على لينكدإن</a>
              </div>
            </div>
            <button onClick={resetAll} className="w-full mt-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl">بوست جديد</button>
          </div>
        )}
      </div>

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
