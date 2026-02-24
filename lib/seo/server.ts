import type { MetadataRoute } from 'next';

type UnknownRecord = Record<string, unknown>;

const DEFAULT_SITE_URL = 'https://nulumbung.id';
const DEFAULT_BACKEND_URL = 'http://127.0.0.1:8000';
const DEFAULT_REVALIDATE_SECONDS = 300;
const MAX_POST_SITEMAP_PAGES = 30;

export const DEFAULT_SITE_NAME = 'NU Lumbung';
export const DEFAULT_SITE_DESCRIPTION =
  'Portal berita dan informasi resmi Nahdlatul Ulama Lumbung: berita NU, agenda, banom, multimedia, serta aktivitas kader.';
export const DEFAULT_SEO_KEYWORDS = [
  'nu lumbung',
  'nulumbung',
  'mwcnu lumbung',
  'mwcnu',
  'lumbung',
  'media nu lumbung',
  'berita lumbung',
  'portal berita',
  'berita nu',
  'organisasi nu',
  'kader lumbung',
  'kader nu',
  'ipnu',
  'ippnu',
  'ansor',
  'muslimat',
  'fatayat',
];

const PUBLIC_SETTING_KEYS = [
  'site_title',
  'site_description',
  'site_logo',
  'site_favicon',
  'contact_email',
  'contact_phone',
  'contact_address',
  'social_facebook',
  'social_twitter',
  'social_instagram',
  'social_youtube',
  'seo_meta_keywords',
  'seo_meta_description',
  'settings_version',
] as const;

type PublicSettingKey = (typeof PUBLIC_SETTING_KEYS)[number];

export type PublicSiteSettings = Partial<Record<PublicSettingKey, string>>;

export interface PostSeoData {
  id: number;
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  image?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
  tags?: string[] | null;
  category?: {
    name?: string | null;
    slug?: string | null;
  } | null;
}

export interface AgendaSeoData {
  id: number;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  date_start?: string | null;
  date_end?: string | null;
  location?: string | null;
  image?: string | null;
  organizer?: string | null;
  updated_at?: string | null;
}

export interface BanomSeoData {
  id: number;
  name?: string | null;
  slug?: string | null;
  short_desc?: string | null;
  long_desc?: string | null;
  logo?: string | null;
  updated_at?: string | null;
}

export interface CategorySeoData {
  id: number;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  image?: string | null;
  updated_at?: string | null;
}

export interface MultimediaSeoData {
  id: number;
  title?: string | null;
  slug?: string | null;
  type?: 'video' | 'photo' | string | null;
  description?: string | null;
  thumbnail?: string | null;
  date?: string | null;
  author?: string | null;
  updated_at?: string | null;
}

interface PaginatedResponse<T> {
  data?: T[];
  current_page?: number | string;
  last_page?: number | string;
}

const asTrimmed = (value?: string | null) => (value || '').trim();

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

const parseNumber = (value: number | string | undefined): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizeOrigin = (rawValue: string, fallback: string): string => {
  try {
    return new URL(rawValue).origin;
  } catch {
    return fallback;
  }
};

const getBackendApiBaseUrl = () => `${stripTrailingSlash(getBackendBaseUrl())}/api`;

const toSafePath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

const parseKeywordString = (raw?: string | null) =>
  asTrimmed(raw)
    .split(/[\n,;|]/g)
    .map((keyword) => keyword.trim())
    .filter(Boolean);

export const getSiteUrl = () =>
  sanitizeOrigin(
    asTrimmed(process.env.NEXT_PUBLIC_SITE_URL) || asTrimmed(process.env.SITE_URL) || DEFAULT_SITE_URL,
    DEFAULT_SITE_URL
  );

export const getBackendBaseUrl = () =>
  sanitizeOrigin(
    asTrimmed(process.env.BACKEND_INTERNAL_URL) ||
      asTrimmed(process.env.NEXT_PUBLIC_BACKEND_URL) ||
      DEFAULT_BACKEND_URL,
    DEFAULT_BACKEND_URL
  );

export const absoluteUrl = (path: string = '/') => new URL(path, `${getSiteUrl()}/`).toString();

export const resolveContentPath = (prefix: string, slugOrId: string | number) =>
  `${prefix}/${encodeURIComponent(String(slugOrId))}`;

export const resolveSlugOrId = (slug?: string | number | null, id?: string | number | null) => {
  const slugValue = asTrimmed(typeof slug === 'number' ? String(slug) : slug);
  if (slugValue) return slugValue;
  const idValue = asTrimmed(typeof id === 'number' ? String(id) : id);
  return idValue || '';
};

export const resolveAssetUrl = (rawUrl?: string | null) => {
  const value = asTrimmed(rawUrl);
  if (!value) return '';
  if (isHttpUrl(value)) return value;
  if (value.startsWith('/')) {
    return `${stripTrailingSlash(getBackendBaseUrl())}${value}`;
  }
  return `${stripTrailingSlash(getBackendBaseUrl())}/${value}`;
};

