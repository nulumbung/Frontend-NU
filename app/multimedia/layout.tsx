import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/server';

export const metadata: Metadata = createPageMetadata({
  title: 'Multimedia - Galeri Video & Foto NU',
  description: 'Jelajahi galeri multimedia Nahdlatul Ulama Lumbung dengan koleksi video, foto, dan dokumentasi kegiatan organisasi. Update visual dari berbagai acara dan program.',
  canonical: absoluteUrl('/multimedia'),
  keywords: [
    'multimedia',
    'galeri',
    'video',
    'foto',
    'dokumentasi',
    'media nu',
    'nu lumbung',
  ],
});

export default function MultimediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
