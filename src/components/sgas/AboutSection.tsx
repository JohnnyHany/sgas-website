"use client";

import { Target, Lightbulb, Heart, TrendingUp, BookOpen, CalendarDays, Crown } from "lucide-react";
import { useLang } from "@/components/sgas/LanguageProvider";
import { translations } from "@/lib/i18n";

export default function AboutSection() {
  const { lang } = useLang();
  const about = translations.about;

  return (
    <section id="about" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-semibold mb-4">
            {about.badge[lang]}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {about.title1[lang]} <span className="text-brand-700">{about.titleHighlight[lang]}</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">{about.description[lang]}</p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="relative bg-gradient-to-br from-brand-50 to-brand-100/50 rounded-2xl p-8 border border-brand-200/50 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-500">
            <div className="w-14 h-14 bg-brand-700 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-brand-700/30">
              <Target className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-brand-800 mb-4">{about.missionTitle[lang]}</h3>
            <p className="text-gray-700 leading-relaxed">{about.mission[lang]}</p>
          </div>

          <div className="relative bg-gradient-to-br from-red-brand-50 to-red-brand-100/30 rounded-2xl p-8 border border-red-brand-200/50 hover:shadow-xl hover:shadow-red-brand-500/10 transition-all duration-500">
            <div className="w-14 h-14 bg-red-brand-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-red-brand-600/30">
              <Lightbulb className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-red-brand-800 mb-4">{about.visionTitle[lang]}</h3>
            <p className="text-gray-700 leading-relaxed">{about.vision[lang]}</p>
          </div>
        </div>

        {/* What We Offer */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { icon: BookOpen, title: about.offer1Title, desc: about.offer1Desc, color: "brand" as const },
            { icon: CalendarDays, title: about.offer2Title, desc: about.offer2Desc, color: "red" as const },
            { icon: Heart, title: about.offer3Title, desc: about.offer3Desc, color: "leaf" as const },
            { icon: TrendingUp, title: about.offer4Title, desc: about.offer4Desc, color: "amber" as const },
          ].map((item, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-brand-200 shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 ${
                  item.color === "brand"
                    ? "bg-brand-100 text-brand-600 group-hover:bg-brand-700 group-hover:text-white"
                    : item.color === "red"
                    ? "bg-red-brand-100 text-red-brand-600 group-hover:bg-red-brand-600 group-hover:text-white"
                    : item.color === "leaf"
                    ? "bg-leaf-100 text-leaf-600 group-hover:bg-leaf-600 group-hover:text-white"
                    : "bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white"
                }`}
              >
                <item.icon className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">{item.title[lang]}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{item.desc[lang]}</p>
            </div>
          ))}
        </div>

        {/* Founder Section */}
        <div className="relative bg-gradient-to-br from-brand-50 via-white to-red-brand-50 rounded-2xl p-8 sm:p-10 border border-brand-200/50 shadow-lg">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-brand-700 to-red-brand-600 flex items-center justify-center shadow-xl shadow-brand-700/30">
                <Crown className="h-12 w-12 sm:h-14 sm:w-14 text-white" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <span className="inline-block px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-semibold mb-3">
                {about.founderTitle[lang]}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {about.founderName[lang]}
              </h3>
              <p className="text-sm font-medium text-brand-600 mb-4">
                {about.founderRole[lang]}
              </p>
              <p className="text-gray-600 leading-relaxed max-w-2xl">
                {about.founderDesc[lang]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
