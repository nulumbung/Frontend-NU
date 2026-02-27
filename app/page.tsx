'use client';

import { HeroSection } from "@/components/home/hero-section";
import { LatestNewsSection } from "@/components/home/latest-news-section";
import { SpotlightSection } from "@/components/home/spotlight-section";
import { AgendaSection } from "@/components/home/agenda-section";
import { BanomSection } from "@/components/home/banom-section";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";

// Lazy load video section as it's below fold
const VideoSection = dynamic(() => import("@/components/home/video-section").then(mod => ({ default: mod.VideoSection })), {
  loading: () => <div className="py-20 bg-background text-center text-muted-foreground">Loading multimedia...</div>,
  ssr: true,
});

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('login') === 'true') {
       router.replace('/admin/login');
    }
  }, [searchParams, router]);

  return (
    <>
      <HeroSection />
      <LatestNewsSection />
      <SpotlightSection />
      <AgendaSection />
      <BanomSection />
      <Suspense fallback={<div className="py-20 bg-background text-center text-muted-foreground">Loading multimedia...</div>}>
        <VideoSection />
      </Suspense>
    </>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={<div className="py-20">Loading...</div>}>
        <HomeContent />
      </Suspense>
    </div>
  );
}
