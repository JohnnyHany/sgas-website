"use client";

import { useState, useEffect, FormEvent } from "react";
import { Trophy, Users, ScrollText, FileText, Scale, Gift, Plus, Trash2, CheckCircle2, Loader2, Clock } from "lucide-react";
import { useLang } from "@/components/sgas/LanguageProvider";
import { translations } from "@/lib/i18n";
import { SCHEDULED, REGISTRATION_OPENS_MS, REGISTRATION_DEADLINE_MS, MIN_TEAM_SIZE, MAX_TEAM_SIZE } from "@/lib/competition";

const c = translations.competition;

interface Member { name: string; age: string; phone: string; university: string; year: string; courses: string }
const emptyMember = (): Member => ({ name: "", age: "", phone: "", university: "", year: "", courses: "" });

function useCountdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return { ready: false, before: false, closed: false, d: 0, h: 0, m: 0, s: 0 };
  const before = now < REGISTRATION_OPENS_MS;
  const target = before ? REGISTRATION_OPENS_MS : REGISTRATION_DEADLINE_MS;
  const diff = Math.max(0, target - now);
  return {
    ready: true,
    before,
    closed: !before && diff === 0,
    d: Math.floor(diff / 86400000),
    h: Math.floor(diff / 3600000) % 24,
    m: Math.floor(diff / 60000) % 60,
    s: Math.floor(diff / 1000) % 60,
  };
}

