
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/components/auth/auth-context';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface Post {
  id: number;
  title: string;
  category_id: number;
  status: string;
  views: number;
  created_at: string;
  is_featured?: boolean;
  is_spotlight?: boolean;
  is_breaking?: boolean;
  is_headline?: boolean;
  author: {
    name: string;
  };
}

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const fetchPosts = async () => {
    try {
      // In a real app, we would add pagination params here
      const response = await api.get('/admin/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/posts/${id}`);
        fetchPosts();
      } catch (error) {
        console.error('Failed to delete post', error);
      }
    }
  };

  const handleToggleFlag = async (
    post: Post,
    field: 'is_spotlight' | 'is_breaking' | 'is_featured' | 'is_headline'
  ) => {
    const nextValue = !Boolean(post[field]);
    const key = `${post.id}:${field}`;
    setTogglingKey(key);
    try {
      await api.put(`/posts/${post.id}`, { [field]: nextValue });
      await fetchPosts();
    } catch (error) {
      console.error(`Failed to toggle ${field}`, error);
      alert('Gagal memperbarui status berita.');
    } finally {
      setTogglingKey(null);
    }
  };

  const filteredPosts = posts.filter(post => {
    const title = (post.title || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesTitle = title.includes(query);
    const matchesStatus = statusFilter ? post.status === statusFilter : true;
    const matchesCategory = categoryFilter ? String(post.category_id) === categoryFilter : true;
    return matchesTitle && matchesStatus && matchesCategory;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Management Berita</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola semua artikel dan berita di sini.</p>
        </div>
        <Link 
          href="/admin/posts/create" 
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Buat Berita Baru
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari judul berita..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-600"
          >
            <option value="">Semua Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-600"
          >
            <option value="">Semua Kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Judul</th>
                <th className="px-6 py-4">Penulis</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Breaking</th>
                <th className="px-6 py-4">Pilihan</th>
                <th className="px-6 py-4">Utama</th>
                <th className="px-6 py-4">Spotlight</th>
                <th className="px-6 py-4">Views</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">Loading data...</td>
                </tr>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 line-clamp-1">{post.title}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {post.author?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleFlag(post, 'is_breaking')}
                        disabled={togglingKey === `${post.id}:is_breaking`}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border transition-colors disabled:opacity-60 ${
                          post.is_breaking
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {post.is_breaking ? 'Ya' : 'Tidak'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleFlag(post, 'is_featured')}
                        disabled={togglingKey === `${post.id}:is_featured`}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border transition-colors disabled:opacity-60 ${
                          post.is_featured
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {post.is_featured ? 'Ya' : 'Tidak'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleFlag(post, 'is_headline')}
                        disabled={togglingKey === `${post.id}:is_headline`}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border transition-colors disabled:opacity-60 ${
                          post.is_headline
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {post.is_headline ? 'Ya' : 'Tidak'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleFlag(post, 'is_spotlight')}
                        disabled={togglingKey === `${post.id}:is_spotlight`}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border transition-colors disabled:opacity-60 ${
                          post.is_spotlight
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {post.is_spotlight ? 'Ya' : 'Tidak'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {post.views.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <Link href={`/admin/posts/${post.id}/edit`} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(post.id)}
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
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">Tidak ada berita ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing 1 to {filteredPosts.length} of {filteredPosts.length} results</p>
          <div className="flex gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
