import type { Metadata } from "next";
import { Playfair_Display, Space_Grotesk, Amiri, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { RootLayoutContent } from "@/components/layout/root-layout-content";
import { SEOScripts } from "@/components/seo/seo-scripts";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const amiri = Amiri({
  variable: "--font-amiri",
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    template: '%s | NU LUMBUNG',
    default: 'NU LUMBUNG - Nahdlatul Ulama Lumbung',
  },
  description: 'Platform resmi Nahdlatul Ulama Lumbung. Jelajahi berita, agenda, multimedia, dan informasi organisasi terpercaya.',
  keywords: ['NU', 'Nahdlatul Ulama', 'Lumbung', 'organisasi', 'berita'],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'NU LUMBUNG',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Search Engine Verification */}
        <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || ''} />
        {process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION && (
          <meta name="msvalidate.01" content={process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION} />
        )}
        {process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION && (
          <meta name="yandex-verification" content={process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION} />
        )}

        {/* PWA Configuration */}
        <meta name="theme-color" content="#16a34a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NU LUMBUNG" />
        <meta name="application-name" content="NU LUMBUNG" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.ico" sizes="any" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.ico" />

        <SEOScripts />
      </head>
      <body
        className={`${playfair.variable} ${spaceGrotesk.variable} ${amiri.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground font-sans min-h-screen flex flex-col`}
      >
        <RootLayoutContent>{children}</RootLayoutContent>
      </body>
    </html>
  );
}
