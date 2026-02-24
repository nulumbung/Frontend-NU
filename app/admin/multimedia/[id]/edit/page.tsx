
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/components/auth/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Save, Loader2, Video, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { ImageInput } from '@/components/form/image-input';

const getErrorMessage = (error: unknown) => {
  const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
  return error instanceof Error ? error.message : 'Unknown error';
};

export default function EditMultimediaPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    type: 'video' as 'video' | 'photo',
    thumbnail: '',
    url: '',
    gallery: [] as string[],
    description: '',
    date: '',
    author: '',
    tags: [] as string[]
  });

  const [galleryInput, setGalleryInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await api.get(`/multimedia/${params.id}`);
        const data = response.data;
        
        // Format dates
        const formatDate = (dateString: string) => {
            if (!dateString) return '';
            return new Date(dateString).toISOString().split('T')[0];
        };

        setFormData({
          title: data.title,
          type: data.type,
          thumbnail: data.thumbnail || '',
          url: data.url || '',
          gallery: Array.isArray(data.gallery) ? data.gallery : [],
          description: data.description || '',
          date: formatDate(data.date),
          author: data.author || '',
          tags: Array.isArray(data.tags) ? data.tags : []
        });

        if (Array.isArray(data.gallery)) {
            setGalleryInput(data.gallery.join('\n'));
        }
        if (Array.isArray(data.tags)) {
            setTagsInput(data.tags.join(', '));
        }

      } catch (error) {
        console.error('Failed to fetch multimedia', error);
        alert('Failed to load multimedia data');
        router.push('/admin/multimedia');
      } finally {
        setIsFetching(false);
      }
    };

    if (params.id) {
        fetchItem();
    }
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Process gallery input
    const galleryArray = galleryInput.split('\n').filter(url => url.trim() !== '');
    // Process tags
    const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    try {
      await api.put(`/multimedia/${params.id}`, {
        ...formData,
        gallery: galleryArray,
        tags: tagsArray
      });
      router.push('/admin/multimedia');
    } catch (error: unknown) {
      console.error('Failed to update multimedia', error);
      alert('Failed to update multimedia: ' + getErrorMessage(error));
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
        <Link href="/admin/multimedia" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Konten Multimedia</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Basic Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Informasi Dasar</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Judul Konten</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Konten</label>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'video'})}
                    className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 font-medium transition-all ${
                      formData.type === 'video' 
                        ? 'bg-green-50 border-green-500 text-green-700 ring-2 ring-green-200' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Video className="w-5 h-5" /> Video
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'photo'})}
                    className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 font-medium transition-all ${
                      formData.type === 'photo' 
                        ? 'bg-green-50 border-green-500 text-green-700 ring-2 ring-green-200' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <ImageIcon className="w-5 h-5" /> Foto
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Publikasi</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <ImageInput
                label="URL Thumbnail / Cover"
                value={formData.thumbnail}
                onChange={(value) => setFormData({...formData, thumbnail: value})}
              />
            </div>

            {formData.type === 'video' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL Video (YouTube)</label>
                <input 
                  type="url" 
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL Foto Galeri (Satu per baris)</label>
                <textarea 
                  rows={5}
                  value={galleryInput}
                  onChange={(e) => setGalleryInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
              <textarea 
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <input 
                type="text" 
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
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
