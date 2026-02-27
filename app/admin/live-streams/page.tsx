
'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/components/auth/auth-context';
import { createLiveStreamService, LiveStream } from '@/lib/services/live-stream.service';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Video,
  Radio,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

const getErrorMessage = (error: unknown): string => {
  const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
  return error instanceof Error ? error.message : 'Unknown error occurred';
};

export default function LiveStreamsPage() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const liveStreamService = createLiveStreamService(api);

  const fetchStreams = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await liveStreamService.getAll();
      setStreams(result.streams);
    } catch (err) {
      const message = getErrorMessage(err);
      console.error('Failed to fetch live streams:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [liveStreamService]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus siaran ini?')) {
      return;
    }

    try {
      setIsDeleting(id);
      setError(null);
      await liveStreamService.delete(id);
      setSuccessMessage('Siaran berhasil dihapus');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchStreams();
    } catch (err) {
      const message = getErrorMessage(err);
      console.error('Failed to delete live stream:', message);
      setError(message);
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredStreams = (streams || []).filter(stream => {
    if (!stream) return false;
    const title = (stream?.title ?? '').toString().toLowerCase();
    const channelName = (stream?.channel_name ?? '').toString().toLowerCase();
    const query = (searchQuery ?? '').toString().toLowerCase();
    return title.includes(query) || channelName.includes(query);
  });

  return (
    <div>
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Management Siaran Langsung</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola jadwal dan siaran langsung YouTube.</p>
        </div>
        <Link 
          href="/admin/live-streams/create" 
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Siaran
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari siaran..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Judul & Channel</th>
                <th className="px-6 py-4">YouTube ID</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading data...</td>
                </tr>
              ) : filteredStreams.length > 0 ? (
                filteredStreams.map((stream) => (
                  <tr key={stream.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {stream.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 animate-pulse">
                          <Radio className="w-3 h-3" /> LIVE
                        </span>
                      ) : (stream.status ?? '').toLowerCase() === 'upcoming' ? (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          UPCOMING
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          ENDED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-black rounded overflow-hidden relative flex-shrink-0">
                           {stream.thumbnail_url ? (
                               // eslint-disable-next-line @next/next/no-img-element
                               <img src={stream.thumbnail_url} alt="" className="w-full h-full object-cover" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center text-white/50">
                                   <Video className="w-4 h-4" />
                               </div>
                           )}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{stream.title || 'Untitled'}</p>
                            <p className="text-xs text-gray-500">{stream.channel_name || 'Unknown Channel'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">
                      {stream.youtube_id}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/live-streams/${stream.id}/edit`} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(stream.id)}
                          disabled={isDeleting === stream.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Tidak ada siaran ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
