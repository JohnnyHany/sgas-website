'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Step = 'topic' | 'ideas' | 'caption' | 'image' | 'review';

interface Idea {
  id: number;
  title: string;
  description: string;
  type: string;
  suggestedHashtags: string[];
}

interface StyleOption {
  id: string;
  name: string;
  nameAr: string;
}

const DEFAULT_STYLES: StyleOption[] = [
  { id: 'gradient', name: 'AI Gradient', nameAr: 'جرادينت AI' },
  { id: 'geometric', name: 'Geometric', nameAr: 'هندسي' },
  { id: 'dark', name: 'Dark Pro', nameAr: 'داكن احترافي' },
  { id: 'nature', name: 'Nature', nameAr: 'طبيعي' },
  { id: 'corporate', name: 'Corporate', nameAr: 'كوربوريت' },
];

const STYLE_COLORS: Record<string, string[]> = {
  'gradient': ['#B71C1C', '#1A1A2E', '#FFFFFF'],
  'geometric': ['#B71C1C', '#FFFFFF', '#0D47A1'],
  'dark': ['#0A0A14', '#E53935', '#FFFFFF'],
  'nature': ['#2E7D32', '#FFFFFF', '#8BC34A'],
  'corporate': ['#0D47A1', '#FFFFFF', '#B71C1C'],
};

const STYLE_ICONS: Record<string, string> = {
  'gradient': '🎨',
  'geometric': '🔷',
  'dark': '🌙',
  'nature': '🌿',
  'corporate': '💼',
};

