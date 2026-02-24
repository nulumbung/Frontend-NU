
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/components/auth/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Save, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { ImageInput } from '@/components/form/image-input';

const getErrorMessage = (error: unknown) => {
  const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
  return error instanceof Error ? error.message : 'Unknown error';
};

export default function EditLiveStreamPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    youtube_id: '',
    channel_name: '',
    thumbnail_url: '',
    is_active: false,
    status: '',
    scheduled_start_time: ''
  });

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const response = await api.get(`/live-streams/${params.id}`);
        const data = response.data;
        
        // Format datetime-local
        const formatDateTime = (dateString: string) => {
            if (!dateString) return '';
            const d = new Date(dateString);
            return d.toISOString().slice(0, 16);
        };

        setFormData({
          title: data.title || '',
          youtube_id: data.youtube_id,
          channel_name: data.channel_name || '',
          thumbnail_url: data.thumbnail_url || '',
          is_active: data.is_active,
          status: data.status,
          scheduled_start_time: formatDateTime(data.scheduled_start_time)
        });
      } catch (error) {
        console.error('Failed to fetch live stream', error);
        alert('Failed to load live stream data');
        router.push('/admin/live-streams');
      } finally {
        setIsFetching(false);
      }
    };

    if (params.id) {
        fetchStream();
    }
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await api.put(`/live-streams/${params.id}`, formData);
      router.push('/admin/live-streams');
    } catch (error: unknown) {
      console.error('Failed to update live stream', error);
      alert('Failed to update live stream: ' + getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!confirm('Ini akan menimpa data judul dan thumbnail dengan data terbaru dari YouTube. Lanjutkan?')) return;
    
    setIsLoading(true);
    try {
        const response = await api.post(`/live-streams/${params.id}/refresh`);
        const data = response.data;
        setFormData(prev => ({
            ...prev,
            title: data.title,
            channel_name: data.channel_name,
            thumbnail_url: data.thumbnail_url
        }));
        alert('Data berhasil diperbarui dari YouTube!');
    } catch (error) {
        console.error('Failed to refresh data', error);
        alert('Gagal mengambil data terbaru dari YouTube.');
    } finally {
        setIsLoading(false);
    }
  };

  if (isFetching) {
      return <div className="text-center py-12">Loading...</div>;
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
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex justify-end mb-4">
            <button 
                type="button" 
                onClick={handleRefresh}
                disabled={isLoading}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
            >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data dari YouTube
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Judul Siaran</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">YouTube Video ID</label>
            <input 
              type="text" 
              required
              readOnly // Usually ID shouldn't change, better delete and re-create
              value={formData.youtube_id}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Channel</label>
            <input 
              type="text" 
              value={formData.channel_name}
              onChange={(e) => setFormData({...formData, channel_name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <ImageInput
              label="URL Thumbnail"
              value={formData.thumbnail_url}
              onChange={(value) => setFormData({...formData, thumbnail_url: value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jadwal Tayang</label>
            <input 
              type="datetime-local" 
              value={formData.scheduled_start_time}
              onChange={(e) => setFormData({...formData, scheduled_start_time: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div className="pt-4 border-t border-gray-100 space-y-3">
             <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <input 
                    type="checkbox" 
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <div>
                    <span className="font-medium text-gray-900 block">Status Aktif (LIVE)</span>
                    <span className="text-xs text-gray-500">Jika dicentang, akan ditampilkan sebagai video utama di halaman Live.</span>
                </div>
             </label>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Perubahan
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
