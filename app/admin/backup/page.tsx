'use client';

import { useState, useEffect } from 'react';
import { backupService, BackupItem } from '@/lib/services/backup.service';
import { toast } from 'sonner';
import { Loader2, HardDriveUpload, Download, Trash2, RefreshCw, UploadCloud, FileArchive } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function BackupPage() {
    const [backups, setBackups] = useState<BackupItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processMessage, setProcessMessage] = useState('');

    useEffect(() => {
        fetchBackups();
    }, []);

    const fetchBackups = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const data = await backupService.getBackups();
            setBackups(data);
        } catch (error) {
            console.error('Failed to fetch backups', error);
            toast.error('Gagal memuat daftar backup.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        if (!confirm('Proses ini akan menjalankan backup database dan file platform. Anda yakin ingin melanjutkan?')) return;

        setIsProcessing(true);
        setProcessMessage('Sedang membuat backup (ini mungkin memakan waktu)...');
        try {
            await backupService.createBackup();
            toast.success('Proses backup telah dimulai di latar belakang. Silakan refresh halaman setelah beberapa menit.');
            setTimeout(() => fetchBackups(true), 5000); // give it some time
        } catch (error: unknown) {
            const apiError = error as { response?: { data?: { message?: string } } };
            toast.error(apiError.response?.data?.message || 'Gagal membuat backup.');
        } finally {
            setIsProcessing(false);
            setProcessMessage('');
        }
    };

    const handleDelete = async (fileName: string) => {
        if (!confirm(`Hapus backup ${fileName} secara permanen?`)) return;

        setIsProcessing(true);
        setProcessMessage('Menghapus backup...');
        try {
            await backupService.deleteBackup(fileName);
            toast.success('Backup berhasil dihapus.');
            fetchBackups(true);
        } catch {
            toast.error('Gagal menghapus backup.');
        } finally {
            setIsProcessing(false);
            setProcessMessage('');
        }
    };

    const handleRestoreServer = async (fileName: string) => {
        if (!confirm(`TIDAK BISA DIBATALKAN! Anda yakin ingin merestore sistem menggunakan ${fileName}? Seluruh data saat ini akan ditimpa dengan data dari backup ini.`)) return;

        setIsProcessing(true);
        setProcessMessage(`Sedang merestore dari ${fileName}... Mohon jangan tutup halaman ini.`);
        try {
            const res = await backupService.restoreBackup(fileName);
            toast.success(res.message);
            // Wait a bit before reloading the page to show the toast
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (error: unknown) {
            const apiError = error as { response?: { data?: { message?: string } } };
            toast.error(apiError.response?.data?.message || 'Gagal merestore sistem.');
            setIsProcessing(false);
            setProcessMessage('');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm(`TIDAK BISA DIBATALKAN! Anda yakin ingin merestore sistem menggunakan file ${file.name}?`)) {
            e.target.value = '';
            return;
        }

        setIsProcessing(true);
        setProcessMessage(`Mengupload dan merestore dari ${file.name}... Mohon jangan tutup halaman ini.`);
        try {
            const res = await backupService.restoreBackup(undefined, file);
            toast.success(res.message);
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (error: unknown) {
            const apiError = error as { response?: { data?: { message?: string } } };
            toast.error(apiError.response?.data?.message || 'Gagal merestore sistem dari file.');
            setIsProcessing(false);
            setProcessMessage('');
        } finally {
            e.target.value = '';
        }
    };

    return (
        <div>
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sistem Backup & Restore</h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola cadangan data platform (Database & File Uploads).</p>
                </div>

                <div className="flex gap-3">
                    {/* Hidden File Input UI */}
                    <div className="relative">
                        <input
                            type="file"
                            accept=".zip"
                            onChange={handleFileUpload}
                            disabled={isProcessing}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            title="Upload File Backup (.zip)"
                        />
                        <button
                            disabled={isProcessing}
                            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 h-[42px]"
                        >
                            <UploadCloud className="w-4 h-4" />
                            Upload & Restore
                        </button>
                    </div>

                    <button
                        onClick={() => fetchBackups()}
                        disabled={isLoading || isProcessing}
                        className="flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 h-[42px] w-[42px]"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={handleCreateBackup}
                        disabled={isProcessing}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 h-[42px]"
                    >
                        <HardDriveUpload className="w-4 h-4" />
                        Buat Backup Baru
                    </button>
                </div>
            </div>

            {isProcessing && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-yellow-800">
                    <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                    <p className="text-sm font-medium">{processMessage}</p>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                    </div>
                ) : backups.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileArchive className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Belum Ada Backup</h3>
                        <p className="text-gray-500 text-sm">Klik tombol &quot;Buat Backup Baru&quot; untuk membackup sistem Anda.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-900">Nama File</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900">Ukuran</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900">Tanggal Dibuat</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {backups.map((backup) => (
                                    <tr key={backup.file_name} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                            <FileArchive className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            {backup.file_name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                {backup.file_size}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {format(new Date(backup.created_at), 'dd MMMM yyyy HH:mm:ss', { locale: id })}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <a
                                                href={backupService.getDownloadUrl(backup.file_name)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => handleRestoreServer(backup.file_name)}
                                                disabled={isProcessing}
                                                className="inline-flex items-center p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Restore Sistem dengan Backup ini"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(backup.file_name)}
                                                disabled={isProcessing}
                                                className="inline-flex items-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
