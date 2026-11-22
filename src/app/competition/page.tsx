"use client";

import Navbar from "@/components/sgas/Navbar";
import CompetitionSection from "@/components/sgas/CompetitionSection";
import Footer from "@/components/sgas/Footer";

export default function CompetitionPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar solid />
      <main className="flex-1 pt-16 sm:pt-20">
        <CompetitionSection />
      </main>
      <Footer />
    </div>
  );
}
