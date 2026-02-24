import type { MetadataRoute } from 'next';
import {
  getSiteUrl,
  absoluteUrl,
  getBackendBaseUrl,
} from '@/lib/seo/server';

const DEFAULT_REVALIDATE_SECONDS = 86400; // 24 hours
const getBackendApiBaseUrl = () => `${getBackendBaseUrl()}/api`;

// Static routes
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: absoluteUrl('/'),
    changeFrequency: 'daily',
    priority: 1.0,
    lastModified: new Date(),
  },
  {
    url: absoluteUrl('/berita'),
    changeFrequency: 'daily',
    priority: 0.9,
    lastModified: new Date(),
  },
  {
    url: absoluteUrl('/agenda'),
    changeFrequency: 'daily',
    priority: 0.8,
    lastModified: new Date(),
  },
  {
    url: absoluteUrl('/organisasi'),
    changeFrequency: 'weekly',
    priority: 0.8,
    lastModified: new Date(),
  },
  {
    url: absoluteUrl('/multimedia'),
    changeFrequency: 'weekly',
    priority: 0.7,
    lastModified: new Date(),
  },
  {
    url: absoluteUrl('/sejarah'),
    changeFrequency: 'monthly',
    priority: 0.5,
    lastModified: new Date(),
  },
  {
    url: absoluteUrl('/kebijakan-privasi'),
    changeFrequency: 'monthly',
    priority: 0.3,
    lastModified: new Date(),
  },
  {
    url: absoluteUrl('/syarat-ketentuan'),
    changeFrequency: 'monthly',
    priority: 0.3,
    lastModified: new Date(),
  },
];

async function fetchSitemapData<T>(endpoint: string): Promise<T[]> {
  try {
    const response = await fetch(`${getBackendApiBaseUrl()}${endpoint}?per_page=999`, {
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: DEFAULT_REVALIDATE_SECONDS,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${endpoint}:`, response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return [];
  }
}

export async function generateSitemaps() {
  return [{ id: '0' }, { id: '1' }, { id: '2' }, { id: '3' }];
}

export async function GET(request: Request) {
  // This is handled by Next.js automatically via sitemap.ts
  return new Response('Handled by Next.js');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [...STATIC_ROUTES];

  try {
    // Fetch posts/berita
    const posts = await fetchSitemapData<any>('/posts');
    posts.forEach((post) => {
      if (post.slug) {
        entries.push({
          url: absoluteUrl(`/berita/${post.slug}`),
          changeFrequency: 'weekly',
          priority: 0.7,
          lastModified: post.updated_at || post.created_at || new Date().toISOString(),
        });
      }
    });

    // Fetch categories
    const categories = await fetchSitemapData<any>('/categories');
    categories.forEach((category) => {
      if (category.slug) {
        entries.push({
          url: absoluteUrl(`/kategori/${category.slug}`),
          changeFrequency: 'weekly',
          priority: 0.6,
          lastModified: category.updated_at || new Date().toISOString(),
        });
      }
    });

    // Fetch agenda
    const agendas = await fetchSitemapData<any>('/agendas');
    agendas.forEach((agenda) => {
      if (agenda.slug) {
        entries.push({
          url: absoluteUrl(`/agenda/${agenda.slug}`),
          changeFrequency: 'daily',
          priority: 0.6,
          lastModified: agenda.updated_at || new Date().toISOString(),
        });
      }
    });

    // Fetch banom
    const banoms = await fetchSitemapData<any>('/banoms');
    banoms.forEach((banom) => {
      if (banom.slug) {
        entries.push({
          url: absoluteUrl(`/organisasi/${banom.slug}`),
          changeFrequency: 'monthly',
          priority: 0.5,
          lastModified: banom.updated_at || new Date().toISOString(),
        });
      }
    });

    // Fetch multimedia
    const multimedia = await fetchSitemapData<any>('/multimedia');
    multimedia.forEach((item) => {
      if (item.slug) {
        entries.push({
          url: absoluteUrl(`/multimedia/${item.slug}`),
          changeFrequency: 'monthly',
          priority: 0.4,
          lastModified: item.updated_at || item.date || new Date().toISOString(),
        });
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  // Sort by priority and remove duplicates
  const uniqueEntries = Array.from(
    new Map(entries.map((entry) => [entry.url, entry])).values()
  );

  return uniqueEntries;
}
