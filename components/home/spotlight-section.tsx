'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { api } from '@/components/auth/auth-context';

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
}

interface PostItem {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  image?: string | null;
  category?: CategoryItem | null;
  is_spotlight?: boolean;
}

const colorPool = ['bg-green-600', 'bg-blue-600', 'bg-yellow-600', 'bg-rose-600', 'bg-teal-600'];
const REFRESH_INTERVAL = 30000;
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export function SpotlightSection() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [newsByCategory, setNewsByCategory] = useState<Record<string, PostItem[]>>({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchSpotlight = async () => {
      try {
        const response = await api.get('/posts/latest', { params: { spotlight: 1, limit: 30 } });
        const rows: PostItem[] = toArray<PostItem>(response.data);

        const grouped: Record<string, PostItem[]> = {};
        const categoryMap: Record<string, CategoryItem> = {};

        rows.forEach((post) => {
          const category = post.category;
          if (!category?.slug) return;

          if (!grouped[category.slug]) {
            grouped[category.slug] = [];
          }
          if (grouped[category.slug].length < 3) {
            grouped[category.slug].push(post);
          }
          if (!categoryMap[category.slug]) {
            categoryMap[category.slug] = {
              id: category.id,
              name: category.name,
              slug: category.slug,
            };
          }
        });

        const nextCategories = Object.values(categoryMap)
          .filter((cat) => (grouped[cat.slug] || []).length > 0)
          .slice(0, 5);

        setNewsByCategory(grouped);
        setCategories(nextCategories);
        setActiveTab((prev) =>
          nextCategories.some((cat) => cat.slug === prev) ? prev : (nextCategories[0]?.slug || '')
        );
      } catch (error) {
        console.error('Failed to fetch spotlight posts:', error);
        setNewsByCategory({});
        setCategories([]);
        setActiveTab('');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchSpotlight();
    const intervalId = window.setInterval(() => {
      fetchSpotlight();
    }, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, []);

  const displayNews = useMemo(() => newsByCategory[activeTab] || [], [newsByCategory, activeTab]);
  const activeCategoryName = useMemo(
    () => categories.find((item) => item.slug === activeTab)?.name || '',
    [categories, activeTab]
  );

  if (isLoadingCategories) {
    return (
      <section className="py-20 bg-surface relative overflow-hidden">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          Loading spotlight...
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-20 bg-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-surface via-background to-surface opacity-90 z-0" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/patterns/mesh.svg')] opacity-[0.05] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Spotlight Kategori
          </h2>
          <div className="w-24 h-1 bg-accent mx-auto rounded-full" />
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.slug)}
              className={cn(
                'px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 border border-transparent hover:border-accent/30',
                activeTab === cat.slug
                  ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/20 scale-105'
                  : 'bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {displayNews.length > 0 ? (
              displayNews.map((news, index) => (
                <Link
                  key={`${activeTab}-${news.id}`}
                  href={`/berita/${news.slug}`}
                  className="group relative block h-80 rounded-2xl overflow-hidden shadow-2xl hover:shadow-accent/20 transition-all duration-500 hover:-translate-y-2"
                >
                  {news.image ? (
                    <Image
                      src={news.image}
                      alt={news.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 bg-secondary/60" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    {activeCategoryName && (
                      <span
                        className={cn(
                          'inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 text-white shadow-sm',
                          colorPool[index % colorPool.length]
                        )}
                      >
                        {activeCategoryName}
                      </span>
                    )}
                    <h3 className="font-serif text-xl font-bold text-white leading-tight mb-2 group-hover:text-accent transition-colors line-clamp-2">
                      {news.title}
                    </h3>
                    {news.excerpt && (
                      <p className="text-xs text-gray-300 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                        {news.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="md:col-span-3 text-center text-muted-foreground py-14 border border-border rounded-2xl bg-card/40">
                Belum ada artikel pada kategori ini.
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
