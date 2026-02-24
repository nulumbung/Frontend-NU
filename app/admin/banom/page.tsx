
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/components/auth/auth-context';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Users
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Banom {
  id: number;
  name: string;
  slug: string;
  logo: string;
  short_desc: string;
}

export default function BanomPage() {
  const [banoms, setBanoms] = useState<Banom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBanoms();
  }, []);

  const fetchBanoms = async () => {
    try {
      const response = await api.get('/banoms');
      setBanoms(response.data);
    } catch (error) {
      console.error('Failed to fetch banoms', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this banom?')) {
      try {
        await api.delete(`/banoms/${id}`);
        fetchBanoms();
      } catch (error) {
        console.error('Failed to delete banom', error);
        alert('Failed to delete banom');
      }
    }
  };

  const filteredBanoms = banoms.filter(banom => 
    banom.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Management Banom</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola Badan Otonom Nahdlatul Ulama.</p>
        </div>
        <Link 
          href="/admin/banom/create" 
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Banom
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari banom..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Banom</th>
                <th className="px-6 py-4">Deskripsi Singkat</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Loading data...</td>
                </tr>
              ) : filteredBanoms.length > 0 ? (
                filteredBanoms.map((banom) => (
                  <tr key={banom.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                            {banom.logo ? (
                                <Image src={banom.logo} alt={banom.name} fill className="object-contain p-1" unoptimized />
                            ) : (
                                <Users className="w-5 h-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400" />
                            )}
                        </div>
                        <span className="font-medium text-gray-900">{banom.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <p className="line-clamp-2 max-w-md">{banom.short_desc}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/banom/${banom.id}/edit`} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(banom.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Tidak ada banom ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
