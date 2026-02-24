'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api } from '@/components/auth/auth-context';

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  color?: string | null;
  count?: number;
}

const REFRESH_INTERVAL = 30000;
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const isImageSource = (value?: string | null) => {
  if (!value) return false;
  return /^(https?:\/\/|\/|data:image\/)/i.test(value);
};

export default function CategoryPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        const rows: CategoryItem[] = toArray<CategoryItem>(response.data);

        const enriched = await Promise.all(
          rows.map(async (category) => {
            try {
              const postResponse = await api.get(`/posts/category/${category.slug}`, { params: { page: 1 } });
              return {
                ...category,
                count: Number(postResponse.data?.total || 0),
              };
            } catch {
              return { ...category, count: 0 };
            }
          })
        );

        setCategories(enriched);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
    const intervalId = window.setInterval(fetchCategories, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      
      {/* Hero Section */}
      <section className="relative py-32 bg-card overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-[0.03]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 mx-auto mb-6 bg-accent/10 rounded-2xl flex items-center justify-center text-accent"
          >
            <Layers className="w-8 h-8" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-6 drop-shadow-sm"
          >
            Kategori Berita
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Jelajahi berbagai topik menarik seputar Nahdlatul Ulama, keislaman, dan kebangsaan.
          </motion.p>
        </div>
      </section>

      {/* Category Grid */}
      <section className="container mx-auto px-4 py-24 -mt-12 relative z-20">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-16">Loading kategori...</div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link 
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className="group relative h-[400px] rounded-3xl overflow-hidden border border-border hover:border-accent/50 transition-all duration-500 hover:shadow-2xl hover:shadow-accent/10"
            >
              {/* Background Image */}
              {isImageSource(cat.image) ? (
                <div className="absolute inset-0">
                  <Image
                    src={cat.image as string}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-900 to-black">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute top-5 right-5 text-white/20 text-7xl font-serif">{cat.name.charAt(0)}</div>
                </div>
              )}
              
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                      {Number(cat.count || 0).toLocaleString('id-ID')} Artikel
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="font-serif font-bold text-3xl text-white mb-3 group-hover:text-accent transition-colors">
                    {cat.name}
                  </h3>
                  
                  {cat.description && (
                    <p className="text-gray-300 text-sm line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                      {cat.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-16">Belum ada kategori tersedia.</div>
        )}
      </section>

    </div>
  );
}
