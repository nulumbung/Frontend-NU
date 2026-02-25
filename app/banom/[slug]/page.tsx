
'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Target, Award, History, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/components/auth/auth-context';
import { ShareButtons } from '@/components/share-buttons';

interface BanomManager {
  name: string;
  position: string;
  image?: string | null;
}

interface BanomDetail {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  short_desc?: string | null;
  long_desc?: string | null;
  history?: string | null;
  vision?: string | null;
  mission?: string[] | null;
  management?: BanomManager[] | null;
}

const REFRESH_INTERVAL = 30000;
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export default function BanomDetailPage() {
  const params = useParams();
  const [banom, setBanom] = useState<BanomDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const banomId = Array.isArray(params.slug) ? params.slug[0] : params.slug;

    const fetchBanom = async () => {
      try {
        const response = await api.get(`/banoms/${banomId}`);
        const data = response.data as BanomDetail;
        setBanom({
          ...data,
          mission: toArray<string>(data.mission),
          management: toArray<BanomManager>(data.management),
        });
      } catch (error) {
        console.error("Failed to fetch banom detail:", error);
        setBanom(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (banomId) {
      fetchBanom();
      const intervalId = window.setInterval(fetchBanom, REFRESH_INTERVAL);
      return () => window.clearInterval(intervalId);
    }
  }, [params.slug]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!banom) {
    return <div className="min-h-screen flex items-center justify-center">Banom tidak ditemukan.</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-black" />
        <div className="absolute inset-0 bg-[url('/patterns/islamic-pattern.svg')] opacity-10" />

        <div className="absolute top-0 left-0 p-6 z-20">
          <Link
            href="/#banom"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" /> Kembali
          </Link>
        </div>

        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col md:flex-row items-center gap-8 md:gap-12"
          >
            <div className="w-32 h-32 md:w-48 md:h-48 relative bg-white rounded-full p-4 shadow-2xl flex-shrink-0">
              {banom.logo ? (
                <Image
                  src={banom.logo}
                  alt={banom.name}
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Users className="w-16 h-16" />
                </div>
              )}
            </div>
            <div className="text-center md:text-left">
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 border border-accent/30 text-accent font-bold text-sm tracking-wider mb-4 backdrop-blur-md">
                BADAN OTONOM NU
              </span>
              <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                {banom.name}
              </h1>
              <p className="text-white/80 text-lg max-w-2xl leading-relaxed">
                {banom.short_desc || '-'}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-8">

            {/* About */}
            <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
              <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-1 h-8 bg-accent rounded-full" />
                Tentang {banom.name}
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground whitespace-pre-wrap">
                <p>{banom.long_desc || '-'}</p>
              </div>
            </div>

            {/* History */}
            {banom.history && (
              <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
                <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-3">
                  <History className="w-6 h-6 text-accent" />
                  Sejarah Singkat
                </h2>
                <div className="prose prose-lg max-w-none text-muted-foreground whitespace-pre-wrap">
                  <p>{banom.history}</p>
                </div>
              </div>
            )}

            {/* Vision & Mission */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-card to-secondary/10 rounded-2xl p-8 border border-border shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-700 mb-6">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-4">Visi</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {banom.vision || '-'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-card to-secondary/10 rounded-2xl p-8 border border-border shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 mb-6">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-4">Misi</h3>
                {banom.mission && banom.mission.length > 0 ? (
                  <ul className="space-y-3">
                    {banom.mission.map((item, idx) => (
                      <li key={idx} className="flex gap-3 text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 flex-shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Belum ada data misi.</p>
                )}
              </div>
            </div>

            {/* Structure / Management */}
            {banom.management && banom.management.length > 0 && (
              <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
                <h2 className="font-serif text-2xl font-bold mb-8 flex items-center gap-3">
                  <Users className="w-6 h-6 text-accent" />
                  Struktur Pengurus
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {banom.management.map((person, idx) => (
                    <div key={idx} className="group relative bg-secondary/20 rounded-xl p-4 text-center hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-border">
                      <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border-4 border-white shadow-md relative bg-gray-200">
                        {person.image ? (
                          <Image
                            src={person.image}
                            alt={person.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Users className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-foreground mb-1 group-hover:text-green-700 transition-colors">{person.name}</h3>
                      <p className="text-xs font-bold text-accent uppercase tracking-wider">{person.position}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
              <h3 className="font-serif text-xl font-bold mb-4">Data Banom</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Slug</span>
                  <span className="font-medium">{banom.slug}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Jumlah Pengurus</span>
                  <span className="font-medium">{banom.management?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Jumlah Misi</span>
                  <span className="font-medium">{banom.mission?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Share */}
            <ShareButtons title={banom.name} text={`Kenali lebih dekat ${banom.name}`} variant="card" />
          </div>

        </div>
      </div>
    </div>
  );
}
