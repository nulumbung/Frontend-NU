
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '@/components/auth/auth-context';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  image?: string | null;
  excerpt?: string | null;
  category: {
    name: string;
  } | null;
  author?: {
    name?: string | null;
    avatar?: string | null;
  } | null;
  created_at: string;
  read_time?: string | null;
  is_featured?: boolean;
  is_breaking?: boolean;
  is_spotlight?: boolean;
  is_headline?: boolean;
}

export interface HeroData {
  headline: NewsItem[];
  featured: NewsItem[];
  breaking: NewsItem[];
  latest: NewsItem[];
}

interface HeroSectionProps {
  initialData?: HeroData;
}

const REFRESH_INTERVAL = 60000; // Reduced from 30s to 60s
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export function HeroSection({ initialData }: HeroSectionProps) {
  const [headlineNews, setHeadlineNews] = useState<NewsItem[]>(initialData?.headline || []);
  const [featuredNews, setFeaturedNews] = useState<NewsItem[]>(initialData?.featured || []);
  const [breakingNews, setBreakingNews] = useState<NewsItem[]>(initialData?.breaking || []);
  const [latestNews, setLatestNews] = useState<NewsItem[]>(initialData?.latest || []);
  const [isLoading, setIsLoading] = useState(!initialData);

  const fetchNews = useCallback(async () => {
    try {
      // Use Promise.race with timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 8000)
      );

      const [headlineResult, featuredResult, breakingResult, latestResult] = await Promise.allSettled([
        Promise.race([api.get('/posts/latest', { params: { headline: 1, limit: 1 } }), timeoutPromise]),
        Promise.race([api.get('/posts/latest', { params: { featured: 1, limit: 4 } }), timeoutPromise]), // Reduced from 6 to 4
        Promise.race([api.get('/posts/latest', { params: { breaking: 1, limit: 4 } }), timeoutPromise]), // Reduced from 8 to 4
        Promise.race([api.get('/posts/latest', { params: { limit: 3 } }), timeoutPromise]), // Reduced from 6 to 3
      ]);

      const headlineRows =
        headlineResult.status === 'fulfilled' ? toArray<NewsItem>((headlineResult.value as { data?: unknown }).data) : [];
      const featuredRows =
        featuredResult.status === 'fulfilled' ? toArray<NewsItem>((featuredResult.value as { data?: unknown }).data) : [];
      const breakingRows =
        breakingResult.status === 'fulfilled' ? toArray<NewsItem>((breakingResult.value as { data?: unknown }).data) : [];
      const latestRows =
        latestResult.status === 'fulfilled' ? toArray<NewsItem>((latestResult.value as { data?: unknown }).data) : [];

      setHeadlineNews(headlineRows);
      setFeaturedNews(featuredRows);
      setBreakingNews(breakingRows);
      setLatestNews(latestRows);
    } catch (error) {
      console.error("Failed to fetch hero news:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    const initialTimer = setTimeout(() => fetchNews(), 100); // Defer initial fetch slightly

    // Polling interval
    const intervalId = window.setInterval(fetchNews, REFRESH_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, [fetchNews]);

  const primaryPool = useMemo(() => (featuredNews.length > 0 ? featuredNews : latestNews), [featuredNews, latestNews]);
  const mainNews = useMemo(() => headlineNews[0] || primaryPool[0], [headlineNews, primaryPool]);

  const featuredUnique = useMemo(() =>
    Array.from(new Map(featuredNews.map((item) => [item.id, item])).values()),
    [featuredNews]
  );

  const featuredSidePool = useMemo(() =>
    featuredUnique.filter((item) => item.id !== mainNews?.id).slice(0, 2),
    [featuredUnique, mainNews]
  );

  const sideNews = useMemo(() =>
    featuredSidePool.length > 0
      ? featuredSidePool
      : (featuredUnique.some((item) => item.id === mainNews?.id) && mainNews
        ? [mainNews]
        : []),
    [featuredSidePool, featuredUnique, mainNews]
  );

  const tickerPool = useMemo(() => breakingNews, [breakingNews]);
  const tickerTitles = useMemo(() =>
    Array.from(
      new Set(
        tickerPool
          .map((item) => (item.title || '').trim())
          .filter((title) => title.length > 0)
      )
    ).slice(0, 6),
    [tickerPool]
  );

  if (isLoading) {
    return (
      <section className="relative pt-6 pb-12 overflow-hidden min-h-[600px] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </section>
    );
  }

  if (!mainNews) {
    return (
      <section className="relative pt-6 pb-12 overflow-hidden min-h-[360px] flex items-center justify-center">
        <p className="text-muted-foreground">Belum ada berita untuk ditampilkan.</p>
      </section>
    );
  }

  const breakingTitles = tickerTitles.length > 0 ? tickerTitles : ['Belum ada breaking news'];
  const useTickerMarquee = breakingTitles.length > 1;
  const scrollingTitles = useTickerMarquee ? [...breakingTitles, ...breakingTitles] : breakingTitles;
  const mainAuthorName = mainNews.author?.name?.trim();
  const mainTitle = (mainNews.title || '').trim() || 'Tanpa Judul';

  return (
    <section className="relative pt-6 pb-12 overflow-hidden">
      {/* Background Elements - simplified for perf */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/20 to-transparent opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4">
        {/* Breaking News Ticker */}
        <div className="mb-8 rounded-lg overflow-hidden border border-red-500/20 bg-red-950/30 flex items-center relative">
          <div className="bg-red-600 text-white px-4 py-2 text-xs font-bold tracking-wider z-10 flex items-center gap-2 shadow-xl">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            BREAKING
          </div>
          <div className="flex-1 overflow-hidden py-2 relative">
            {useTickerMarquee ? (
              <>
                <motion.div
                  className="whitespace-nowrap flex gap-12 text-sm text-foreground/90 font-medium"
                  animate={{ x: [0, -1000] }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                >
                  {scrollingTitles.map((title, i) => (
                    <span key={`${title}-${i}`} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span className="text-white">{title}</span>
                    </span>
                  ))}
                </motion.div>
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-red-950/30 to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-red-950/30 to-transparent z-10" />
              </>
            ) : (
              <div className="px-4 text-sm text-white font-medium truncate">
                {breakingTitles[0]}
              </div>
            )}
          </div>
        </div>

        {/* Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Main Headline (Left - 8 cols) */}
          <div className="lg:col-span-8 group cursor-pointer relative min-h-[320px] md:min-h-[420px]">
            <Link href={`/berita/${mainNews.slug}`} className="block h-full min-h-[320px] md:min-h-[420px] relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
              {mainNews.image ? (
                <Image
                  src={mainNews.image}
                  alt={mainTitle}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-secondary/40" />
              )}

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-20">
                {mainNews.category && (
                  <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold tracking-wider mb-4 border border-accent-foreground/20 shadow-lg shadow-accent/20">
                    {mainNews.category.name}
                  </span>
                )}
                <h1 className="font-serif text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 drop-shadow-lg group-hover:text-glow-gold transition-all">
                  {mainTitle}
                </h1>
                <p className="text-gray-300 line-clamp-2 md:text-lg mb-6 max-w-2xl">
                  {mainNews.excerpt}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden relative border border-white/20">
                      {mainNews.author?.avatar ? (
                        <Image
                          src={mainNews.author.avatar}
                          alt={mainAuthorName || 'Penulis'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                          {(mainAuthorName || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span>{mainAuthorName || 'Penulis'}</span>
                  </div>
                  <span className="w-1 h-1 rounded-full bg-gray-500" />
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(mainNews.created_at).toLocaleDateString('id-ID')}</span>
                  {mainNews.read_time && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-500" />
                      <span>{mainNews.read_time} baca</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          </div>

          {/* Side News (Right - 4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-serif font-bold text-xl text-foreground flex items-center gap-2">
                <span className="w-1 h-6 bg-accent rounded-full" />
                Berita Pilihan
              </h2>
            </div>

            <div className="flex flex-col gap-4 h-full">
              {sideNews.map((news, idx) => (
                <Link
                  key={news.id}
                  href={`/berita/${news.slug}`}
                  className="group relative glass-card rounded-xl p-3 flex gap-4 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-accent/30 overflow-hidden"
                >
                  <div className="w-24 h-24 flex-shrink-0 relative rounded-lg overflow-hidden bg-secondary/20">
                    {news.image ? (
                      <Image
                        src={news.image}
                        alt={news.title}
                        fill
                        loading={idx === 0 ? "eager" : "lazy"}
                        sizes="96px"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-secondary/50" />
                    )}
                  </div>

                  <div className="flex flex-col justify-center relative z-10">
                    {news.category && (
                      <span className="text-[10px] font-bold text-accent mb-1 uppercase tracking-wider">{news.category.name}</span>
                    )}
                    <h3 className="font-serif font-bold text-foreground leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
                      {news.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(news.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {sideNews.length === 0 && (
                <div className="glass-card rounded-xl p-4 text-sm text-muted-foreground">
                  Belum ada berita dengan toggle Berita Pilihan.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
