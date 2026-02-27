
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { api } from '@/components/auth/auth-context';

interface AgendaItem {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  date_start: string;
  date_end?: string | null;
  time_string?: string | null;
  location?: string | null;
  status: 'upcoming' | 'ongoing' | 'completed';
  image?: string | null;
}

const REFRESH_INTERVAL = 30000;
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export function AgendaSection() {
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgendas = async () => {
      try {
        const response = await api.get('/agendas');
        setAgendas(toArray<AgendaItem>(response.data));
      } catch (error) {
        console.error("Failed to fetch agendas:", error);
        setAgendas([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgendas();
    const intervalId = window.setInterval(fetchAgendas, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, []);

  if (isLoading) {
      return (
        <section className="py-20 bg-surface relative overflow-hidden text-center">
             <p>Loading agenda...</p>
        </section>
      )
  }

  // Helper to format date for display
  const getDayMonthYear = (dateString: string) => {
      const date = new Date(dateString);
      return {
          day: date.getDate(),
          month: date.toLocaleString('id-ID', { month: 'short' }).toUpperCase(),
          year: date.getFullYear()
      }
  }

  return (
    <section className="py-20 bg-surface relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-[url('/patterns/topography.svg')] opacity-[0.03]" />
      <div className="absolute -left-20 top-1/2 w-64 h-64 bg-accent/10 rounded-full blur-3xl opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 relative inline-block">
              Agenda Terkini
              <span className="absolute -right-8 -top-4 text-accent text-6xl">·</span>
            </h2>
            <p className="text-muted-foreground max-w-xl text-lg">
              Ikuti berbagai kegiatan dan acara penting Nahdlatul Ulama yang akan datang.
            </p>
          </div>
          <Link 
            href="/agenda" 
            className="px-6 py-3 rounded-full border border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground transition-all flex items-center gap-2 font-bold group"
          >
            Lihat Semua Agenda <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {agendas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agendas.slice(0, 3).map((agenda, index) => {
                const { day, month, year } = getDayMonthYear(agenda.date_start);
                return (
                    <motion.div
                    key={agenda.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                    viewport={{ once: true }}
                    className="group relative bg-background/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden hover:border-accent/50 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/10"
                    >
                    {/* Card Header (Date) */}
                    <div className="absolute top-0 left-0 bottom-0 w-24 bg-gradient-to-b from-accent to-accent-teal/80 flex flex-col items-center justify-center text-accent-foreground p-4 text-center group-hover:w-full transition-all duration-500 opacity-10 group-hover:opacity-100 z-0" />
                    
                    <div className="flex h-full relative z-10">
                        {/* Date Box */}
                        <div className="w-24 flex-shrink-0 flex flex-col items-center justify-center border-r border-border bg-card/80 backdrop-blur-md group-hover:bg-transparent group-hover:border-transparent transition-all duration-500">
                        <span className="text-4xl font-serif font-bold text-accent group-hover:text-accent-foreground transition-colors">{day}</span>
                        <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase group-hover:text-accent-foreground/80 transition-colors">{month}</span>
                        <span className="text-[10px] text-muted-foreground/50 mt-1 group-hover:text-accent-foreground/60 transition-colors">{year}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 flex flex-col justify-between group-hover:text-white transition-colors">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded border uppercase",
                                agenda.status === 'upcoming'
                                  ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                                  : agenda.status === 'ongoing'
                                  ? "border-green-500/30 text-green-400 bg-green-500/10"
                                  : "border-gray-500/30 text-gray-400 bg-gray-500/10"
                            )}>
                                {agenda.status}
                            </span>
                            </div>
                            
                            <h3 className="font-serif text-xl font-bold mb-4 line-clamp-2 group-hover:text-white transition-colors">
                            <Link href={`/agenda/${agenda.slug}`} className="hover:underline decoration-accent underline-offset-4">
                                {agenda.title}
                            </Link>
                            </h3>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground group-hover:text-white/80 transition-colors">
                            <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 mt-0.5 text-accent group-hover:text-white" />
                            <span className="line-clamp-1">{agenda.location || 'Lokasi belum tersedia'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-accent group-hover:text-white" />
                            <span>{agenda.time_string || 'Waktu Belum Ditentukan'}</span>
                            </div>
                        </div>
                        </div>
                    </div>
                    </motion.div>
                )
            })}
            </div>
        ) : (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <p className="text-muted-foreground">Belum ada agenda dalam waktu dekat.</p>
            </div>
        )}

      </div>
    </section>
  );
}
