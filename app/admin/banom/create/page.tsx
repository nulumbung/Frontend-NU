
'use client';

import { useState } from 'react';
import { api } from '@/components/auth/auth-context';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ImageInput } from '@/components/form/image-input';

const getErrorMessage = (error: unknown) => {
  const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
  return error instanceof Error ? error.message : 'Unknown error';
};

export default function CreateBanomPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    short_desc: '',
    long_desc: '',
    history: '',
    vision: '',
    mission: [] as string[],
    management: [] as { name: string, position: string, image: string }[]
  });

  // Mission Helpers
  const addMission = () => {
    setFormData({ ...formData, mission: [...formData.mission, ''] });
  };
  const updateMission = (index: number, value: string) => {
    const newMission = [...formData.mission];
    newMission[index] = value;
    setFormData({ ...formData, mission: newMission });
  };
  const removeMission = (index: number) => {
    const newMission = [...formData.mission];
    newMission.splice(index, 1);
    setFormData({ ...formData, mission: newMission });
  };

  // Management Helpers
  const addManagement = () => {
    setFormData({ ...formData, management: [...formData.management, { name: '', position: '', image: '' }] });
  };
  const updateManagement = (index: number, field: string, value: string) => {
    const newManagement = [...formData.management];
    newManagement[index] = { ...newManagement[index], [field]: value };
    setFormData({ ...formData, management: newManagement });
  };
  const removeManagement = (index: number) => {
    const newManagement = [...formData.management];
    newManagement.splice(index, 1);
    setFormData({ ...formData, management: newManagement });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await api.post('/banoms', formData);
      router.push('/admin/banom');
    } catch (error: unknown) {
      console.error('Failed to create banom', error);
      alert('Failed to create banom: ' + getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/banom" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Banom Baru</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Basic Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Informasi Umum</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Banom</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Gerakan Pemuda Ansor"
              />
            </div>

            <div>
              <ImageInput
                label="URL Logo"
                value={formData.logo}
                onChange={(value) => setFormData({...formData, logo: value})}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi Singkat</label>
              <textarea 
                rows={2}
                value={formData.short_desc}
                onChange={(e) => setFormData({...formData, short_desc: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Deskripsi singkat untuk kartu..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi Lengkap</label>
              <textarea 
                rows={4}
                value={formData.long_desc}
                onChange={(e) => setFormData({...formData, long_desc: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Penjelasan detail tentang banom..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sejarah</label>
              <textarea 
                rows={4}
                value={formData.history}
                onChange={(e) => setFormData({...formData, history: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Sejarah pembentukan..."
              />
            </div>
          </div>

          {/* Vision & Mission */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Visi & Misi</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visi</label>
              <textarea 
                rows={2}
                value={formData.vision}
                onChange={(e) => setFormData({...formData, vision: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Visi organisasi..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Misi</label>
                <button type="button" onClick={addMission} className="text-xs text-green-600 font-bold hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Tambah Misi
                </button>
              </div>
              <div className="space-y-2">
                {formData.mission.map((m, idx) => (
                    <div key={idx} className="flex gap-2">
                        <input 
                            type="text" 
                            value={m}
                            onChange={(e) => updateMission(idx, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            placeholder={`Misi ${idx + 1}`}
                        />
                        <button type="button" onClick={() => removeMission(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
              </div>
            </div>
          </div>

          {/* Management Structure */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-bold text-gray-900">Struktur Pengurus</h3>
              <button 
                type="button" 
                onClick={addManagement}
                className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Tambah Pengurus
              </button>
            </div>

            <div className="space-y-4">
              {formData.management.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                  <button 
                    type="button" 
                    onClick={() => removeManagement(index)}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Nama Lengkap</label>
                      <input 
                        type="text" 
                        value={item.name}
                        onChange={(e) => updateManagement(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Nama..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Jabatan</label>
                      <input 
                        type="text" 
                        value={item.position}
                        onChange={(e) => updateManagement(index, 'position', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Ketua Umum..."
                      />
                    </div>
                    <div>
                      <ImageInput
                        label="URL Foto"
                        value={item.image}
                        onChange={(value) => updateManagement(index, 'image', value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
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
              Simpan Banom
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
