import Navbar from "@/components/sgas/Navbar";
import HeroSection from "@/components/sgas/HeroSection";
import AboutSection from "@/components/sgas/AboutSection";
import UniversitiesSection from "@/components/sgas/UniversitiesSection";
import TeamSection from "@/components/sgas/TeamSection";
import EventsSection from "@/components/sgas/EventsSection";
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
        <EventsSection />
        <JoinSection />
      </main>
      <Footer />
    </div>
  );
}