
'use client';

import { useEffect, useState } from 'react';
import { 
  FileText, 
  Users, 
  Video, 
  Calendar,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/components/auth/auth-context';

interface DashboardStats {
  total_posts: number;
  total_users: number;
  total_agendas: number;
  total_videos: number;
  recent_posts: Array<{
    id: number;
    title: string;
    status: string;
    created_at: string;
    published_at?: string | null;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_posts: 0,
    total_users: 0,
    total_agendas: 0,
    total_videos: 0,
    recent_posts: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Posts</p>
            <p className="text-3xl font-bold text-gray-900">
              {isLoading ? '...' : stats.total_posts.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">
              {isLoading ? '...' : stats.total_users.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Agendas</p>
            <p className="text-3xl font-bold text-gray-900">
              {isLoading ? '...' : stats.total_agendas.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Multimedia</p>
            <p className="text-3xl font-bold text-gray-900">
              {isLoading ? '...' : stats.total_videos.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <Video className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            Recent Activity
          </h2>
          <Link href="/admin/posts" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.recent_posts.map((item) => (
            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">
                  {new Date(item.published_at || item.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                item.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
          {!isLoading && stats.recent_posts.length === 0 && (
            <div className="p-6 text-sm text-gray-500">Belum ada aktivitas terbaru.</div>
          )}
        </div>
      </div>
    </div>
  );
}
