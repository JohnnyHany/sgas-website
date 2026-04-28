import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/components/sgas/LanguageProvider";
import { AdminProvider } from "@/components/sgas/AdminProvider";

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
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/sgas-logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "SGAS - Strive and Grow in Actuarial Science",
    description: "SGAS - Strive and Grow in Actuarial Science. The official student community for Actuarial Science students in Egypt",
    type: "website",
    siteName: "SGAS",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "SGAS - Strive and Grow in Actuarial Science" }],
    locale: "en_US",
    alternateLocale: "ar_EG",
  },
  twitter: {
    card: "summary",
    title: "SGAS - Strive and Grow in Actuarial Science",
    description: "Student community for Actuarial Science students - Cairo University & Ain Shams University",
    images: ["/og-image.png"],
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SGAS",
  alternateName: "Strive and Grow in Actuarial Science",
  url: "https://sgas-website.vercel.app",
  logo: "https://sgas-website.vercel.app/sgas-logo.png",
  description: "SGAS is a student activity founded at Cairo University's Faculty of Commerce, Department of Actuarial Science. It provides study materials, events, workshops, and career development resources for actuarial science students.",
  foundingDate: "2024",
  foundingLocation: {
    "@type": "Place",
    name: "Cairo University, Faculty of Commerce, Cairo, Egypt",
  },
  sameAs: [
    "https://www.instagram.com/sgas.cu",
    "https://www.linkedin.com/company/sgas/",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SGAS",
  url: "https://sgas-website.vercel.app",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <LanguageProvider>
          <AdminProvider>
            {children}
            <Toaster />
            <Analytics />
          </AdminProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
