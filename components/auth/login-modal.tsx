
'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from './auth-context';
import { X, Lock, Loader2 } from 'lucide-react';

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
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupAvatar, setSignupAvatar] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setError('');
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen || !googleButtonRef.current || !GOOGLE_CLIENT_ID) {
      return;
    }

    const renderGoogleButton = () => {
      const googleId = window.google?.accounts?.id;
      if (!googleId || !googleButtonRef.current) return;

      googleId.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          setIsLoading(true);
          setError('');

          try {
            await loginWithGoogle(response.credential, 'public');
            onClose?.();
          } catch (err) {
            setError(getErrorMessage(err, 'Login Google gagal.'));
          } finally {
            setIsLoading(false);
          }
        },
      });

      googleButtonRef.current.innerHTML = '';
      googleId.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: mode === 'signup' ? 'signup_with' : 'signin_with',
        width: 320,
        logo_alignment: 'left',
      });
    };

    if (window.google) {
      renderGoogleButton();
      return;
    }

    let script = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = GOOGLE_SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener('load', renderGoogleButton);
    return () => {
      script?.removeEventListener('load', renderGoogleButton);
    };
  }, [isOpen, mode, loginWithGoogle, onClose]);

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
            >
              <X className="w-4 h-4 text-muted-foreground" />
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
          <div className="flex rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                mode === 'login' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
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
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                mode === 'signup' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Daftar
            </button>
          </div>

          {GOOGLE_CLIENT_ID ? (
            <div className="flex flex-col items-center gap-2">
              <div ref={googleButtonRef} className="w-full flex justify-center" />
              <p className="text-[11px] text-muted-foreground text-center">
                Gunakan akun Google/YouTube asli untuk autentikasi cepat.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Login Google belum aktif. Tambahkan `NEXT_PUBLIC_GOOGLE_CLIENT_ID` di env frontend.
            </div>
          )}
          
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {mode === 'login' ? 'Atau login dengan email' : 'Atau daftar dengan email'}
              </span>
            </div>
          </div>
          
          {error && <div className="text-red-500 text-xs text-center">{error}</div>}

          {mode === 'login' ? (
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <input 
                type="email" 
                placeholder="Email" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-accent" 
                required
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-accent" 
                required
              />
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
              />
              <input
                type="url"
                placeholder="URL Foto Profil (opsional)"
                value={signupAvatar}
                onChange={(e) => setSignupAvatar(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-accent"
              />
              <input
                type="email"
                placeholder="Email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-accent"
                required
              />
              <input
                type="password"
                placeholder="Password (min. 8 karakter)"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-accent"
                minLength={8}
                required
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
          Dengan melanjutkan, Anda menyetujui <a href="#" className="text-accent hover:underline">Syarat & Ketentuan</a> kami.
        </div>
      </div>
    </div>
  );
}
