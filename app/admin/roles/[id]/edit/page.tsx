
'use client';

import { useState, useEffect, use } from 'react';
import { api } from '@/components/auth/auth-context';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Save,
    Loader2,
    Shield,
    Tag,
    FileText,
    CheckSquare,
    Info,
    Lock,
    Users,
    AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface Permission {
    id: number;
    name: string;
    display_name: string;
    group: string;
    description: string;
}

interface PermissionGroup {
    group: string;
    permissions: Permission[];
}

interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string;
    is_system: boolean;
    users_count: number;
    permissions: Permission[];
}

const getErrorMessage = (error: unknown) => {
    const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
    return error instanceof Error ? error.message : 'Unknown error';
};

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [role, setRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        display_name: '',
        description: '',
    });

    useEffect(() => {
        Promise.all([fetchRole(), fetchPermissions()]).finally(() => setIsFetching(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchRole = async () => {
        try {
            const response = await api.get(`/roles/${id}`);
            const data: Role = response.data;
            setRole(data);
            setFormData({
                name: data.name,
                display_name: data.display_name,
                description: data.description || '',
            });
            setSelectedPermissions(data.permissions.map(p => p.id));
        } catch (error) {
            console.error('Failed to fetch role', error);
            alert('Role tidak ditemukan');
            router.push('/admin/roles');
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await api.get('/permissions');
            setPermissionGroups(response.data);
        } catch (error) {
            console.error('Failed to fetch permissions', error);
        }
    };

    const togglePermission = (permId: number) => {
        setSelectedPermissions(prev =>
            prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
        );
    };

    const toggleGroup = (group: PermissionGroup) => {
        const groupIds = group.permissions.map(p => p.id);
        const allSelected = groupIds.every(id => selectedPermissions.includes(id));

        if (allSelected) {
            setSelectedPermissions(prev => prev.filter(id => !groupIds.includes(id)));
        } else {
            setSelectedPermissions(prev => [...new Set([...prev, ...groupIds])]);
        }
    };

    const selectAll = () => {
        const allIds = permissionGroups.flatMap(g => g.permissions.map(p => p.id));
        setSelectedPermissions(allIds);
    };

    const deselectAll = () => {
        setSelectedPermissions([]);
    };

    const autoSlug = (value: string) => {
        return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload: Record<string, unknown> = {
                display_name: formData.display_name,
                description: formData.description,
                permissions: selectedPermissions,
            };

            // Only send name if role is not system
            if (!role?.is_system) {
                payload.name = formData.name;
            }

            await api.put(`/roles/${id}`, payload);
            router.push('/admin/roles');
        } catch (error: unknown) {
            console.error('Failed to update role', error);
            alert('Gagal mengupdate role: ' + getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const totalPermissions = permissionGroups.reduce((acc, g) => acc + g.permissions.length, 0);

    if (isFetching) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                <span className="ml-3 text-gray-500">Memuat data role...</span>
            </div>
        );
    }

    if (!role) return null;

    const getRoleColor = (name: string) => {
        switch (name) {
            case 'superadmin': return 'from-purple-500 to-indigo-600';
            case 'admin': return 'from-blue-500 to-cyan-600';
            case 'editor': return 'from-green-500 to-emerald-600';
            case 'redaksi': return 'from-orange-500 to-amber-600';
            case 'user': return 'from-gray-400 to-gray-500';
            default: return 'from-teal-500 to-cyan-600';
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/roles" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">Edit Role</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Edit informasi dan hak akses role.</p>
                </div>
                {/* Role badge summary */}
                <div className={`hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-br ${getRoleColor(role.name)} text-white`}>
                    <Shield className="w-5 h-5" />
                    <div>
                        <p className="text-sm font-bold">{role.display_name}</p>
                        <p className="text-xs opacity-80 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {role.users_count} user aktif
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* System role warning */}
                {role.is_system && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-amber-800">Role Bawaan Sistem</p>
                            <p className="text-xs text-amber-600 mt-0.5">
                                Nama (slug) role ini tidak dapat diubah karena merupakan role bawaan sistem. Anda masih bisa mengubah nama tampil, deskripsi, dan permissions.
                            </p>
                        </div>
                    </div>
                )}

                {/* Basic Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
                        <Shield className="w-5 h-5 text-green-600" />
                        Informasi Role
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Tampil</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    required
                                    value={formData.display_name}
                                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Contoh: Content Manager"
                                />
                            </div>
                        </div>

                        {/* Slug Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Slug (Unique ID)</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: autoSlug(e.target.value) })}
                                    className={`w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm ${role.is_system ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                                        }`}
                                    placeholder="content-manager"
                                    pattern="^[a-z0-9_-]+$"
                                    title="Hanya huruf kecil, angka, dash, dan underscore"
                                    disabled={role.is_system}
                                />
                            </div>
                            {role.is_system && (
                                <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Tidak dapat diubah untuk role sistem
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                    placeholder="Deskripsi singkat tentang role ini..."
                                    rows={3}
                                    maxLength={500}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Permissions Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-green-600" />
                            Hak Akses (Permissions)
                            <span className="text-sm font-normal text-gray-400">
                                {selectedPermissions.length}/{totalPermissions} dipilih
                            </span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={selectAll}
                                className="text-xs font-medium text-green-600 hover:text-green-700 hover:underline"
                            >
                                Pilih Semua
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                                type="button"
                                onClick={deselectAll}
                                className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {permissionGroups.map((group) => {
                            const groupIds = group.permissions.map(p => p.id);
                            const allSelected = groupIds.every(id => selectedPermissions.includes(id));
                            const someSelected = groupIds.some(id => selectedPermissions.includes(id)) && !allSelected;

                            return (
                                <div key={group.group} className="border border-gray-100 rounded-xl overflow-hidden">
                                    {/* Group Header */}
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group)}
                                        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${allSelected ? 'bg-green-600 border-green-600' : someSelected ? 'bg-green-200 border-green-400' : 'border-gray-300'
                                            }`}>
                                            {(allSelected || someSelected) && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    {allSelected ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                                                    )}
                                                </svg>
                                            )}
                                        </div>
                                        <span className="font-semibold text-gray-700">{group.group}</span>
                                        <span className="text-xs text-gray-400 ml-auto">
                                            {groupIds.filter(id => selectedPermissions.includes(id)).length}/{groupIds.length}
                                        </span>
                                    </button>

                                    {/* Permissions */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                                        {group.permissions.map((perm) => {
                                            const isSelected = selectedPermissions.includes(perm.id);
                                            return (
                                                <label
                                                    key={perm.id}
                                                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-t border-gray-50 ${isSelected ? 'bg-green-50/50' : 'hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => togglePermission(perm.id)}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-4 h-4 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-green-600 border-green-600' : 'border-gray-300'
                                                        }`}>
                                                        {isSelected && (
                                                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>{perm.display_name}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{perm.description}</p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Superadmin info */}
                    {role.name === 'superadmin' && (
                        <div className="mt-6 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-2">
                            <Info className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-purple-700">
                                Super Admin selalu memiliki akses penuh ke semua fitur, terlepas dari permission yang dipilih di sini.
                            </p>
                        </div>
                    )}

                    {/* Info */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700">
                            Perubahan permissions akan langsung berlaku untuk semua user dengan role ini.
                        </p>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <Link
                        href="/admin/roles"
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Perubahan
                    </button>
                </div>
            </form>
        </div>
    );
}
