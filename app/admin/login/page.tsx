
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-context';
import { Lock, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdminUser = useMemo(
    () => Boolean(user && ['superadmin', 'admin', 'editor', 'redaksi'].includes(user.role)),
    [user]
  );

  useEffect(() => {
    if (isAdminUser) {
      router.replace('/admin');
    }
  }, [isAdminUser, router]);

  if (isAdminUser) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password, 'admin');
      // AuthContext will update user state, and then we can redirect
      // But we can also force redirect here
      router.push('/admin');
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 via-yellow-400 to-green-600" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
            <h1 className="font-serif font-bold text-3xl text-white tracking-wider mb-2">
              NU | LUMBUNG
            </h1>
            <p className="text-gray-400 text-sm uppercase tracking-widest">Portal Admin</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-green-700" />
            </div>
            
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Masuk ke Dashboard</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center border border-red-100">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Administrator</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  placeholder="example@nulumbung.or.id"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk Dashboard'}
              </button>
            </form>
            
          </div>
          <div className="bg-gray-50 px-8 py-4 text-center">
            <p className="text-xs text-gray-500">
              Sistem Informasi Terpadu Nahdlatul Ulama &copy; 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
