'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Image as ImageIcon, Calendar, User, Eye, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/components/auth/auth-context';

interface MultimediaItem {
  id: number;
  title: string;
  slug: string;
  type: 'video' | 'photo';
  thumbnail?: string | null;
  description?: string | null;
  date: string;
  author?: string | null;
  views?: number;
  likes?: number;
}

const REFRESH_INTERVAL = 30000;
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export default function MultimediaPage() {
  const [items, setItems] = useState<MultimediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'video' | 'photo'>('all');

  useEffect(() => {
    const fetchMultimedia = async () => {
      try {
        const response = await api.get('/multimedia');
        setItems(toArray<MultimediaItem>(response.data));
      } catch (error) {
        console.error('Failed to fetch multimedia:', error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMultimedia();
    const intervalId = window.setInterval(fetchMultimedia, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, []);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.type === filter);
  }, [filter, items]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="relative py-24 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/circuit-board.svg')] opacity-[0.1]" />
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-black/80 to-black" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Galeri Multimedia
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto"
          >
            Dokumentasi kegiatan, kajian, dan momen-momen penting dalam bentuk video dan foto.
          </motion.p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="flex justify-center mb-12">
          <div className="flex bg-card border border-border rounded-full p-1 shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filter === 'all'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter('video')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                filter === 'video'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
              }`}
            >
              <Play className="w-4 h-4" /> Video
            </button>
            <button
              onClick={() => setFilter('photo')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                filter === 'photo'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Foto
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-16">Loading multimedia...</div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
              >
                <Link href={`/multimedia/${item.slug || item.id}`}>
                  <div className="relative aspect-video overflow-hidden">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-secondary/50" />
                    )}

                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold border border-white/10">
                      {item.type === 'video' ? (
                        <>
                          <Play className="w-3 h-3 fill-current" /> Video
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3 h-3" /> Foto
                        </>
                      )}
                    </div>

                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-16 h-16 bg-accent/90 rounded-full flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-6 h-6 text-white fill-current ml-1" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{' '}
                        {new Date(item.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {Number(item.views || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-xl mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      {item.author ? (
                        <div className="flex items-center gap-2 text-xs font-medium text-accent">
                          <User className="w-3 h-3" />
                          {item.author}
                        </div>
                      ) : (
                        <span />
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="w-3 h-3" /> {Number(item.likes || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-16 border border-border rounded-2xl bg-card">
            Tidak ada konten multimedia untuk filter ini.
          </div>
        )}
      </section>
    </div>
  );
}
