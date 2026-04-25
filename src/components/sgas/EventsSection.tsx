"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/components/sgas/LanguageProvider";
import { useAdmin } from "@/components/sgas/AdminProvider";
import { translations } from "@/lib/i18n";
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
  Pencil,
} from "lucide-react";
import Link from "next/link";

interface SGASEvent {
  id: string;
  titleEn: string;
  titleAr: string;
  type: "workshop" | "seminar" | "competition" | "networking";
  dateEn: string;
  dateAr: string;
  time: string;
  locationEn: string;
  locationAr: string;
  descEn: string;
  descAr: string;
  status: "past" | "upcoming";
  highlights: string[];
}

const typeConfigMap: Record<string, {
  icon: typeof Video;
  en: string;
  ar: string;
  color: string;
}> = {
  workshop: { icon: Video, en: "Workshop", ar: "ورشة عمل", color: "bg-brand-100 text-brand-700 border-brand-200" },
  seminar: { icon: Mic, en: "Seminar", ar: "محاضرة/ندوة", color: "bg-red-brand-100 text-red-brand-700 border-red-brand-200" },
  competition: { icon: Trophy, en: "Competition", ar: "مسابقة", color: "bg-amber-100 text-amber-700 border-amber-200" },
  networking: { icon: Briefcase, en: "Networking", ar: "تواصل مهني", color: "bg-leaf-100 text-leaf-700 border-leaf-200" },
};

export default function EventsSection() {
  const { lang } = useLang();
  const { isAdmin } = useAdmin();
  const ev = translations.events;
  const [events, setEvents] = useState<SGASEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const pastEvents = events.filter((e) => e.status === "past");
  const upcomingEvents = events.filter((e) => e.status === "upcoming");

  const renderEventCard = (event: SGASEvent) => {
    const config = typeConfigMap[event.type] || typeConfigMap.networking;
    const Icon = config.icon;
    const title = lang === "en" ? event.titleEn : event.titleAr;
    const desc = lang === "en" ? event.descEn : event.descAr;
    const date = lang === "en" ? event.dateEn : event.dateAr;
    const typeLabel = config[lang as "en" | "ar"];

    return (
      <div
        key={event.id}
        className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-300 relative"
      >
        {/* Admin edit button */}
        {isAdmin && (
          <Link
            href="/admin"
            className="absolute top-3 end-3 p-1.5 rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-xs text-gray-400 font-medium">{date}</span>
        </div>

        {event.status === "upcoming" && (
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 mb-2">
            {ev.upcomingBadge[lang]}
          </span>
        )}

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
  };

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

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
          </div>
        )}

        {/* Upcoming Events */}
        {!loading && upcomingEvents.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <h3 className="text-2xl font-bold text-gray-900">{ev.upcoming[lang]}</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingEvents.map(renderEventCard)}
            </div>
          </div>
        )}

        {/* Past Events */}
        {!loading && pastEvents.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="w-3 h-3 rounded-full bg-gray-400" />
              <h3 className="text-2xl font-bold text-gray-900">{ev.past[lang]}</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pastEvents.map(renderEventCard)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && events.length === 0 && (
          <div className="text-center py-12">
            <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No events yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
