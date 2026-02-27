
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/components/auth/auth-context';
import { 
  Search, 
  Trash2, 
  Mail,
  CheckCircle2,
  XCircle,
  Download,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

interface Newsletter {
  id: number;
  email: string;
  is_active: boolean;
  subscribed_at: string;
}

export default function NewslettersPage() {
  const [subscribers, setSubscribers] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const response = await api.get('/newsletters');
      setSubscribers(response.data);
    } catch (error) {
      console.error('Failed to fetch subscribers', error);
      toast.error('Gagal memuat data subscriber');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus subscriber ini?')) {
      try {
        await api.delete(`/newsletters/${id}`);
        fetchSubscribers();
        toast.success('Subscriber berhasil dihapus');
      } catch (error) {
        console.error('Failed to delete subscriber', error);
        toast.error('Gagal menghapus subscriber');
      }
    }
  };

  const handleToggleStatus = async (subscriber: Newsletter) => {
    try {
        await api.put(`/newsletters/${subscriber.id}`, {
            is_active: !subscriber.is_active
        });
        fetchSubscribers();
        toast.success(`Status ${subscriber.email} berhasil diubah`);
    } catch (error) {
        console.error('Failed to update status', error);
        toast.error('Gagal mengubah status');
    }
  };

  const handleCopyEmails = () => {
    const emails = filteredSubscribers
        .filter(s => s.is_active)
        .map(s => s.email)
        .join(', ');
    
    navigator.clipboard.writeText(emails);
    toast.success('Email aktif berhasil disalin ke clipboard');
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Email', 'Status', 'Tanggal Subscribe'];
    const rows = filteredSubscribers.map(s => [
        s.id,
        s.email,
        s.is_active ? 'Active' : 'Inactive',
        new Date(s.subscribed_at).toLocaleDateString()
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const email = (sub.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return email.includes(query);
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletter Subscribers</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola daftar email berlangganan newsletter.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleCopyEmails}
                className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                title="Salin semua email aktif"
            >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Salin Email</span>
            </button>
            <button 
                onClick={handleExportCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
                <Download className="w-4 h-4" />
                Export CSV
            </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari email subscriber..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-500">Total:</span>
            <span className="font-bold text-gray-900">{subscribers.length}</span>
            <span className="text-gray-300 mx-2">|</span>
            <span className="text-sm text-green-600">Aktif:</span>
            <span className="font-bold text-green-700">{subscribers.filter(s => s.is_active).length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tanggal Subscribe</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading data...</td>
                </tr>
              ) : filteredSubscribers.length > 0 ? (
                filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                           <Mail className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-900">{sub.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(sub)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            sub.is_active 
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {sub.is_active ? (
                            <>
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                            </>
                        ) : (
                            <>
                                <XCircle className="w-3 h-3" />
                                Inactive
                            </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(sub.subscribed_at).toLocaleDateString('id-ID', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(sub.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Subscriber"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Tidak ada subscriber ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
