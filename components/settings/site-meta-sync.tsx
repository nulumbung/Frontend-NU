'use client';

import { useEffect, useMemo } from 'react';
import { useSiteSettings } from '@/components/settings/site-settings-context';

const DEFAULT_TITLE = 'NU LUMBUNG';
const DEFAULT_DESCRIPTION = 'Portal Berita dan Informasi Nahdlatul Ulama';
const DEFAULT_FAVICON = '/favicon.ico';
const MANAGED_ATTR = 'data-site-settings-managed';

const asTrimmed = (value?: string) => (value || '').trim();

const isValidFaviconUrl = (value: string) => {
  const trimmed = (value || '').trim();
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('data:image/');
};

const upsertMetaTag = (name: string, content: string) => {
  // Use querySelectorAll to handle duplicates and update all of them
  const tags = document.querySelectorAll(`meta[name="${name}"]`);

  if (tags.length > 0) {
    tags.forEach(tag => {
      if (tag.getAttribute('content') !== content) {
        tag.setAttribute('content', content);
      }
    });
  } else {
    const tag = document.createElement('meta');
    tag.setAttribute('name', name);
    tag.setAttribute('content', content);
    tag.setAttribute(MANAGED_ATTR, 'true');
    document.head.appendChild(tag);
  }
};

/**
 * Sync favicon links non-destructively.
 */
const syncIconLinks = (href: string) => {
  const bustUrl = href.includes('?')
    ? `${href}&_t=${Date.now()}`
    : `${href}?_t=${Date.now()}`;

  const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];

  rels.forEach(rel => {
    const links = document.querySelectorAll(`link[rel="${rel}"]`);

    if (links.length > 0) {
      links.forEach(link => {
        if (link.getAttribute('href') !== bustUrl) {
          link.setAttribute('href', bustUrl);
        }
      });
    } else {
      const link = document.createElement('link');
      link.rel = rel;
      link.setAttribute('href', bustUrl);
      link.setAttribute(MANAGED_ATTR, 'true');
      document.head.appendChild(link);
    }
  });
};

export function SiteMetaSync() {
  const { settings, version } = useSiteSettings();

  const siteTitle = asTrimmed(settings.site_title) || DEFAULT_TITLE;
  const siteDescription =
    asTrimmed(settings.seo_meta_description) ||
    asTrimmed(settings.site_description) ||
    DEFAULT_DESCRIPTION;
  const siteKeywords = asTrimmed(settings.seo_meta_keywords);

  // Derive the favicon href from settings.
  // Uses the uploaded URL directly — no server-side proxy required.
  const faviconHref = useMemo(() => {
    const configured = asTrimmed(settings.site_favicon);
    if (configured && isValidFaviconUrl(configured)) {
      // Ensure HTTPS on production
      let url = configured;
      if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        url = url.replace(/^http:\/\//, 'https://');
      }
      console.log('[Favicon] Using configured URL:', url);
      return url;
    }
    console.log('[Favicon] Using default fallback');
    return DEFAULT_FAVICON;
  }, [settings.site_favicon]);

  useEffect(() => {
    document.title = siteTitle;
    upsertMetaTag('description', siteDescription);
    if (siteKeywords) {
      upsertMetaTag('keywords', siteKeywords);
    }
    syncIconLinks(faviconHref);
  }, [faviconHref, siteDescription, siteKeywords, siteTitle, version]);

  return null;
}
