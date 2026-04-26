"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/components/sgas/LanguageProvider";
import { useAdmin } from "@/components/sgas/AdminProvider";
import { translations } from "@/lib/i18n";
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
  X,
  ArrowUpDown,
  Filter,
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

function parseDate(event: SGASEvent): Date {
  const dateStr = event.dateEn;
  const parts = dateStr.split(" ");
  const months: Record<string, number> = {
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
  };
  const month = months[parts[0]] ?? 0;
  const day = parseInt(parts[1]?.replace(",", "") || "1", 10);
  const year = parseInt(parts[2] || new Date().getFullYear().toString(), 10);
  return new Date(year, month, day);
}

function EventModal({ event, lang, onClose }: { event: SGASEvent; lang: "en" | "ar"; onClose: () => void }) {
  const config = typeConfigMap[event.type] || typeConfigMap.networking;
  const Icon = config.icon;
  const typeLabel = config[lang as "en" | "ar"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl animate-fade-in-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors shadow-sm"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-brand-700 to-brand-900 px-8 pt-8 pb-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="h-5 w-5" />
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full border bg-white/15 border-white/25 text-white`}>
              {typeLabel}
            </span>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
              event.status === "upcoming"
                ? "bg-green-500/20 text-green-200"
                : "bg-white/10 text-white/60"
            }`}>
              {event.status === "upcoming"
                ? (lang === "en" ? "Upcoming" : "قادمة")
                : (lang === "en" ? "Past Event" : "فعالية سابقة")}
            </span>
          </div>
          <h3 className="text-xl font-bold leading-tight">
            {lang === "en" ? event.titleEn : event.titleAr}
          </h3>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          {/* Info row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays className="h-4 w-4 text-brand-500 shrink-0" />
              <span>{lang === "en" ? event.dateEn : event.dateAr}</span>
            </div>
            {event.time && event.time !== "TBA" && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-brand-500 shrink-0" />
                <span>{event.time}</span>
              </div>
            )}
            {(event.locationEn || event.locationAr) && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-red-brand-500 shrink-0" />
                <span>{lang === "en" ? event.locationEn : event.locationAr}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {lang === "en" ? event.descEn : event.descAr}
            </p>
          </div>

          {/* Highlights */}
          {event.highlights && event.highlights.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {lang === "en" ? "Highlights" : "أبرز النقاط"}
              </p>
              <div className="flex flex-wrap gap-2">
                {event.highlights.map((h, i) => (
                  <span
                    key={i}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border ${config.color}`}
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventFilters({
  lang,
  sortDir,
  setSortDir,
  filterType,
  setFilterType,
}: {
  lang: "en" | "ar";
  sortDir: "newest" | "oldest";
  setSortDir: (d: "newest" | "oldest") => void;
  filterType: string;
  setFilterType: (t: string) => void;
}) {
  const types = [
    { key: "all", en: "All", ar: "الكل" },
    { key: "workshop", en: "Workshop", ar: "ورشة عمل" },
    { key: "seminar", en: "Seminar", ar: "محاضرة" },
    { key: "competition", en: "Competition", ar: "مسابقة" },
    { key: "networking", en: "Networking", ar: "تواصل مهني" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
      {/* Sort button */}
      <button
        onClick={() => setSortDir(sortDir === "newest" ? "oldest" : "newest")}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-brand-300 hover:text-brand-700 transition-all"
      >
        <ArrowUpDown className="h-4 w-4" />
        {sortDir === "newest"
          ? (lang === "en" ? "Newest First" : "الأحدث أولاً")
          : (lang === "en" ? "Oldest First" : "الأقدم أولاً")}
      </button>

      {/* Type filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        {types.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilterType(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === t.key
                ? "bg-brand-700 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600"
            }`}
          >
            {lang === "en" ? t.en : t.ar}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EventsSection() {
  const { lang } = useLang();
  const { isAdmin } = useAdmin();
  const ev = translations.events;
  const [events, setEvents] = useState<SGASEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SGASEvent | null>(null);

  // Upcoming filters
  const [upcomingSort, setUpcomingSort] = useState<"newest" | "oldest">("newest");
  const [upcomingType, setUpcomingType] = useState<string>("all");

  // Past filters
  const [pastSort, setPastSort] = useState<"newest" | "oldest">("newest");
  const [pastType, setPastType] = useState<string>("all");

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const applyFilters = (
    list: SGASEvent[],
    sortDir: "newest" | "oldest",
    filterType: string
  ) => {
    let filtered = filterType === "all"
      ? [...list]
      : list.filter((e) => e.type === filterType);

    filtered.sort((a, b) => {
      const da = parseDate(a).getTime();
      const db = parseDate(b).getTime();
      return sortDir === "newest" ? db - da : da - db;
    });

    return filtered;
  };

  const upcomingEvents = applyFilters(
    events.filter((e) => e.status === "upcoming"),
    upcomingSort,
    upcomingType
  );

  const pastEvents = applyFilters(
    events.filter((e) => e.status === "past"),
    pastSort,
    pastType
  );

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
        onClick={() => setSelectedEvent(event)}
        className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-300 relative cursor-pointer"
      >
        {/* Admin edit button */}
        {isAdmin && (
          <Link
            href="/admin"
            className="absolute top-3 end-3 p-1.5 rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition-colors opacity-0 group-hover:opacity-100 z-10"
            onClick={(e) => e.stopPropagation()}
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
        {!loading && events.filter((e) => e.status === "upcoming").length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <h3 className="text-2xl font-bold text-gray-900">{ev.upcoming[lang]}</h3>
            </div>
            <EventFilters
              lang={lang}
              sortDir={upcomingSort}
              setSortDir={setUpcomingSort}
              filterType={upcomingType}
              setFilterType={setUpcomingType}
            />
            {upcomingEvents.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcomingEvents.map(renderEventCard)}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                {lang === "en" ? "No matching events." : "لا توجد فعاليات مطابقة."}
              </div>
            )}
          </div>
        )}

        {/* Past Events */}
        {!loading && events.filter((e) => e.status === "past").length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-3 h-3 rounded-full bg-gray-400" />
              <h3 className="text-2xl font-bold text-gray-900">{ev.past[lang]}</h3>
            </div>
            <EventFilters
              lang={lang}
              sortDir={pastSort}
              setSortDir={setPastSort}
              filterType={pastType}
              setFilterType={setPastType}
            />
            {pastEvents.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {pastEvents.map(renderEventCard)}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                {lang === "en" ? "No matching events." : "لا توجد فعاليات مطابقة."}
              </div>
            )}
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

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          lang={lang}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </section>
  );
}
