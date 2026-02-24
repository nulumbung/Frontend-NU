'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/components/auth/auth-context';

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

interface AgendaItem {
  id: number;
  slug: string;
  title: string;
  date_start: string;
  date_end?: string | null;
  time_string?: string | null;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

const REFRESH_INTERVAL = 30000;
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const toDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function AgendaPage() {
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [displayMonth, setDisplayMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgendas = async () => {
      try {
        const response = await api.get('/agendas');
        setAgendas(toArray<AgendaItem>(response.data));
      } catch (error) {
        console.error('Failed to fetch agendas:', error);
        setAgendas([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgendas();
    const intervalId = window.setInterval(fetchAgendas, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, []);

  const monthLabel = displayMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeekIndex = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    return {
      firstDayWeekIndex,
      days: Array.from({ length: totalDays }, (_, i) => i + 1),
    };
  }, [displayMonth]);

  const eventDateSet = useMemo(() => {
    const set = new Set<string>();
    agendas.forEach((agenda) => {
      const start = new Date(agenda.date_start);
      if (
        start.getMonth() === displayMonth.getMonth() &&
        start.getFullYear() === displayMonth.getFullYear()
      ) {
        set.add(toDateKey(start));
      }
    });
    return set;
  }, [agendas, displayMonth]);

  const filteredAgendas = useMemo(() => {
    if (!selectedDate) return agendas;
    return agendas.filter((agenda) => toDateKey(new Date(agenda.date_start)) === selectedDate);
  }, [agendas, selectedDate]);

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* Hero Calendar */}
      <section className="relative py-12 bg-card border-b border-border">
        <div className="absolute inset-0 bg-[url('/patterns/topography.svg')] opacity-[0.05]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-serif text-4xl font-bold text-foreground">Agenda NU</h1>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setDisplayMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
                className="p-2 rounded-full bg-secondary/50 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xl font-bold font-serif text-accent capitalize">{monthLabel}</span>
              <button
                type="button"
                onClick={() =>
                  setDisplayMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                }
                className="p-2 rounded-full bg-secondary/50 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-background/50 backdrop-blur-xl rounded-2xl border border-border p-6 shadow-2xl">
            <div className="grid grid-cols-7 mb-4">
              {days.map(day => (
                <div key={day} className="text-center text-sm font-bold text-muted-foreground uppercase tracking-wider py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for previous month */}
              {[...Array(calendarDays.firstDayWeekIndex)].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {calendarDays.days.map((day) => {
                const key = toDateKey(
                  new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day)
                );
                const hasEvent = eventDateSet.has(key);
                const isSelected = selectedDate === key;
                
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(key)}
                    className={cn(
                      "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-300 group hover:bg-secondary/50",
                      isSelected ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20 scale-105 z-10" : "text-foreground",
                      hasEvent && !isSelected && "border border-accent/30 bg-accent/5"
                    )}
                  >
                    <span className={cn("text-lg font-bold", isSelected ? "text-accent-foreground" : "text-foreground")}>
                      {day}
                    </span>
                    {hasEvent && (
                      <div className="flex gap-1 mt-1">
                         <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-accent-foreground" : "bg-accent animate-pulse")} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Agenda List */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl font-bold mb-10 flex items-center gap-3">
          <CalendarIcon className="w-8 h-8 text-accent" />
          {selectedDate ? 'Agenda Terpilih' : 'Semua Agenda'}
        </h2>

        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading agenda...</div>
          ) : filteredAgendas.length > 0 ? (
            filteredAgendas.map((agenda) => {
              const date = new Date(agenda.date_start);
              const day = date.getDate();
              const month = date.toLocaleString('id-ID', { month: 'short' }).toUpperCase();
              const year = date.getFullYear();
              return (
            <Link 
              key={agenda.id} 
              href={`/agenda/${agenda.slug || agenda.id}`}
              className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/10 flex flex-col md:flex-row"
            >
              {/* Date Box */}
              <div className="md:w-48 bg-gradient-to-br from-accent/20 to-accent-teal/20 flex flex-col items-center justify-center p-6 text-center border-r border-border group-hover:bg-accent group-hover:text-accent-foreground transition-colors duration-500">
                <span className="text-5xl font-serif font-bold text-foreground group-hover:text-accent-foreground transition-colors">{day}</span>
                <span className="text-xl font-bold tracking-widest text-muted-foreground uppercase group-hover:text-accent-foreground/80 transition-colors">{month}</span>
                <span className="text-sm text-muted-foreground/70 mt-1 group-hover:text-accent-foreground/60 transition-colors">{year}</span>
              </div>

              {/* Content */}
              <div className="flex-1 p-8 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                    agenda.status === 'upcoming'
                      ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                      : agenda.status === 'ongoing'
                      ? "border-green-500/30 text-green-400 bg-green-500/10"
                      : "border-gray-500/30 text-gray-400 bg-gray-500/10"
                  )}>
                    {agenda.status}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{agenda.time_string || 'Waktu belum ditentukan'}</span>
                  </div>
                </div>

                <h3 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4 group-hover:text-accent transition-colors">
                  {agenda.title}
                </h3>

                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors mb-6">
                  <MapPin className="w-5 h-5 text-accent" />
                  <span>{agenda.location}</span>
                </div>

                <div className="flex items-center text-accent font-bold text-sm group-hover:translate-x-2 transition-transform duration-300">
                  Lihat Detail Agenda <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>
              );
            })
          ) : (
            <div className="text-center py-10 text-muted-foreground border border-border rounded-2xl bg-card">
              Tidak ada agenda untuk tanggal ini.
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
