
'use client';

import { useState, useEffect } from 'react';
import { api, useAuth } from '@/components/auth/auth-context';
import {
    Save,
    Loader2,
    User as UserIcon,
    Lock,
    Mail,
    Eye,
    EyeOff,
    Shield,
    Calendar,
    Monitor,
    AlertCircle,
    CheckCircle2,
    KeyRound
} from 'lucide-react';
import { ImageInput } from '@/components/form/image-input';

const getErrorMessage = (error: unknown) => {
    const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
    return error instanceof Error ? error.message : 'Unknown error';
};

const getRoleBadge = (role: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        superadmin: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Super Admin' },
        admin: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Admin' },
        editor: { bg: 'bg-green-100', text: 'text-green-700', label: 'Editor' },
        redaksi: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Redaksi' },
        user: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'User' },
    };
    const c = config[role] || config.user;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
            <Shield className="w-3 h-3" />
            {c.label}
        </span>
    );
};

export default function ProfilePage() {
    const { user: authUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        avatar: '',
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (authUser) {
            setFormData({
                name: authUser.name || '',
                email: authUser.email || '',
                avatar: authUser.avatar || '',
            });
        }
    }, [authUser]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSuccessMessage('');

        try {
            await api.put('/user/profile', formData);
            setSuccessMessage('Profil berhasil diperbarui! Refresh halaman untuk melihat perubahan di sidebar.');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error: unknown) {
            console.error('Failed to update profile', error);
            alert('Gagal memperbarui profil: ' + getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSuccessMessage('');

        if (passwordData.password !== passwordData.password_confirmation) {
            alert('Password baru dan konfirmasi tidak cocok.');
            setIsLoading(false);
            return;
        }

        try {
            await api.put('/user/profile', {
                current_password: passwordData.current_password,
                password: passwordData.password,
            });
            setSuccessMessage('Password berhasil diubah!');
            setPasswordData({ current_password: '', password: '', password_confirmation: '' });
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error: unknown) {
            console.error('Failed to update password', error);
            alert('Gagal mengubah password: ' + getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    if (!authUser) return null;

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <UserIcon className="w-7 h-7 text-green-600" />
                    Profil Saya
                </h1>
                <p className="text-gray-500 text-sm mt-1">Kelola informasi profil dan keamanan akun Anda.</p>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700 font-medium">{successMessage}</p>
                </div>
            )}

            {/* Profile Card Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold overflow-hidden border-2 border-white/40 flex-shrink-0">
                            {authUser.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={authUser.avatar} alt={authUser.name} className="w-full h-full object-cover" />
                            ) : (
                                authUser.name.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="text-white">
                            <h2 className="text-xl font-bold">{authUser.name}</h2>
                            <p className="text-green-100 text-sm">{authUser.email}</p>
                            <div className="mt-2">{getRoleBadge(authUser.role as string)}</div>
                        </div>
                    </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                    <div className="px-4 py-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Role</p>
                            <p className="text-sm font-medium text-gray-700 capitalize">{authUser.role}</p>
                        </div>
                    </div>
                    <div className="px-4 py-3 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Provider</p>
                            <p className="text-sm font-medium text-gray-700 capitalize">{authUser.auth_provider || 'email'}</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex px-4 py-3 items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Login Terakhir</p>
                            <p className="text-sm font-medium text-gray-700">
                                {authUser.last_login_at
                                    ? new Date(authUser.last_login_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info'
                            ? 'border-green-600 text-green-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    <UserIcon className="w-4 h-4" />
                    Informasi Profil
                </button>
                <button
                    onClick={() => setActiveTab('password')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'password'
                            ? 'border-green-600 text-green-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    <KeyRound className="w-4 h-4" />
                    Ubah Password
                </button>
            </div>

            {/* Tab Content: Profile Info */}
            {activeTab === 'info' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex-1 space-y-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                            placeholder="Nama lengkap Anda"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                            placeholder="email@contoh.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="w-full sm:w-1/3">
                                {/* Avatar */}
                                <ImageInput
                                    label="Foto Profil"
                                    value={formData.avatar}
                                    onChange={(value) => setFormData({ ...formData, avatar: value })}
                                />
                            </div>
                        </div>

                        {/* Role Info (read-only) */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Shield className="w-4 h-4 text-gray-400" />
                                <span>Role Anda: <strong className="capitalize">{authUser.role}</strong></span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 ml-6">Role hanya bisa diubah oleh Super Admin.</p>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Simpan Profil
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tab Content: Change Password */}
            {activeTab === 'password' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password Saat Ini</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    required
                                    value={passwordData.current_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                    className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Masukkan password saat ini"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    required
                                    value={passwordData.password}
                                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                    className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Minimal 8 karakter"
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="password"
                                    required
                                    value={passwordData.password_confirmation}
                                    onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Ketik ulang password baru"
                                    minLength={8}
                                />
                            </div>
                            {passwordData.password && passwordData.password_confirmation &&
                                passwordData.password !== passwordData.password_confirmation && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                        Password baru dan konfirmasi tidak cocok.
                                    </div>
                                )}
                        </div>

                        {/* Warning */}
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-700">
                                Setelah password diubah, Anda mungkin perlu login ulang di perangkat lain yang menggunakan password lama.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading || (passwordData.password !== passwordData.password_confirmation)}
                                className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                                Ubah Password
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
