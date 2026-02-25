
'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Calendar, User, Eye, Heart, ArrowLeft, Tag, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/components/auth/auth-context';
import { CommentSection } from '@/components/comments/comment-section';
import { ShareButtons } from '@/components/share-buttons';

interface MultimediaItem {
  id: number;
  title: string;
  slug: string;
  type: 'video' | 'photo';
  thumbnail?: string | null;
  url?: string | null;
  gallery?: string[] | null;
  description?: string | null;
  date: string;
  author?: string | null;
  tags?: string[] | null;
  views?: number;
  likes?: number;
}

const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export default function MultimediaDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [item, setItem] = useState<MultimediaItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<MultimediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await api.get(`/multimedia/${slug}`);
        const data = response.data as MultimediaItem;
        setItem(data);
        const gallery = toArray<string>(data.gallery);
        setActivePhoto(data.url || data.thumbnail || gallery[0] || '');

        const allResponse = await api.get('/multimedia');
        const allItems = toArray<MultimediaItem>(allResponse.data);
        const related = allItems
          .filter((i: MultimediaItem) => i.type === data.type && i.id !== data.id)
          .slice(0, 3);
        setRelatedItems(related);

      } catch (error) {
        console.error("Failed to fetch multimedia detail:", error);
        setItem(null);
        setRelatedItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchItem();
    }
  }, [slug]);

  // If not found, show 404 style
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <h1 className="text-4xl font-bold mb-4">Konten Tidak Ditemukan</h1>
        <Link href="/multimedia" className="text-accent hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Galeri
        </Link>
      </div>
    );
  }

  // Helper to extract YouTube ID
  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = item.type === 'video' && item.url ? getYoutubeId(item.url) : null;

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* Breadcrumb / Back Navigation */}
      <div className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Beranda</Link>
          <span>/</span>
          <Link href="/multimedia" className="hover:text-foreground">Multimedia</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px] md:max-w-md">{item.title}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Main Content (Left Column) */}
          <div className="lg:col-span-8">

            {/* Media Player / Viewer */}
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl mb-8 border border-white/10">
              {item.type === 'video' && videoId ? (
                <div className="relative aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                    title={item.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="relative aspect-video bg-black/50">
                    {activePhoto || item.thumbnail ? (
                      <Image
                        src={activePhoto || item.thumbnail || ''}
                        alt={item.title}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
                        Media belum tersedia
                      </div>
                    )}
                  </div>

                  {/* Gallery Thumbnails if Photo Type */}
                  {item.type === 'photo' && toArray<string>(item.gallery).length > 0 && (
                    <div className="flex gap-2 p-4 overflow-x-auto bg-black/80 backdrop-blur-sm scrollbar-thin scrollbar-thumb-white/20">
                      {toArray<string>(item.gallery).map((photo, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActivePhoto(photo)}
                          className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activePhoto === photo ? 'border-accent scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                        >
                          <Image
                            src={photo}
                            alt={`Gallery ${idx + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Title & Meta */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="bg-accent/10 text-accent px-3 py-1 rounded-full font-bold uppercase text-xs tracking-wider flex items-center gap-2">
                  {item.type === 'video' ? <Play className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                  {item.type}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {item.author && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4" /> {item.author}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
                {item.title}
              </h1>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border mb-8">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="w-5 h-5" />
                    <span className="font-medium">{Number(item.views || 0).toLocaleString()}</span>
                    <span className="text-xs">Tayangan</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Heart className="w-5 h-5" />
                    <span className="font-medium">{Number(item.likes || 0).toLocaleString()}</span>
                    <span className="text-xs">Suka</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ShareButtons title={item.title} variant="compact" />
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                <p>{item.description || '-'}</p>
              </div>

              {/* Tags */}
              {toArray<string>(item.tags).length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {toArray<string>(item.tags).map((tag) => (
                    <span key={tag} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors cursor-pointer">
                      <Tag className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="mt-12">
              <CommentSection
                contentType="multimedia"
                target={item.slug || item.id}
                title="Komentar Multimedia"
                placeholder="Tulis komentar Anda tentang konten ini..."
                emptyMessage="Belum ada komentar. Jadilah yang pertama!"
              />
            </div>

          </div>

          {/* Sidebar (Right Column) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <h3 className="font-serif font-bold text-xl mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-accent rounded-full" /> Multimedia Terkait
              </h3>

              <div className="flex flex-col gap-6">
                {relatedItems.map((related) => (
                  <Link href={`/multimedia/${related.slug || related.id}`} key={related.id} className="group flex gap-4 items-start">
                    <div className="relative w-32 aspect-video rounded-lg overflow-hidden flex-shrink-0 border border-border group-hover:border-accent transition-colors">
                      {related.thumbnail ? (
                        <Image
                          src={related.thumbnail}
                          alt={related.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 bg-secondary/50" />
                      )}
                      {related.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="w-6 h-6 text-white fill-current opacity-80" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm line-clamp-2 leading-snug group-hover:text-accent transition-colors mb-1">
                        {related.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(related.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </Link>
                ))}

                {relatedItems.length === 0 && (
                  <p className="text-muted-foreground text-sm italic">Tidak ada konten terkait saat ini.</p>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
