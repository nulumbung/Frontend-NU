import type { Metadata } from 'next';
import {
  DEFAULT_SITE_NAME,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SEO_KEYWORDS,
  getSiteUrl,
  absoluteUrl,
} from './server';

// Re-export for convenience
export { DEFAULT_SITE_NAME, DEFAULT_SITE_DESCRIPTION, DEFAULT_SEO_KEYWORDS } from './server';

export const createDefaultMetadata = (): Metadata => {
  const keywords = DEFAULT_SEO_KEYWORDS.join(', ');
  const siteUrl = getSiteUrl();

  return {
    title: DEFAULT_SITE_NAME,
    description: DEFAULT_SITE_DESCRIPTION,
    keywords,
    authors: [{ name: 'NU Lumbung' }],
    creator: 'NU Lumbung Team',
    publisher: 'NU Lumbung',
    formatDetection: {
      email: false,
      telephone: false,
      address: false,
    },
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: siteUrl,
      languages: {
        'id-ID': siteUrl,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      url: siteUrl,
      siteName: DEFAULT_SITE_NAME,
      title: DEFAULT_SITE_NAME,
      description: DEFAULT_SITE_DESCRIPTION,
      images: [
        {
          url: absoluteUrl('/og-image.png'),
          width: 1200,
          height: 630,
          alt: DEFAULT_SITE_NAME,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: DEFAULT_SITE_NAME,
      description: DEFAULT_SITE_DESCRIPTION,
      creator: '@nulumbung',
      images: [absoluteUrl('/og-image.png')],
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
      other: {
        ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION && {
          'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
        }),
        ...(process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION && {
          'yandex-verification': process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION,
        }),
      },
    },
  };
};

export interface PageMetadataOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'article' | 'website' | 'profile';
  publishedTime?: string;
  updatedTime?: string;
  authors?: string[];
  tags?: string[];
  noindex?: boolean;
}

export const createPageMetadata = (
  options: PageMetadataOptions
): Metadata => {
  const siteUrl = getSiteUrl();
  const title = options.title ? `${options.title} | ${DEFAULT_SITE_NAME}` : DEFAULT_SITE_NAME;
  const description = options.description || DEFAULT_SITE_DESCRIPTION;
  const keywords = [...DEFAULT_SEO_KEYWORDS, ...(options.keywords || [])];

  const canonical = options.canonical ? absoluteUrl(options.canonical) : siteUrl;
  const ogImage = options.ogImage || absoluteUrl('/og-image.png');

  const metadata: Metadata = {
    title,
    description,
    keywords: Array.from(new Set(keywords)).join(', '),
    alternates: {
      canonical,
    },
    robots: {
      index: options.noindex === true ? false : true,
      follow: true,
      nocache: false,
    },
    openGraph: {
      type: (options.ogType || 'website') as 'article' | 'website' | 'profile',
      locale: 'id_ID',
      url: canonical,
      siteName: DEFAULT_SITE_NAME,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(options.publishedTime && { publishedTime: options.publishedTime }),
      ...(options.updatedTime && { modifiedTime: options.updatedTime }),
      ...(options.authors && { authors: options.authors }),
      ...(options.tags && { tags: options.tags }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@nulumbung',
    },
  };

  return metadata;
};

export const createArticleMetadata = (
  title: string,
  description: string,
  canonicalUrl: string,
  imageUrl: string,
  publishedDate?: string,
  updatedDate?: string,
  authors?: string[],
  tags?: string[]
): Metadata => {
  return createPageMetadata(
    {
      title,
      description,
      canonical: canonicalUrl,
      ogImage: imageUrl,
      ogType: 'article',
      publishedTime: publishedDate,
      updatedTime: updatedDate,
      authors,
      tags: [...DEFAULT_SEO_KEYWORDS, ...(tags || [])],
    }
  );
};

export const createBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

export const createOrganizationSchema = () => {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: DEFAULT_SITE_NAME,
    url: siteUrl,
    logo: absoluteUrl('/logo.png'),
    description: DEFAULT_SITE_DESCRIPTION,
    sameAs: [
      'https://www.facebook.com/nulumbung',
      'https://www.twitter.com/nulumbung',
      'https://www.instagram.com/nulumbung',
      'https://www.youtube.com/nulumbung',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
    },
  };
};

export const createNewsArticleSchema = (
  title: string,
  description: string,
  imageUrl: string,
  publishedDate: string,
  updatedDate: string,
  authorName?: string,
  articleUrl?: string
) => {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    image: imageUrl,
    datePublished: publishedDate,
    dateModified: updatedDate,
    author: authorName
      ? {
        '@type': 'Person',
        name: authorName,
      }
      : {
        '@type': 'Organization',
        name: DEFAULT_SITE_NAME,
      },
    publisher: {
      '@type': 'Organization',
      name: DEFAULT_SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.png'),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl || siteUrl,
    },
  };
};

export const createArticleSchema = (
  title: string,
  description: string,
  imageUrl: string,
  publishedDate: string,
  updatedDate: string,
  authorName?: string,
  articleUrl?: string
) => {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: imageUrl,
    datePublished: publishedDate,
    dateModified: updatedDate,
    author: authorName
      ? {
        '@type': 'Person',
        name: authorName,
      }
      : {
        '@type': 'Organization',
        name: DEFAULT_SITE_NAME,
      },
    publisher: {
      '@type': 'Organization',
      name: DEFAULT_SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.png'),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl || siteUrl,
    },
  };
};

export const createEventSchema = (
  title: string,
  description: string,
  startDate: string,
  endDate: string,
  location: string,
  imageUrl: string,
  organizer?: string
) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    description,
    startDate,
    endDate,
    location: {
      '@type': 'Place',
      name: location,
    },
    image: imageUrl,
    organizer: organizer
      ? {
        '@type': 'Organization',
        name: organizer,
        url: getSiteUrl(),
      }
      : {
        '@type': 'Organization',
        name: DEFAULT_SITE_NAME,
        url: getSiteUrl(),
      },
  };
};
