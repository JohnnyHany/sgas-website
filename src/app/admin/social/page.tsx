"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Download,
  ChevronRight,
  ArrowLeft,
  ImageIcon,
  Type,
  Eye,
  Instagram,
  Linkedin,
  Languages,
  Loader2,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { useAdmin } from "@/components/sgas/AdminProvider";

interface PostIdea {
  title: string;
  description: string;
  platform: string;
  type: string;
  bestTime: string;
  language: string;
}

type Step = "idea" | "caption" | "image" | "review";

export default function SocialMediaPage() {
  const router = useRouter();
  const { admin, loading } = useAdmin();

  const [step, setStep] = useState<Step>("idea");
  const [topic, setTopic] = useState("");
  const [ideas, setIdeas] = useState<PostIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<PostIdea | null>(null);
  const [caption, setCaption] = useState("");
  const [platform, setPlatform] = useState<"instagram" | "linkedin" | "both">("instagram");
  const [language, setLanguage] = useState<"en" | "ar" | "both">("en");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  if (!loading && !admin) {
    router.push("/login");
    return null;
  }

  const generateIdeas = async () => {
    setLoadingStep("ideas");
    setError("");
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ideas", topic: topic || undefined }),
      });
      const data = await res.json();
      if (data.ideas) {
        setIdeas(data.ideas);
      } else {
        setError(data.error || "Failed to generate ideas");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoadingStep("");
  };

  const generateCaption = async () => {
    if (!selectedIdea) return;
    setLoadingStep("caption");
    setError("");
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "caption",
          idea: selectedIdea.title + " - " + selectedIdea.description,
          platform,
          language,
        }),
      });
      const data = await res.json();
      if (data.caption) {
        setCaption(data.caption);
        setStep("caption");
      } else {
        setError(data.error || "Failed to generate caption");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoadingStep("");
  };

  const generateImage = async () => {
    if (!selectedIdea) return;
    setLoadingStep("image-prompt");
    setError("");
    try {
      const promptRes = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "image-prompt",
          idea: selectedIdea.title + " - " + selectedIdea.description,
          platform,
        }),
      });
      const promptData = await promptRes.json();
      if (promptData.prompt) {
        setImagePrompt(promptData.prompt);
        setLoadingStep("image");
        const imgRes = await fetch("/api/social/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptData.prompt }),
        });
        const imgData = await imgRes.json();
        if (imgData.image) {
          setImageUrl(imgData.image);
          setStep("image");
        } else {
          setError(imgData.error || "Failed to generate image");
        }
      } else {
        setError(promptData.error || "Failed to generate image prompt");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoadingStep("");
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = caption;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `sgas-post-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFlow = () => {
    setStep("idea");
    setIdeas([]);
    setSelectedIdea(null);
    setCaption("");
    setImageUrl("");
    setImagePrompt("");
    setError("");
    setTopic("");
  };

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "idea", label: "Idea", icon: <Lightbulb className="h-4 w-4" /> },
    { key: "caption", label: "Caption", icon: <Type className="h-4 w-4" /> },
    { key: "image", label: "Image", icon: <ImageIcon className="h-4 w-4" /> },
    { key: "review", label: "Review", icon: <Eye className="h-4 w-4" /> },
  ];

  const getStepIndex = (s: Step) => steps.findIndex((st) => st.key === s);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Social Media Manager</h1>
              <p className="text-sm text-gray-500">AI-powered post creation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">SGAS AI</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-10">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  step === s.key
                    ? "bg-brand-700 text-white shadow-lg shadow-brand-700/30"
                    : getStepIndex(step) > i
                    ? "bg-brand-100 text-brand-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight
                  className={`h-4 w-4 mx-2 ${
                    getStepIndex(step) > i ? "text-brand-400" : "text-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Generate Ideas */}
        {step === "idea" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Generate Post Ideas
              </h2>
              <p className="text-gray-600 mb-4">
                Tell AI what you want to post about, or leave empty for creative suggestions.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., upcoming workshop, exam tips, member spotlight..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                  onKeyDown={(e) => e.key === "Enter" && generateIdeas()}
                />
                <button
                  onClick={generateIdeas}
                  disabled={loadingStep === "ideas"}
                  className="px-6 py-3 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                >
                  {loadingStep === "ideas" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate
                </button>
              </div>
            </div>

            {ideas.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Select an idea to develop:
                </h3>
                {ideas.map((idea, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-brand-300 cursor-pointer transition-all duration-300 hover:shadow-md group"
                    onClick={() => setSelectedIdea(idea)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-brand-50 text-brand-700 rounded-lg text-xs font-semibold">
                            {idea.type}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                            {idea.platform}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                            {idea.language}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{idea.title}</h3>
                        <p className="text-sm text-gray-600">{idea.description}</p>
                        <p className="text-xs text-gray-400 mt-2">Best time: {idea.bestTime}</p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIdea(idea);
                          }}
                          className={`p-2 rounded-xl transition-colors ${
                            selectedIdea?.title === idea.title
                              ? "bg-brand-700 text-white"
                              : "bg-gray-100 text-gray-400 hover:bg-brand-100 hover:text-brand-700"
                          }`}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {selectedIdea && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Platform
                      </label>
                      <div className="flex gap-2">
                        {(["instagram", "linkedin", "both"] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => setPlatform(p)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              platform === p
                                ? p === "instagram"
                                  ? "bg-pink-600 text-white"
                                  : p === "linkedin"
                                  ? "bg-blue-700 text-white"
                                  : "bg-brand-700 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {p === "instagram" && <Instagram className="h-4 w-4" />}
                            {p === "linkedin" && <Linkedin className="h-4 w-4" />}
                            {p === "both" && (
                              <>
                                <Instagram className="h-4 w-4" />
                                <span>+</span>
                                <Linkedin className="h-4 w-4" />
                              </>
                            )}
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Language
                      </label>
                      <div className="flex gap-2">
                        {(["en", "ar", "both"] as const).map((l) => (
                          <button
                            key={l}
                            onClick={() => setLanguage(l)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              language === l
                                ? "bg-brand-700 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            <Languages className="h-4 w-4" />
                            {l === "en" ? "English" : l === "ar" ? "Arabic" : "Both"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedIdea && (
                  <button
                    onClick={generateCaption}
                    disabled={loadingStep === "caption"}
                    className="w-full py-4 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingStep === "caption" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Type className="h-5 w-5" />
                        Write Caption for: &quot;{selectedIdea.title}&quot;
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={generateIdeas}
                  disabled={loadingStep === "ideas"}
                  className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl font-medium hover:border-brand-400 hover:text-brand-600 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingStep === "ideas" ? "animate-spin" : ""}`} />
                  Generate New Ideas
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review Caption */}
        {step === "caption" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Type className="h-5 w-5 text-brand-600" />
                  Post Caption
                </h2>
                <button
                  onClick={copyCaption}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-xl text-sm font-medium hover:bg-brand-100 transition-colors"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm leading-relaxed resize-y"
                placeholder="Caption will appear here..."
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400">
                  {caption.length} characters
                  {platform === "instagram" && caption.length > 2200 && " (over 2200 limit)"}
                </p>
                <button
                  onClick={generateCaption}
                  disabled={loadingStep === "caption"}
                  className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-brand-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingStep === "caption" ? "animate-spin" : ""}`} />
                  Regenerate
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("idea")}
                className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-xl font-bold transition-colors hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Ideas
              </button>
              <button
                onClick={generateImage}
                disabled={loadingStep === "image-prompt" || loadingStep === "image"}
                className="flex-[2] py-4 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingStep === "image-prompt" || loadingStep === "image" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {loadingStep === "image-prompt" ? "Preparing prompt..." : "Generating image..."}
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-5 w-5" />
                    Generate Post Image
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setStep("review")}
              className="w-full py-3 text-brand-600 hover:text-brand-800 font-medium text-sm transition-colors"
            >
              Skip image &rarr; Review & Export
            </button>
          </div>
        )}

        {/* Step 3: Image */}
        {step === "image" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-brand-600" />
                  Post Image
                </h2>
                {imageUrl && (
                  <button
                    onClick={downloadImage}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-xl text-sm font-medium hover:bg-brand-100 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                )}
              </div>
              {loadingStep === "image-prompt" || loadingStep === "image" ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 text-brand-600 animate-spin mb-4" />
                  <p className="text-gray-600 font-medium">
                    {loadingStep === "image-prompt"
                      ? "AI is designing your image..."
                      : "Generating high-quality image..."}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">This may take 10-20 seconds</p>
                </div>
              ) : imageUrl ? (
                <div className="flex justify-center">
                  <img
                    src={imageUrl}
                    alt="Generated post image"
                    className="max-w-md w-full rounded-xl shadow-lg"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <ImageIcon className="h-10 w-10 mb-3" />
                  <p>No image generated yet</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("caption")}
                className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-xl font-bold transition-colors hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </button>
              <button
                onClick={generateImage}
                disabled={loadingStep === "image"}
                className="flex-1 py-4 border-2 border-brand-200 text-brand-700 rounded-xl font-bold transition-colors hover:bg-brand-50 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${loadingStep === "image" ? "animate-spin" : ""}`} />
                New Image
              </button>
              <button
                onClick={() => setStep("review")}
                className="flex-[2] py-4 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="h-5 w-5" />
                Review & Export
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Export */}
        {step === "review" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-brand-700 to-brand-900 rounded-2xl p-6 text-white">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6" />
                Post Ready!
              </h2>
              <p className="text-brand-200 text-sm">
                Review everything below, then copy the caption and download the image to post.
              </p>
            </div>

            {selectedIdea && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Post Details
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Title</p>
                    <p className="font-medium text-gray-900 text-sm">{selectedIdea.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Platform</p>
                    <p className="font-medium text-gray-900 text-sm capitalize">{platform}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Type</p>
                    <p className="font-medium text-gray-900 text-sm capitalize">{selectedIdea.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Language</p>
                    <p className="font-medium text-gray-900 text-sm capitalize">{language}</p>
                  </div>
                </div>
              </div>
            )}

            {imageUrl && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Image
                  </h3>
                  <button
                    onClick={downloadImage}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-xl text-sm font-medium hover:bg-brand-100 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download PNG
                  </button>
                </div>
                <div className="flex justify-center">
                  <img
                    src={imageUrl}
                    alt="Post image"
                    className="max-w-sm w-full rounded-xl shadow-md"
                  />
                </div>
              </div>
            )}

            {caption && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Caption
                  </h3>
                  <button
                    onClick={copyCaption}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-700 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? "Copied!" : "Copy Caption"}
                  </button>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {caption}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Quick Actions
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-colors"
                >
                  <Instagram className="h-6 w-6 text-pink-600" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Open Instagram</p>
                    <p className="text-xs text-gray-500">Paste caption & upload image</p>
                  </div>
                </a>
                <a
                  href="https://www.linkedin.com/feed/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <Linkedin className="h-6 w-6 text-blue-700" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Open LinkedIn</p>
                    <p className="text-xs text-gray-500">Create new post with content</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={generateCaption}
                disabled={loadingStep === "caption"}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold transition-colors hover:bg-gray-50 flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                New Caption
              </button>
              <button
                onClick={generateImage}
                disabled={loadingStep === "image"}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold transition-colors hover:bg-gray-50 flex items-center justify-center gap-2 text-sm"
              >
                <ImageIcon className="h-4 w-4" />
                New Image
              </button>
              <button
                onClick={resetFlow}
                className="flex-[2] py-3 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles className="h-4 w-4" />
                Create New Post
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
