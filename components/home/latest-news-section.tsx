
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/components/auth/auth-context';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  image?: string | null;
  category: {
    name: string;
  } | null;
  created_at: string;
}

export interface LatestNewsData extends NewsItem { }

interface LatestNewsSectionProps {
  initialData?: LatestNewsData[];
}

const REFRESH_INTERVAL = 30000;
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export function LatestNewsSection({ initialData }: LatestNewsSectionProps) {
  const [news, setNews] = useState<NewsItem[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await api.get('/posts/latest');
        setNews(toArray<NewsItem>(response.data));
      } catch (error) {
        console.error("Failed to fetch latest news:", error);
        setNews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
    const intervalId = window.setInterval(fetchNews, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-background via-surface to-background relative">
        <div className="container mx-auto px-4 text-center">
          <p>Loading berita terbaru...</p>
        </div>
      </section>
    )
  }

  if (news.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-background via-surface to-background relative">
      <div className="container mx-auto px-4">

        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-1 bg-gradient-to-r from-accent to-transparent" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground relative z-10">
              Berita Terbaru
              <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-accent/50 rounded-full blur-sm" />
            </h2>
          </div>
          <Link
            href="/berita"
            className="flex items-center gap-2 text-accent font-bold hover:gap-4 transition-all group"
          >
            Lihat Semua <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="group glass-card rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-accent/10 transition-all duration-500 perspective-1000"
            >
              <div className="relative h-48 md:h-56 overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-secondary/50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 transition-opacity group-hover:opacity-40" />

                {/* Category Badge */}
                {item.category && (
                  <span className="absolute top-4 left-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-md">
                    {item.category.name}
                  </span>
                )}
              </div>

              <div className="p-6 relative z-10 bg-card/50 backdrop-blur-sm border-t border-border h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                    <Link href={`/berita/${item.slug}`}>
                      {item.title}
                    </Link>
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-accent" /> {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Bottom Shine Effect */}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-accent to-transparent transition-all duration-500 group-hover:w-full" />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
