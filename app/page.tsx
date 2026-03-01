import { HeroSection, HeroData } from "@/components/home/hero-section";
import { LatestNewsSection, LatestNewsData } from "@/components/home/latest-news-section";
import { SpotlightSection, SpotlightData } from "@/components/home/spotlight-section";
import { AgendaSection, AgendaData } from "@/components/home/agenda-section";
import { BanomSection, BanomData } from "@/components/home/banom-section";
import { LoginRedirect } from "@/components/home/login-redirect";
import dynamic from 'next/dynamic';
import { Suspense } from "react";

// Lazy load video section as it's below fold
const VideoSection = dynamic(() => import("@/components/home/video-section").then(mod => ({ default: mod.VideoSection })), {
  loading: () => <div className="py-20 bg-background text-center text-muted-foreground">Loading multimedia...</div>,
  ssr: true,
});

async function fetchFromAPI(endpoint: string, params: Record<string, string> = {}) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
  const url = new URL(`${backendUrl.replace(/\/$/, '')}/api${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch (e) {
    console.error(`Failed to fetch ${url.toString()}:`, e);
    return null;
  }
}

export default async function Home() {
  // Parallel Data Fetching for all sections
  const [
    heroHeadline,
    heroFeatured,
    heroBreaking,
    heroLatest,
    latestNews,
    spotlight,
    agendas,
    banoms
  ] = await Promise.all([
    fetchFromAPI('/posts/latest', { headline: '1', limit: '1' }),
    fetchFromAPI('/posts/latest', { featured: '1', limit: '4' }),
    fetchFromAPI('/posts/latest', { breaking: '1', limit: '4' }),
    fetchFromAPI('/posts/latest', { limit: '3' }),
    fetchFromAPI('/posts/latest'),
    fetchFromAPI('/posts/latest', { spotlight: '1', limit: '30' }),
    fetchFromAPI('/agendas'),
    fetchFromAPI('/banoms')
  ]);

  const heroData: HeroData = {
    headline: heroHeadline || [],
    featured: heroFeatured || [],
    breaking: heroBreaking || [],
    latest: heroLatest || []
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={null}>
        <LoginRedirect />
      </Suspense>
      <HeroSection initialData={heroData} />
      <LatestNewsSection initialData={latestNews || []} />
      <SpotlightSection initialData={spotlight || []} />
      <AgendaSection initialData={agendas || []} />
      <BanomSection initialData={banoms?.slice(0, 6) || []} />
      <Suspense fallback={<div className="py-20 bg-background text-center text-muted-foreground">Loading multimedia...</div>}>
        <VideoSection />
      </Suspense>
    </div>
  );
}
