'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/components/auth/auth-context';
import { Edit, Eye, MousePointerClick, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Advertisement {
  id: number;
  title: string;
  slug: string;
  placement: string;
  content_type: 'image' | 'html';
  image_url?: string | null;
  html_content?: string | null;
  target_url?: string | null;
  alt_text?: string | null;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  priority: number;
  impressions: number;
  clicks: number;
  created_at: string;
}

const placementLabels: Record<string, string> = {
  post_detail_top: 'Detail Berita - Atas',
  post_detail_inline: 'Detail Berita - Tengah',
  post_detail_sidebar: 'Detail Berita - Sidebar',
  post_detail_bottom: 'Detail Berita - Bawah',
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isRunningNow = (ad: Advertisement) => {
  if (!ad.is_active) return false;
  const now = new Date();
  const startsAt = ad.starts_at ? new Date(ad.starts_at) : null;
  const endsAt = ad.ends_at ? new Date(ad.ends_at) : null;
  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;
  return true;
};

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [placementFilter, setPlacementFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const fetchAds = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const response = await api.get('/ads', {
          params: {
            page,
            placement: placementFilter || undefined,
            status: statusFilter || undefined,
            search: debouncedSearch || undefined,
          },
        });

        const payload = response.data;
        const rows: Advertisement[] = Array.isArray(payload) ? payload : payload.data || [];
        setAds(rows);
        setCurrentPage(payload.current_page || page);
        setLastPage(payload.last_page || 1);
      } catch (error) {
        console.error('Failed to fetch ads', error);
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, placementFilter, statusFilter]
  );

  useEffect(() => {
    fetchAds(1);
  }, [fetchAds]);

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus iklan ini?')) return;

    try {
      await api.delete(`/ads/${id}`);
      fetchAds(currentPage);
    } catch (error) {
      console.error('Failed to delete ad', error);
      alert('Gagal menghapus iklan.');
    }
  };

  const totalClicks = useMemo(
    () => ads.reduce((sum, ad) => sum + Number(ad.clicks || 0), 0),
    [ads]
  );

  const totalImpressions = useMemo(
    () => ads.reduce((sum, ad) => sum + Number(ad.impressions || 0), 0),
    [ads]
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Management Iklan</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola iklan untuk halaman detail berita dengan data tayang nyata.
          </p>
        </div>
        <Link
          href="/admin/ads/create"
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Iklan
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Impression</p>
          <p className="text-2xl font-bold text-gray-900">{totalImpressions.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Click</p>
          <p className="text-2xl font-bold text-gray-900">{totalClicks.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">CTR Rata-rata</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'}%
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari judul / URL target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <select
          value={placementFilter}
          onChange={(e) => setPlacementFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="">Semua Placement</option>
          <option value="post_detail_top">Detail Berita - Atas</option>
          <option value="post_detail_inline">Detail Berita - Tengah</option>
          <option value="post_detail_sidebar">Detail Berita - Sidebar</option>
          <option value="post_detail_bottom">Detail Berita - Bawah</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Iklan</th>
                <th className="px-6 py-4">Placement</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Performa</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading data...
                  </td>
                </tr>
              ) : ads.length > 0 ? (
                ads.map((ad) => {
                  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';
                  return (
                    <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex-shrink-0">
                            {ad.content_type === 'image' && ad.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={ad.image_url} alt={ad.alt_text || ad.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full text-[10px] text-gray-500 flex items-center justify-center p-1 text-center">
                                HTML
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-2">{ad.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Priority: {ad.priority} • {ad.content_type.toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {ad.target_url || 'Tanpa URL tujuan'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {placementLabels[ad.placement] || ad.placement}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isRunningNow(ad)
                              ? 'bg-green-100 text-green-700'
                              : ad.is_active
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {isRunningNow(ad) ? 'Aktif Tayang' : ad.is_active ? 'Aktif (Terjadwal)' : 'Nonaktif'}
                        </span>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDateTime(ad.starts_at)} - {formatDateTime(ad.ends_at)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 space-y-1">
                          <p className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-gray-400" />
                            {Number(ad.impressions || 0).toLocaleString('id-ID')} impressions
                          </p>
                          <p className="flex items-center gap-2">
                            <MousePointerClick className="w-4 h-4 text-gray-400" />
                            {Number(ad.clicks || 0).toLocaleString('id-ID')} clicks
                          </p>
                          <p className="text-xs text-gray-500">CTR: {ctr}%</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/ads/${ad.id}/edit`}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(ad.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Belum ada data iklan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Halaman {currentPage} dari {lastPage}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fetchAds(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => fetchAds(Math.min(lastPage, currentPage + 1))}
              disabled={currentPage >= lastPage || isLoading}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
