import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/server';

export const metadata: Metadata = createPageMetadata({
  title: 'Berita & Informasi NU',
  description: 'Baca berita terkini, informasi, dan laporan terbaru dari Nahdlatul Ulama Lumbung. Update langsung tentang kegiatan, agenda, dan perkembangan organisasi.',
  canonical: absoluteUrl('/berita'),
  keywords: [
    'berita',
    'berita nu',
    'berita lumbung',
    'informasi nu',
    'portal berita',
    'media nu lumbung',
    'berita nahdlatul ulama',
  ],
});

export default function BeritaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
