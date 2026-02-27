
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/components/auth/auth-context';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Users,
  Lock,
  Loader2,
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

interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_system: boolean;
  permissions_count: number;
  users_count: number;
  permissions?: Permission[];
  created_at: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRole, setExpandedRole] = useState<number | null>(null);
  const [expandedPermissions, setExpandedPermissions] = useState<Record<number, Permission[]>>({});
  const [loadingPermissions, setLoadingPermissions] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Failed to fetch roles', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = async (roleId: number) => {
    if (expandedRole === roleId) {
      setExpandedRole(null);
      return;
    }

    setExpandedRole(roleId);

    if (!expandedPermissions[roleId]) {
      setLoadingPermissions(roleId);
      try {
        const response = await api.get(`/roles/${roleId}`);
        setExpandedPermissions(prev => ({
          ...prev,
          [roleId]: response.data.permissions || [],
        }));
      } catch (error) {
        console.error('Failed to fetch role permissions', error);
      } finally {
        setLoadingPermissions(null);
      }
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteLoading(true);
    try {
      await api.delete(`/roles/${id}`);
      setDeleteConfirm(null);
      fetchRoles();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
        || 'Terjadi kesalahan saat menghapus role.';
      alert(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredRoles = roles.filter(role => {
    const displayName = (role.display_name || '').toLowerCase();
    const name = (role.name || '').toLowerCase();
    const description = (role.description || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return displayName.includes(query) || name.includes(query) || description.includes(query);
  });

  const getRoleIcon = (name: string) => {
    switch (name) {
      case 'superadmin':
        return <ShieldAlert className="w-5 h-5" />;
      case 'admin':
        return <ShieldCheck className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getRoleColor = (name: string) => {
    switch (name) {
      case 'superadmin':
        return 'from-purple-500 to-indigo-600';
      case 'admin':
        return 'from-blue-500 to-cyan-600';
      case 'editor':
        return 'from-green-500 to-emerald-600';
      case 'redaksi':
        return 'from-orange-500 to-amber-600';
      case 'user':
        return 'from-gray-400 to-gray-500';
      default:
        return 'from-teal-500 to-cyan-600';
    }
  };

  const getRoleBadgeColor = (name: string) => {
    switch (name) {
      case 'superadmin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'editor':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'redaksi':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'user':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-teal-100 text-teal-700 border-teal-200';
    }
  };

  const groupPermissions = (perms: Permission[]) => {
    const grouped: Record<string, Permission[]> = {};
    perms.forEach(p => {
      if (!grouped[p.group]) grouped[p.group] = [];
      grouped[p.group].push(p);
    });
    return grouped;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-green-600" />
            Roles & Permissions
          </h1>
          <p className="text-gray-500 text-sm mt-1">Kelola role dan hak akses pengguna sistem.</p>
        </div>
        <Link 
          href="/admin/roles/create" 
          className="bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Tambah Role
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari role berdasarkan nama atau deskripsi..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Roles Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-3 text-gray-500">Memuat data roles...</span>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Tidak ada role ditemukan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRoles.map((role) => (
            <div key={role.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Role Header */}
              <div className="flex items-center p-5">
                {/* Icon with gradient */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRoleColor(role.name)} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                  {getRoleIcon(role.name)}
                </div>

                {/* Role Info */}
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-lg">{role.display_name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getRoleBadgeColor(role.name)}`}>
                      {role.name}
                    </span>
                    {role.is_system && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                        <Lock className="w-2.5 h-2.5" />
                        Sistem
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{role.description || '-'}</p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 mx-6">
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">{role.permissions_count}</p>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide">Permissions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">{role.users_count}</p>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide">Users</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => toggleExpand(role.id)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Lihat permissions"
                  >
                    {expandedRole === role.id ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  <Link 
                    href={`/admin/roles/${role.id}/edit`} 
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit role"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  {!role.is_system && (
                    <button
                      onClick={() => setDeleteConfirm(role.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Stats */}
              <div className="flex sm:hidden items-center gap-4 px-5 pb-3 -mt-1">
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Lock className="w-3 h-3" /> {role.permissions_count} permissions
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Users className="w-3 h-3" /> {role.users_count} users
                </span>
              </div>

              {/* Expanded Permissions */}
              {expandedRole === role.id && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                  {loadingPermissions === role.id ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                      <span className="ml-2 text-sm text-gray-500">Memuat permissions...</span>
                    </div>
                  ) : (
                    <>
                      {expandedPermissions[role.id] && expandedPermissions[role.id].length > 0 ? (
                        <div className="space-y-4">
                          {Object.entries(groupPermissions(expandedPermissions[role.id])).map(([group, perms]) => (
                            <div key={group}>
                              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{group}</h4>
                              <div className="flex flex-wrap gap-2">
                                {perms.map(perm => (
                                  <span 
                                    key={perm.id} 
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700 shadow-sm"
                                    title={perm.description}
                                  >
                                    <Lock className="w-3 h-3 text-green-500" />
                                    {perm.display_name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-2">Role ini belum memiliki permission.</p>
                      )}
                      {role.name === 'superadmin' && (
                        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-xs text-purple-700 font-medium flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Super Admin memiliki akses penuh ke semua fitur tanpa batasan permission.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Delete Confirmation */}
              {deleteConfirm === role.id && (
                <div className="border-t border-red-100 bg-red-50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-700">Yakin ingin menghapus role <strong>{role.display_name}</strong>?</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      disabled={deleteLoading}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Hapus
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