export const parseDate = (rawDate?: string | null) => {
  const value = asTrimmed(rawDate);
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

export const resolveLastModified = (...candidates: Array<string | null | undefined>) => {
  for (const candidate of candidates) {
    const parsed = parseDate(candidate);
    if (parsed) return parsed;
  }
  return undefined;
};

export const buildKeywords = (
  ...groups: Array<ReadonlyArray<string | null | undefined> | undefined>
) => {
  const seen = new Set<string>();
  const keywords: string[] = [];

  groups.forEach((group) => {
    if (!group) return;
    group.forEach((entry) => {
      const keyword = asTrimmed(entry || '');
      if (!keyword) return;

      const normalized = keyword.toLowerCase();
      if (seen.has(normalized)) return;
      seen.add(normalized);
      keywords.push(keyword);
    });
  });

  return keywords;
};

export const buildSeoKeywordSet = (
  customKeywords: ReadonlyArray<string | null | undefined> = [],
  settingsKeywordsRaw?: string | null
) =>
  buildKeywords(DEFAULT_SEO_KEYWORDS, parseKeywordString(settingsKeywordsRaw), customKeywords);

const fetchBackendJson = async <T>(
  path: string,
  revalidateSeconds = DEFAULT_REVALIDATE_SECONDS
): Promise<T | null> => {
  const endpoint = `${getBackendApiBaseUrl()}${toSafePath(path)}`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: revalidateSeconds,
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`Failed fetching backend endpoint: ${endpoint}`, error);
    return null;
  }
};

export const fetchPublicSiteSettings = async () => {
  const payload = await fetchBackendJson<unknown>('/settings/public', 60);
  if (!isRecord(payload)) return {} satisfies PublicSiteSettings;

  const settings: PublicSiteSettings = {};
  PUBLIC_SETTING_KEYS.forEach((key) => {
    const value = payload[key];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      settings[key] = String(value);
    }
  });

  return settings;
};

export const resolveSiteMeta = (settings: PublicSiteSettings) => {
  const siteName = asTrimmed(settings.site_title) || DEFAULT_SITE_NAME;
  const siteDescription =
    asTrimmed(settings.seo_meta_description) ||
    asTrimmed(settings.site_description) ||
    DEFAULT_SITE_DESCRIPTION;
  const siteKeywords = buildSeoKeywordSet([], settings.seo_meta_keywords);

  const contactEmail = asTrimmed(settings.contact_email);
  const contactPhone = asTrimmed(settings.contact_phone);
  const contactAddress = asTrimmed(settings.contact_address);

  const socialLinks = [
    asTrimmed(settings.social_facebook),
    asTrimmed(settings.social_twitter),
    asTrimmed(settings.social_instagram),
    asTrimmed(settings.social_youtube),
  ].filter((item) => isHttpUrl(item));

  return {
    siteName,
    siteDescription,
    siteKeywords,
    contactEmail,
    contactPhone,
    contactAddress,
    socialLinks,
  };
};

export const fetchPostBySlug = async (slug: string) =>
  fetchBackendJson<PostSeoData>(resolveContentPath('/posts', slug), 120);

export const fetchAgendaBySlugOrId = async (idOrSlug: string) =>
  fetchBackendJson<AgendaSeoData>(resolveContentPath('/agendas', idOrSlug), 120);

export const fetchBanomBySlug = async (slug: string) =>
  fetchBackendJson<BanomSeoData>(resolveContentPath('/banoms', slug), 120);

export const fetchCategoryBySlug = async (slug: string) =>
  fetchBackendJson<CategorySeoData>(resolveContentPath('/categories', slug), 120);

export const fetchMultimediaBySlug = async (slug: string) =>
  fetchBackendJson<MultimediaSeoData>(resolveContentPath('/multimedia', slug), 120);

export const fetchAllPostsForSitemap = async () => {
  const firstPage = await fetchBackendJson<PaginatedResponse<PostSeoData>>('/posts?page=1', 600);
  const initialRows = Array.isArray(firstPage?.data) ? firstPage.data : [];
  if (initialRows.length === 0) return [];

  const lastPage = Math.max(1, Math.min(MAX_POST_SITEMAP_PAGES, parseNumber(firstPage?.last_page)));
  const rows = [...initialRows];

  for (let page = 2; page <= lastPage; page += 1) {
    const response = await fetchBackendJson<PaginatedResponse<PostSeoData>>(`/posts?page=${page}`, 600);
    if (!Array.isArray(response?.data) || response.data.length === 0) break;
    rows.push(...response.data);
  }

  return rows;
};

export const fetchLatestPostsForRss = async (limit = 30) => {
  const boundedLimit = Math.max(1, Math.min(limit, 50));
  const rows = await fetchBackendJson<unknown>(`/posts/latest?limit=${boundedLimit}`, 600);
  return Array.isArray(rows) ? (rows as PostSeoData[]) : [];
};

export const fetchAgendasForSitemap = async () => {
  const rows = await fetchBackendJson<unknown>('/agendas', 600);
  return Array.isArray(rows) ? (rows as AgendaSeoData[]) : [];
};

export const fetchBanomsForSitemap = async () => {
  const rows = await fetchBackendJson<unknown>('/banoms', 600);
  return Array.isArray(rows) ? (rows as BanomSeoData[]) : [];
};

export const fetchCategoriesForSitemap = async () => {
  const rows = await fetchBackendJson<unknown>('/categories', 600);
  return Array.isArray(rows) ? (rows as CategorySeoData[]) : [];
};

export const fetchMultimediaForSitemap = async () => {
  const rows = await fetchBackendJson<unknown>('/multimedia', 600);
  return Array.isArray(rows) ? (rows as MultimediaSeoData[]) : [];
};

export const pushUniqueSitemapEntry = (
  collection: MetadataRoute.Sitemap,
  seen: Set<string>,
  entry: MetadataRoute.Sitemap[number]
) => {
  if (seen.has(entry.url)) return;
  seen.add(entry.url);
  collection.push(entry);
};
