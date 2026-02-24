import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/server';

export const metadata: Metadata = createPageMetadata({
  title: 'Sejarah Nahdlatul Ulama',
  description: 'Pelajari sejarah lengkap Nahdlatul Ulama sejak awal berdiri hingga perkembangannya. Memahami latar belakang, nilai, dan kontribusi NU di Indonesia.',
  canonical: absoluteUrl('/sejarah'),
  keywords: [
    'sejarah',
    'sejarah nu',
    'nahdlatul ulama',
    'lumbung',
    'organisasi islam',
    'organisasi massa islam',
  ],
});

export default function SejarahLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
