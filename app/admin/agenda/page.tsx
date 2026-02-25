
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/components/auth/auth-context';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  FileSpreadsheet,
  X,
  Download,
  Loader2,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface Agenda {
  id: number;
  title: string;
  description?: string;
  date_start: string;
  date_end?: string;
  time_string: string;
  location: string;
  maps_url?: string;
  status: string;
  organizer?: string;
  ticket_price?: string;
  ticket_quota?: number;
  registration_enabled?: boolean;
  registration_url?: string;
  rundown?: Array<{ time: string; activity: string }>;
}

export default function AgendaPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Export states
  const [showExportModal, setShowExportModal] = useState(false);
  const [organizers, setOrganizers] = useState<string[]>([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState(false);

  useEffect(() => {
    fetchAgendas();
  }, []);

  const fetchAgendas = async () => {
    try {
      const response = await api.get('/agendas');
      setAgendas(response.data);
    } catch (error) {
      console.error('Failed to fetch agendas', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this agenda?')) {
      try {
        await api.delete(`/agendas/${id}`);
        fetchAgendas();
      } catch (error) {
        console.error('Failed to delete agenda', error);
        alert('Failed to delete agenda');
      }
    }
  };

  const openExportModal = async () => {
    setShowExportModal(true);
    setSelectedOrganizer('');
    setIsLoadingOrganizers(true);

    try {
      const response = await api.get('/agendas/organizers');
      setOrganizers(response.data);
    } catch (error) {
      console.error('Failed to fetch organizers', error);
    } finally {
      setIsLoadingOrganizers(false);
    }
  };

  const handleExport = async () => {
    if (!selectedOrganizer) return;

    setIsExporting(true);
    try {
      const response = await api.get('/agendas/export', {
        params: { organizer: selectedOrganizer },
      });

      const data: Agenda[] = response.data;

      if (data.length === 0) {
        alert('Tidak ada agenda untuk penyelenggara ini.');
        setIsExporting(false);
        return;
      }

      generateExcel(data, selectedOrganizer);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed', error);
      alert('Gagal mengekspor data.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateExcel = (data: Agenda[], organizerName: string) => {
    const wb = XLSX.utils.book_new();

    // === SHEET 1: Laporan Agenda ===
    const headerRows = [
      ['LAPORAN KEGIATAN / AGENDA'],
      [`Penyelenggara: ${organizerName}`],
      [`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`],
      [`Total Kegiatan: ${data.length}`],
      [], // empty row
    ];

    const tableHeader = [
      'No', 'Judul Kegiatan', 'Deskripsi', 'Tanggal Mulai', 'Tanggal Selesai',
      'Waktu', 'Lokasi', 'Status', 'Harga Tiket', 'Kuota',
      'Pendaftaran', 'URL Pendaftaran', 'Rundown'
    ];

    const tableData = data.map((agenda, index) => {
      const formatDate = (d?: string) => {
        if (!d) return '-';
        try {
          return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch { return d; }
      };

      const statusMap: Record<string, string> = {
        upcoming: 'Akan Datang',
        ongoing: 'Sedang Berlangsung',
        completed: 'Selesai',
      };

      const rundownText = agenda.rundown && Array.isArray(agenda.rundown)
        ? agenda.rundown.map(r => `${r.time} - ${r.activity}`).join('\n')
        : '-';

      // Strip HTML tags from description
      const cleanDesc = agenda.description
        ? agenda.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
        : '-';

      return [
        index + 1,
        agenda.title || '-',
        cleanDesc,
        formatDate(agenda.date_start),
        formatDate(agenda.date_end),
        agenda.time_string || '-',
        agenda.location || '-',
        statusMap[agenda.status] || agenda.status || '-',
        agenda.ticket_price || 'Gratis',
        agenda.ticket_quota || '-',
        agenda.registration_enabled ? 'Aktif' : 'Nonaktif',
        agenda.registration_url || '-',
        rundownText,
      ];
    });

    const wsData = [
      ...headerRows,
      tableHeader,
      ...tableData,
      [], // empty row
      ['--- Akhir Laporan ---'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws['!cols'] = [
      { wch: 5 },   // No
      { wch: 35 },  // Judul
      { wch: 50 },  // Deskripsi
      { wch: 20 },  // Tanggal Mulai
      { wch: 20 },  // Tanggal Selesai
      { wch: 18 },  // Waktu
      { wch: 30 },  // Lokasi
      { wch: 18 },  // Status
      { wch: 15 },  // Harga
      { wch: 10 },  // Kuota
      { wch: 14 },  // Pendaftaran
      { wch: 35 },  // URL
      { wch: 50 },  // Rundown
    ];

    // Merge header cells
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } }, // Organizer
      { s: { r: 2, c: 0 }, e: { r: 2, c: 12 } }, // Date
      { s: { r: 3, c: 0 }, e: { r: 3, c: 12 } }, // Total
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Agenda');

    // === SHEET 2: Ringkasan ===
    const statusCounts = {
      upcoming: data.filter(a => a.status === 'upcoming').length,
      ongoing: data.filter(a => a.status === 'ongoing').length,
      completed: data.filter(a => a.status === 'completed').length,
    };

    const regEnabled = data.filter(a => a.registration_enabled).length;

    const summaryData = [
      ['RINGKASAN KEGIATAN'],
      [`Penyelenggara: ${organizerName}`],
      [],
      ['Kategori', 'Jumlah'],
      ['Total Kegiatan', data.length],
      ['Akan Datang', statusCounts.upcoming],
      ['Sedang Berlangsung', statusCounts.ongoing],
      ['Selesai', statusCounts.completed],
      [],
      ['Pendaftaran Aktif', regEnabled],
      ['Tanpa Pendaftaran', data.length - regEnabled],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [
      { wch: 25 },
      { wch: 15 },
    ];
    wsSummary['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    // Download
    const safeOrganizer = organizerName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Laporan_Agenda_${safeOrganizer}_${dateStr}.xlsx`);
  };

  const filteredAgendas = agendas.filter(agenda =>
    agenda.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Management Agenda</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola jadwal kegiatan dan acara.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openExportModal}
            className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <Link
            href="/admin/agenda/create"
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Buat Agenda Baru
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari agenda..."
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
                <th className="px-6 py-4">Judul Agenda</th>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Lokasi</th>
                <th className="px-6 py-4">Penyelenggara</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Daftar</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading data...</td>
                </tr>
              ) : filteredAgendas.length > 0 ? (
                filteredAgendas.map((agenda) => (
                  <tr key={agenda.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 line-clamp-1">{agenda.title}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3" /> {new Date(agenda.date_start).toLocaleDateString('id-ID')}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">{agenda.time_string}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{agenda.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {agenda.organizer ? (
                        <span className="inline-flex items-center gap-1 text-gray-700">
                          <Building2 className="w-3 h-3" />
                          <span className="line-clamp-1">{agenda.organizer}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${agenda.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                          agenda.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {agenda.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${agenda.registration_enabled
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}>
                        {agenda.registration_enabled ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/agenda/${agenda.id}/edit`} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(agenda.id)}
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
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Tidak ada agenda ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === EXPORT MODAL === */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowExportModal(false)} />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <FileSpreadsheet className="w-6 h-6" />
                <div>
                  <h3 className="font-bold text-lg">Export Agenda ke Excel</h3>
                  <p className="text-emerald-100 text-xs">Laporan LPJ per Penyelenggara</p>
                </div>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isLoadingOrganizers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  <span className="ml-2 text-sm text-gray-500">Memuat data penyelenggara...</span>
                </div>
              ) : organizers.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Belum ada penyelenggara yang tersedia.</p>
                  <p className="text-xs text-gray-400 mt-1">Pastikan agenda memiliki field penyelenggara.</p>
                </div>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Pilih Penyelenggara / Banom
                  </label>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {organizers.map((org) => {
                      const count = agendas.filter(a => a.organizer === org).length;
                      return (
                        <label
                          key={org}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${selectedOrganizer === org
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                          <input
                            type="radio"
                            name="organizer"
                            value={org}
                            checked={selectedOrganizer === org}
                            onChange={() => setSelectedOrganizer(org)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedOrganizer === org
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                            }`}>
                            {selectedOrganizer === org && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${selectedOrganizer === org ? 'text-green-700' : 'text-gray-700'
                              }`}>
                              {org}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                            {count} agenda
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Info */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                      File Excel berisi 2 sheet: <strong>Laporan Agenda</strong> (data lengkap setiap kegiatan) dan <strong>Ringkasan</strong> (statistik kegiatan).
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {organizers.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleExport}
                  disabled={!selectedOrganizer || isExporting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengekspor...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export Excel
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
