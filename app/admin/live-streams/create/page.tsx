
'use client';

import { useState } from 'react';
import { api } from '@/components/auth/auth-context';
import { createLiveStreamService } from '@/lib/services/live-stream.service';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Loader2, Video, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const getErrorMessage = (error: unknown): string => {
  const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
  return error instanceof Error ? error.message : 'Unknown error';
};

export default function CreateLiveStreamPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    youtube_id: '',
    is_active: true,
    scheduled_start_time: '',
    title: '',
    channel_name: ''
  });

  const liveStreamService = createLiveStreamService(api);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.youtube_id.trim()) {
      setError('YouTube Video ID harus diisi');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const payload = {
        youtube_id: formData.youtube_id.trim(),
        is_active: formData.is_active,
        scheduled_start_time: formData.scheduled_start_time || undefined,
        title: formData.title || undefined,
        channel_name: formData.channel_name || undefined,
      };

      await liveStreamService.create(payload);
      router.push('/admin/live-streams');
    } catch (err) {
      const message = getErrorMessage(err);
      console.error('Failed to create live stream:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/live-streams" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Siaran Langsung</h1>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-6 flex gap-3">
             <Video className="w-5 h-5 flex-shrink-0 mt-0.5" />
             <div>
                <p className="font-bold mb-1">YouTube Integration</p>
                <p>Masukkan YouTube Video ID. Sistem akan mencoba mengambil Judul, Channel, dan Thumbnail secara otomatis dari YouTube API.</p>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">YouTube Video ID *</label>
            <input 
              type="text" 
              required
              value={formData.youtube_id}
              onChange={(e) => setFormData({...formData, youtube_id: e.target.value})}
              onFocus={() => setError(null)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
              placeholder="Contoh: Kz3FK5FbBz8"
            />
            <p className="text-xs text-gray-500 mt-1">ID unik video dari URL YouTube (v=...)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Judul Siaran (Opsional - akan diambil dari YouTube)</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Biarkan kosong untuk ambil dari YouTube"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Channel (Opsional - akan diambil dari YouTube)</label>
            <input 
              type="text" 
              value={formData.channel_name}
              onChange={(e) => setFormData({...formData, channel_name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Biarkan kosong untuk ambil dari YouTube"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jadwal Tayang (Opsional)</label>
            <input 
              type="datetime-local" 
              value={formData.scheduled_start_time}
              onChange={(e) => setFormData({...formData, scheduled_start_time: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">Kosongkan jika siaran sudah berlangsung</p>
          </div>

          <div className="pt-4 border-t border-gray-100">
             <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <input 
                    type="checkbox" 
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <div>
                    <span className="font-medium text-gray-900 block">Set sebagai Siaran Aktif (LIVE)</span>
                    <span className="text-xs text-gray-500">Akan menonaktifkan siaran lain yang sedang aktif.</span>
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
                  Simpan Siaran
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}>
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan & Fetch Data
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
