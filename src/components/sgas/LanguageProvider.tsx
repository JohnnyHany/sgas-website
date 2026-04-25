"use client";

import { createContext, useContext, useEffect, useCallback, useSyncExternalStore, type ReactNode } from "react";
import type { Language } from "@/lib/i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  isRTL: false,
});

// External store for mount state
let mountListeners: (() => void)[] = [];
let isClientMounted = false;

function subscribeMount(cb: () => void) {
  mountListeners.push(cb);
  return () => { mountListeners = mountListeners.filter((l) => l !== cb); };
}
function getMountSnapshot() { return isClientMounted; }
function getServerMountSnapshot() { return false; }

// External store for language state
let langListeners: (() => void)[] = [];
let currentLang: Language = "en";

function subscribeLang(cb: () => void) {
  langListeners.push(cb);
  return () => { langListeners = langListeners.filter((l) => l !== cb); };
}
function getLangSnapshot() { return currentLang; }
function getServerLangSnapshot() { return "en" as Language; }

function setExternalLang(newLang: Language) {
  currentLang = newLang;
  langListeners.forEach((l) => l());
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribeMount, getMountSnapshot, getServerMountSnapshot);
  const lang = useSyncExternalStore(subscribeLang, getLangSnapshot, getServerLangSnapshot);

  const isRTL = lang === "ar";

  const setLang = useCallback((newLang: Language) => {
    setExternalLang(newLang);
    localStorage.setItem("sgas-lang", newLang);
  }, []);

  // Initialize: mount + read localStorage (side effects only, no setState)
  useEffect(() => {
    isClientMounted = true;
    mountListeners.forEach((l) => l());

    const saved = localStorage.getItem("sgas-lang") as Language | null;
    if (saved === "ar" || saved === "en") {
      setExternalLang(saved);
    }

    return () => {
      isClientMounted = false;
      mountListeners.forEach((l) => l());
    };
  }, []);

  // Sync dir/lang attributes to DOM (side effect only)
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    html.setAttribute("dir", isRTL ? "rtl" : "ltr");
    html.setAttribute("lang", lang);
  }, [lang, isRTL, mounted]);

  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
