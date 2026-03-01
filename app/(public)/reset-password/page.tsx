'use client';

import { Suspense, FormEvent, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/components/auth/auth-context';
import { Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const email = searchParams.get('email') || '';
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Password dan konfirmasi password tidak cocok.');
            return;
        }

        if (password.length < 8) {
            setError('Password minimal 8 karakter.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await api.post('/auth/reset-password', {
                email,
                token,
                password,
            });
            setSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 3000);
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            const msg = apiError.response?.data?.message || 'Gagal mereset password. Token mungkin sudah tidak valid.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (!email || !token) {
        return (
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center max-w-lg mx-auto w-full">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <KeyRound className="w-8 h-8" />
                </div>
                <h1 className="text-xl font-bold mb-2">Tautan Tidak Valid</h1>
                <p className="text-muted-foreground text-sm mb-6">
                    Tautan reset password ini tidak valid karena tidak memiliki token atau email yang benar. Silakan ajukan ulang permintaan reset password melalui menu login.
                </p>
                <Link
                    href="/"
                    className="inline-flex justify-center items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors text-sm"
                >
                    Kembali ke Beranda
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center max-w-lg mx-auto w-full">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <KeyRound className="w-8 h-8" />
                </div>
                <h1 className="text-xl font-bold mb-2 text-emerald-700">Password Berhasil Direset</h1>
                <p className="text-muted-foreground text-sm mb-6">
                    Kata sandi Anda telah berhasil diubah. Mengalihkan Anda ke beranda...
                </p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden max-w-md mx-auto w-full relative">
            <div className="p-8 text-center border-b border-border bg-muted/30">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
                <p className="text-sm text-muted-foreground mt-2">
                    Buat password baru untuk akun <strong>{email}</strong>
                </p>
            </div>

            <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Password Baru</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-accent"
                            placeholder="Minimal 8 karakter"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Konfirmasi Password Baru</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-accent"
                            placeholder="Ulangi password baru"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || password.length < 8}
                        className="w-full flex justify-center items-center py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center py-20 px-4 bg-muted/10 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto relative z-10 flex justify-center">
                <Suspense fallback={
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                        <p>Memuat formulir...</p>
                    </div>
                }>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
