"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useLang } from "@/components/sgas/LanguageProvider";

interface Bilingual {
  en: string;
  ar: string;
}

// Compact homepage section: same header as the full section, plus a button to its own page.
export default function SectionLinkCard({
  id,
  href,
  badge,
  title1,
  titleHighlight,
  description,
  buttonLabel,
  bgClass,
}: {
  id: string;
  href: string;
  badge: Bilingual;
  title1: Bilingual;
  titleHighlight: Bilingual;
  description: Bilingual;
  buttonLabel: Bilingual;
  bgClass: string;
}) {
  const { lang } = useLang();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section id={id} className={`py-20 sm:py-28 ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-block px-4 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-semibold mb-4">
            {badge[lang]}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {title1[lang]} <span className="text-brand-700">{titleHighlight[lang]}</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">{description[lang]}</p>
          <Link
            href={href}
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-base font-semibold transition-colors shadow-lg"
          >
            {buttonLabel[lang]}
            <Arrow className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
