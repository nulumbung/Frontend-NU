'use client';

import { usePathname } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/components/auth/auth-context";
import { SiteSettingsProvider } from "@/components/settings/site-settings-context";
import { SiteMetaSync } from "@/components/settings/site-meta-sync";
import { PWAInstaller } from "@/components/pwa/pwa-installer";

export function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <AuthProvider>
      <SiteSettingsProvider>
        <SiteMetaSync />
        {!isAdmin && <Header />}
        <main className={!isAdmin ? "flex-grow pt-[60px] md:pt-[72px]" : "flex-grow"}>
          {children}
        </main>
        {!isAdmin && <Footer />}
        <PWAInstaller />
      </SiteSettingsProvider>
    </AuthProvider>
  );
}
