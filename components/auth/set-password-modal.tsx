'use client';

import { FormEvent, useState } from 'react';
import { Lock, Loader2, Info } from 'lucide-react';
import { AxiosInstance } from 'axios';

interface SetPasswordModalProps {
    isOpen: boolean;
    onSuccess: () => void;
    userEmail: string;
    userName: string;
    api: AxiosInstance;
}

const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null) {
        const maybeMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
        if (maybeMessage) return maybeMessage;
    }
    return fallback;
};

export function SetPasswordModal({ isOpen, onSuccess, userEmail, userName, api }: SetPasswordModalProps) {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await api.put('/user/profile', {
                password: password
            });
            onSuccess();
        } catch (err) {
            setError(getErrorMessage(err, 'Gagal menyimpan password. Silakan coba lagi.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 pt-20 md:pt-24">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

            {/* Modal Content */}
            <div className="relative bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 bg-accent/5 text-center relative border-b border-border">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-background">
                        <Lock className="w-8 h-8 text-accent" />
                    </div>

                    <h2 className="text-xl font-bold mb-2">Buat Password Login</h2>
                    <p className="text-sm text-muted-foreground">
                        Halo {userName}, Anda masuk menggunakan akun Google. Untuk keamanan dan agar Anda bisa login menggunakan form manual di kemudian hari, <strong>silakan buat password</strong> khusus untuk platform ini.
                    </p>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 flex items-start gap-2">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>
                            Email Google Anda (<strong>{userEmail}</strong>) akan terintegrasi sebagai username Anda di form login biasa.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Password Baru</label>
                        <input
                            type="password"
                            placeholder="Minimal 8 karakter..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-accent font-mono"
                            required
                            minLength={8}
                        />
                    </div>

                    {error && <div className="text-red-500 text-xs text-center font-medium bg-red-50 p-2 rounded-lg border border-red-100">{error}</div>}

                    <button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        disabled={isLoading || password.length < 8}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan & Lanjutkan'}
                    </button>
                </form>
            </div>
        </div>
    );
}
