
'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/components/auth/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ImageInput } from '@/components/form/image-input';

const getErrorMessage = (error: unknown) => {
  const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
  return error instanceof Error ? error.message : 'Unknown error';
};

interface BanomItem {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const formatDateOnly = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
};

const formatDateTimeLocal = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function EditAgendaPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [banoms, setBanoms] = useState<BanomItem[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date_start: '',
    date_end: '',
    time_string: '',
    location: '',
    maps_url: '',
    image: '',
    status: 'upcoming',
    ticket_info_title: 'Informasi Tiket',
    ticket_price: 'Gratis',
    ticket_quota: 0,
    ticket_quota_label: '',
    organizer: 'PBNU',
    organizer_logo: '',
    organizer_verified: true,
    registration_enabled: false,
    registration_url: '',
    registration_button_text: 'Daftar Sekarang',
    registration_note: '',
    registration_closed_text: 'Pendaftaran ditutup 24 jam sebelum acara dimulai',
    registration_open_until: '',
    rundown: [] as { time: string, title: string, description: string }[],
    gallery: [] as string[]
  });

  useEffect(() => {
    const fetchBanoms = async () => {
      try {
        const response = await api.get('/banoms');
        setBanoms(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch banoms', error);
        setBanoms([]);
      }
    };

    fetchBanoms();
  }, []);

  const matchedBanom = useMemo(() => {
    const organizerValue = formData.organizer.trim().toLowerCase();
    if (!organizerValue) return null;
    const organizerSlug = slugify(formData.organizer);
    return (
      banoms.find(
        (banom) =>
          banom.name.trim().toLowerCase() === organizerValue ||
          banom.slug.trim().toLowerCase() === organizerSlug
      ) || null
    );
  }, [banoms, formData.organizer]);

  useEffect(() => {
    if (matchedBanom?.logo) {
      setFormData((prev) => ({ ...prev, organizer_logo: matchedBanom.logo || '' }));
    }
  }, [matchedBanom]);

  const handleOrganizerChange = (nextOrganizer: string) => {
    const nextSlug = slugify(nextOrganizer);
    const nextNormalized = nextOrganizer.trim().toLowerCase();
    const nextMatch = banoms.find(
      (banom) =>
        banom.name.trim().toLowerCase() === nextNormalized ||
        banom.slug.trim().toLowerCase() === nextSlug
    );

    setFormData((prev) => {
      const prevSlug = slugify(prev.organizer);
      const prevNormalized = prev.organizer.trim().toLowerCase();
      const prevMatch = banoms.find(
        (banom) =>
          banom.name.trim().toLowerCase() === prevNormalized ||
          banom.slug.trim().toLowerCase() === prevSlug
      );
      const shouldClearPreviousAutoLogo = Boolean(
        prevMatch?.logo && prev.organizer_logo && prev.organizer_logo === prevMatch.logo
      );

      return {
        ...prev,
        organizer: nextOrganizer,
        organizer_logo: nextMatch?.logo || (shouldClearPreviousAutoLogo ? '' : prev.organizer_logo),
      };
    });
  };

  useEffect(() => {
    const fetchAgenda = async () => {
      try {
        const response = await api.get(`/agendas/${params.id}`);
        const data = response.data;
        
        setFormData({
          title: data.title,
          description: data.description || '',
          date_start: formatDateOnly(data.date_start),
          date_end: formatDateOnly(data.date_end),
          time_string: data.time_string || '',
          location: data.location,
          maps_url: data.maps_url || '',
          image: data.image || '',
          status: data.status,
          ticket_info_title: data.ticket_info_title || 'Informasi Tiket',
          ticket_price: data.ticket_price || 'Gratis',
          ticket_quota: data.ticket_quota || 0,
          ticket_quota_label: data.ticket_quota_label || (data.ticket_quota ? String(data.ticket_quota) : ''),
          organizer: data.organizer || 'PBNU',
          organizer_logo: data.organizer_logo || '',
          organizer_verified: data.organizer_verified !== false,
          registration_enabled: Boolean(data.registration_enabled),
          registration_url: data.registration_url || '',
          registration_button_text: data.registration_button_text || 'Daftar Sekarang',
          registration_note: data.registration_note || '',
          registration_closed_text: data.registration_closed_text || 'Pendaftaran ditutup 24 jam sebelum acara dimulai',
          registration_open_until: formatDateTimeLocal(data.registration_open_until),
          rundown: Array.isArray(data.rundown) ? data.rundown : [],
          gallery: Array.isArray(data.gallery) ? data.gallery : []
        });
        
      } catch (error) {
        console.error('Failed to fetch agenda', error);
        alert('Failed to load agenda data');
        router.push('/admin/agenda');
      } finally {
        setIsFetching(false);
      }
    };

    if (params.id) {
        fetchAgenda();
    }
  }, [params.id, router]);

  const addRundownItem = () => {
    setFormData({
      ...formData,
      rundown: [...formData.rundown, { time: '', title: '', description: '' }]
    });
  };

  const removeRundownItem = (index: number) => {
    const newRundown = [...formData.rundown];
    newRundown.splice(index, 1);
    setFormData({ ...formData, rundown: newRundown });
  };

  const updateRundownItem = (index: number, field: string, value: string) => {
    const newRundown = [...formData.rundown];
    newRundown[index] = { ...newRundown[index], [field]: value };
    setFormData({ ...formData, rundown: newRundown });
  };

  const addGalleryItem = () => {
    setFormData({
      ...formData,
      gallery: [...formData.gallery, '']
    });
  };

  const removeGalleryItem = (index: number) => {
    const newGallery = [...formData.gallery];
    newGallery.splice(index, 1);
    setFormData({ ...formData, gallery: newGallery });
  };

  const updateGalleryItem = (index: number, value: string) => {
    const newGallery = [...formData.gallery];
    newGallery[index] = value;
    setFormData({ ...formData, gallery: newGallery });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Filter empty gallery items
    const galleryArray = formData.gallery.filter(url => url.trim() !== '');
    const quotaLabel = formData.ticket_quota_label.trim();
    const numericQuota = /^\d+$/.test(quotaLabel) ? Number.parseInt(quotaLabel, 10) : 0;

    if (formData.registration_enabled && !formData.registration_url.trim()) {
      alert('URL pendaftaran wajib diisi jika tombol Daftar Sekarang diaktifkan.');
      setIsLoading(false);
      return;
    }

    try {
      await api.put(`/agendas/${params.id}`, {
        ...formData,
        ticket_quota: numericQuota,
        ticket_quota_label: quotaLabel || null,
        registration_open_until: formData.registration_open_until || null,
        gallery: galleryArray
      });
      router.push('/admin/agenda');
    } catch (error: unknown) {
      console.error('Failed to update agenda', error);
      alert('Failed to update agenda: ' + getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
      return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/agenda" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Agenda</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Basic Info Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Informasi Dasar</h3>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Judul Agenda</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Start */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
                <input 
                  type="date" 
                  required
                  value={formData.date_start}
                  onChange={(e) => setFormData({...formData, date_start: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Date End */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai (Opsional)</label>
                <input 
                  type="date" 
                  value={formData.date_end}
                  onChange={(e) => setFormData({...formData, date_end: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time String */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Waktu (Teks)</label>
                <input 
                  type="text" 
                  value={formData.time_string}
                  onChange={(e) => setFormData({...formData, time_string: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="upcoming">Akan Datang (Upcoming)</option>
                  <option value="ongoing">Sedang Berlangsung (Ongoing)</option>
                  <option value="completed">Selesai (Completed)</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lokasi</label>
              <input 
                type="text" 
                required
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="mt-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Link Google Maps (Opsional)</label>
                <input 
                    type="url" 
                    value={formData.maps_url}
                    onChange={(e) => setFormData({...formData, maps_url: e.target.value})}
                    placeholder="https://maps.google.com/..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi Lengkap</label>
              <textarea 
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-sans text-sm"
              />
            </div>

            {/* Image URL */}
            <div>
              <ImageInput
                label="URL Gambar Utama"
                value={formData.image}
                onChange={(value) => setFormData({...formData, image: value})}
              />
            </div>
          </div>

          {/* Ticket & Organizer Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Tiket & Penyelenggara</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Card Tiket</label>
                <input
                  type="text"
                  value={formData.ticket_info_title}
                  onChange={(e) => setFormData({...formData, ticket_info_title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Contoh: Informasi Tiket"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Harga Tiket</label>
                <input
                  type="text"
                  value={formData.ticket_price}
                  onChange={(e) => setFormData({...formData, ticket_price: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kuota Tiket (Angka / Huruf)</label>
                <input
                  type="text"
                  value={formData.ticket_quota_label}
                  onChange={(e) => setFormData({...formData, ticket_quota_label: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Contoh: Tanpa Batas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Penyelenggara</label>
                <input
                  type="text"
                  list="banom-organizer-options"
                  value={formData.organizer}
                  onChange={(e) => handleOrganizerChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <datalist id="banom-organizer-options">
                  {banoms.map((banom) => (
                    <option key={banom.id} value={banom.name} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-500 mt-1">
                  Nama yang cocok dengan Banom akan otomatis memakai logo Banom.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageInput
                label="Logo Penyelenggara (Opsional)"
                value={formData.organizer_logo}
                onChange={(value) => setFormData({...formData, organizer_logo: value})}
                placeholder="https://..."
              />
              <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-2">Status Penyelenggara</p>
                <p className="text-sm text-emerald-700 font-semibold">Terverifikasi</p>
                <p className="text-xs text-gray-500 mt-1">
                  Semua penyelenggara agenda ditandai terverifikasi.
                </p>
              </div>
            </div>
          </div>

          {/* Registration Controls */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Pendaftaran Peserta</h3>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.registration_enabled}
                onChange={(e) => setFormData({...formData, registration_enabled: e.target.checked})}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Tampilkan tombol Daftar Sekarang</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL Pendaftaran</label>
                <input
                  type="url"
                  value={formData.registration_url}
                  onChange={(e) => setFormData({...formData, registration_url: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://form..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teks Tombol</label>
                <input
                  type="text"
                  value={formData.registration_button_text}
                  onChange={(e) => setFormData({...formData, registration_button_text: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Contoh: Daftar Sekarang"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pendaftaran Dibuka Sampai</label>
                <input
                  type="datetime-local"
                  value={formData.registration_open_until}
                  onChange={(e) => setFormData({...formData, registration_open_until: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Saat Ditutup</label>
                <input
                  type="text"
                  value={formData.registration_closed_text}
                  onChange={(e) => setFormData({...formData, registration_closed_text: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Contoh: Pendaftaran ditutup 24 jam sebelum acara dimulai"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Pendaftaran</label>
              <textarea
                rows={3}
                value={formData.registration_note}
                onChange={(e) => setFormData({...formData, registration_note: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Contoh: Peserta wajib konfirmasi ulang H-1."
              />
            </div>
          </div>

          {/* Rundown Builder */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-bold text-gray-900">Susunan Acara (Rundown)</h3>
              <button 
                type="button" 
                onClick={addRundownItem}
                className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Tambah Sesi
              </button>
            </div>

            {formData.rundown.length === 0 && (
              <p className="text-gray-500 text-sm italic">Belum ada susunan acara.</p>
            )}

            <div className="space-y-4">
              {formData.rundown.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                  <button 
                    type="button" 
                    onClick={() => removeRundownItem(index)}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Waktu</label>
                      <input 
                        type="text" 
                        value={item.time}
                        onChange={(e) => updateRundownItem(index, 'time', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Judul Sesi</label>
                      <input 
                        type="text" 
                        value={item.title}
                        onChange={(e) => updateRundownItem(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Deskripsi Singkat</label>
                      <input 
                        type="text" 
                        value={item.description}
                        onChange={(e) => updateRundownItem(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery Builder */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-bold text-gray-900">Galeri Dokumentasi</h3>
              <button 
                type="button" 
                onClick={addGalleryItem}
                className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Tambah Foto
              </button>
            </div>
            
            {formData.gallery.length === 0 && (
              <p className="text-gray-500 text-sm italic">Belum ada foto dokumentasi.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.gallery.map((url, index) => (
                <div key={index} className="relative group bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <button 
                    type="button" 
                    onClick={() => removeGalleryItem(index)}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg shadow-sm border border-gray-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <ImageInput
                    label={`Foto ${index + 1}`}
                    value={url}
                    onChange={(value) => updateGalleryItem(index, value)}
                    placeholder="https://..."
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-green-600/20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan Perubahan
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
