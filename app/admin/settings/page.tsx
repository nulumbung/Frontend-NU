
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/components/auth/auth-context';
import { Save, Loader2, Globe, Share2, Mail, Search, Scale, History as HistoryIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ImageInput } from '@/components/form/image-input';
import { Editor } from '@/components/form/editor';
import { SITE_SETTINGS_UPDATED_EVENT } from '@/components/settings/site-settings-context';

interface Setting {
  id: number;
  key: string;
  value: string;
  group: string;
  type: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await api.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings', error);
      toast.error('Gagal memuat pengaturan');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const handleUpdate = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        // Only send changed settings in current group to save bandwidth/processing
        // But for simplicity, we can send all or filtered by group
        const settingsToSave = settings
            .filter(s => s.group === activeTab)
            .map(({ key, value }) => ({ key, value }));

        await api.put('/settings', { settings: settingsToSave });
        await fetchSettings(true);
        window.dispatchEvent(new Event(SITE_SETTINGS_UPDATED_EVENT));
        toast.success('Pengaturan berhasil disimpan');
    } catch (error) {
        console.error('Failed to save settings', error);
        toast.error('Gagal menyimpan pengaturan');
    } finally {
        setIsSaving(false);
    }
  };

  const renderField = (setting: Setting) => {
    switch (setting.type) {
        case 'textarea':
            return (
                <textarea
                    rows={4}
                    value={setting.value || ''}
                    onChange={(e) => handleUpdate(setting.key, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-sans text-sm"
                />
            );
        case 'richtext':
            return (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <Editor
                        value={setting.value || ''}
                        onChange={(value) => handleUpdate(setting.key, value)}
                    />
                </div>
            );
        case 'image':
            return (
                <ImageInput
                    label=""
                    value={setting.value || ''}
                    onChange={(value) => handleUpdate(setting.key, value)}
                />
            );
        default:
            return (
                <input
                    type="text"
                    value={setting.value || ''}
                    onChange={(e) => handleUpdate(setting.key, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            );
    }
  };

  const getGroupLabel = (group: string) => {
      switch(group) {
          case 'general': return 'Umum';
          case 'contact': return 'Kontak';
          case 'social': return 'Sosial Media';
          case 'seo': return 'SEO & Meta';
          case 'legal': return 'Kebijakan & Legal';
          case 'history': return 'Sejarah';
          default: return group;
      }
  };

  const tabs = [
      { id: 'general', label: 'Umum', icon: Globe },
      { id: 'contact', label: 'Kontak', icon: Mail },
      { id: 'social', label: 'Sosial Media', icon: Share2 },
      { id: 'seo', label: 'SEO', icon: Search },
      { id: 'legal', label: 'Legal', icon: Scale },
      { id: 'history', label: 'Sejarah', icon: HistoryIcon },
  ];

  if (isLoading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Situs</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola informasi global, kontak, dan konfigurasi lainnya.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === tab.id 
                            ? 'bg-green-50 text-green-700 border-l-4 border-green-600' 
                            : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Content */}
        <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                    <h2 className="text-lg font-bold text-gray-900">{getGroupLabel(activeTab)}</h2>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Perubahan
                    </button>
                </div>

                <div className="space-y-6">
                    {settings
                        .filter(s => s.group === activeTab)
                        .map(setting => (
                            <div key={setting.id}>
                                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                                    {setting.key.replace(activeTab + '_', '').replace('seo_meta', 'Meta').replace(/_/g, ' ')}
                                </label>
                                {renderField(setting)}
                            </div>
                        ))
                    }
                    {settings.filter(s => s.group === activeTab).length === 0 && (
                        <p className="text-gray-500 italic">Tidak ada pengaturan di grup ini.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
