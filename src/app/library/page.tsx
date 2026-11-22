import Navbar from "@/components/sgas/Navbar";
import LibrarySection from "@/components/sgas/LibrarySection";
import Footer from "@/components/sgas/Footer";

export default function LibraryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar solid />
      <main className="flex-1 pt-16 sm:pt-20">
        <LibrarySection />
      </main>
      <Footer />
    </div>
  );
}
