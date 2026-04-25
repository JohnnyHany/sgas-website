"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Calculator,
  BarChart3,
  TrendingUp,
  Shield,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { useLang } from "@/components/sgas/LanguageProvider";
import { translations } from "@/lib/i18n";

const subjectIcons = [Calculator, BarChart3, TrendingUp, Shield, BarChart3, Calculator, TrendingUp, FileText, BookOpen, Calculator];

const yearKeys = ["year1", "year2", "year3", "year4"] as const;
const yearColorMap: Record<number, { bg: string; badge: string; icon: string }> = {
  1: { bg: "bg-blue-500", badge: "bg-blue-100 text-blue-700 border-blue-200", icon: "bg-blue-500" },
  2: { bg: "bg-brand-500", badge: "bg-brand-100 text-brand-700 border-brand-200", icon: "bg-brand-500" },
  3: { bg: "bg-amber-500", badge: "bg-amber-100 text-amber-700 border-amber-200", icon: "bg-amber-500" },
  4: { bg: "bg-red-brand-500", badge: "bg-red-brand-100 text-red-brand-700 border-red-brand-200", icon: "bg-red-brand-500" },
};

export default function MaterialsSection() {
  const { lang } = useLang();
  const m = translations.materials;
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const subjects = translations.subjects;
  const filtered = selectedYear ? subjects.filter((_, i) => i < selectedYear * 3 && i >= (selectedYear - 1) * 3) : subjects;

  return (
    <section id="materials" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-semibold mb-4">
            {m.badge[lang]}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {m.title1[lang]} <span className="text-brand-700">{m.titleHighlight[lang]}</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">{m.description[lang]}</p>
        </div>

        {/* Year Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button
            onClick={() => setSelectedYear(null)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              selectedYear === null
                ? "bg-brand-700 text-white shadow-lg shadow-brand-700/30"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {m.allSubjects[lang]}
          </button>
          {[1, 2, 3, 4].map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                selectedYear === year
                  ? `${yearColorMap[year].icon} text-white shadow-lg`
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {m[yearKeys[year - 1]][lang]}
            </button>
          ))}
        </div>

        {/* Subjects Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((subject, index) => {
            const realIndex = selectedYear ? (selectedYear - 1) * 3 + index : index;
            const Icon = subjectIcons[realIndex];
            const year = Math.floor(realIndex / 3) + 1;
            const colors = yearColorMap[year];
            const isExpanded = expandedCard === realIndex;

            return (
              <div
                key={realIndex}
                className={`group relative bg-white rounded-2xl border transition-all duration-500 overflow-hidden ${
                  isExpanded
                    ? "border-brand-300 shadow-xl shadow-brand-500/10"
                    : "border-gray-100 shadow-sm hover:shadow-lg hover:border-brand-200"
                }`}
              >
                {/* Year Badge */}
                <div className="absolute top-4 start-4">
                  <Badge className={`${colors.badge} text-xs font-semibold px-2.5 py-1`}>
                    {m[yearKeys[year - 1]][lang]}
                  </Badge>
                </div>

                <div className="p-6">
                  {/* Icon & Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center shrink-0`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="pt-1">
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">
                        {lang === "en" ? subject.nameEn : subject.nameAr}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        {lang === "ar" ? subject.nameEn : subject.nameAr}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {lang === "en" ? subject.descEn : subject.descAr}
                  </p>

                  {/* Topics (Expanded) */}
                  {isExpanded && (
                    <div className="mb-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 mb-3">{m.topicsLabel[lang]}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(lang === "en" ? subject.topicsEn : subject.topicsAr).map((topic, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                            {topic}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <button className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
                      <Download className="h-4 w-4" />
                      {m.download[lang]}
                    </button>
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : realIndex)}
                      className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {isExpanded ? m.less[lang] : m.more[lang]}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="text-center mt-12 p-6 bg-brand-50 rounded-2xl border border-brand-100">
          <p className="text-gray-700 font-medium">{m.bottomNote1[lang]}</p>
          <p className="text-sm text-gray-500 mt-2">{m.bottomNote2[lang]}</p>
        </div>
      </div>
    </section>
  );
}
