'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/components/auth/auth-context';

interface BanomItem {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  short_desc?: string | null;
}

const REFRESH_INTERVAL = 30000;
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export default function BanomPage() {
  const [banoms, setBanoms] = useState<BanomItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanoms = async () => {
      try {
        const response = await api.get('/banoms');
        setBanoms(toArray<BanomItem>(response.data));
      } catch (error) {
        console.error('Failed to fetch banoms:', error);
        setBanoms([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanoms();
    const intervalId = window.setInterval(fetchBanoms, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-32 bg-card overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/hex-grid.svg')] opacity-[0.05]" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-6 drop-shadow-sm"
          >
            Badan Otonom
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Mengenal lebih dekat pilar-pilar pergerakan Nahdlatul Ulama yang berkontribusi nyata
            dalam membangun peradaban bangsa.
          </motion.p>
        </div>
      </section>

      {/* Banom Grid */}
      <section className="container mx-auto px-4 py-24 -mt-12 relative z-20">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-16">Loading banom...</div>
        ) : banoms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {banoms.map((banom) => (
              <Link
                key={banom.id}
                href={`/banom/${banom.slug}`}
                className="group relative bg-card rounded-3xl overflow-hidden border border-border hover:border-accent/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-accent/5 flex flex-col h-full"
              >
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-secondary/30 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative p-8 flex flex-col items-center flex-grow text-center">
                  <div className="relative mb-8 w-32 h-32 flex-shrink-0">
                    <div className="absolute inset-0 bg-background rounded-full shadow-xl shadow-black/5 group-hover:shadow-accent/20 transition-all duration-500 border border-border group-hover:border-accent/30 flex items-center justify-center p-6">
                      <div className="relative w-full h-full transition-transform duration-500 group-hover:scale-110">
                        {banom.logo ? (
                          <Image
                            src={banom.logo}
                            alt={banom.name}
                            fill
                            className="object-contain filter drop-shadow-sm"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-secondary/60 flex items-center justify-center text-2xl font-serif text-muted-foreground">
                            {banom.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <h3 className="font-serif font-bold text-3xl text-foreground mb-3 group-hover:text-accent transition-colors">
                    {banom.name}
                  </h3>

                  {banom.short_desc && (
                    <p className="text-muted-foreground leading-relaxed mb-8 line-clamp-3">
                      {banom.short_desc}
                    </p>
                  )}

                  <div className="mt-auto pt-6 border-t border-border w-full flex items-center justify-between text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors">
                    <span>Lihat Profil Lengkap</span>
                    <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all duration-300">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-16">Belum ada data banom.</div>
        )}
      </section>
    </div>
  );
}
