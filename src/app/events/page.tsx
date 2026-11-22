import Navbar from "@/components/sgas/Navbar";
import EventsSection from "@/components/sgas/EventsSection";
import Footer from "@/components/sgas/Footer";

export default function EventsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar solid />
      <main className="flex-1 pt-16 sm:pt-20">
        <EventsSection />
      </main>
      <Footer />
    </div>
  );
}
