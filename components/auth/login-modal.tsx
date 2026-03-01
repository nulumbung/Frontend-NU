
'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth, api } from './auth-context';
import { X, Lock, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

declare global {
  interface Window {
    google?: {
      accounts: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'small' | 'medium' | 'large';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: string | number;
              logo_alignment?: 'left' | 'center';
            }
          ) => void;
        };
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: '' | 'consent' }) => void;
          };
        };
      };
    };
  }
}

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  message?: string;
  initialMode?: 'login' | 'signup';
}

const GOOGLE_SCRIPT_ID = 'google-identity-services-script';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (maybeMessage) return maybeMessage;
  }
  return fallback;
};

export function LoginModal({
  isOpen,
  onClose,
  message = 'Silakan login untuk mengakses konten ini',
  initialMode = 'login',
}: LoginModalProps) {
  const { login, register, loginWithGoogle } = useAuth();
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode as 'login' | 'signup' | 'forgot');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupAvatar, setSignupAvatar] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode as 'login' | 'signup' | 'forgot');
    setError('');
    setSuccessMsg('');
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen || !googleButtonRef.current) return;

    if (!GOOGLE_CLIENT_ID) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing in frontend environment.');
      return;
    }

    let isMounted = true;

    const initGoogleButton = () => {
      if (!isMounted || !googleButtonRef.current) return;
      if (typeof window === 'undefined') return;

      const googleAccounts = window.google?.accounts?.id;
      if (!googleAccounts) {
        // Retry if script loaded but object isn't attached yet
        setTimeout(initGoogleButton, 150);
        return;
      }

      try {
        googleAccounts.initialize({
          client_id: GOOGLE_CLIENT_ID.trim(),
          callback: async (response: { credential: string }) => {
            if (!isMounted) return;
            setIsLoading(true);
            setError('');
            try {
              await loginWithGoogle(response.credential, 'public');
              onClose?.();
            } catch (err) {
              if (isMounted) setError(getErrorMessage(err, 'Login Google gagal.'));
            } finally {
              if (isMounted) setIsLoading(false);
            }
          },
        });

        // Clear before rendering (important for React Strict Mode where it might double call)
        if (googleButtonRef.current) {
          googleButtonRef.current.innerHTML = '';
          googleAccounts.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            text: mode === 'signup' ? 'signup_with' : 'signin_with',
            width: 320,
            logo_alignment: 'left',
          });
        }
      } catch (err) {
        console.error('[GoogleAuth] Error rendering button:', err);
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleButton();
    } else {
      let script = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = GOOGLE_SCRIPT_ID;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', initGoogleButton);
      return () => {
        isMounted = false;
        script?.removeEventListener('load', initGoogleButton);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, mode, loginWithGoogle, onClose, GOOGLE_CLIENT_ID]);

  if (!isOpen) return null;

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(loginEmail, loginPassword, 'public');
      onClose?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Login gagal. Periksa email dan password Anda.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await register({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        avatar: signupAvatar || undefined,
        portal: 'public',
      });
      onClose?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Registrasi gagal. Mohon cek data Anda.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setSuccessMsg(res.data.message || 'Tautan reset password telah dikirim ke email Anda.');
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal mengirim permintaan reset password.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 pt-20 md:pt-24">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="p-6 bg-muted/30 text-center relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Tutup modal login"
            >
              <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            </button>
          )}

          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-accent" />
          </div>

          <h2 className="text-xl font-bold mb-2">Login Diperlukan</h2>
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          {mode !== 'forgot' && (
            <div className="flex rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${mode === 'signup' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Daftar
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="flex justify-center mb-4">
              <button
                onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali ke Login
              </button>
            </div>
          )}

          {mode !== 'forgot' && GOOGLE_CLIENT_ID ? (
            <div className="flex flex-col items-center gap-2">
              <div ref={googleButtonRef} className="w-full flex justify-center" />
              <p className="text-[11px] text-muted-foreground text-center">
                Gunakan akun Google/YouTube asli untuk autentikasi cepat.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <p className="font-semibold">Login Google belum aktif.</p>
              <p className="mt-1 opacity-80">Segera hubungi administrator atau tambahkan `NEXT_PUBLIC_GOOGLE_CLIENT_ID` di konfigurasi frontend.</p>
            </div>
          )}

          {mode !== 'forgot' && (
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Email
                </span>
              </div>
            </div>
          )}

          {error && <div className="text-red-500 text-xs text-center font-medium bg-red-50 p-2 rounded-lg">{error}</div>}
          {successMsg && <div className="text-emerald-600 text-xs text-center font-medium bg-emerald-50 p-2 rounded-lg">{successMsg}</div>}

          {mode === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                placeholder="Email akun Anda"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-accent"
                required
              />
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Link Reset'}
              </button>
            </form>
          ) : mode === 'login' ? (
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-accent"
                required
                aria-label="Email login"
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-accent"
                required
                aria-label="Password login"
              />
              {/* TEMPORARY: Forgot Password hidden per user request */}
              {/* <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
                  className="text-xs text-accent hover:underline font-medium"
                >
                  Lupa Password?
                </button>
              </div> */}
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Masuk'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <input
                type="text"
                placeholder="Username"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-accent"
                required
                aria-label="Username pendaftaran"
              />
              <input
                type="url"
                placeholder="URL Foto Profil (opsional)"
                value={signupAvatar}
                onChange={(e) => setSignupAvatar(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-accent"
                aria-label="URL Foto Profil"
              />
              <input
                type="email"
                placeholder="Email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-accent"
                required
                aria-label="Email pendaftaran"
              />
              <input
                type="password"
                placeholder="Password (min. 8 karakter)"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-accent"
                minLength={8}
                required
                aria-label="Password pendaftaran"
              />
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Daftar & Masuk'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 text-center text-xs text-muted-foreground border-t border-border">
          Dengan melanjutkan, Anda menyetujui <Link href="/syarat-ketentuan" target="_blank" className="text-accent hover:underline">Syarat & Ketentuan</Link> kami.
        </div>
      </div>
    </div>
  );
}
