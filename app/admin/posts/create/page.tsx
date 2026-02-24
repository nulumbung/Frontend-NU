
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/components/auth/auth-context';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { ImageInput } from '@/components/form/image-input';
import { Editor } from '@/components/form/editor';

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
}

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null) {
    const responseMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    const message = (error as { message?: string }).message;
    return responseMessage || message || 'Terjadi kesalahan.';
  }
  return 'Terjadi kesalahan.';
};

const hasMeaningfulContent = (html: string) => {
  if (/<img[\s\S]*?>/i.test(html)) return true;
  const plain = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
  return plain.length > 0;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export default function CreatePostPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft',
    category_id: '',
    image: '',
    image_caption: '',
    image_credit: '',
    tags: [] as string[],
    is_featured: false,
    is_spotlight: false,
    is_breaking: false,
    is_headline: false
  });
  const [additionalImage, setAdditionalImage] = useState({
    caption: '',
    credit: '',
  });

  const [tagsInput, setTagsInput] = useState('');

  const appendAdditionalImageMetaToContent = () => {
    const caption = additionalImage.caption.trim();
    const credit = additionalImage.credit.trim();
    const contentHtml = formData.content || '';
    const imageBlockRegex = /<p>\s*<img\b[^>]*>\s*<\/p>|<img\b[^>]*>/gi;

    if (!caption && !credit) {
      alert('Isi caption atau kredit gambar tambahan terlebih dahulu.');
      return;
    }

    const imageMatches = Array.from(contentHtml.matchAll(imageBlockRegex));
    if (imageMatches.length === 0) {
      alert('Tambahkan dulu gambar di Konten Lengkap, lalu isi caption/kredit tambahan.');
      return;
    }

    const captionHtml = caption
      ? `<p><em>Keterangan Gambar: ${escapeHtml(caption)}</em></p>`
      : '';
    const creditHtml = credit
      ? `<p><em>Kredit Gambar: ${escapeHtml(credit)}</em></p>`
      : '';
    const metaHtml = `${captionHtml}${creditHtml}`;

    setFormData((prev) => ({
      ...prev,
      content: (() => {
        const source = prev.content || '';
        const matches = Array.from(source.matchAll(imageBlockRegex));
        const lastMatch = matches[matches.length - 1];
        if (!lastMatch || typeof lastMatch.index !== 'number') return source;

        const insertAt = lastMatch.index + lastMatch[0].length;
        return `${source.slice(0, insertAt)}${metaHtml}${source.slice(insertAt)}`;
      })(),
    }));

    setAdditionalImage({ caption: '', credit: '' });
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Process tags
    const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    if (!hasMeaningfulContent(formData.content)) {
      alert('Konten lengkap wajib diisi (teks atau gambar).');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/posts', {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        tags: tagsArray
      });
      router.push('/admin/posts');
    } catch (error: unknown) {
      console.error('Failed to create post', error);
      alert('Failed to create post: ' + getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/posts" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Buat Berita Baru</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Judul Berita</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-bold"
                placeholder="Masukkan judul berita..."
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ringkasan (Excerpt)</label>
              <textarea 
                rows={3}
                value={formData.excerpt}
                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Ringkasan singkat untuk ditampilkan di kartu berita..."
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Konten Lengkap</label>
              <Editor
                value={formData.content}
                onChange={(value) => setFormData({...formData, content: value})}
                className="min-h-[280px]"
              />
              <p className="text-xs text-gray-500 mt-2">
                Gunakan toolbar untuk format teks dan sisipkan gambar tambahan di dalam deskripsi.
              </p>
            </div>
          </div>

          {/* Additional Image Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-gray-500" />
              Gambar Tambahan (Dalam Konten)
            </h3>
            <p className="text-xs text-gray-500">
              Gambar tambahan diambil dari editor pada bagian Konten Lengkap. Caption/kredit akan ditempel ke gambar terakhir di konten.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keterangan Gambar Tambahan (Caption)
                </label>
                <input
                  type="text"
                  value={additionalImage.caption}
                  onChange={(e) => setAdditionalImage((prev) => ({ ...prev, caption: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="Contoh: Rapat pleno PBNU..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kredit Gambar Tambahan
                </label>
                <input
                  type="text"
                  value={additionalImage.credit}
                  onChange={(e) => setAdditionalImage((prev) => ({ ...prev, credit: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="Contoh: Dok. NU Online"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={appendAdditionalImageMetaToContent}
              className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors text-sm font-medium"
            >
              Tambahkan Caption/Kredit ke Konten
            </button>
          </div>

          {/* Image Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
             <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-gray-500" />
                Gambar Utama
             </h3>
             
             <div>
                <ImageInput
                  label="URL Gambar"
                  value={formData.image}
                  onChange={(value) => setFormData({...formData, image: value})}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan Gambar (Caption)</label>
                    <input 
                      type="text" 
                      value={formData.image_caption}
                      onChange={(e) => setFormData({...formData, image_caption: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      placeholder="Contoh: Suasana Muktamar..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kredit Gambar</label>
                    <input 
                      type="text" 
                      value={formData.image_credit}
                      onChange={(e) => setFormData({...formData, image_credit: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      placeholder="Contoh: Dok. Antara"
                    />
                </div>
              </div>
          </div>
        </div>

        {/* Sidebar (Right Column) */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6 sticky top-6">
            <h3 className="font-bold text-gray-900 border-b pb-2">Publikasi</h3>
            
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
              <select 
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">Pilih Kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <input 
                type="text" 
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="PBNU, Ulama, Santri (pisahkan koma)"
              />
            </div>

            {/* Options */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={formData.is_breaking}
                        onChange={(e) => setFormData({...formData, is_breaking: e.target.checked})}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">Breaking News (Ticker)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Berita Pilihan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={formData.is_headline}
                        onChange={(e) => setFormData({...formData, is_headline: e.target.checked})}
                        className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Berita Utama (Hero)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={formData.is_spotlight}
                        onChange={(e) => setFormData({...formData, is_spotlight: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Spotlight Kategori</span>
                </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4 shadow-lg shadow-green-600/20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan & Publish
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
