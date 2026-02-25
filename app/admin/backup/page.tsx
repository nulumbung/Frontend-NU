
'use client';

import { useState, useRef } from 'react';
import { api } from '@/components/auth/auth-context';
import {
    Download,
    Upload,
    Loader2,
    HardDrive,
    FileArchive,
    CheckCircle2,
    AlertTriangle,
    Database,
    Image,
    Calendar,
    User,
    X,
    Shield,
    UploadCloud
} from 'lucide-react';

interface BackupManifest {
    app: string;
    version: string;
    created_at: string;
    created_by: string;
    tables: Record<string, number>;
    files_count: number;
}

interface RestoreResult {
    message: string;
    details: {
        tables_restored: number;
        files_restored: number;
        backup_date: string;
        backup_by: string;
    };
}

export default function BackupPage() {
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [backupSuccess, setBackupSuccess] = useState(false);
    const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
    const [restoreError, setRestoreError] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [manifest, setManifest] = useState<BackupManifest | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleBackup = async () => {
        setIsBackingUp(true);
        setBackupSuccess(false);
        try {
            const response = await api.get('/backup/download', {
                responseType: 'blob',
            });

            // Create download link
            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Extract filename from header or generate
            const contentDisposition = response.headers['content-disposition'];
            let filename = `nulumbung_backup_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_')}.zip`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+)"?/);
                if (match) filename = match[1];
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setBackupSuccess(true);
            setTimeout(() => setBackupSuccess(false), 8000);
        } catch (error) {
            console.error('Backup failed', error);
            alert('Gagal membuat backup. Silakan coba lagi.');
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleFileSelect = async (file: File) => {
        if (!file.name.endsWith('.zip')) {
            alert('Hanya file ZIP yang diperbolehkan.');
            return;
        }

        setSelectedFile(file);
        setManifest(null);
        setRestoreResult(null);
        setRestoreError('');
        setIsPreviewing(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/backup/preview', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setManifest(response.data);
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
                || 'File tidak valid.';
            setRestoreError(message);
            setSelectedFile(null);
        } finally {
            setIsPreviewing(false);
        }
    };

    const handleRestore = async () => {
        if (!selectedFile) return;

        setShowConfirm(false);
        setIsRestoring(true);
        setRestoreResult(null);
        setRestoreError('');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await api.post('/backup/restore', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 300000, // 5 minute timeout for large backups
            });

            setRestoreResult(response.data);
            setSelectedFile(null);
            setManifest(null);
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
                || 'Gagal melakukan restore.';
            setRestoreError(message);
        } finally {
            setIsRestoring(false);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setManifest(null);
        setRestoreError('');
        setRestoreResult(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const totalRecords = manifest ? Object.values(manifest.tables).reduce((a, b) => a + b, 0) : 0;

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch {
            return iso;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <HardDrive className="w-7 h-7 text-green-600" />
                    Backup & Restore
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Backup seluruh data (database + file upload) dan restore dari file backup.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* === BACKUP CARD === */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5">
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Download className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg">Backup Data</h2>
                                <p className="text-green-100 text-xs">Download backup lengkap sebagai ZIP</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Database className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span>Semua tabel database (users, posts, categories, dll.)</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Image className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <span>Semua file gambar yang telah diupload</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Shield className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                <span>Roles, permissions, dan konfigurasi sistem</span>
                            </div>
                        </div>

                        <button
                            onClick={handleBackup}
                            disabled={isBackingUp}
                            className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md"
                        >
                            {isBackingUp ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Membuat Backup...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    Download Backup
                                </>
                            )}
                        </button>

                        {backupSuccess && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <p className="text-sm text-green-700 font-medium">Backup berhasil didownload!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* === RESTORE CARD === */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5">
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Upload className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg">Restore Data</h2>
                                <p className="text-amber-100 text-xs">Upload file backup ZIP untuk restore</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* File Drop Zone */}
                        {!selectedFile && !restoreResult && (
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver
                                        ? 'border-amber-400 bg-amber-50'
                                        : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                                    }`}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragOver(false);
                                    const file = e.dataTransfer.files[0];
                                    if (file) handleFileSelect(file);
                                }}
                                onClick={() => fileRef.current?.click()}
                            >
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".zip"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelect(file);
                                    }}
                                />
                                <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-amber-500' : 'text-gray-300'}`} />
                                <p className="text-sm font-medium text-gray-700">
                                    {dragOver ? 'Lepaskan file di sini...' : 'Drag & drop file backup ZIP'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">atau klik untuk memilih file</p>
                            </div>
                        )}

                        {/* Preview Loading */}
                        {isPreviewing && (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                                <span className="ml-2 text-sm text-gray-500">Membaca file backup...</span>
                            </div>
                        )}

                        {/* Error */}
                        {restoreError && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-red-700">{restoreError}</p>
                                    <button
                                        onClick={clearFile}
                                        className="text-xs text-red-600 underline mt-1"
                                    >
                                        Coba lagi
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Manifest Preview */}
                        {manifest && selectedFile && !isRestoring && !restoreResult && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileArchive className="w-5 h-5 text-amber-500" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{selectedFile.name}</p>
                                            <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
                                        </div>
                                    </div>
                                    <button onClick={clearFile} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>

                                {/* Backup Info */}
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Calendar className="w-3 h-3" />
                                        <span>Dibuat: <strong className="text-gray-700">{formatDate(manifest.created_at)}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <User className="w-3 h-3" />
                                        <span>Oleh: <strong className="text-gray-700">{manifest.created_by}</strong></span>
                                    </div>
                                </div>

                                {/* Tables Summary */}
                                <div className="border border-gray-100 rounded-xl overflow-hidden">
                                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Data yang akan di-restore
                                        </p>
                                    </div>
                                    <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                                        {Object.entries(manifest.tables).filter(([, count]) => count > 0).map(([table, count]) => (
                                            <div key={table} className="flex items-center justify-between px-4 py-2">
                                                <span className="text-sm text-gray-700">{table}</span>
                                                <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{count} rows</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-600">Total</span>
                                        <span className="text-xs font-bold text-gray-700">{totalRecords} records • {manifest.files_count} files</span>
                                    </div>
                                </div>

                                {/* Warning */}
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-red-700">
                                        <strong>Peringatan:</strong> Restore akan <strong>menimpa semua data yang ada</strong>. Pastikan Anda sudah membuat backup terlebih dahulu sebelum melanjutkan.
                                    </p>
                                </div>

                                {/* Restore Button */}
                                {!showConfirm ? (
                                    <button
                                        onClick={() => setShowConfirm(true)}
                                        className="w-full bg-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <Upload className="w-5 h-5" />
                                        Restore Data
                                    </button>
                                ) : (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                                        <p className="text-sm font-bold text-red-800 text-center">
                                            Yakin ingin melakukan restore?
                                        </p>
                                        <p className="text-xs text-red-600 text-center">Semua data saat ini akan diganti dengan data dari file backup.</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowConfirm(false)}
                                                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={handleRestore}
                                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                                            >
                                                Ya, Restore Sekarang
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Restoring Progress */}
                        {isRestoring && (
                            <div className="text-center py-8">
                                <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-3" />
                                <p className="text-sm font-semibold text-gray-700">Sedang melakukan restore...</p>
                                <p className="text-xs text-gray-400 mt-1">Proses ini mungkin memakan waktu beberapa menit.</p>
                            </div>
                        )}

                        {/* Restore Success */}
                        {restoreResult && (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <p className="text-sm font-bold text-green-700">Restore Berhasil!</p>
                                    </div>
                                    <div className="space-y-1 ml-7">
                                        <p className="text-xs text-green-600">
                                            {restoreResult.details.tables_restored} tabel berhasil di-restore
                                        </p>
                                        <p className="text-xs text-green-600">
                                            {restoreResult.details.files_restored} file berhasil di-restore
                                        </p>
                                        {restoreResult.details.backup_date && (
                                            <p className="text-xs text-green-600">
                                                Dari backup: {formatDate(restoreResult.details.backup_date)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={clearFile}
                                    className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Selesai
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Database className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700 space-y-1">
                    <p className="font-semibold">Informasi Backup</p>
                    <p>• File backup berformat ZIP yang berisi data database (JSON) dan file upload.</p>
                    <p>• Backup menyimpan semua data: pengguna, berita, kategori, agenda, banom, multimedia, sejarah, iklan, newsletter, live stream, komentar, roles, permissions, dan pengaturan.</p>
                    <p>• Disarankan untuk membuat backup secara berkala dan menyimpannya di lokasi yang aman.</p>
                </div>
            </div>
        </div>
    );
}
