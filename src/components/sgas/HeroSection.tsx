"use client";

import { Button } from "@/components/ui/button";
import { ArrowDown, GraduationCap, Users, BookOpen, CalendarDays } from "lucide-react";
import { useLang } from "@/components/sgas/LanguageProvider";
import { translations } from "@/lib/i18n";

export default function HeroSection() {
  const { lang } = useLang();
  const hero = translations.hero;

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background - Navy Blue gradient with red accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#001440] via-[#002060] to-[#1a3fa0]" />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#B22222]/15 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-[#006400]/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1.5s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#002060]/10 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
          <span className="w-2 h-2 rounded-full bg-[#006400] animate-pulse" />
          <span className="text-sm text-white/80 font-medium">{hero.badge[lang]}</span>
        </div>

        {/* Main Title */}
        <h1 className="animate-fade-in-up-delay-1 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
          <span className="text-white">SGAS</span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up-delay-1 text-lg sm:text-xl md:text-2xl text-white/90 font-medium mb-4">
          {hero.subtitle[lang]}
        </p>

        {/* Description */}
        <p className="animate-fade-in-up-delay-2 text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          {hero.description1[lang]}
          <br className="hidden sm:block" />
          {hero.description2[lang]}
        </p>

        {/* CTA Buttons - Browse Materials = Red, Learn More = White with green border */}
        <div className="animate-fade-in-up-delay-3 flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            asChild
            size="lg"
            className="bg-[#B22222] hover:bg-[#961d1d] text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-[#B22222]/30 hover:shadow-[#B22222]/40 transition-all duration-300"
          >
            <a href="#join">
              {hero.ctaAbout[lang]}
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            className="bg-[#006400] hover:bg-[#004d30] text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-[#006400]/30 hover:shadow-[#006400]/40 transition-all duration-300"
          >
            <a href="#about">{hero.ctaAbout[lang]}</a>
          </Button>
        </div>

        {/* Stats */}
        <div className="animate-fade-in-up-delay-3 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { icon: GraduationCap, value: "2+", label: hero.statUniversities[lang] },
            { icon: Users, value: "100+", label: hero.statStudents[lang] },
            { icon: BookOpen, value: "30+", label: hero.statMaterials[lang] },
            { icon: CalendarDays, value: "15+", label: hero.statEvents[lang] },
          ].map((stat, index) => (
            <div
              key={index}
              className="glass-effect rounded-xl p-4 hover:bg-white/15 transition-all duration-300"
            >
              <stat.icon className="h-6 w-6 text-[#006400] mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-xs sm:text-sm text-white/70">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <a href="#about" className="text-white/40 hover:text-white/80 transition-colors">
            <ArrowDown className="h-6 w-6" />
          </a>
        </div>
      </div>
    </section>
  );
}
