"use client";

import { useState, useEffect, useRef } from "react";
import { useLang } from "@/components/sgas/LanguageProvider";
import { useAdmin } from "@/components/sgas/AdminProvider";
import { translations } from "@/lib/i18n";
import {
  FileText,
  Presentation,
  Link2,
  Newspaper,
  Pencil,
  Trash2,
  X,
  Plus,
  Upload,
  ExternalLink,
  Download,
  Filter,
  ArrowUpDown,
  BookOpen,
  Loader2,
} from "lucide-react";

interface LibraryItem {
  id: string;
  type: "pdf" | "pptx" | "link" | "article";
  title: string;
  description: string;
  url: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  content: string;
  createdBy: string;
  createdAt: string;
}

const MAX_MB = 10;

const typeConfig: Record<string, {
  icon: typeof FileText;
  en: string;
  ar: string;
  color: string;
}> = {
  pdf: { icon: FileText, en: "PDF", ar: "PDF", color: "bg-red-brand-100 text-red-brand-700 border-red-brand-200" },
  pptx: { icon: Presentation, en: "PowerPoint", ar: "بوربوينت", color: "bg-amber-100 text-amber-700 border-amber-200" },
  link: { icon: Link2, en: "Link", ar: "رابط", color: "bg-brand-100 text-brand-700 border-brand-200" },
  article: { icon: Newspaper, en: "Article", ar: "مقال", color: "bg-leaf-100 text-leaf-700 border-leaf-200" },
};

function formatSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string, lang: "en" | "ar") {
  try {
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/* ---------------- Detail Modal ---------------- */
function ItemModal({ item, lang, onClose }: { item: LibraryItem; lang: "en" | "ar"; onClose: () => void }) {
  const config = typeConfig[item.type];
  const Icon = config.icon;
  const isFile = item.type === "pdf" || item.type === "pptx";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl animate-fade-in-up overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors shadow-sm"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-r from-brand-700 to-brand-900 px-8 pt-8 pb-6 text-white shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full border bg-white/15 border-white/25 text-white">
              {config[lang]}
            </span>
            {isFile && item.fileSize > 0 && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/10 text-white/70">
                {formatSize(item.fileSize)}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold leading-tight pe-8">{item.title}</h3>
        </div>

        <div className="px-8 py-6 space-y-5 overflow-y-auto">
          {item.description && (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{item.description}</p>
          )}

          {item.type === "article" && item.content && (
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
              <p className="text-sm text-gray-800 leading-loose whitespace-pre-line">{item.content}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {isFile && item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" />
                {lang === "en" ? "Download" : "تحميل"}
              </a>
            )}
            {(item.type === "link" || item.type === "article") && item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <ExternalLink className="h-4 w-4" />
                {lang === "en" ? "Open Link" : "فتح الرابط"}
              </a>
            )}
            <span className="text-xs text-gray-400">{formatDate(item.createdAt, lang)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Add / Edit Modal (admin) ---------------- */
function FormModal({
  lang,
  editing,
  onClose,
  onSaved,
}: {
  lang: "en" | "ar";
  editing: LibraryItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<LibraryItem["type"]>(editing?.type || "pdf");
  const [title, setTitle] = useState(editing?.title || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [url, setUrl] = useState(editing?.url && (editing.type === "link" || editing.type === "article") ? editing.url : "");
  const [content, setContent] = useState(editing?.content || "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = !!editing;
  const isFileType = type === "pdf" || type === "pptx";

  const onPickFile = (f: File | null) => {
    setError("");
    if (!f) return setFile(null);
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "ppt", "pptx"].includes(ext || "")) {
      setError(lang === "en" ? "Only PDF / PPT / PPTX files are allowed." : "مسموح فقط بملفات PDF / PPT / PPTX.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(lang === "en" ? `File is larger than ${MAX_MB}MB.` : `حجم الملف أكبر من ${MAX_MB} ميجا.`);
      return;
    }
    setFile(f);
    setType(ext === "pdf" ? "pdf" : "pptx");
  };

  const submit = async () => {
    setError("");
    if (!title.trim()) {
      setError(lang === "en" ? "Title is required." : "الاسم مطلوب.");
      return;
    }
    setSaving(true);
    try {
      let res: Response;
      if (isEdit) {
        const body: any = { title, description };
        if (type === "link") body.url = url;
        if (type === "article") {
          body.content = content;
          body.url = url;
        }
        res = await fetch(`/api/library/${editing!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        if (isFileType && !file) {
          setError(lang === "en" ? "Please choose a file." : "اختار ملف الأول.");
          setSaving(false);
          return;
        }
        const fd = new FormData();
        fd.append("type", type);
        fd.append("title", title);
        fd.append("description", description);
        if (isFileType && file) fd.append("file", file);
        if (type === "link" || type === "article") fd.append("url", url);
        if (type === "article") fd.append("content", content);
        res = await fetch("/api/library", { method: "POST", body: fd });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || (lang === "en" ? "Something went wrong." : "حصلت مشكلة."));
        setSaving(false);
        return;
      }
      onSaved();
    } catch {
      setError(lang === "en" ? "Network error." : "مشكلة في الاتصال.");
      setSaving(false);
    }
  };

  const typeOptions: LibraryItem["type"][] = ["pdf", "pptx", "link", "article"];
  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl max-w-lg w-full max-h-[90vh] shadow-2xl animate-fade-in-up overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors shadow-sm"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-r from-brand-700 to-brand-900 px-8 pt-7 pb-5 text-white shrink-0">
          <h3 className="text-lg font-bold">
            {isEdit
              ? lang === "en" ? "Edit Item" : "تعديل العنصر"
              : lang === "en" ? "Add to Library" : "إضافة للمكتبة"}
          </h3>
        </div>

        <div className="px-8 py-6 space-y-4 overflow-y-auto">
          {/* Type selector (only when adding) */}
          {!isEdit && (
            <div className="grid grid-cols-4 gap-2">
              {typeOptions.map((tk) => {
                const c = typeConfig[tk];
                const I = c.icon;
                const active = type === tk;
                return (
                  <button
                    key={tk}
                    type="button"
                    onClick={() => {
                      setType(tk);
                      setFile(null);
                      setError("");
                    }}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all ${
                      active
                        ? "bg-brand-700 text-white border-brand-700 shadow-sm"
                        : "bg-white border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600"
                    }`}
                  >
                    <I className="h-4 w-4" />
                    {c[lang]}
                  </button>
                );
              })}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              {lang === "en" ? "Title" : "الاسم"}
            </label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              {lang === "en" ? "Description" : "الوصف"}
            </label>
            <textarea
              className={inputCls + " min-h-[90px] resize-y"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
          </div>

          {/* File upload */}
          {!isEdit && isFileType && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                {lang === "en" ? `File (PDF / PowerPoint, max ${MAX_MB}MB)` : `الملف (PDF / بوربوينت، الحد الأقصى ${MAX_MB} ميجا)`}
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.ppt,.pptx"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50/40 text-sm text-gray-500 hover:text-brand-700 transition-all"
              >
                <Upload className="h-4 w-4" />
                {file
                  ? `${file.name} (${formatSize(file.size)})`
                  : lang === "en" ? "Click to choose a file" : "اضغط لاختيار ملف"}
              </button>
            </div>
          )}

          {/* Link */}
          {(type === "link" || type === "article") && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                {type === "link"
                  ? lang === "en" ? "Link URL" : "الرابط"
                  : lang === "en" ? "External link (optional)" : "رابط خارجي (اختياري)"}
              </label>
              <input
                className={inputCls}
                dir="ltr"
                placeholder="https://"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          )}

          {/* Article body */}
          {type === "article" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                {lang === "en" ? "Article text (optional if link is provided)" : "نص المقال (اختياري لو فيه رابط)"}
              </label>
              <textarea
                className={inputCls + " min-h-[160px] resize-y"}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {lang === "en" ? "Cancel" : "إلغاء"}
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit
                ? lang === "en" ? "Save Changes" : "حفظ التعديلات"
                : lang === "en" ? "Publish" : "نشر"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Main Section ---------------- */
export default function LibrarySection() {
  const { lang } = useLang();
  const { isAdmin } = useAdmin();
  const lb = translations.library;

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LibraryItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LibraryItem | null>(null);
  const [sortDir, setSortDir] = useState<"newest" | "oldest">("newest");
  const [filterType, setFilterType] = useState("all");

  const load = () => {
    fetch("/api/library")
      .then((res) => res.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (item: LibraryItem) => {
    const msg = lang === "en" ? `Delete "${item.title}"?` : `هل تريد حذف "${item.title}"؟`;
    if (!confirm(msg)) return;
    const res = await fetch(`/api/library/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } else {
      alert(lang === "en" ? "Failed to delete." : "فشل الحذف.");
    }
  };

  const filters = [
    { key: "all", en: "All", ar: "الكل" },
    { key: "pdf", en: "PDF", ar: "PDF" },
    { key: "pptx", en: "PowerPoint", ar: "بوربوينت" },
    { key: "link", en: "Links", ar: "روابط" },
    { key: "article", en: "Articles", ar: "مقالات" },
  ];

  const visible = (filterType === "all" ? [...items] : items.filter((i) => i.type === filterType)).sort((a, b) => {
    const da = new Date(a.createdAt).getTime();
    const db = new Date(b.createdAt).getTime();
    return sortDir === "newest" ? db - da : da - db;
  });

  return (
    <section id="library" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-semibold mb-4">
            {lb.badge[lang]}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {lb.title1[lang]} <span className="text-brand-700">{lb.titleHighlight[lang]}</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">{lb.description[lang]}</p>

          {isAdmin && (
            <button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold transition-colors shadow-lg"
            >
              <Plus className="h-4 w-4" />
              {lb.addNew[lang]}
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
          </div>
        )}

        {/* Filters */}
        {!loading && items.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <button
              onClick={() => setSortDir(sortDir === "newest" ? "oldest" : "newest")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-brand-300 hover:text-brand-700 transition-all"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortDir === "newest"
                ? lang === "en" ? "Newest First" : "الأحدث أولاً"
                : lang === "en" ? "Oldest First" : "الأقدم أولاً"}
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-gray-400" />
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterType(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterType === f.key
                      ? "bg-brand-700 text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600"
                  }`}
                >
                  {lang === "en" ? f.en : f.ar}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cards */}
        {!loading && visible.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((item) => {
              const config = typeConfig[item.type];
              const Icon = config.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="group bg-gray-50 rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 hover:bg-white transition-all duration-300 relative cursor-pointer"
                >
                  {isAdmin && (
                    <div className="absolute top-3 end-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(item);
                          setFormOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title={lang === "en" ? "Edit" : "تعديل"}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title={lang === "en" ? "Delete" : "حذف"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{formatDate(item.createdAt, lang)}</span>
                  </div>

                  <h4 className="text-base font-bold text-gray-900 mb-2 leading-tight line-clamp-2">{item.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2 min-h-[2.5rem]">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.color}`}>
                      {config[lang]}
                    </span>
                    {item.fileSize > 0 && <span>{formatSize(item.fileSize)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && items.length > 0 && visible.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            {lang === "en" ? "No matching items." : "لا توجد عناصر مطابقة."}
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{lb.empty[lang]}</p>
          </div>
        )}
      </div>

      {selected && <ItemModal item={selected} lang={lang} onClose={() => setSelected(null)} />}

      {formOpen && (
        <FormModal
          lang={lang}
          editing={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </section>
  );
}
