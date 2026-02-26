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
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

/**
 * Force-update all favicon link elements in the document head.
 *
 * Browsers aggressively cache favicons, so simply changing `href` on an existing
 * `<link>` element often has no visible effect.  The most reliable cross-browser
 * approach is to:
 *   1. Remove every existing icon `<link>`.
 *   2. Append brand-new `<link>` elements with a cache-busting query string.
 */
const syncIconLinks = (href: string) => {
  // Append a unique timestamp to bust the browser cache
  const bustUrl = href.includes('?')
    ? `${href}&_t=${Date.now()}`
    : `${href}?_t=${Date.now()}`;

  // 1. Remove ALL existing icon links
  document
    .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    .forEach((el) => el.remove());

  // 2. Create new links
  const createLink = (rel: string, sizes?: string) => {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = bustUrl;
    if (sizes) link.setAttribute('sizes', sizes);
    link.setAttribute(MANAGED_ATTR, 'true');
    document.head.appendChild(link);
  };

  // Standard icon – no size constraint so the browser picks the best resolution
  createLink('icon');
  // Explicit large sizes to encourage hi-res rendering
  createLink('icon', '192x192');
  createLink('icon', '512x512');
  // Apple touch icon (required for iOS home screen)
  createLink('apple-touch-icon', '180x180');
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
