import type { Metadata, ResolvingMetadata } from 'next';
import { createArticleMetadata, DEFAULT_SITE_NAME } from '@/lib/seo/metadata';
import { absoluteUrl, getBackendBaseUrl } from '@/lib/seo/server';

const getBackendApiBaseUrl = () => `${getBackendBaseUrl()}/api`;

// Fetch single post data for SEO
async function getPostData(slug: string) {
  try {
    const response = await fetch(
      `${getBackendApiBaseUrl()}/posts/${slug}`,
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Failed to fetch post for metadata:', error);
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

  // Fetch the post data
  const post = await getPostData(slug);

  if (!post) {
    return {
      title: `Berita | ${DEFAULT_SITE_NAME}`,
      description: 'Berita tidak ditemukan',
    };
  }

  const title = post.title || 'Berita';
  const description = post.excerpt || post.content?.substring(0, 155) || 'Baca berita terbaru di NU Lumbung';
  const ogImageObj = (await parent).openGraph?.images?.[0];
  const ogImageUrl = typeof ogImageObj === 'string' ? ogImageObj : ogImageObj?.url || (post.image ? absoluteUrl(post.image) : absoluteUrl('/og-image.png'));
  const url = absoluteUrl(`/berita/${post.slug || slug}`);
  const publishedDate = post.created_at;
  const updatedDate = post.updated_at;

  return createArticleMetadata(
    title,
    description,
    url,
    ogImageUrl,
    publishedDate,
    updatedDate,
    post.author?.name ? [post.author.name] : undefined,
    post.tags
  );
}

export default function BeritaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
