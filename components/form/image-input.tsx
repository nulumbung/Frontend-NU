
'use client';
import { useState } from 'react';
import { Upload, Link as LinkIcon, Loader2, X } from 'lucide-react';
import { api } from '@/components/auth/auth-context';

interface ImageInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export function ImageInput({ label, value, onChange, className = '', placeholder = 'https://...' }: ImageInputProps) {
  const [mode, setMode] = useState<'url' | 'upload'>('upload');
  const [isUploading, setIsUploading] = useState(false);

  const getErrorMessage = (error: unknown) => {
    const validationMessage = (error as { response?: { data?: { errors?: { file?: string[] } } } }).response?.data?.errors?.file?.[0];
    if (typeof validationMessage === 'string' && validationMessage.trim()) return validationMessage;

    const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
    return error instanceof Error ? error.message : 'Unknown error';
  };

  const getStatusCode = (error: unknown) =>
    (error as { response?: { status?: number } })?.response?.status;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      alert(`Ukuran gambar maksimal ${MAX_IMAGE_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload', formData);
      onChange(response.data.url);
    } catch (error: unknown) {
      if (getStatusCode(error) !== 422) {
        console.error('Upload failed', error);
      }
      alert('Gagal mengupload gambar: ' + getErrorMessage(error));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      
      <div className="flex gap-2 mb-3">
        <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex-1 py-1.5 text-sm flex items-center justify-center gap-2 rounded-lg border transition-colors ${mode === 'upload' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
            <Upload className="w-4 h-4" /> Upload
        </button>
        <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex-1 py-1.5 text-sm flex items-center justify-center gap-2 rounded-lg border transition-colors ${mode === 'url' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
            <LinkIcon className="w-4 h-4" /> URL
        </button>
      </div>

      {mode === 'url' ? (
        <input 
          type="url" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder={placeholder}
        />
      ) : (
        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
            {isUploading ? (
                <div className="flex flex-col items-center justify-center py-4">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-2" />
                    <p className="text-sm text-gray-500">Mengupload...</p>
                </div>
            ) : (
                <>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Klik atau drag file gambar ke sini</p>
                    <p className="text-xs text-gray-400 mt-1">Maksimal 10MB</p>
                </>
            )}
        </div>
      )}

      {value && (
        <div className="mt-3 relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className="w-full h-full object-contain" />
            <button 
                type="button"
                onClick={() => onChange('')}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
      )}
    </div>
  );
}
