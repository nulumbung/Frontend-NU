
'use client';

import { useAuth } from '@/components/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  Hash,
  History,
  Radio,
  Mail,
  Home,
  Megaphone
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auth Guard
  useEffect(() => {
    if (pathname === '/admin/login') return; // Skip check for login page

    if (!isLoading) {
      if (!user) {
        // Redirect to dedicated admin login page
        router.push('/admin/login');
      } else if (!['superadmin', 'admin', 'editor', 'redaksi'].includes(user.role as string)) {
        // Logged in but not admin
        router.push('/');
      }
    }
  }, [user, isLoading, router, pathname]);

  // Don't protect the login page itself with this layout's logic if it's rendered inside it?
  // Actually, Next.js Layouts wrap pages. If /admin/login is inside /admin, it will be wrapped by this layout.
  // We need to exclude /admin/login from this check or move /admin/login outside of this layout group.
  // BUT, usually /admin/login should NOT have the sidebar.
  // So /admin/login should NOT be under app/admin/layout.tsx if this layout adds sidebar.
  // OR we check pathname.
  
  if (pathname === '/admin/login') {
      return <>{children}</>;
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
    { label: 'Settings', href: '/admin/settings', icon: Settings, roles: ['superadmin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role as string));

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
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
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
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

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
