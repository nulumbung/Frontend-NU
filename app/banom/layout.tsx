import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/server';

export const metadata: Metadata = createPageMetadata({
  title: 'Organisasi NU - Banom di Lumbung',
  description: 'Pelajari struktur organisasi Nahdlatul Ulama Lumbung, termasuk IPNU, IPPNU, Ansor, Muslimat, dan Fatayat. Informasi lengkap tentang setiap badan organisasi otonom NU.',
  canonical: absoluteUrl('/organisasi'),
  keywords: [
    'organisasi',
    'organisasi nu',
    'banom',
    'ipnu',
    'ippnu',
    'ansor',
    'muslimat',
    'fatayat',
    'lumbung',
    'kader',
  ],
});

export default function OrganisasiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
