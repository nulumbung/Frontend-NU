
'use client';

import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, ArrowLeft, Ticket, Users, Info, ExternalLink, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/components/auth/auth-context';

interface AgendaDetail {
  id: number;
  title: string;
  description?: string | null;
  date_start: string;
  date_end?: string | null;
  time_string?: string | null;
  location?: string | null;
  maps_url?: string | null;
  image?: string | null;
  status: string;
  ticket_info_title?: string | null;
  ticket_price?: string | null;
  ticket_quota?: number | null;
  ticket_quota_label?: string | null;
  organizer?: string | null;
  organizer_logo?: string | null;
  organizer_verified?: boolean;
  registration_enabled?: boolean;
  registration_url?: string | null;
  registration_button_text?: string | null;
  registration_note?: string | null;
  registration_closed_text?: string | null;
  registration_open_until?: string | null;
  rundown?: { time: string; title: string; description: string }[] | null;
  gallery?: string[] | null;
}

const REFRESH_INTERVAL = 30000;
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export default function AgendaDetailPage() {
  const params = useParams();
  const [agenda, setAgenda] = useState<AgendaDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shareStatus, setShareStatus] = useState('');

  useEffect(() => {
    const agendaId = Array.isArray(params.id) ? params.id[0] : params.id;

    const fetchAgenda = async () => {
      try {
        const response = await api.get(`/agendas/${agendaId}`);
        const data = response.data as AgendaDetail;
        setAgenda({
          ...data,
          rundown: toArray(data.rundown),
          gallery: toArray(data.gallery),
        });
      } catch (error) {
        console.error("Failed to fetch agenda detail:", error);
        setAgenda(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (agendaId) {
        fetchAgenda();
        const intervalId = window.setInterval(fetchAgenda, REFRESH_INTERVAL);
        return () => window.clearInterval(intervalId);
    }
  }, [params.id]);

  if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!agenda) {
      return <div className="min-h-screen flex items-center justify-center">Agenda tidak ditemukan.</div>;
  }

  // Format Date
  const startDate = new Date(agenda.date_start);
  const endDate = agenda.date_end ? new Date(agenda.date_end) : null;
  
  const dateString = endDate 
      ? `${startDate.getDate()} - ${endDate.getDate()} ${startDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`
      : startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const now = Date.now();
  const registrationDeadline = agenda.registration_open_until ? new Date(agenda.registration_open_until).getTime() : null;
  const registrationClosedByDeadline = registrationDeadline !== null && now > registrationDeadline;
  const registrationClosedByStatus = agenda.status === 'completed';
  const registrationEnabled = Boolean(agenda.registration_enabled);
  const canRegister = registrationEnabled && !registrationClosedByDeadline && !registrationClosedByStatus;
  const ticketCardTitle = agenda.ticket_info_title?.trim() || 'Informasi Tiket';
  const ticketSectionTitle = ticketCardTitle.toLowerCase() === 'detail agenda'
    ? 'Informasi Tiket'
    : ticketCardTitle;
  const registerButtonText = agenda.registration_button_text?.trim() || 'Daftar Sekarang';
  const organizerName = agenda.organizer?.trim() || 'Tidak tersedia';
  const quotaText = agenda.ticket_quota_label?.trim()
    || (typeof agenda.ticket_quota === 'number'
      ? agenda.ticket_quota > 0
        ? `${agenda.ticket_quota} Kursi`
        : 'Tanpa Batas'
      : 'Tidak tersedia');
  const registrationInfoText = canRegister
    ? (agenda.registration_note?.trim() || '*Pendaftaran ditutup 24 jam sebelum acara dimulai')
    : (agenda.registration_closed_text?.trim() || 'Pendaftaran ditutup.');

  const getSharePayload = () => {
    const url = window.location.href;
    const title = agenda.title || 'Agenda NU';
    const text = `Yuk ikuti agenda: ${title}`;
    return { url, title, text };
  };

  const showShareStatus = (message: string) => {
    setShareStatus(message);
    window.setTimeout(() => {
      setShareStatus('');
    }, 2500);
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        return copied;
      } catch {
        return false;
      }
    }
  };

  const handleFacebookShare = () => {
    const { url } = getSharePayload();
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=640,height=720');
  };

  const handleWhatsAppShare = () => {
    const { url, title } = getSharePayload();
    const shareText = `${title} - ${url}`;
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=640,height=720');
  };

  const handleInstagramShare = async () => {
    const payload = getSharePayload();
    const instagramWindow = window.open(
      'https://www.instagram.com/',
      '_blank',
      'noopener,noreferrer,width=640,height=720'
    );

    const copied = await copyToClipboard(payload.url);
    if (!instagramWindow) {
      showShareStatus(
        copied
          ? 'Popup diblokir browser. Link sudah disalin, buka Instagram manual.'
          : 'Popup diblokir browser. Buka Instagram manual dan salin link dari address bar.'
      );
      return;
    }

    showShareStatus(
      copied
        ? 'Instagram dibuka. Link disalin, tinggal tempel.'
        : 'Instagram dibuka. Salin link manual dari address bar.'
    );
  };

  const handleCopyLink = async () => {
    const { url } = getSharePayload();
    const copied = await copyToClipboard(url);
    showShareStatus(copied ? 'Link berhasil disalin.' : 'Gagal menyalin link.');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px]">
        {agenda.image ? (
          <Image
            src={agenda.image}
            alt={agenda.title}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-secondary/60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="absolute top-0 left-0 p-6 z-20">
          <Link 
            href="/agenda" 
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" /> Kembali
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-12 z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 tracking-wider ${
                agenda.status === 'upcoming' ? 'bg-blue-500 text-white' : 
                agenda.status === 'ongoing' ? 'bg-green-500 text-white' :
                'bg-gray-500 text-white'
            }`}>
              {agenda.status === 'upcoming' ? 'Akan Datang' : agenda.status === 'ongoing' ? 'Sedang Berlangsung' : 'Selesai'}
            </span>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
              <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-3">
                <Info className="w-6 h-6 text-accent" />
                Tentang Acara
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground whitespace-pre-wrap">
                <p>{agenda.description || '-'}</p>
              </div>
            </div>

            {/* Rundown */}
            {agenda.rundown && agenda.rundown.length > 0 && (
                <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
                <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-accent" />
                    Susunan Acara
                </h2>
                <div className="space-y-6 relative before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-[2px] before:bg-border">
                    {agenda.rundown.map((item, index) => (
                    <div key={index} className="relative pl-12">
                        <div className="absolute left-0 top-1 w-10 h-10 bg-background border-2 border-accent rounded-full flex items-center justify-center z-10">
                        <div className="w-3 h-3 bg-accent rounded-full" />
                        </div>
                        <div className="bg-secondary/20 p-4 rounded-xl">
                        <span className="text-sm font-bold text-accent block mb-1">{item.time}</span>
                        <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            )}

            {/* Gallery */}
            {agenda.gallery && agenda.gallery.length > 0 && (
                <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
                <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-3">
                    Galeri Dokumentasi
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {agenda.gallery.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer">
                        <Image 
                        src={img} 
                        alt={`Gallery ${idx + 1}`} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        unoptimized
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                    ))}
                </div>
                </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start lg:h-fit">
            
            {/* Ticket Info Card */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <h3 className="font-serif text-xl font-bold mb-4">Detail Agenda</h3>

              <div className="space-y-3 mb-6">
                <h4 className="font-serif text-3xl leading-tight font-bold text-foreground">{agenda.title}</h4>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-accent" />
                    <span>Tanggal</span>
                  </div>
                  <span className="font-semibold text-right">{dateString}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 text-accent" />
                    <span>Waktu</span>
                  </div>
                  <span className="font-semibold text-right">{agenda.time_string || 'Waktu belum ditentukan'}</span>
                </div>
                <div className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-accent mt-0.5" />
                    <span>Alamat</span>
                  </div>
                  <span className="font-semibold text-right">{agenda.location || 'Lokasi belum tersedia'}</span>
                </div>
                {agenda.maps_url && (
                  <a
                    href={agenda.maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Buka Google Maps
                  </a>
                )}
              </div>

              <h3 className="font-serif text-xl font-bold mb-6 pb-4 border-b border-border">{ticketSectionTitle}</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Ticket className="w-5 h-5" />
                    <span>Harga Tiket</span>
                  </div>
                  <span className="font-bold text-lg text-green-600">{agenda.ticket_price || 'Tidak tersedia'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Users className="w-5 h-5" />
                    <span>Kuota Tersedia</span>
                  </div>
                  <span className="font-bold">{quotaText}</span>
                </div>
              </div>

              {registrationEnabled && (
                <>
                  {canRegister && agenda.registration_url ? (
                    <a
                      href={agenda.registration_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center bg-accent text-accent-foreground py-3 rounded-xl font-bold hover:bg-accent/90 transition-colors mb-4 shadow-lg shadow-accent/20"
                    >
                      {registerButtonText}
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full bg-gray-300 text-gray-600 py-3 rounded-xl font-bold cursor-not-allowed mb-4"
                    >
                      {registrationClosedByDeadline || registrationClosedByStatus ? 'Pendaftaran Ditutup' : registerButtonText}
                    </button>
                  )}
                </>
              )}

              <p className="text-xs text-center text-muted-foreground">{registrationInfoText}</p>
            </div>

            {/* Organizer Card */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <h3 className="font-serif text-xl font-bold mb-4">Penyelenggara</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-green-50 border border-green-100 relative flex items-center justify-center text-green-700 font-bold">
                  {agenda.organizer_logo ? (
                    <Image
                      src={agenda.organizer_logo}
                      alt={organizerName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    organizerName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-bold text-lg">{organizerName}</p>
                  <p className="text-xs text-emerald-600 inline-flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Verified Organizer
                  </p>
                </div>
              </div>
            </div>

            {/* Share */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <h3 className="font-serif text-xl font-bold mb-4">Bagikan Acara</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleFacebookShare}
                  className="py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-xs font-medium transition-colors"
                >
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={handleInstagramShare}
                  className="py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-xs font-medium transition-colors"
                >
                  Instagram
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-xs font-medium transition-colors"
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-xs font-medium transition-colors"
                >
                  Copy Link
                </button>
              </div>
              {shareStatus && (
                <p className="text-xs text-muted-foreground mt-3">{shareStatus}</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
