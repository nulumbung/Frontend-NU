
'use client';

import { useState } from 'react';
import { api } from '@/components/auth/auth-context';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { IconPicker } from '@/components/form/icon-picker';
import { ImageInput } from '@/components/form/image-input';

const getErrorMessage = (error: unknown) => {
  const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
  return error instanceof Error ? error.message : 'Unknown error';
};

export default function CreateCategoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'MdCategory',
    image: '',
    color: 'bg-green-500' // Default
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await api.post('/categories', formData);
      router.push('/admin/categories');
    } catch (error: unknown) {
      console.error('Failed to create category', error);
      alert('Failed to create category: ' + getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/categories" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Buat Kategori Baru</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Kategori</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Contoh: Politik NU"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
            <textarea 
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              placeholder="Deskripsi singkat kategori ini..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon Kategori (Dropdown/Header)</label>
            <IconPicker
              label="Pilih Icon (Material Design)"
              value={formData.icon}
              onChange={(value) => setFormData({...formData, icon: value})}
            />
            <p className="text-xs text-gray-500 mt-1">Icon ini dipakai di dropdown menu kategori pada halaman publik.</p>
          </div>

          <div>
            <ImageInput
              label="Gambar Kategori (Halaman Kategori)"
              value={formData.image}
              onChange={(value) => setFormData({ ...formData, image: value })}
              placeholder="https://..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Gambar ini akan tampil sebagai visual utama pada halaman kategori.
            </p>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Kategori
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
