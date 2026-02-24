import type { Metadata, ResolvingMetadata } from 'next';
import { createPageMetadata, DEFAULT_SITE_NAME } from '@/lib/seo/metadata';
import { absoluteUrl, getBackendBaseUrl } from '@/lib/seo/server';

const getBackendApiBaseUrl = () => `${getBackendBaseUrl()}/api`;

// Fetch single category data for SEO
async function getCategoryData(slug: string) {
  try {
    const response = await fetch(
      `${getBackendApiBaseUrl()}/categories/${slug}`,
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Failed to fetch category for metadata:', error);
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

  // Fetch the category data
  const category = await getCategoryData(slug);

  if (!category) {
    return {
      title: `Kategori | ${DEFAULT_SITE_NAME}`,
      description: 'Kategori berita tidak ditemukan',
    };
  }

  const title = `${category.name} - Berita & Informasi`;
  const description = category.description || `Baca semua berita dalam kategori ${category.name}`;
  const ogImageObj = (await parent).openGraph?.images?.[0];
  const ogImageUrl = typeof ogImageObj === 'string' ? ogImageObj : ogImageObj?.url || (category.image ? absoluteUrl(category.image) : absoluteUrl('/og-image.png'));
  const url = absoluteUrl(`/kategori/${category.slug || slug}`);

  return createPageMetadata({
    title,
    description,
    canonical: url,
    ogImage: ogImageUrl,
    keywords: [
      'kategori',
      category.name,
      'berita',
      'NU',
      'lumbung',
    ],
  });
}

export default function KategoriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
