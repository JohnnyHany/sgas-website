"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Menu, X, Languages, Shield } from "lucide-react";
import { useLang } from "@/components/sgas/LanguageProvider";
import { useAdmin } from "@/components/sgas/AdminProvider";
import { translations } from "@/lib/i18n";
import Link from "next/link";
import { useRouter } from "next/navigation";

const navKeys = [
  { href: "#home", key: "home" },
  { href: "#about", key: "about" },
  { href: "#universities", key: "universities" },
  { href: "#events", key: "events" },
  { href: "#join", key: "join" },
];

function MobileMenu({
  open,
  onClose,
  lang,
  isAdmin,
}: {
  open: boolean;
  onClose: () => void;
  lang: "en" | "ar";
  isAdmin: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <>
      <div
        className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      <div
        className={`lg:hidden fixed top-0 bottom-0 w-72 bg-white shadow-2xl overflow-y-auto ${
          lang === "ar" ? "right-0" : "left-0"
        }`}
        style={{ zIndex: 9999, paddingTop: "80px" }}
      >
        <div className="flex flex-col min-h-full">
          <div className="flex items-center gap-3 p-6 border-b border-brand-100">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden">
              <Image src="/sgas-logo.png" alt="SGAS Logo" fill className="object-cover" />
            </div>
            <div>
              <span className="text-xl font-bold text-brand-700">SGAS</span>
              <p className="text-xs text-brand-500">{translations.nav.subtitle[lang]}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1 p-4">
            {navKeys.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-brand-50 hover:text-brand-700 transition-all duration-200"
              >
                {translations.nav[link.key as keyof typeof translations.nav][lang]}
              </a>
            ))}
            {/* Admin link in mobile menu */}
            <button
              onClick={() => { onClose(); window.location.href = isAdmin ? "/admin" : "/login"; }}
              className="px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              <span className={isAdmin ? "text-brand-600 bg-brand-50 hover:bg-brand-100" : "text-gray-700 hover:bg-brand-50 hover:text-brand-700"}>
                {isAdmin ? "Admin Dashboard" : (lang === "en" ? "Admin Login" : "دخول الأدمن")}
              </span>
            </button>
          </div>
          <div className="mt-auto p-4 border-t border-brand-100">
            <div className="p-4 bg-brand-50 rounded-xl">
              <p className="text-sm font-semibold text-brand-700">SGAS</p>
              <p className="text-xs text-brand-500">{translations.nav.subtitle[lang]}</p>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export default function Navbar() {
  const { lang, setLang } = useLang();
  const { isAdmin } = useAdmin();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-brand-100"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <a href="#home" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-lg group-hover:shadow-brand-500/30 transition-all duration-300">
                <Image src="/sgas-logo.png" alt="SGAS Logo" fill className="object-cover" />
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors duration-300 ${
                    scrolled ? "text-brand-700" : "text-white"
                  }`}
                >
                  SGAS
                </span>
                <span
                  className={`text-[10px] sm:text-xs font-medium -mt-1 transition-colors duration-300 ${
                    scrolled ? "text-brand-500" : "text-brand-200"
                  }`}
                >
                  {translations.nav.subtitle[lang]}
                </span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navKeys.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-brand-500/10 ${
                    scrolled
                      ? "text-gray-700 hover:text-brand-700"
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  {translations.nav[link.key as keyof typeof translations.nav][lang]}
                </a>
              ))}

              {/* Admin Button */}
              <button
                onClick={() => { window.location.href = isAdmin ? "/admin" : "/login"; }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ms-1 ${
                  isAdmin
                    ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
                    : scrolled
                      ? "text-gray-500 hover:text-brand-700 hover:bg-brand-50"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Shield className="h-4 w-4" />
                <span className="hidden xl:inline">{isAdmin ? "Dashboard" : "Admin"}</span>
              </button>

              {/* Language Toggle */}
              <button
                onClick={() => setLang(lang === "en" ? "ar" : "en")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ms-2 ${
                  scrolled
                    ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
                    : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                }`}
              >
                <Languages className="h-4 w-4" />
                {lang === "en" ? "عربي" : "EN"}
              </button>
            </div>

            {/* Mobile: Language + Menu */}
            <div className="flex items-center gap-2 lg:hidden">
              {/* Admin icon (mobile) */}
              <button
                onClick={() => { window.location.href = isAdmin ? "/admin" : "/login"; }}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isAdmin
                    ? "text-brand-600"
                    : scrolled ? "text-brand-700 hover:bg-brand-50" : "text-white hover:bg-white/10"
                }`}
              >
                <Shield className="h-5 w-5" />
              </button>

              <button
                onClick={() => setLang(lang === "en" ? "ar" : "en")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  scrolled
                    ? "bg-brand-50 text-brand-700"
                    : "bg-white/10 text-white"
                }`}
              >
                <Languages className="h-3.5 w-3.5" />
                {lang === "en" ? "عربي" : "EN"}
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  scrolled ? "text-brand-700 hover:bg-brand-50" : "text-white hover:bg-white/10"
                }`}
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Portal */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        lang={lang}
        isAdmin={isAdmin}
      />
    </>
  );
}
