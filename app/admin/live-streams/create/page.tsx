'use client';

import { useState, useEffect } from 'react';
import { api } from '@/components/auth/auth-context';
import { createLiveStreamService } from '@/lib/services/live-stream.service';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Loader2, Video, AlertCircle, RefreshCw, Youtube, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const getErrorMessage = (error: unknown): string => {
  const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
  return error instanceof Error ? error.message : 'Unknown error';
};

const liveStreamService = createLiveStreamService(api);

export default function CreateLiveStreamPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    youtube_id: '',
    is_active: true,
    scheduled_start_time: '',
    title: '',
    channel_name: ''
  });

  const [channelId, setChannelId] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  const [isYoutubeConnected, setIsYoutubeConnected] = useState(false);
  const [myBroadcasts, setMyBroadcasts] = useState<Array<{ id: string; title?: string; status?: string; scheduledStartTime?: string; thumbnail_url?: string }>>([]);
  const [isFetchingBroadcasts, setIsFetchingBroadcasts] = useState(false);

  // Check YouTube connection status
  useEffect(() => {
    liveStreamService.checkYoutubeStatus().then(res => {
      setIsYoutubeConnected(res.connected);
    }).catch(console.error);
  }, []);

  const handleFetchFromChannel = async () => {
    if (!channelId.trim()) {
      setError('Masukkan Channel ID terlebih dahulu');
      return;
    }

    setIsFetching(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = await liveStreamService.fetchFromChannel(channelId.trim());
      setFormData({
        ...formData,
        youtube_id: data.youtube_id,
        title: data.title || '',
        channel_name: data.channel_name || '',
      });
      const responseData = data as { message?: string };
      if (responseData.message) {
        setSuccessMsg(responseData.message);
      } else {
        setSuccessMsg('Siaran aktif berhasil dimuat dari channel.');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsFetching(false);
    }
  };

  const handleFetchMyBroadcasts = async () => {
    setIsFetchingBroadcasts(true);
    setError(null);
    try {
      const broadcastsRaw = await liveStreamService.getMyBroadcasts();
      const broadcasts = broadcastsRaw.map(b => ({
        id: b.id,
        title: b.snippet?.title || '',
        status: b.status?.lifeCycleStatus || '',
        scheduledStartTime: b.snippet?.publishedAt || '',
        thumbnail_url: b.snippet?.thumbnails?.default?.url || ''
      }));
      setMyBroadcasts(broadcasts);
      if (broadcasts.length === 0) {
        setError('Tidak ada siaran ditemukan di akun YouTube Anda.');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsFetchingBroadcasts(false);
    }
  };

  const handleSelectBroadcast = (broadcast: { id: string, title?: string, scheduledStartTime?: string }) => {
    setFormData({
      ...formData,
      youtube_id: broadcast.id,
      title: broadcast.title || '',
      scheduled_start_time: broadcast.scheduledStartTime ? broadcast.scheduledStartTime.slice(0, 16) : '',
    });
    // Scroll to form or give feedback
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

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

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-900">Berhasil</h3>
              <p className="text-sm text-emerald-700">{successMsg}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-6 flex gap-3">
            <Video className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Otomasi YouTube</p>
              <p>Gunakan Fitur ini untuk mengambil siaran yang sedang &quot;LIVE&quot; secara otomatis dari Channel tertentu.</p>
            </div>
          </div>

          {isYoutubeConnected && (
            <div className="p-4 border border-red-100 bg-red-50/30 rounded-lg mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-600" />
                    Ambil dari Akun YouTube Anda
                  </label>
                  <p className="text-[10px] text-gray-500 mt-1">Pilih siaran yang sudah dijadwalkan atau sedang live dari akun yang terhubung.</p>
                </div>
                <button
                  type="button"
                  onClick={handleFetchMyBroadcasts}
                  disabled={isFetchingBroadcasts}
                  className="px-3 py-1.5 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-xs w-full sm:w-auto justify-center"
                >
                  {isFetchingBroadcasts ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Muat Siaran Saya
                </button>
              </div>

              {myBroadcasts.length > 0 && (
                <div className="space-y-2 mt-4 max-h-60 overflow-y-auto pr-2">
                  {myBroadcasts.map(b => (
                    <div
                      key={b.id}
                      onClick={() => handleSelectBroadcast(b)}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.youtube_id === b.id
                        ? 'bg-red-50 border-red-300 shadow-sm ring-1 ring-red-200'
                        : 'bg-white border-gray-200 hover:border-red-200 hover:bg-gray-50'
                        }`}
                    >
                      {b.thumbnail_url && (
                        <div className="w-24 h-16 bg-black rounded overflow-hidden flex-shrink-0 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={b.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          {b.status === 'live' && (
                            <span className="absolute bottom-1 right-1 bg-red-600 text-white text-[10px] px-1 rounded font-bold">
                              LIVE
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{b.title}</p>
                        <p className="text-xs text-gray-500 mt-1">Status: <span className="font-medium uppercase">{b.status}</span></p>
                        {b.scheduledStartTime && <p className="text-[10px] text-gray-400">Jadwal: {new Date(b.scheduledStartTime).toLocaleString('id-ID')}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-4 border border-blue-100 bg-blue-50/30 rounded-lg mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ambil Otomatis dari Channel ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Contoh: UCj... (Channel ID)"
              />
              <button
                type="button"
                onClick={handleFetchFromChannel}
                disabled={isFetching}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                Ambil Siaran Aktif
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Sistem akan mencari video yang berstatus &quot;LIVE&quot; di Channel tersebut.</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-400 font-medium">ATAU MASUKKAN MANUAL</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">YouTube Video ID *</label>
              <input
                type="text"
                required
                value={formData.youtube_id}
                onChange={(e) => setFormData({ ...formData, youtube_id: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Biarkan kosong untuk ambil dari YouTube"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Channel (Opsional - akan diambil dari YouTube)</label>
              <input
                type="text"
                value={formData.channel_name}
                onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Biarkan kosong untuk ambil dari YouTube"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jadwal Tayang (Opsional)</label>
              <input
                type="datetime-local"
                value={formData.scheduled_start_time}
                onChange={(e) => setFormData({ ...formData, scheduled_start_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Kosongkan jika siaran sudah berlangsung</p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
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
    </div>
  );
}
