import Navbar from "@/components/sgas/Navbar";
import HeroSection from "@/components/sgas/HeroSection";
import AboutSection from "@/components/sgas/AboutSection";
import UniversitiesSection from "@/components/sgas/UniversitiesSection";
import TeamSection from "@/components/sgas/TeamSection";
import SectionLinkCard from "@/components/sgas/SectionLinkCard";
import { translations } from "@/lib/i18n";
import JoinSection from "@/components/sgas/JoinSection";
import Footer from "@/components/sgas/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <UniversitiesSection />
        <TeamSection />
        <SectionLinkCard
          id="events"
          href="/events"
          bgClass="bg-gray-50"
          badge={translations.events.badge}
          title1={translations.events.title1}
          titleHighlight={translations.events.titleHighlight}
          description={translations.events.description}
          buttonLabel={{ en: "View All Events", ar: "شوف كل الفعاليات" }}
        />
        <SectionLinkCard
          id="library"
          href="/library"
          bgClass="bg-white"
          badge={translations.library.badge}
          title1={translations.library.title1}
          titleHighlight={translations.library.titleHighlight}
          description={translations.library.description}
          buttonLabel={{ en: "Browse the Library", ar: "تصفح المكتبة" }}
        />
        <SectionLinkCard
          id="competition"
          href="/competition"
          bgClass="bg-gray-50"
          badge={translations.competition.badge}
          title1={translations.competition.title1}
          titleHighlight={translations.competition.titleHighlight}
          description={translations.competition.description}
          buttonLabel={translations.competition.buttonLabel}
        />
        <JoinSection />
      </main>
      <Footer />
    </div>
  );
}
