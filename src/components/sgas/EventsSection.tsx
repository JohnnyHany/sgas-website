"use client";

import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  Video,
  Trophy,
  Mic,
  Briefcase,
} from "lucide-react";
import { useLang } from "@/components/sgas/LanguageProvider";
import { translations } from "@/lib/i18n";

const typeConfigMap = {
  workshop: { icon: Video, en: "Workshop", ar: "ورشة عمل", color: "bg-brand-100 text-brand-700 border-brand-200" },
  seminar: { icon: Mic, en: "Seminar", ar: "محاضرة/ندوة", color: "bg-red-brand-100 text-red-brand-700 border-red-brand-200" },
  competition: { icon: Trophy, en: "Competition", ar: "مسابقة", color: "bg-amber-100 text-amber-700 border-amber-200" },
  networking: { icon: Briefcase, en: "Networking", ar: "تواصل مهني", color: "bg-leaf-100 text-leaf-700 border-leaf-200" },
};

export default function EventsSection() {
  const { lang } = useLang();
  const ev = translations.events;

  const pastEvents = translations.eventsList.filter((e) => e.status === "past");

  return (
    <section id="events" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-semibold mb-4">
            {ev.badge[lang]}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {ev.title1[lang]} <span className="text-brand-700">{ev.titleHighlight[lang]}</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">{ev.description[lang]}</p>
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="w-3 h-3 rounded-full bg-gray-400" />
              <h3 className="text-2xl font-bold text-gray-900">{ev.past[lang]}</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pastEvents.map((event, index) => {
                const config = typeConfigMap[event.type];
                const Icon = config.icon;
                const title = lang === "en" ? event.titleEn : event.titleAr;
                const desc = lang === "en" ? event.descEn : event.descAr;
                const date = lang === "en" ? event.dateEn : event.dateAr;
                const typeLabel = config[lang];

                return (
                  <div key={index} className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{date}</span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 mb-2 leading-tight">{title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2">{desc}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {event.highlights?.[event.highlights.length - 1] || ""}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.color}`}>
                        {typeLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
