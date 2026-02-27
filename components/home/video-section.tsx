'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '@/components/auth/auth-context';

interface MultimediaItem {
  id: number;
  title: string;
  slug: string;
  type: 'video' | 'photo';
  thumbnail?: string | null;
  date?: string | null;
}

const REFRESH_INTERVAL = 60000; // Increased from 30s to 60s
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export function VideoSection() {
  const [items, setItems] = useState<MultimediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVideos = useCallback(async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      const response = await Promise.race([api.get('/multimedia'), timeoutPromise]);
      const rows: MultimediaItem[] = toArray<MultimediaItem>((response as any).data);
      setItems(rows.filter((item) => item.type === 'video').slice(0, 4));
    } catch (error) {
      console.error('Failed to fetch multimedia for homepage:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = setTimeout(() => fetchVideos(), 100); // Defer initial fetch
    const intervalId = window.setInterval(fetchVideos, REFRESH_INTERVAL);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, [fetchVideos]);

  const mainVideo = useMemo(() => items[0], [items]);
  const sideVideos = useMemo(() => items.slice(1, 4), [items]);

  if (isLoading) {
    return (
      <section className="py-20 bg-background relative">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      </section>
    );
  }

  if (!mainVideo) {
    return (
      <section className="py-20 bg-background relative">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          Belum ada video multimedia.
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-3xl font-bold text-foreground flex items-center gap-3">
            <span className="w-2 h-8 bg-red-600 rounded-full" />
            Multimedia
          </h2>
          <Link href="/multimedia" className="text-sm font-bold text-accent hover:underline">
            Lihat Semua
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link
            href={`/multimedia/${mainVideo.slug || mainVideo.id}`}
            className="md:col-span-2 relative aspect-video rounded-2xl overflow-hidden group cursor-pointer shadow-2xl block"
          >
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors z-10" />
            {mainVideo.thumbnail ? (
              <Image
                src={mainVideo.thumbnail}
                alt={mainVideo.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-secondary/50" />
            )}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-red-600/30">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-8 z-20 bg-gradient-to-t from-black to-transparent">
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">
                VIDEO
              </span>
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-white leading-tight line-clamp-2">
                {mainVideo.title}
              </h3>
            </div>
          </Link>

          <div className="flex flex-col gap-6">
            {sideVideos.map((video, idx) => (
              <Link
                href={`/multimedia/${video.slug || video.id}`}
                key={video.id}
                className="flex gap-4 group cursor-pointer"
              >
                <div className="relative w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
                  {video.thumbnail ? (
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      loading={idx === 0 ? "eager" : "lazy"}
                      sizes="160px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-secondary/50" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                      <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-foreground text-sm line-clamp-2 group-hover:text-accent transition-colors mb-2">
                    {video.title}
                  </h4>
                  {video.date && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(video.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
