import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/server';

export const metadata: Metadata = createPageMetadata({
  title: 'Kategori Berita - NU Lumbung',
  description: 'Jelajahi berbagai kategori berita dan informasi dari Nahdlatul Ulama Lumbung. Cari berita berdasarkan topik yang Anda minati.',
  canonical: absoluteUrl('/kategori'),
  keywords: [
    'kategori',
    'kategori berita',
    'topik',
    'berita',
    'nu lumbung',
  ],
});

export default function KategoriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
