import type { Metadata, ResolvingMetadata } from 'next';
import { createPageMetadata, DEFAULT_SITE_NAME } from '@/lib/seo/metadata';
import { absoluteUrl, getBackendBaseUrl } from '@/lib/seo/server';

const getBackendApiBaseUrl = () => `${getBackendBaseUrl()}/api`;

// Fetch single banom data for SEO
async function getBanomData(slug: string) {
  try {
    const response = await fetch(
      `${getBackendApiBaseUrl()}/banoms/${slug}`,
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Failed to fetch banom for metadata:', error);
    return null;
  }
}

export async function generateMetadata(
  {
    params,
  }: {
    params: Promise<{ slug: string }>;
  },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;

  // Fetch the banom data
  const banom = await getBanomData(slug);

  if (!banom) {
    return {
      title: `Organisasi | ${DEFAULT_SITE_NAME}`,
      description: 'Organisasi tidak ditemukan',
    };
  }

  const title = banom.name || 'Organisasi NU';
  const description = banom.short_desc || banom.long_desc?.substring(0, 155) || 'Informasi organisasi NU Lumbung';
  const ogImageObj = (await parent).openGraph?.images?.[0];
  const ogImageUrl = typeof ogImageObj === 'string' ? ogImageObj : ogImageObj?.url || (banom.logo ? absoluteUrl(banom.logo) : absoluteUrl('/og-image.png'));
  const url = absoluteUrl(`/organisasi/${banom.slug || slug}`);

  return createPageMetadata({
    title,
    description,
    canonical: url,
    ogImage: ogImageUrl,
    ogType: 'profile',
    keywords: [
      'organisasi',
      banom.name,
      'NU',
      'Nahdlatul Ulama',
      'lumbung',
    ],
  });
}

export default function BanomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