export default function SocialMediaPage() {
  const [step, setStep] = useState<Step>('topic');
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [language, setLanguage] = useState('arabic');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [styleId, setStyleId] = useState('gradient');
  const [styleOptions, setStyleOptions] = useState<StyleOption[]>(DEFAULT_STYLES);

  useEffect(() => {
    fetch('/api/social/image')
      .then(r => r.json())
      .then(data => {
        if (data.styles && data.styles.length > 0) {
          setStyleOptions(data.styles);
        }
      })
      .catch(() => {});
  }, []);

  const generateIdeas = async () => {
    if (!topic.trim()) { setError('اكتب الموضوع الأول'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ideas', topic, platform, language }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIdeas(data.ideas);
      setStep('ideas');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const generateCaption = async () => {
    if (!selectedIdea) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'caption', topic, platform, language,
          selectedIdea: selectedIdea.title + '. ' + selectedIdea.description
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCaption(data.caption);
      setHashtags(data.hashtags || []);
      setStep('caption');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const generateImage = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/social/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedIdea?.title || topic,
          caption,
          styleId,
          platform,
          language,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setImageBase64(data.image);
      setImageUrl(`data:image/png;base64,${data.image}`);
      setStep('image');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `sgas-social-${Date.now()}.png`;
    link.click();
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(`${caption}\n\n${hashtags.join(' ')}`);
    alert('تم نسخ الكابشن!');
  };

  const resetAll = () => {
    setStep('topic'); setTopic(''); setIdeas([]); setSelectedIdea(null);
    setCaption(''); setHashtags([]); setImageUrl(''); setImageBase64('');
    setError(''); setStyleId('gradient');
  };

  const stepsList: { key: Step; label: string; num: number }[] = [
    { key: 'topic', label: 'الموضوع', num: 1 },
    { key: 'ideas', label: 'الأفكار', num: 2 },
    { key: 'caption', label: 'الكابشن', num: 3 },
    { key: 'image', label: 'الصورة', num: 4 },
    { key: 'review', label: 'المراجعة', num: 5 },
  ];

  const stepOrder: Step[] = ['topic', 'ideas', 'caption', 'image', 'review'];
  const currentStepIndex = stepOrder.indexOf(step);

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">→ الرجوع للادمن</Link>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-l from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Social Media Manager
            </h1>
            <p className="text-gray-500 text-sm">انشاء بوستات انستا بتستخدم AI + تيمبلتات احترافية</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-10 px-4">
          {stepsList.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i <= currentStepIndex ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-purple-500/25' : 'bg-gray-800 text-gray-500'
                }`}>
                  {i < currentStepIndex ? '✓' : s.num}
                </div>
                <span className={`text-xs mt-2 ${i <= currentStepIndex ? 'text-white' : 'text-gray-600'}`}>{s.label}</span>
              </div>
              {i < stepsList.length - 1 && (
                <div className={`w-16 sm:w-24 h-0.5 mx-2 mt-[-20px] transition-all ${i < currentStepIndex ? 'bg-purple-500' : 'bg-gray-800'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400 text-center">{error}</div>
        )}

        {step === 'topic' && (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
            <h2 className="text-xl font-bold mb-6">ايه موضوع البوست?</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-gray-400 mb-2 text-sm">الموضوع</label>
                <input
                  type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="مثلاً: تعريف بالـ SGAS، ورشة عمل جديدة، نصائح للطلاب..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && generateIdeas()}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2 text-sm">المنصة</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter / X</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2 text-sm">اللغة</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="arabic">العربية</option>
                    <option value="english">English</option>
                    <option value="both">عربي + انجليزي</option>
                  </select>
                </div>
              </div>
              <button onClick={generateIdeas} disabled={loading} className="w-full bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⏳</span> بتولد الأفكار...</span> : '✨ ولّد أفكار للبوست'}
              </button>
            </div>
          </div>
        )}

        {step === 'ideas' && (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">اختار فكرة البوست</h2>
              <button onClick={generateIdeas} disabled={loading} className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                {loading ? '⏳ بتولد...' : '🔄 ولّد أفكار جديدة'}
              </button>
            </div>
            <div className="space-y-4">
              {ideas.map((idea) => (
                <button key={idea.id} onClick={() => setSelectedIdea(idea)}
                  className={`w-full text-right p-5 rounded-xl border transition-all ${selectedIdea?.id === idea.id ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {idea.type === 'engagement' && '💬'}
                      {idea.type === 'educational' && '📚'}
                      {idea.type === 'announcement' && '📢'}
                      {idea.type === 'motivational' && '💪'}
                      {idea.type === 'fun' && '🎉'}
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
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedIdea?.id === idea.id ? 'border-purple-500 bg-purple-500' : 'border-gray-600'}`}>
                      {selectedIdea?.id === idea.id && '✓'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('topic')} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">→ رجوع</button>
              <button onClick={generateCaption} disabled={!selectedIdea || loading} className="flex-1 bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? '⏳ بيكتب الكابشن...' : '✍️ اكتب الكابشن'}
              </button>
            </div>
          </div>
        )}

        {step === 'caption' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <h2 className="text-xl font-bold mb-4">الكابشن</h2>
              <div className="bg-gray-800 rounded-xl p-5 mb-6">
                <pre className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed font-sans">{caption}</pre>
              </div>
              {hashtags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm text-gray-400 mb-2">الهاشتاجات المقترحة</h3>
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag) => (<span key={tag} className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">#{tag}</span>))}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep('ideas')} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">→ رجوع</button>
                <button onClick={generateCaption} disabled={loading} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">{loading ? '⏳' : '🔄 كابشن تاني'}</button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <h2 className="text-xl font-bold mb-1">اختار ستايل الصورة</h2>
              <p className="text-gray-400 text-sm mb-2">AI بيعمل خلفية + الكتابة واللوجو بيتحطوا فوقها</p>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Free</span>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">No API Key</span>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">FLUX AI Model</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {styleOptions.map((s) => (
                  <button key={s.id} onClick={() => setStyleId(s.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-center ${
                      styleId === s.id ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10 scale-105' : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
                    }`}>
                    <div className="flex gap-1 justify-center mb-3">
                      {(STYLE_COLORS[s.id] || ['#888', '#888', '#888']).map((color, i) => (
                        <div key={i} className="w-7 h-7 rounded-full border border-gray-600" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <p className="text-2xl mb-1">{STYLE_ICONS[s.id] || '🎨'}</p>
                    <p className="font-bold text-sm text-white">{s.nameAr}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.name}</p>
                    {styleId === s.id && (
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button onClick={generateImage} disabled={loading}
                className="w-full bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⏳</span> بيعمل الصورة... (ممكن تاخد 10-15 ثانية)</span> : '🎨 اعمل صورة للبوست'}
              </button>
            </div>
          </div>
        )}

        {step === 'image' && (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
            <h2 className="text-xl font-bold mb-4">صورة البوست</h2>
            <div className="flex justify-center mb-6">
              {imageUrl ? (
                <div className="relative group">
                  <img src={imageUrl} alt="Post image" className="w-80 h-80 object-cover rounded-2xl shadow-2xl shadow-purple-500/20" />
                  <button onClick={downloadImage} className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 text-white px-4 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity">⬇️ تحميل</button>
                </div>
              ) : (
                <div className="w-80 h-80 bg-gray-800 rounded-2xl flex items-center justify-center text-gray-500">مفيش صورة</div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('caption')} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">→ رجوع</button>
              <button onClick={generateImage} disabled={loading} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">{loading ? '⏳' : '🔄 صورة تانية'}</button>
              <button onClick={() => setStep('review')} className="flex-1 bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 rounded-xl transition-all">✅ مراجعة ونشر</button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
            <h2 className="text-xl font-bold mb-6 text-center">✨ مراجعة البوست</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-sm text-gray-400 mb-3">الصورة</h3>
                {imageUrl ? (
                  <div className="relative">
                    <img src={imageUrl} alt="Post image" className="w-full aspect-square object-cover rounded-xl" />
                    <button onClick={downloadImage} className="mt-2 w-full bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm transition-colors">⬇️ تحميل الصورة</button>
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">مفيش صورة</div>
                )}
              </div>
              <div>
                <h3 className="text-sm text-gray-400 mb-3">الكابشن</h3>
                <div className="bg-gray-800 rounded-xl p-4 mb-4 max-h-[300px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed font-sans">{caption}</pre>
                </div>
                <button onClick={copyCaption} className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded-lg text-sm transition-colors">📋 نسخ الكابشن + الهاشتاجات</button>
              </div>
            </div>
            {hashtags.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm text-gray-400 mb-2">الهاشتاجات</h3>
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <span key={tag} className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-purple-500/30" onClick={() => navigator.clipboard.writeText(`#${tag}`)}>#{tag}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="font-bold mb-4 text-center">🚀 نشر البوست</h3>
              <p className="text-gray-400 text-sm text-center mb-4">انسخ الكابشن وحمل الصورة، واذهب لنشرها يدوياً</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href="https://www.instagram.com/sgas.cu" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl transition-all">📸 نشر على انستا</a>
                <a href="https://www.linkedin.com/company/sgas-cu" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all">💼 نشر على لينكدإن</a>
              </div>
            </div>
            <button onClick={resetAll} className="w-full mt-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">🔄 بوست جديد</button>
          </div>
        )}
      </div>
    </div>
  );
}
