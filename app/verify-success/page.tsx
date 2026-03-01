'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/components/auth/auth-context';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const id = searchParams.get('id');
    const hash = searchParams.get('hash');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Memverifikasi email Anda...');

    useEffect(() => {
        if (!id || !hash) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStatus('error');
            setMessage('Tautan verifikasi tidak valid atau tidak lengkap.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await api.get(`/auth/verify-email/${id}/${hash}`);
                setStatus('success');
                setMessage(response.data?.message || 'Email berhasil diverifikasi.');

                // Optionally redirect after a few seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } catch (error: unknown) {
                setStatus('error');
                const apiError = error as { response?: { data?: { message?: string } } };
                setMessage(apiError.response?.data?.message || 'Gagal memverifikasi email. Tautan mungkin telah kadaluarsa.');
            }
        };

        verifyEmail();
    }, [id, hash, router]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 text-center">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Memverifikasi...</h1>
                            <p className="text-gray-500">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifikasi Berhasil!</h1>
                            <p className="text-gray-500 mb-8">{message}</p>

                            <Link
                                href="/login"
                                className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium rounded-xl transition-colors duration-200"
                            >
                                Lanjut ke Halaman Login
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <p className="mt-4 text-xs text-gray-400">
                                Anda akan dialihkan secara otomatis dalam 3 detik...
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifikasi Gagal</h1>
                            <p className="text-gray-500 mb-8">{message}</p>

                            <Link
                                href="/"
                                className="w-full inline-flex justify-center items-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors duration-200"
                            >
                                Kembali ke Beranda
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
