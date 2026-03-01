'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Logo } from '@/components/ui/logo';
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/components/auth/auth-context';
import { useSiteSettings } from '@/components/settings/site-settings-context';

interface BanomItem {
  id: number;
  name: string;
  slug: string;
}

type SocialSettingKey =
  | 'social_facebook'
  | 'social_twitter'
  | 'social_instagram'
  | 'social_youtube';

const REFRESH_INTERVAL = 30000;
const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Berita', href: '/berita' },
  { label: 'Agenda', href: '/agenda' },
  { label: 'Banom', href: '/banom' },
  { label: 'Kategori', href: '/kategori' },
  { label: 'Multimedia', href: '/multimedia' },
  { label: 'Sejarah', href: '/sejarah' },
];

const socialConfigs: Array<{
  key: SocialSettingKey;
  label: string;
  color: string;
  icon: typeof Facebook;
}> = [
    { key: 'social_facebook', label: 'Facebook', color: 'hover:text-blue-500', icon: Facebook },
    { key: 'social_twitter', label: 'Twitter', color: 'hover:text-sky-400', icon: Twitter },
    { key: 'social_instagram', label: 'Instagram', color: 'hover:text-pink-500', icon: Instagram },
    { key: 'social_youtube', label: 'YouTube', color: 'hover:text-red-500', icon: Youtube },
  ];

const isHttpUrl = (value?: string) => (value ? /^https?:\/\//i.test(value) : false);
const asTrimmed = (value?: string) => (value || '').trim();

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (message) return message;
  }

  return fallback;
};

export function Footer() {
  const { settings } = useSiteSettings();
  const [banoms, setBanoms] = useState<BanomItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);
  const [newsletterFeedback, setNewsletterFeedback] = useState('');
  const [newsletterFeedbackType, setNewsletterFeedbackType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    let isMounted = true;

    const fetchFooterData = async () => {
      try {
        const banomResult = await api.get('/banoms');

        if (!isMounted) return;

        setBanoms(toArray<BanomItem>(banomResult.data).slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch footer data:', error);
        if (!isMounted) return;
        setBanoms([]);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    };

    fetchFooterData();
    const intervalId = window.setInterval(fetchFooterData, REFRESH_INTERVAL);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const socialLinks = useMemo(
    () =>
      socialConfigs
        .map((config) => ({
          ...config,
          href: asTrimmed(settings[config.key]),
        }))
        .filter((item) => isHttpUrl(item.href)),
    [settings]
  );

  const siteTitle = asTrimmed(settings.site_title) || 'Nulumbung';
  const siteDescription = asTrimmed(settings.site_description);
  const contactAddress = asTrimmed(settings.contact_address);
  const contactPhone = asTrimmed(settings.contact_phone);
  const contactEmail = asTrimmed(settings.contact_email);

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = newsletterEmail.trim();
    if (!email) {
      setNewsletterFeedback('Email wajib diisi.');
      setNewsletterFeedbackType('error');
      return;
    }

    try {
      setIsSubmittingNewsletter(true);
      setNewsletterFeedback('');
      setNewsletterFeedbackType('');
      await api.post('/newsletter/subscribe', { email });
      setNewsletterEmail('');
      setNewsletterFeedback('Berhasil berlangganan newsletter.');
      setNewsletterFeedbackType('success');
    } catch (error) {
      setNewsletterFeedback(getErrorMessage(error, 'Gagal berlangganan newsletter.'));
      setNewsletterFeedbackType('error');
    } finally {
      setIsSubmittingNewsletter(false);
    }
  };

  return (
    <footer className="relative bg-background pt-20 pb-10 overflow-hidden border-t border-border">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
      <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-[0.02] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Logo showSubLabel className="scale-110 origin-left" />
            {siteDescription ? (
              <p className="text-muted-foreground leading-relaxed text-sm max-w-xs">{siteDescription}</p>
            ) : (
              <p className="text-muted-foreground leading-relaxed text-sm max-w-xs">
                Deskripsi situs belum diatur.
              </p>
            )}

            {socialLinks.length > 0 ? (
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'p-2 rounded-lg bg-secondary/50 border border-border transition-all hover:scale-110',
                      social.color
                    )}
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Tautan media sosial belum diatur.</p>
            )}
          </div>

          <div>
            <h3 className="font-serif font-bold text-lg text-foreground mb-6 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-accent" />
              Navigasi
            </h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-accent transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-border group-hover:bg-accent transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-bold text-lg text-foreground mb-6 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-accent" />
              Banom NU
            </h3>
            {isLoadingData ? (
              <p className="text-sm text-muted-foreground">Memuat data banom...</p>
            ) : banoms.length > 0 ? (
              <ul className="space-y-3">
                {banoms.map((banom) => (
                  <li key={banom.id}>
                    <Link
                      href={`/banom/${banom.slug}`}
                      className="text-muted-foreground hover:text-accent transition-colors text-sm flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-border group-hover:bg-accent transition-colors" />
                      {banom.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada data banom.</p>
            )}
          </div>

          <div>
            <h3 className="font-serif font-bold text-lg text-foreground mb-6 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-accent" />
              Kontak
            </h3>

            {contactAddress || contactPhone || contactEmail ? (
              <ul className="space-y-4 mb-8">
                {contactAddress && (
                  <li className="flex items-start gap-3 text-sm text-muted-foreground">
                    <MapPin className="w-5 h-5 text-accent shrink-0" />
                    <span>{contactAddress}</span>
                  </li>
                )}
                {contactPhone && (
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Phone className="w-5 h-5 text-accent shrink-0" />
                    <span>{contactPhone}</span>
                  </li>
                )}
                {contactEmail && (
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="w-5 h-5 text-accent shrink-0" />
                    <span>{contactEmail}</span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground mb-8">Data kontak belum diatur.</p>
            )}

            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <h4 className="text-sm font-bold text-foreground mb-2">Berlangganan Newsletter</h4>
              <form className="flex gap-2" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  placeholder="Email Anda"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-xs w-full focus:outline-none focus:border-accent"
                  disabled={isSubmittingNewsletter}
                  aria-label="Email untuk berlangganan newsletter"
                />
                <button
                  type="submit"
                  className="bg-accent text-accent-foreground px-3 py-2 rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors disabled:opacity-60"
                  disabled={isSubmittingNewsletter}
                >
                  {isSubmittingNewsletter ? '...' : 'OK'}
                </button>
              </form>
              {newsletterFeedback && (
                <p
                  className={cn(
                    'mt-2 text-xs',
                    newsletterFeedbackType === 'success' ? 'text-emerald-600' : 'text-red-600'
                  )}
                >
                  {newsletterFeedback}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            {`© ${new Date().getFullYear()} ${siteTitle}. All rights reserved.`}
          </p>
          <div className="flex gap-6">
            <Link href="/kebijakan-privasi" className="hover:text-accent transition-colors">
              Kebijakan Privasi
            </Link>
            <Link href="/syarat-ketentuan" className="hover:text-accent transition-colors">
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
