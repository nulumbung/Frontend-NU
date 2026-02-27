
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/components/auth/auth-context';
import { createLiveStreamService, LiveStream } from '@/lib/services/live-stream.service';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Save, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ImageInput } from '@/components/form/image-input';

const getErrorMessage = (error: unknown): string => {
  const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
  return error instanceof Error ? error.message : 'Unknown error';
};

export default function EditLiveStreamPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<LiveStream>>({
    title: '',
    youtube_id: '',
    channel_name: '',
    thumbnail_url: '',
    is_active: false,
    status: '',
    scheduled_start_time: ''
  });

  const liveStreamService = createLiveStreamService(api);

  useEffect(() => {
    const fetchStream = async () => {
      try {
        setError(null);
        const stream = await liveStreamService.getById(Number(params.id));
        
        // Format datetime-local
        const formatDateTime = (dateString?: string) => {
            if (!dateString) return '';
            const d = new Date(dateString);
            return d.toISOString().slice(0, 16);
        };

        setFormData({
          title: stream.title || '',
          youtube_id: stream.youtube_id,
          channel_name: stream.channel_name || '',
          thumbnail_url: stream.thumbnail_url || '',
          is_active: stream.is_active,
          status: stream.status,
          scheduled_start_time: formatDateTime(stream.scheduled_start_time)
        });
      } catch (err) {
        const message = getErrorMessage(err);
        console.error('Failed to fetch live stream:', message);
        setError(message);
        setTimeout(() => router.push('/admin/live-streams'), 2000);
      } finally {
        setIsFetching(false);
      }
    };

    if (params.id) {
        fetchStream();
    }
  }, [params.id, router, liveStreamService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await liveStreamService.update(Number(params.id), formData);
      setSuccessMessage('Siaran berhasil diperbarui');
      setTimeout(() => router.push('/admin/live-streams'), 1500);
    } catch (err) {
      const message = getErrorMessage(err);
      console.error('Failed to update live stream:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!confirm('Ini akan menimpa data judul dan thumbnail dengan data terbaru dari YouTube. Lanjutkan?')) return;
    
    setIsLoading(true);
    setError(null);
    try {
        const updated = await liveStreamService.refresh(Number(params.id));
        setFormData(prev => ({
            ...prev,
            title: updated.title,
            channel_name: updated.channel_name,
            thumbnail_url: updated.thumbnail_url
        }));
        setSuccessMessage('Data berhasil diperbarui dari YouTube!');
        setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
        const message = getErrorMessage(err);
        console.error('Failed to refresh data:', message);
        setError(message);
    } finally {
        setIsLoading(false);
    }
  };

  if (isFetching) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Memuat data siaran...</p>
          </div>
        </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/live-streams" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Siaran Langsung</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Terjadi Kesalahan</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 font-medium">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex justify-end mb-4">
            <button 
                type="button" 
                onClick={handleRefresh}
                disabled={isLoading}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data dari YouTube
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Judul Siaran *</label>
            <input 
              type="text" 
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              onFocus={() => setError(null)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">YouTube Video ID</label>
            <input 
              type="text" 
              required
              readOnly
              value={formData.youtube_id || ''}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">ID tidak dapat diubah. Buat siaran baru jika perlu mengubah video.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Channel</label>
            <input 
              type="text" 
              value={formData.channel_name || ''}
              onChange={(e) => setFormData({...formData, channel_name: e.target.value})}
              onFocus={() => setError(null)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <ImageInput
              label="URL Thumbnail"
              value={formData.thumbnail_url || ''}
              onChange={(value) => setFormData({...formData, thumbnail_url: value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jadwal Tayang (Opsional)</label>
            <input 
              type="datetime-local" 
              value={formData.scheduled_start_time || ''}
              onChange={(e) => setFormData({...formData, scheduled_start_time: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">Atur waktu tayang siaran. Biarkan kosong jika sudah berlangsung.</p>
          </div>
          
          <div className="pt-4 border-t border-gray-100 space-y-3">
             <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <input 
                    type="checkbox" 
                    checked={formData.is_active || false}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <div>
                    <span className="font-medium text-gray-900 block">Status Aktif (LIVE)</span>
                    <span className="text-xs text-gray-500">Jika dicentang, akan ditampilkan sebagai video utama di halaman Live. Siaran lain akan otomatis dinonaktifkan.</span>
                </div>
             </label>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <Link 
              href="/admin/live-streams"
              className="px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </Link>
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
