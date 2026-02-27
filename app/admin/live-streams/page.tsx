
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/components/auth/auth-context';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Video,
  Radio
} from 'lucide-react';
import Link from 'next/link';

interface LiveStream {
  id: number;
  title: string | null;
  youtube_id: string;
  channel_name: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  status: string | null;
}

export default function LiveStreamsPage() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const response = await api.get('/live-streams');
      setStreams(response.data.data); // Assuming API returns { data: [...] }
    } catch (error) {
      console.error('Failed to fetch live streams', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this live stream?')) {
      try {
        await api.delete(`/live-streams/${id}`);
        fetchStreams();
      } catch (error) {
        console.error('Failed to delete live stream', error);
        alert('Failed to delete live stream');
      }
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
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
