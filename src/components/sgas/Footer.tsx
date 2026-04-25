"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Linkedin, MessageCircle, Mail, Heart } from "lucide-react";
import { useLang } from "@/components/sgas/LanguageProvider";
import { useAdmin } from "@/components/sgas/AdminProvider";
import { translations } from "@/lib/i18n";
import Link from "next/link";

export default function Footer() {
  const { lang } = useLang();
  const { isAdmin } = useAdmin();
  const f = translations.footer;

  return (
    <footer className="bg-brand-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 sm:py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                <Image src="/sgas-logo.png" alt="SGAS Logo" fill className="object-cover" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">SGAS</span>
                <p className="text-xs text-brand-300 -mt-0.5">
                  Strive and Grow in Actuarial Science
                </p>
              </div>
            </div>
            <p className="text-brand-300 text-sm leading-relaxed">
              {lang === "en" ? f.brandDescEn : f.brandDescAr}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              {f.quickLinks[lang]}
            </h4>
            <ul className="space-y-3">
              {[
                { href: "#home", en: "Home", ar: "الرئيسية" },
                { href: "#about", en: "About SGAS", ar: "عن SGAS" },
                { href: "#team", en: "Our Team", ar: "فريقنا" },
                { href: "#events", en: "Events", ar: "الفعاليات" },
                { href: "#join", en: "Join Us", ar: "انضم لينا" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-brand-300 hover:text-white transition-colors text-sm"
                  >
                    {lang === "en" ? link.en : link.ar}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              {f.ourUniversities[lang]}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-brand-300 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                {lang === "en" ? "Cairo University" : "جامعة القاهرة"} - {lang === "en" ? "Faculty of Commerce" : "كلية التجارة"}
              </li>
              <li className="flex items-center gap-2 text-brand-300 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-brand-400" />
                {lang === "en" ? "Ain Shams University" : "جامعة عين شمس"} - {lang === "en" ? "Faculty of Commerce" : "كلية التجارة"}
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              {f.contactUs[lang]}
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:SGAS.hub@gmail.com"
                  className="flex items-center gap-2 text-brand-300 hover:text-white transition-colors text-sm"
                >
                  <Mail className="h-4 w-4" />
                  SGAS.hub@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/sgas/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-brand-300 hover:text-white transition-colors text-sm"
                >
                  <Linkedin className="h-4 w-4" />
                  SGAS - LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://chat.whatsapp.com/GFwGss82nOQKnsHn6l88vE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-brand-300 hover:text-white transition-colors text-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Group
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="py-6 border-t border-brand-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-brand-400">
            {f.copyright[lang](new Date().getFullYear().toString())}
          </p>
          <div className="flex items-center gap-4">
            {!isAdmin && (
              <Link
                href="/login"
                className="text-xs text-brand-500 hover:text-brand-300 transition-colors"
              >
                Admin
              </Link>
            )}
            <p className="text-sm text-brand-400 flex items-center gap-1">
              {f.madeWith[lang]} <Heart className="h-3.5 w-3.5 text-red-brand-500 fill-red-brand-500" /> {f.byStudents[lang]}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}