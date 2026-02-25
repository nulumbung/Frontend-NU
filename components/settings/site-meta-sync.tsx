'use client';

import { useEffect, useMemo } from 'react';
import { useSiteSettings } from '@/components/settings/site-settings-context';

const DEFAULT_TITLE = 'NU LUMBUNG';
const DEFAULT_DESCRIPTION = 'Portal Berita dan Informasi Nahdlatul Ulama';
const DEFAULT_FAVICON = '/favicon.ico';
const MANAGED_ATTR = 'data-site-settings-managed';

const asTrimmed = (value?: string) => (value || '').trim();

const isValidFaviconUrl = (value: string) =>
  /^https?:\/\//i.test(value) || value.startsWith('/') || value.startsWith('data:image/');

const withCacheVersion = (href: string, version: string) => {
  if (!version || href.startsWith('data:image/')) return href;
  if (typeof window === 'undefined') return href;

  try {
    const url = new URL(href, window.location.origin);
    url.searchParams.set('v', version);
    return url.toString();
  } catch {
    return href;
  }
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

const detectIconMimeType = (href: string): string | null => {
  const normalized = href.toLowerCase();
  if (normalized.includes('.svg')) return 'image/svg+xml';
  if (normalized.includes('.png')) return 'image/png';
  if (normalized.includes('.jpg') || normalized.includes('.jpeg')) return 'image/jpeg';
  if (normalized.includes('.webp')) return 'image/webp';
  if (normalized.includes('.ico')) return 'image/x-icon';
  return 'image/png'; // Default to PNG for uploaded images
};

const ICON_SIZES = ['16x16', '32x32', '48x48', '64x64', '96x96', '128x128', '180x180', '192x192', '256x256', '512x512'];

const syncIconLinks = (href: string) => {
  const mimeType = detectIconMimeType(href);

  // Remove ALL existing icon links first
  const existingIconLinks = Array.from(document.querySelectorAll('link[rel*="icon"]')) as HTMLLinkElement[];
  existingIconLinks.forEach((link) => link.remove());

  // Create fresh icon links with all sizes for high-res display
  const createLink = (rel: string, size?: string) => {
    const link = document.createElement('link');
    link.setAttribute('rel', rel);
    link.setAttribute('href', href);
    if (mimeType) link.setAttribute('type', mimeType);
    if (size) link.setAttribute('sizes', size);
    link.setAttribute(MANAGED_ATTR, 'true');
    document.head.appendChild(link);
  };

  // Main icon (no size = browser picks best)
  createLink('icon');

  // Sized icons for different contexts
  ICON_SIZES.forEach((size) => {
    createLink('icon', size);
  });

  // Apple touch icon (large)
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

  const faviconHref = useMemo(() => {
    const cacheVersion = asTrimmed(settings.settings_version) || String(version);
    const configured = asTrimmed(settings.site_favicon);

    // Use the configured favicon URL directly (no proxy needed)
    if (isValidFaviconUrl(configured)) {
      return withCacheVersion(configured, cacheVersion);
    }

    return withCacheVersion(DEFAULT_FAVICON, cacheVersion);
  }, [settings.settings_version, settings.site_favicon, version]);

  useEffect(() => {
    document.title = siteTitle;
    upsertMetaTag('description', siteDescription);
    if (siteKeywords) {
      upsertMetaTag('keywords', siteKeywords);
    }
    syncIconLinks(faviconHref);
  }, [faviconHref, siteDescription, siteKeywords, siteTitle]);

  return null;
}
