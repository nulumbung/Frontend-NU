'use client';

import { useEffect, useState } from 'react';
import { api } from '@/components/auth/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { ImageInput } from '@/components/form/image-input';

interface AdvertisementForm {
  title: string;
  placement: string;
  content_type: 'image' | 'html';
  image_url: string;
  html_content: string;
  target_url: string;
  alt_text: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  priority: number;
  impressions: number;
  clicks: number;
}

const toApiDateTime = (value: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const toInputDateTime = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const tzOffset = parsed.getTimezoneOffset() * 60000;
  return new Date(parsed.getTime() - tzOffset).toISOString().slice(0, 16);
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null) {
    const validation = (error as { response?: { data?: { errors?: Record<string, string[]> } } }).response?.data?.errors;
    if (validation && typeof validation === 'object') {
      for (const messages of Object.values(validation)) {
        if (Array.isArray(messages) && messages[0]) {
          return messages[0];
        }
      }
    }

    const responseMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    const message = (error as { message?: string }).message;
    return responseMessage || message || 'Terjadi kesalahan.';
  }

  return 'Terjadi kesalahan.';
};

export default function EditAdvertisementPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState<AdvertisementForm>({
    title: '',
    placement: 'post_detail_sidebar',
    content_type: 'image',
    image_url: '',
    html_content: '',
    target_url: '',
    alt_text: '',
    is_active: true,
    starts_at: '',
    ends_at: '',
    priority: 100,
    impressions: 0,
    clicks: 0,
  });

  useEffect(() => {
    const fetchAdvertisement = async () => {
      try {
        const response = await api.get(`/ads/${params.id}`);
        const data = response.data;
        setFormData({
          title: data.title || '',
          placement: data.placement || 'post_detail_sidebar',
          content_type: data.content_type || 'image',
          image_url: data.image_url || '',
          html_content: data.html_content || '',
          target_url: data.target_url || '',
          alt_text: data.alt_text || '',
          is_active: Boolean(data.is_active),
          starts_at: toInputDateTime(data.starts_at),
          ends_at: toInputDateTime(data.ends_at),
          priority: Number(data.priority || 0),
          impressions: Number(data.impressions || 0),
          clicks: Number(data.clicks || 0),
        });
      } catch (error) {
        console.error('Failed to fetch ad', error);
        alert('Gagal memuat data iklan.');
        router.push('/admin/ads');
      } finally {
        setIsFetching(false);
      }
    };

    if (params.id) {
      fetchAdvertisement();
    }
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.content_type === 'image' && !formData.image_url.trim()) {
      alert('URL gambar wajib diisi untuk iklan tipe image.');
      return;
    }

    if (formData.content_type === 'html' && !formData.html_content.trim()) {
      alert('HTML content wajib diisi untuk iklan tipe HTML.');
      return;
    }

    setIsLoading(true);
    try {
      await api.put(`/ads/${params.id}`, {
        title: formData.title,
        placement: formData.placement,
        content_type: formData.content_type,
        image_url: formData.content_type === 'image' ? formData.image_url.trim() || null : null,
        html_content: formData.content_type === 'html' ? formData.html_content || null : null,
        target_url: formData.target_url.trim() || null,
        alt_text: formData.alt_text || null,
        is_active: formData.is_active,
        starts_at: toApiDateTime(formData.starts_at),
        ends_at: toApiDateTime(formData.ends_at),
        priority: Number(formData.priority) || 0,
      });

      router.push('/admin/ads');
    } catch (error: unknown) {
      console.error('Failed to update advertisement', error);
      alert('Gagal mengupdate iklan: ' + getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const ctr = formData.impressions > 0 ? ((formData.clicks / formData.impressions) * 100).toFixed(2) : '0.00';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/ads" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Iklan</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500 uppercase mb-1">Impression</p>
            <p className="text-xl font-bold text-gray-900">{formData.impressions.toLocaleString('id-ID')}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500 uppercase mb-1">Click</p>
            <p className="text-xl font-bold text-gray-900">{formData.clicks.toLocaleString('id-ID')}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500 uppercase mb-1">CTR</p>
            <p className="text-xl font-bold text-gray-900">{ctr}%</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Judul Iklan</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Placement</label>
              <select
                value={formData.placement}
                onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="post_detail_top">Detail Berita - Atas</option>
                <option value="post_detail_inline">Detail Berita - Tengah</option>
                <option value="post_detail_sidebar">Detail Berita - Sidebar</option>
                <option value="post_detail_bottom">Detail Berita - Bawah</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Konten</label>
              <select
                value={formData.content_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    content_type: e.target.value as 'image' | 'html',
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="image">Image Banner</option>
                <option value="html">HTML Script</option>
              </select>
            </div>
          </div>

          {formData.content_type === 'image' ? (
            <ImageInput
              label="Gambar Iklan"
              value={formData.image_url}
              onChange={(value) => setFormData({ ...formData, image_url: value })}
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">HTML Content</label>
              <textarea
                value={formData.html_content}
                onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                rows={8}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL Tujuan</label>
              <input
                type="url"
                value={formData.target_url}
                onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alt Text</label>
              <input
                type="text"
                value={formData.alt_text}
                onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <input
                type="number"
                min={0}
                max={9999}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mulai Tayang</label>
              <input
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Berakhir</label>
              <input
                type="datetime-local"
                value={formData.ends_at}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div>
                <span className="font-medium text-gray-900 block">Iklan aktif</span>
                <span className="text-xs text-gray-500">
                  Jika aktif, iklan akan tayang mengikuti jadwal dan placement.
                </span>
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
