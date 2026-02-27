
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/components/auth/auth-context';
import { 
  Plus, 
  Search, 
  Trash2, 
  Video, 
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Multimedia {
  id: number;
  title: string;
  type: 'video' | 'photo';
  thumbnail: string;
  date: string;
}

export default function MultimediaPage() {
  const [items, setItems] = useState<Multimedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMultimedia();
  }, []);

  const fetchMultimedia = async () => {
    try {
      const response = await api.get('/multimedia');
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch multimedia', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/multimedia/${id}`);
        fetchMultimedia();
      } catch (error) {
        console.error('Failed to delete item', error);
        alert('Failed to delete item');
      }
    }
  };

  const filteredItems = items.filter(item => {
    const title = (item.title || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query);
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Management Multimedia</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola galeri foto dan video.</p>
        </div>
        <Link 
          href="/admin/multimedia/create" 
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Konten
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari konten..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Grid View */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading data...</div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                    <div className="relative aspect-video bg-gray-100">
                        {item.thumbnail ? (
                            <Image src={item.thumbnail} alt={item.title} fill className="object-cover" unoptimized />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                {item.type === 'video' ? <Video className="w-10 h-10" /> : <ImageIcon className="w-10 h-10" />}
                            </div>
                        )}
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs font-bold text-white uppercase flex items-center gap-1">
                            {item.type === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                            {item.type}
                        </div>
                    </div>
                    <div className="p-4">
                        <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 min-h-[40px]">{item.title}</h3>
                        <p className="text-xs text-gray-500 mb-4">{new Date(item.date).toLocaleDateString('id-ID')}</p>
                        
                        <div className="flex items-center gap-2">
                            <Link 
                                href={`/admin/multimedia/${item.id}/edit`} 
                                className="flex-1 py-2 text-center text-sm font-medium text-gray-600 bg-gray-50 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors border border-gray-200"
                            >
                                Edit
                            </Link>
                            <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
            Tidak ada konten ditemukan.
        </div>
      )}
    </div>
  );
}
