
'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api } from '@/components/auth/auth-context';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
}

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  image?: string | null;
  category: {
      name: string;
  } | null;
  author?: {
      name?: string | null;
      avatar?: string | null;
  } | null;
  created_at: string;
  read_time?: string | null;
}

const REFRESH_INTERVAL = 30000;
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const isImageSource = (value?: string | null) => Boolean(value && /^(https?:\/\/|\/|data:image\/)/i.test(value));

export default function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [category, setCategory] = useState<Category | null>(null);
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Category Info
        const catResponse = await api.get(`/categories/${slug}`);
        setCategory(catResponse.data);

        // Fetch Posts by Category
        const postsResponse = await api.get(`/posts/category/${slug}`);
        setPosts(toArray<NewsItem>(postsResponse.data?.data));
      } catch (error) {
        console.error("Failed to fetch category data:", error);
        setCategory(null);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
        fetchData();
        const intervalId = window.setInterval(fetchData, REFRESH_INTERVAL);
        return () => window.clearInterval(intervalId);
    }
  }, [slug]);

  if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!category) {
      return <div className="min-h-screen flex items-center justify-center">Kategori tidak ditemukan.</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-end justify-center overflow-hidden">
        {isImageSource(category.image) ? (
          <Image 
            src={category.image as string} 
            alt={category.name} 
            fill 
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-secondary/50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10 pb-20">
          <Link 
            href="/kategori" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-accent mb-8 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">Kembali ke Kategori</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-bold tracking-wider mb-6 border border-accent-foreground/20 shadow-lg shadow-accent/20">
              KATEGORI
            </span>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-6 drop-shadow-lg">
              {category.name}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
              {category.description || '-'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* News Grid */}
      <section className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.length > 0 ? (
            posts.map((news, index) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link 
                  href={`/berita/${news.slug}`}
                  className="group block bg-card rounded-2xl overflow-hidden border border-border hover:border-accent/30 transition-all hover:-translate-y-2 hover:shadow-xl h-full flex flex-col"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {news.image ? (
                      <Image 
                        src={news.image} 
                        alt={news.title} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-secondary/50" />
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-background/80 backdrop-blur-md text-xs font-bold text-foreground border border-border">
                        {news.category?.name || category.name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(news.created_at).toLocaleDateString('id-ID')}
                      </span>
                      {news.read_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {news.read_time}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-serif font-bold text-xl text-foreground mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                      {news.title}
                    </h3>
                    
                    {news.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-grow">
                        {news.excerpt}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 pt-4 border-t border-border mt-auto">
                      {news.author && (
                        <>
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary relative">
                            {news.author.avatar ? (
                              <Image 
                                src={news.author.avatar} 
                                alt={news.author.name || 'Penulis'} 
                                fill 
                                className="object-cover" 
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                                {(news.author.name || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-foreground">{news.author.name || 'Penulis'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-card rounded-3xl border border-border border-dashed">
              <div className="w-20 h-20 mx-auto mb-6 bg-secondary/50 rounded-full flex items-center justify-center text-muted-foreground">
                <Hash className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Belum ada berita</h3>
              <p className="text-muted-foreground">
                Maaf, belum ada artikel untuk kategori <strong>{category.name}</strong> saat ini.
              </p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
