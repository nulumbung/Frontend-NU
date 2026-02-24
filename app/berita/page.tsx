'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Calendar, ChevronRight, Filter } from 'lucide-react';
import { api } from '@/components/auth/auth-context';

interface PostItem {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  image?: string;
  created_at: string;
  views?: number;
  is_featured?: boolean;
  is_spotlight?: boolean;
  is_breaking?: boolean;
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
}

const REFRESH_INTERVAL = 30000;
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export default function BeritaPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [popularPosts, setPopularPosts] = useState<PostItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(toArray<CategoryItem>(response.data));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      }
    };

    fetchCategories();
    const intervalId = window.setInterval(fetchCategories, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchPosts = async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
        const response = selectedCategory
          ? await api.get(`/posts/category/${selectedCategory}`, { params: { page: currentPage } })
          : await api.get('/posts', { params: { page: currentPage } });

        const rows: PostItem[] = toArray<PostItem>(response.data?.data);
        setPosts(rows);
        setCurrentPage(Number(response.data?.current_page || currentPage));
        setLastPage(Number(response.data?.last_page || 1));
        const sortedPopular = [...rows].sort((a, b) => Number(b.views || 0) - Number(a.views || 0));
        setPopularPosts(sortedPopular.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        setPosts([]);
        setPopularPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
    const intervalId = window.setInterval(() => {
      fetchPosts(false);
    }, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [selectedCategory, currentPage]);

  const filteredPosts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return posts;
    return posts.filter((news) => {
      const title = news.title?.toLowerCase() || '';
      const excerpt = news.excerpt?.toLowerCase() || '';
      const category = news.category?.name?.toLowerCase() || '';
      return title.includes(keyword) || excerpt.includes(keyword) || category.includes(keyword);
    });
  }, [posts, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mini Hero */}
      <section className="relative py-20 bg-surface overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-surface z-0" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-accent">Beranda</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-accent">Berita</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">
            Semua Berita
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            Kumpulan berita terbaru, opini, dan liputan khusus seputar Nahdlatul Ulama dan keislaman.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content (8 cols) */}
          <div className="lg:col-span-8">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card/50 p-4 rounded-xl border border-border">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Cari berita..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setSelectedCategory(e.target.value);
                  }}
                  className="bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button className="p-2 bg-background border border-border rounded-lg hover:bg-white/5">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading ? (
                <div className="col-span-full text-center py-10 text-muted-foreground">Loading berita...</div>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((news) => (
                <Link 
                  key={news.id} 
                  href={`/berita/${news.slug || news.id}`}
                  className="group bg-card rounded-xl overflow-hidden border border-border hover:border-accent/30 transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden">
                    {news.image ? (
                      <Image 
                        src={news.image} 
                        alt={news.title} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-secondary/50" />
                    )}
                    <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded">
                      {news.category?.name || 'Berita'}
                    </span>
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                      {news.is_spotlight && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                          Spotlight
                        </span>
                      )}
                      {news.is_breaking && (
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                          Breaking
                        </span>
                      )}
                      {news.is_featured && (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                          Pilihan
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(news.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                      {news.title}
                    </h3>
                    {news.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {news.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                  Tidak ada berita yang cocok dengan filter saat ini.
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1 || isLoading}
                className="px-4 py-2 rounded-lg bg-card border border-border hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-bold">
                {currentPage}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(lastPage, prev + 1))}
                disabled={currentPage >= lastPage || isLoading}
                className="px-4 py-2 rounded-lg bg-card border border-border hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>

          {/* Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            {/* Popular News Widget */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-serif text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-accent rounded-full" />
                Terpopuler
              </h3>
              <div className="space-y-4">
                {popularPosts.map((news, idx) => (
                  <Link key={news.id} href={`/berita/${news.slug || news.id}`} className="flex gap-4 group">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      {news.image ? (
                        <Image
                          src={news.image}
                          alt={news.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 bg-secondary/50" />
                      )}
                      <span className="absolute top-0 left-0 w-6 h-6 bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold rounded-br-lg">
                        {idx + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                        {news.title}
                      </h4>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {new Date(news.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </Link>
                ))}
                {popularPosts.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada data populer.</p>
                )}
              </div>
            </div>

            {/* Tags Widget */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-serif text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-accent rounded-full" />
                Topik Populer
              </h3>
              {categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 7).map((item) => (
                    <Link 
                      key={item.id} 
                      href={`/berita?q=${encodeURIComponent(item.name.toLowerCase())}`}
                      className="px-3 py-1 rounded-full bg-background border border-border text-xs text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                    >
                      #{item.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada topik kategori.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
