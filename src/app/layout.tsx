import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/components/sgas/LanguageProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sgas-website.vercel.app"),
  title: "SGAS - Strive and Grow in Actuarial Science",
  description:
    "SGAS - Strive and Grow in Actuarial Science. The official student community for Actuarial Science students from Cairo University and Ain Shams University. Study materials, events, and career development.",
  keywords: [
    "SGAS",
    "Strive and Grow in Actuarial Science",
    "actuarial science",
    "Cairo University",
    "Ain Shams University",
    "actuarial students",
    "actuarial materials",
    "علوم اكتوارية",
    "جامعة القاهرة",
    "عين شمس",
    "SOA exams",
    "IFoA",
    "actuarial exams Egypt",
  ],
  authors: [{ name: "SGAS Team", url: "https://sgas-website.vercel.app" }],
  icons: {
    icon: "/sgas-logo.png",
    apple: "/sgas-logo.png",
  },
  openGraph: {
    title: "SGAS - Strive and Grow in Actuarial Science",
    description: "SGAS - Strive and Grow in Actuarial Science. The official student community for Actuarial Science students in Egypt",
    type: "website",
    siteName: "SGAS",
    images: [{ url: "/sgas-logo.png", width: 512, height: 512, alt: "SGAS Logo" }],
    locale: "en_US",
    alternateLocale: "ar_EG",
  },
  twitter: {
    card: "summary",
    title: "SGAS - Strive and Grow in Actuarial Science",
    description: "Student community for Actuarial Science students - Cairo University & Ain Shams University",
    images: ["/sgas-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "tOarrjOAuCPuSJ63PpG6ynzPxdmPdAwdSqOIjjR8YLI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <LanguageProvider>
          {children}
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
