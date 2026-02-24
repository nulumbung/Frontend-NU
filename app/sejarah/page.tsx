'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { History as HistoryIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { api } from '@/components/auth/auth-context';
import { useSiteSettings } from '@/components/settings/site-settings-context';

interface HistoryItem {
  id: number;
  year: string;
  title: string;
  description: string;
  image?: string | null;
}

const REFRESH_INTERVAL = 30000;
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const DEFAULT_HISTORY_HERO_BG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Lawang_sewu_semarang.jpg/1600px-Lawang_sewu_semarang.jpg';
const DEFAULT_HISTORY_TAGLINE = 'Perjalanan Panjang Nahdlatul Ulama Dari Masa ke Masa';
const asTrimmed = (value?: string) => (value || '').trim();

export default function SejarahPage() {
  const { settings } = useSiteSettings();
  const [timeline, setTimeline] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const heroBackground = asTrimmed(settings.history_hero_background_image) || DEFAULT_HISTORY_HERO_BG;
  const heroTagline = asTrimmed(settings.history_hero_tagline) || DEFAULT_HISTORY_TAGLINE;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historyResult = await api.get('/histories');

        setTimeline(toArray<HistoryItem>(historyResult.data));
      } catch (error) {
        console.error('Failed to fetch history:', error);
        setTimeline([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
    const intervalId = window.setInterval(fetchHistory, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <section
        className="relative py-24 md:py-32 bg-cover bg-center bg-no-repeat bg-fixed overflow-hidden"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-slate-950/65" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-background/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.22),_transparent_35%)]" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shadow-lg shadow-accent/30">
            <HistoryIcon className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-4">
            Sejarah
          </h1>
          <p className="text-slate-100/90 max-w-3xl mx-auto text-lg">
            {heroTagline}
          </p>
          <p className="text-amber-300 max-w-3xl mx-auto mt-4 text-sm md:text-base font-medium italic">
            &quot;Al-muhafazhatu &#39;ala al-qadimish shalih wal akhdzu bil jadidil ashlah.&quot;
            <span className="block not-italic text-amber-200/90 mt-1">
              KH. Hadratussyaikh Hasyim Asy&#39;ari
            </span>
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {timeline.length > 0 ? (
            <div className="space-y-16">
              {timeline.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  viewport={{ once: true, margin: '-100px' }}
                  className={cn(
                    'grid grid-cols-1 md:grid-cols-12 gap-6 items-start',
                    index % 2 === 0 ? '' : 'md:[&>div:first-child]:order-2'
                  )}
                >
                  <div className="md:col-span-5">
                    <div className="rounded-2xl border border-border bg-card p-6">
                      <p className="text-xs uppercase tracking-widest text-accent font-bold mb-3">{item.year}</p>
                      <h2 className="font-serif text-2xl font-bold text-foreground mb-3">{item.title}</h2>
                      <p className="text-muted-foreground whitespace-pre-wrap">{item.description}</p>
                    </div>
                  </div>
                  <div className="md:col-span-7">
                    {item.image ? (
                      <div className="relative rounded-2xl overflow-hidden border border-border aspect-[16/9]">
                        <Image src={item.image} alt={item.title} fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-card/40 aspect-[16/9] flex items-center justify-center text-sm text-muted-foreground">
                        Gambar belum tersedia
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-20 border border-border rounded-2xl bg-card">
              Belum ada data sejarah.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
