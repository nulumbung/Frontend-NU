'use client';

import { useEffect } from 'react';

export interface SchemaMarkupProps {
  schema: Record<string, any>;
  id?: string;
}

export function SchemaMarkup({ schema, id = 'schema-markup' }: SchemaMarkupProps) {
  useEffect(() => {
    // Add schema markup to head
    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('id', id);
    script.innerHTML = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById(id);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [schema, id]);

  return null;
}

export function BreadcrumbSchema({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <SchemaMarkup schema={schema} id="breadcrumb-schema" />;
}

export function NewsArticleSchema({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author,
  publisher,
  mainEntityOfPage,
}: {
  headline: string;
  description: string;
  image: string | string[];
  datePublished: string;
  dateModified: string;
  author?: string;
  publisher?: string;
  mainEntityOfPage?: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    description,
    image: Array.isArray(image) ? image : [image],
    datePublished,
    dateModified,
    author: author
      ? {
          '@type': 'Person',
          name: author,
        }
      : {
          '@type': 'Organization',
          name: 'NU Lumbung',
        },
    publisher: {
      '@type': 'Organization',
      name: publisher || 'NU Lumbung',
    },
    mainEntityOfPage: mainEntityOfPage
      ? {
          '@type': 'WebPage',
          '@id': mainEntityOfPage,
        }
      : undefined,
  };

  return <SchemaMarkup schema={schema} id="news-article-schema" />;
}

export function ArticleSchema({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author,
  mainEntityOfPage,
}: {
  headline: string;
  description: string;
  image: string | string[];
  datePublished: string;
  dateModified: string;
  author?: string;
  mainEntityOfPage?: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image: Array.isArray(image) ? image : [image],
    datePublished,
    dateModified,
    author: author
      ? {
          '@type': 'Person',
          name: author,
        }
      : {
          '@type': 'Organization',
          name: 'NU Lumbung',
        },
    publisher: {
      '@type': 'Organization',
      name: 'NU Lumbung',
    },
    mainEntityOfPage: mainEntityOfPage
      ? {
          '@type': 'WebPage',
          '@id': mainEntityOfPage,
        }
      : undefined,
  };

  return <SchemaMarkup schema={schema} id="article-schema" />;
}

export function EventSchema({
  name,
  description,
  startDate,
  endDate,
  location,
  image,
  organizer,
  url,
}: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  image?: string;
  organizer?: string;
  url?: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    endDate,
    location: {
      '@type': 'Place',
      name: location,
    },
    image,
    organizer: {
      '@type': 'Organization',
      name: organizer || 'NU Lumbung',
    },
    url,
  };

  return <SchemaMarkup schema={schema} id="event-schema" />;
}

export function OrganizationSchema({
  name,
  url,
  logo,
  description,
  sameAs,
  contactPoint,
}: {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
  contactPoint?: {
    contactType: string;
    email: string;
    phone?: string;
  };
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs: sameAs || [],
    contactPoint: contactPoint
      ? {
          '@type': 'ContactPoint',
          ...contactPoint,
        }
      : undefined,
  };

  return <SchemaMarkup schema={schema} id="organization-schema" />;
}
