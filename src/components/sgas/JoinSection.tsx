"use client";

import { Button } from "@/components/ui/button";
import {
  Linkedin,
  Instagram,
  MessageCircle,
  Mail,
  ExternalLink,
  Heart,
  Send,
} from "lucide-react";
import { useLang } from "@/components/sgas/LanguageProvider";
import { translations } from "@/lib/i18n";

export default function JoinSection() {
  const { lang } = useLang();
  const j = translations.join;

  return (
    <section id="join" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-semibold mb-4">
            {j.badge[lang]}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {j.title1[lang]} <span className="text-brand-700">{j.titleHighlight[lang]}</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{j.description[lang]}</p>
        </div>

        {/* Social Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/company/sgas/"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 text-center"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300">
              <Linkedin className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">LinkedIn</h3>
            <p className="text-sm text-gray-500 mb-4">{j.linkedinLabel[lang]}</p>
            <span className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium group-hover:gap-2 transition-all">
              {j.followUs[lang]}
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </a>

          {/* WhatsApp */}
          <a
            href="https://chat.whatsapp.com/GFwGss82nOQKnsHn6l88vE"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-200 shadow-sm hover:shadow-xl hover:shadow-green-500/10 transition-all duration-500 text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 group-hover:scale-110 transition-all duration-300">
              <MessageCircle className="h-8 w-8 text-green-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">WhatsApp</h3>
            <p className="text-sm text-gray-500 mb-4">{j.whatsappLabel[lang]}</p>
            <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium group-hover:gap-2 transition-all">
              {j.joinNow[lang]}
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/sgas.cu"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-pink-200 shadow-sm hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-500 text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-purple-600 group-hover:to-pink-600 group-hover:scale-110 transition-all duration-300">
              <Instagram className="h-8 w-8 text-pink-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Instagram</h3>
            <p className="text-sm text-gray-500 mb-4">{j.instagramLabel[lang]}</p>
            <span className="inline-flex items-center gap-1 text-sm text-pink-600 font-medium group-hover:gap-2 transition-all">
              {j.followUs[lang]}
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </a>

          {/* Email */}
          <a
            href="mailto:SGAS.hub@gmail.com"
            className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-brand-200 shadow-sm hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-500 text-center"
          >
            <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-700 group-hover:scale-110 transition-all duration-300">
              <Mail className="h-8 w-8 text-brand-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Email</h3>
            <p className="text-sm text-gray-500 mb-4">{j.emailLabel[lang]}</p>
            <span className="inline-flex items-center gap-1 text-sm text-brand-600 font-medium group-hover:gap-2 transition-all">
              {j.emailUs[lang]}
              <Send className="h-3.5 w-3.5" />
            </span>
          </a>
        </div>

        {/* CTA Banner */}
        <div className="relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 rounded-3xl p-8 sm:p-12 overflow-hidden">
          <div className="absolute top-0 start-0 w-64 h-64 bg-red-brand-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-0 w-64 h-64 bg-leaf-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 text-center">
            <Heart className="h-12 w-12 text-red-brand-400 mx-auto mb-6" />
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">{j.ctaTitle[lang]}</h3>
            <p className="text-brand-200 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">{j.ctaDescription[lang]}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-brand-800 hover:bg-brand-50 px-8 py-6 rounded-xl font-bold shadow-lg transition-all duration-300"
                asChild
              >
                <a href="https://chat.whatsapp.com/GFwGss82nOQKnsHn6l88vE" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="me-2 h-5 w-5" />
                  {j.ctaWhatsApp[lang]}
                </a>
              </Button>
              <Button
                size="lg"
                className="bg-transparent border-2 border-white/40 text-white hover:bg-white/15 hover:border-white/60 px-8 py-6 rounded-xl font-bold transition-all duration-300"
                asChild
              >
                <a href="mailto:SGAS.hub@gmail.com">
                  <Mail className="me-2 h-5 w-5" />
                  {j.ctaEmail[lang]}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
