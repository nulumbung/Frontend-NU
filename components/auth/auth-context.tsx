
'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import axios from 'axios';
import { SetPasswordModal } from './set-password-modal';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  role: string;
  auth_provider?: string;
  last_login_at?: string | null;
  last_login_ip?: string | null;
  needs_password?: boolean;
}

type AuthPortal = 'public' | 'admin';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  portal?: AuthPortal;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, portal?: AuthPortal) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginWithGoogle: (idToken: string, portal?: AuthPortal) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_TOKEN_KEY = 'auth_token';
const USER_SESSION_KEY = 'user_session';
const DEVICE_FINGERPRINT_KEY = 'device_fingerprint';

// Get API base URL from environment variable
// In production: NEXT_PUBLIC_API_URL should be set to https://api.nulumbung.or.id/api
// In development: falls back to http://localhost:8000/api
const getApiBaseUrl = () => {
  // Priority: Use full backend URL for direct API access (bypasses Next.js proxy limits)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  // If we are on the SERVER SIDE (Node.js SSR), we MUST use the absolute URL.
  // Relative URLs like '/api' will cause Axios Network Error because it lacks a host.
  if (typeof window === 'undefined') {
    return backendUrl ? `${backendUrl.replace(/\/$/, '')}/api` : 'http://127.0.0.1:8000/api';
  }

  // If we are on the CLIENT SIDE, we should also prefer absolute to avoid proxy issues,
  // but fallback to relative '/api' if NEXT_PUBLIC_BACKEND_URL is somehow missing.
  if (backendUrl) {
    return `${backendUrl.replace(/\/$/, '')}/api`;
  }

  return '/api';
};

// Axios instance with base URL
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => Promise.reject(error));

const parseStoredUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(USER_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(USER_SESSION_KEY);
    return null;
  }
};

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

const setAuthHeader = (token?: string) => {
  // Now handled primarily by the Axios interceptor
  // But we can keep this for explicit state changes if needed
  if (!token) {
    delete api.defaults.headers.common['Authorization'];
    return;
  }
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

const ensureDeviceFingerprint = () => {
  if (typeof window === 'undefined') {
    return 'server-render';
  }

  const existing = localStorage.getItem(DEVICE_FINGERPRINT_KEY);
  if (existing) {
    return existing;
  }

  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  localStorage.setItem(DEVICE_FINGERPRINT_KEY, generated);
  return generated;
};

const getDevicePayload = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  const metadata = {
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
  };

  return {
    device_fingerprint: ensureDeviceFingerprint(),
    device_name: navigator.platform || 'Unknown Device',
    device_metadata: metadata,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const persistSession = (nextUser: User, token: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(nextUser));
    setAuthHeader(token);
    setUser(nextUser);
  };

  const clearSession = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_SESSION_KEY);
    setAuthHeader();
    setUser(null);
  };

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = parseStoredUser();

    if (!token) {
      setIsLoading(false);
      return;
    }

    // Set initial user from storage immediately on mount (safe for hydration now)
    if (storedUser) {
      setUser(storedUser);
    }

    setAuthHeader(token);

    let isMounted = true;
    api
      .get('/user')
      .then((response) => {
        if (!isMounted) return;
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(response.data));
        setUser(response.data);
      })
      .catch(() => {
        if (!isMounted) return;
        clearSession();
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string, portal: AuthPortal = 'public') => {
    const response = await api.post('/login', {
      email,
      password,
      portal,
      ...getDevicePayload(),
    });

    const { user: nextUser, token } = response.data;
    persistSession(nextUser, token);
  };

  const register = async (payload: RegisterPayload) => {
    const response = await api.post('/register', {
      ...payload,
      portal: payload.portal || 'public',
      ...getDevicePayload(),
    });

    const { user: nextUser, token } = response.data;
    persistSession(nextUser, token);
  };

  const loginWithGoogle = async (idToken: string, portal: AuthPortal = 'public') => {
    const response = await api.post('/auth/google', {
      id_token: idToken,
      portal,
      ...getDevicePayload(),
    });

    const { user: nextUser, token } = response.data;
    persistSession(nextUser, token);
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch {
      // Ignore logout errors (token might be invalid already)
    }

    clearSession();
  };

  const authValue = useMemo(
    () => ({ user, login, register, loginWithGoogle, logout, isLoading }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, isLoading]
  );

  return (
    <AuthContext.Provider value={authValue}>
      {children}

      {/* Forced Password Setup for Google Users */}
      {user?.needs_password && (
        <SetPasswordModal
          isOpen={true}
          userEmail={user.email}
          userName={user.name}
          api={api}
          onSuccess={() => {
            // Update context to reflect password was set
            setUser(prev => prev ? { ...prev, needs_password: false } : null);
          }}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { api }; // Export axios instance for other components
