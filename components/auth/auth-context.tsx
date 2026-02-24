
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  role: string;
  auth_provider?: string;
  last_login_at?: string | null;
  last_login_ip?: string | null;
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

// Axios instance with base URL
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Accept': 'application/json',
  },
});

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
  const [user, setUser] = useState<User | null>(() => parseStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getStoredToken()));

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
    if (!token) {
      return;
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

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, isLoading }}>
      {children}
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
