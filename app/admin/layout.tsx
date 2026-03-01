
'use client';

import { useAuth } from '@/components/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Calendar,
  Users,
  Video,
  LogOut,
  Menu,
  X,
  Settings,
  Shield,
  ShieldAlert,
  Hash,
  History,
  Radio,
  Mail,
  Home,
  Megaphone,
  ChevronUp,
  User as UserIcon,
  HardDrive
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  console.log('[AdminLayout] Render', { isLoading, user: !!user, pathname });

  // Ensure component is mounted before rendering auth-dependent content
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Auth Guard
  useEffect(() => {
    if (pathname === '/admin/login') return;

    if (!isLoading) {
      if (!user) {
        router.push('/admin/login');
      } else if (!['superadmin', 'admin', 'editor', 'redaksi'].includes(user.role as string)) {
        router.push('/');
      }
    }
  }, [user, isLoading, router, pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isMounted) {
    return null;
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  if (!user) return null;

  const menuItems = [
    { label: 'Dashboard', href: '/admin', icon: Home, roles: ['superadmin', 'admin', 'editor', 'redaksi'] },
    { label: 'Berita / Posts', href: '/admin/posts', icon: FileText, roles: ['superadmin', 'admin', 'editor', 'redaksi'] },
    { label: 'Kategori', href: '/admin/categories', icon: Hash, roles: ['superadmin', 'admin', 'editor'] },
    { label: 'Live Stream', href: '/admin/live-streams', icon: Radio, roles: ['superadmin', 'admin', 'editor'] },
    { label: 'Agenda', href: '/admin/agenda', icon: Calendar, roles: ['superadmin', 'admin', 'editor'] },
    { label: 'Banom', href: '/admin/banom', icon: Shield, roles: ['superadmin', 'admin'] },
    { label: 'Sejarah', href: '/admin/histories', icon: History, roles: ['superadmin', 'admin'] },
    { label: 'Multimedia', href: '/admin/multimedia', icon: Video, roles: ['superadmin', 'admin', 'editor'] },
    { label: 'Iklan', href: '/admin/ads', icon: Megaphone, roles: ['superadmin', 'admin', 'editor', 'redaksi'] },
    { label: 'Newsletter', href: '/admin/newsletters', icon: Mail, roles: ['superadmin', 'admin'] },
    { label: 'Users', href: '/admin/users', icon: Users, roles: ['superadmin'] },
    { label: 'Roles & Permissions', href: '/admin/roles', icon: ShieldAlert, roles: ['superadmin'] },
    { label: 'Backup & Restore', href: '/admin/backup', icon: HardDrive, roles: ['superadmin'] },
    { label: 'Settings', href: '/admin/settings', icon: Settings, roles: ['superadmin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role as string));

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <Link href="/" className="font-serif font-bold text-xl text-green-800">
              NU | ADMIN
            </Link>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="px-2 mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</p>
            </div>
            {filteredMenu.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section with Dropdown */}
          <div className="relative border-t border-gray-200" ref={profileRef}>
            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute bottom-full left-0 right-0 mx-3 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                <Link
                  href="/admin/profile"
                  onClick={() => { setIsProfileOpen(false); setIsSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${pathname === '/admin/profile'
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <UserIcon className="w-4 h-4" />
                  Profil Saya
                </Link>
                <div className="border-t border-gray-100" />
                <button
                  onClick={() => { setIsProfileOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            )}

            {/* User Info Button */}
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold flex-shrink-0 overflow-hidden">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
              </div>
              <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold">Admin Panel</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
