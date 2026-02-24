'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/components/auth/auth-context';

export const SITE_SETTINGS_UPDATED_EVENT = 'site-settings-updated';

export type PublicSiteSettings = Partial<
  Record<
    | 'site_title'
    | 'site_description'
    | 'site_logo'
    | 'site_favicon'
    | 'contact_email'
    | 'contact_phone'
    | 'contact_address'
    | 'social_facebook'
    | 'social_twitter'
    | 'social_instagram'
    | 'social_youtube'
    | 'seo_meta_keywords'
    | 'seo_meta_description'
    | 'legal_privacy_policy'
    | 'legal_terms_conditions'
    | 'history_hero_background_image'
    | 'history_hero_tagline'
    | 'settings_version',
    string
  >
>;

interface SiteSettingsContextValue {
  settings: PublicSiteSettings;
  isLoading: boolean;
  refresh: () => Promise<void>;
  version: number;
}

const REFRESH_INTERVAL = 30000;

const SiteSettingsContext = createContext<SiteSettingsContextValue | undefined>(undefined);

const normalizeSettings = (payload: unknown): PublicSiteSettings => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }

  const next: Record<string, string> = {};
  Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      next[key] = '';
      return;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      next[key] = String(value);
    }
  });

  return next as PublicSiteSettings;
};

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSiteSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const isMountedRef = useRef(true);

  const fetchSettings = useCallback(async (silent = false) => {
    if (!silent && isMountedRef.current) {
      setIsLoading(true);
    }

    try {
      const response = await api.get('/settings/public');
      if (!isMountedRef.current) return;
      setSettings(normalizeSettings(response.data));
      setVersion((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to fetch public settings:', error);
    } finally {
      if (!silent && isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    const intervalId = window.setInterval(() => {
      fetchSettings(true);
    }, REFRESH_INTERVAL);

    const handleSettingsUpdated = () => {
      fetchSettings(true);
    };
    window.addEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdated);

    return () => {
      isMountedRef.current = false;
      window.clearInterval(intervalId);
      window.removeEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
    };
  }, [fetchSettings]);

  const contextValue = useMemo<SiteSettingsContextValue>(
    () => ({
      settings,
      isLoading,
      refresh: async () => {
        await fetchSettings(true);
      },
      version,
    }),
    [fetchSettings, isLoading, settings, version]
  );

  return <SiteSettingsContext.Provider value={contextValue}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within SiteSettingsProvider.');
  }
  return context;
}
