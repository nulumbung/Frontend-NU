'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
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

export function BanomSection() {
  const [banoms, setBanoms] = useState<BanomItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanoms = async () => {
      try {
        const response = await api.get('/banoms');
        const rows: BanomItem[] = toArray<BanomItem>(response.data);
        setBanoms(rows.slice(0, 6));
      } catch (error) {
        console.error('Failed to fetch banoms for homepage:', error);
        setBanoms([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanoms();
    const intervalId = window.setInterval(fetchBanoms, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return (
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center text-muted-foreground">
          Loading banom...
        </div>
      </section>
    );
  }

  if (banoms.length === 0) return null;

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/patterns/grid-pattern.svg')] opacity-[0.05] pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent opacity-30 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-bold tracking-[0.2em] uppercase mb-4">
            Badan Otonom
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">
            Pilar Pergerakan NU
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Mengenal lebih dekat organisasi-organisasi sayap Nahdlatul Ulama yang bergerak di
            berbagai bidang.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {banoms.map((banom, index) => (
            <motion.div
              key={banom.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              viewport={{ once: true }}
              className="group relative aspect-square rounded-2xl bg-card/50 backdrop-blur-sm border border-border overflow-hidden hover:border-accent/50 hover:bg-accent/5 transition-all duration-500 cursor-pointer"
            >
              <Link
                href={`/banom/${banom.slug}`}
                className="flex flex-col items-center justify-center h-full w-full p-4 text-center"
              >
                <div className="relative mb-4 w-20 h-20 flex-shrink-0">
                  <div className="absolute inset-0 bg-background rounded-full shadow-lg shadow-black/5 group-hover:shadow-accent/20 transition-all duration-500 border border-border group-hover:border-accent/30 flex items-center justify-center p-4">
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
                        <div className="w-full h-full rounded-full bg-secondary/60 flex items-center justify-center text-sm font-serif text-muted-foreground">
                          {banom.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-accent transition-colors mb-1">
                  {banom.name}
                </h3>
                {banom.short_desc && (
                  <p className="text-[10px] text-muted-foreground line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                    {banom.short_desc}
                  </p>
                )}

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowUpRight className="w-4 h-4 text-accent" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
