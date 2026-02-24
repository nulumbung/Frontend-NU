'use client';

import { HeroSection } from "@/components/home/hero-section";
import { LatestNewsSection } from "@/components/home/latest-news-section";
import { SpotlightSection } from "@/components/home/spotlight-section";
import { AgendaSection } from "@/components/home/agenda-section";
import { BanomSection } from "@/components/home/banom-section";
import { VideoSection } from "@/components/home/video-section";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";

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
      <VideoSection />
    </>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <HomeContent />
      </Suspense>
    </div>
  );
}
