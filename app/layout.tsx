'use client';

import { Playfair_Display, Space_Grotesk, Amiri, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/components/auth/auth-context";
import { SiteSettingsProvider } from "@/components/settings/site-settings-context";
import { SiteMetaSync } from "@/components/settings/site-meta-sync";
import { SEOScripts } from "@/components/seo/seo-scripts";
import { usePathname } from 'next/navigation';

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <>
      <AuthProvider>
        <SiteSettingsProvider>
          <SiteMetaSync />
          {!isAdmin && <Header />}
          <main className={!isAdmin ? "flex-grow pt-[60px] md:pt-[72px]" : "flex-grow"}>
            {children}
          </main>
          {!isAdmin && <Footer />}
        </SiteSettingsProvider>
      </AuthProvider>
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || ''} />
        {process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION && (
          <meta name="msvalidate.01" content={process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION} />
        )}
        {process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION && (
          <meta name="yandex-verification" content={process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION} />
        )}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
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
