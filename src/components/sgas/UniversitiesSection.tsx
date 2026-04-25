"use client";

import { MapPin, Users, BookOpen } from "lucide-react";
import { useLang } from "@/components/sgas/LanguageProvider";
import { translations } from "@/lib/i18n";

export default function UniversitiesSection() {
  const { lang } = useLang();
  const u = translations.universities;

  return (
    <section id="universities" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-semibold mb-4">
            {u.badge[lang]}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {u.title[lang]}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{u.description[lang]}</p>
        </div>

        {/* University Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Cairo University */}
          <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100">
            <div className="h-2 bg-gradient-to-l from-brand-600 to-brand-400" />
            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand-700 transition-colors duration-300">
                  <MapPin className="h-7 w-7 text-brand-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{u.cairoTitle[lang]}</h3>
                  <p className="text-brand-600 font-medium text-sm">{u.cairoSubtitle[lang]}</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">{u.cairoDesc[lang]}</p>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-500" />
                  <span>{u.cairoTag1[lang]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-brand-500" />
                  <span>{u.cairoTag2[lang]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ain Shams University */}
          <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100">
            <div className="h-2 bg-gradient-to-l from-red-brand-600 to-red-brand-400" />
            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-red-brand-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-red-brand-600 transition-colors duration-300">
                  <MapPin className="h-7 w-7 text-red-brand-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{u.ainShamsTitle[lang]}</h3>
                  <p className="text-red-brand-600 font-medium text-sm">{u.ainShamsSubtitle[lang]}</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">{u.ainShamsDesc[lang]}</p>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-red-brand-500" />
                  <span>{u.ainShamsTag1[lang]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-red-brand-500" />
                  <span>{u.ainShamsTag2[lang]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