function ListCard({ icon: Icon, title, items }: { icon: typeof Trophy; title: string; items: readonly string[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center"><Icon className="h-5 w-5" /></div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      <ul className="space-y-2.5 text-gray-600 leading-relaxed">
        {items.map((it) => (
          <li key={it} className="flex gap-2"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-700 shrink-0" /><span>{it}</span></li>
        ))}
      </ul>
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";

export default function CompetitionSection() {
  const { lang } = useLang();
  const cd = useCountdown();
  const closed = cd.closed;

  const [teamName, setTeamName] = useState("");
  const [teamUniversity, setTeamUniversity] = useState("");
  const [members, setMembers] = useState<Member[]>([emptyMember(), emptyMember()]);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [website, setWebsite] = useState("");

  const update = (i: number, k: keyof Member, v: string) =>
    setMembers((ms) => ms.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)));

  const deadlineLabel = new Date(cd.before ? REGISTRATION_OPENS_MS : REGISTRATION_DEADLINE_MS).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
    timeZone: "Africa/Cairo", dateStyle: "full", timeStyle: "short",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/competition/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, teamUniversity, members, website }),
      });
      if (res.ok) { setStatus("done"); return; }
      const data = await res.json().catch(() => ({}));
      setError(data.error === "closed" ? c.errClosed[lang] : data.error === "invalid" ? c.errInvalid[lang] : c.errServer[lang]);
    } catch {
      setError(c.errServer[lang]);
    }
    setStatus("idle");
  }

  const units = [
    { v: cd.d, l: c.days[lang] }, { v: cd.h, l: c.hours[lang] },
    { v: cd.m, l: c.minutes[lang] }, { v: cd.s, l: c.seconds[lang] },
  ];

  return (
    <section className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <span className="inline-block px-4 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-semibold mb-4">{c.badge[lang]}</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {c.title1[lang]} <span className="text-brand-700">{c.titleHighlight[lang]}</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">{c.description[lang]}</p>
        </div>

        {/* Deadline + countdown */}
        <div className="mt-10 bg-brand-700 text-white rounded-2xl p-6 sm:p-8 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-white/80 mb-1"><Clock className="h-4 w-4" />{!SCHEDULED ? c.opensTitle[lang] : cd.before ? c.opensTitle[lang] : c.deadlineTitle[lang]}</div>
          {SCHEDULED && <p className="text-lg sm:text-xl font-bold mb-5">{deadlineLabel}</p>}
          {!SCHEDULED ? (
            <p className="text-2xl font-bold">{c.opensSoon[lang]}</p>
          ) : closed ? (
            <p className="text-2xl font-bold">{c.countdownClosed[lang]}</p>
          ) : (
            <div dir="ltr" className="flex justify-center gap-3 sm:gap-4">
              {units.map((u) => (
                <div key={u.l} className="bg-white/10 rounded-xl px-3 sm:px-5 py-3 min-w-[64px] sm:min-w-[84px]">
                  <div className="text-2xl sm:text-4xl font-bold tabular-nums">{cd.ready ? String(u.v).padStart(2, "0") : "--"}</div>
                  <div className="text-xs sm:text-sm text-white/70">{u.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* About */}
        <div className="mt-10 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-3">{c.aboutTitle[lang]}</h2>
          <p className="text-gray-600 leading-relaxed">{c.aboutText[lang]}</p>
          <p className="text-sm text-gray-500 mt-3">{c.caseNote[lang]}</p>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <ListCard icon={Users} title={c.whoTitle[lang]} items={c.who[lang]} />
          <ListCard icon={ScrollText} title={c.rulesTitle[lang]} items={c.rules[lang]} />
          <ListCard icon={FileText} title={c.submitTitle[lang]} items={c.submit[lang]} />
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center"><Scale className="h-5 w-5" /></div>
              <h3 className="text-lg font-bold text-gray-900">{c.judgingTitle[lang]}</h3>
            </div>
            <ul className="space-y-2.5 text-gray-600">
              {(c.judging[lang] as readonly (readonly string[])[]).map(([label, pts]) => (
                <li key={label} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span>{label}</span><span className="font-bold text-brand-700">{pts}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-500 mt-3">{c.judgingNote[lang]}</p>
          </div>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center gap-4">
          <Gift className="h-8 w-8 text-amber-600 shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">{c.prizesTitle[lang]}</h3>
            <p className="text-gray-700">{c.prizesText[lang]}</p>
          </div>
        </div>

        {/* Registration */}
        <div id="register" className="mt-12 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2"><Trophy className="h-6 w-6 text-brand-700" />{c.formTitle[lang]}</h2>
          {cd.before ? (
            <p className="text-lg font-semibold text-gray-700 mt-4">{c.notOpen[lang]}</p>
          ) : closed ? (
            <p className="text-lg font-semibold text-red-600 mt-4">{c.errClosed[lang]}</p>
          ) : status === "done" ? (
            <div className="mt-4 flex items-start gap-3 text-leaf-700 bg-leaf-50 border border-leaf-100 rounded-xl p-4">
              <CheckCircle2 className="h-6 w-6 shrink-0" /><p className="font-medium">{c.success[lang]}</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-4 space-y-6">
              <p className="text-sm text-gray-500">{c.formNote[lang]}</p>
              {/* honeypot */}
              <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block text-sm font-medium text-gray-700">{c.teamName[lang]}
                  <input required maxLength={100} className={`${inputCls} mt-1`} value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                </label>
                <label className="block text-sm font-medium text-gray-700">{c.teamUni[lang]}
                  <input required maxLength={150} className={`${inputCls} mt-1`} value={teamUniversity} onChange={(e) => setTeamUniversity(e.target.value)} />
                </label>
              </div>
              <p className="text-sm font-medium text-gray-600">{c.teamSize[lang]}</p>
              {members.map((m, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-brand-700">{i === 0 ? c.lead[lang] : `${c.member[lang]} ${i + 1}`}</h4>
                    {i >= MIN_TEAM_SIZE && (
                      <button type="button" onClick={() => setMembers((ms) => ms.filter((_, idx) => idx !== i))} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />{c.removeMember[lang]}
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-gray-600">{c.name[lang]}
                      <input required maxLength={120} className={`${inputCls} mt-1`} value={m.name} onChange={(e) => update(i, "name", e.target.value)} />
                    </label>
                    <label className="block text-xs font-medium text-gray-600">{c.age[lang]}
                      <input required type="number" min={14} max={60} inputMode="numeric" className={`${inputCls} mt-1`} value={m.age} onChange={(e) => update(i, "age", e.target.value)} />
                    </label>
                    <label className="block text-xs font-medium text-gray-600">{c.phone[lang]}
                      <input required type="tel" dir="ltr" maxLength={30} pattern="[0-9+\-\s()]{7,30}" className={`${inputCls} mt-1`} value={m.phone} onChange={(e) => update(i, "phone", e.target.value)} />
                    </label>
                    <label className="block text-xs font-medium text-gray-600">{c.university[lang]}
                      <input required maxLength={150} className={`${inputCls} mt-1`} value={m.university} onChange={(e) => update(i, "university", e.target.value)} />
                    </label>
                    <label className="block text-xs font-medium text-gray-600">{c.year[lang]}
                      <select required className={`${inputCls} mt-1`} value={m.year} onChange={(e) => update(i, "year", e.target.value)}>
                        <option value="">{c.selectYear[lang]}</option>
                        {c.years.en.map((y, yi) => (<option key={y} value={y}>{c.years[lang][yi]}</option>))}
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-gray-600">{c.courses[lang]}
                      <input required maxLength={500} placeholder={c.coursesHint[lang]} className={`${inputCls} mt-1`} value={m.courses} onChange={(e) => update(i, "courses", e.target.value)} />
                    </label>
                  </div>
                </div>
              ))}
              {members.length < MAX_TEAM_SIZE && (
                <button type="button" onClick={() => setMembers((ms) => [...ms, emptyMember()])} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-700 text-brand-700 text-sm font-semibold hover:bg-brand-50 transition-colors">
                  <Plus className="h-4 w-4" />{c.addMember[lang]}
                </button>
              )}
              {error && <p className="text-sm font-medium text-red-600">{error}</p>}
              <button type="submit" disabled={status === "sending"} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold transition-colors shadow-lg">
                {status === "sending" && <Loader2 className="h-5 w-5 animate-spin" />}
                {status === "sending" ? c.submitting[lang] : c.submitBtn[lang]}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
