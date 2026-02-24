import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/server';

export const metadata: Metadata = createPageMetadata({
  title: 'Agenda & Kegiatan NU',
  description: 'Lihat jadwal lengkap agenda dan kegiatan Nahdlatul Ulama Lumbung. Informasi tentang acara, seminar, diskusi, dan kegiatan sosial organisasi.',
  canonical: absoluteUrl('/agenda'),
  keywords: [
    'agenda',
    'jadwal',
    'kegiatan',
    'acara',
    'event',
    'nu lumbung',
    'organisasi',
  ],
});

export default function AgendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
