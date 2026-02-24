import { NextRequest, NextResponse } from 'next/server';

interface PublicSettingsResponse {
  site_favicon?: string | null;
}

const FALLBACK_ICON_PATH = '/favicon.ico';
const SETTINGS_PATH = '/api/settings/public';

const getBackendBaseUrl = () =>
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://127.0.0.1:8000';

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

const resolveIconUrl = (rawUrl: string) => {
  const value = rawUrl.trim();
  if (!value) return null;
  if (isHttpUrl(value)) return value;

  try {
    return new URL(value, getBackendBaseUrl()).toString();
  } catch {
    return null;
  }
};

const fallbackRedirect = (request: NextRequest) => {
  return NextResponse.redirect(new URL(FALLBACK_ICON_PATH, request.url), 307);
};

export async function GET(request: NextRequest) {
  try {
    const settingsResponse = await fetch(`${getBackendBaseUrl()}${SETTINGS_PATH}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!settingsResponse.ok) {
      return fallbackRedirect(request);
    }

    const settings = (await settingsResponse.json()) as PublicSettingsResponse;
    const iconUrl = resolveIconUrl(settings.site_favicon || '');

    if (!iconUrl) {
      return fallbackRedirect(request);
    }

    const iconResponse = await fetch(iconUrl, {
      cache: 'no-store',
    });

    if (!iconResponse.ok) {
      return fallbackRedirect(request);
    }

    const contentType = iconResponse.headers.get('content-type') || 'image/x-icon';
    const body = await iconResponse.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to serve site favicon:', error);
    return fallbackRedirect(request);
  }
}

