import type { Metadata, ResolvingMetadata } from 'next';
import { createArticleMetadata, DEFAULT_SITE_NAME } from '@/lib/seo/metadata';
import { absoluteUrl, getBackendBaseUrl } from '@/lib/seo/server';

const getBackendApiBaseUrl = () => `${getBackendBaseUrl()}/api`;

// Fetch single multimedia data for SEO
async function getMultimediaData(slug: string) {
  try {
    const response = await fetch(
      `${getBackendApiBaseUrl()}/multimedia/${slug}`,
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Failed to fetch multimedia for metadata:', error);
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

  // Fetch the multimedia data
  const item = await getMultimediaData(slug);

  if (!item) {
    return {
      title: `Multimedia | ${DEFAULT_SITE_NAME}`,
      description: 'Konten multimedia tidak ditemukan',
    };
  }

  const title = item.title || 'Multimedia';
  const description = item.description || `${item.type === 'video' ? 'Video' : 'Foto'} NU Lumbung`;
  const ogImageObj = (await parent).openGraph?.images?.[0];
  const ogImageStr = typeof ogImageObj === 'string' ? ogImageObj : ogImageObj?.url;
  const imageUrl = item.thumbnail || item.url || ogImageStr || absoluteUrl('/og-image.png');
  const finalImageUrl = imageUrl.startsWith('http') ? imageUrl : absoluteUrl(imageUrl);
  const url = absoluteUrl(`/multimedia/${item.slug || slug}`);
  const publishedDate = item.date;

  return createArticleMetadata(
    title,
    description,
    url,
    finalImageUrl,
    publishedDate,
    item.date,
    item.author,
    item.tags
  );
}

export default function MultimediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
