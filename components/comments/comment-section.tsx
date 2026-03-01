'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { api, useAuth } from '@/components/auth/auth-context';
import { LoginModal } from '@/components/auth/login-modal';

interface CommentUser {
  id: number;
  name: string;
  avatar?: string | null;
}

interface CommentItem {
  id: number;
  content: string;
  created_at: string;
  user: CommentUser;
}

interface CommentSectionProps {
  contentType: 'post' | 'multimedia' | 'live-stream';
  target: string | number | null | undefined;
  variant?: 'light' | 'dark';
  title?: string;
  placeholder?: string;
  emptyMessage?: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (maybeMessage) return maybeMessage;
  }

  return fallback;
};

export function CommentSection({
  contentType,
  target,
  variant = 'light',
  title = 'Komentar',
  placeholder = 'Tulis komentar Anda...',
  emptyMessage = 'Belum ada komentar. Jadilah yang pertama!',
}: CommentSectionProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const targetId = useMemo(() => {
    if (target === null || target === undefined) return '';
    return String(target).trim();
  }, [target]);

  const isDark = variant === 'dark';
  const isPublicUser = user?.role === 'user';

  useEffect(() => {
    if (!targetId) return;

    const fetchComments = async () => {
      setIsLoadingComments(true);
      setError('');

      try {
        const response = await api.get(`/comments/${contentType}/${targetId}`);
        setComments(response.data);
      } catch (err) {
        setError(getErrorMessage(err, 'Gagal memuat komentar.'));
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [contentType, targetId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const content = commentInput.trim();
    if (!content) return;

    if (!isPublicUser) {
      setShowLoginModal(true);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.post(`/comments/${contentType}/${targetId}`, { content });
      setComments((prev) => [response.data, ...prev]);
      setCommentInput('');
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal mengirim komentar.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`rounded-2xl p-6 border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-card border-border'
        }`}
    >
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className={`w-5 h-5 ${isDark ? 'text-accent' : 'text-accent'}`} />
        <h3 className="font-bold text-xl">
          {title} ({comments.length})
        </h3>
      </div>

      {error && (
        <div className={`mb-4 text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>
          {error}
        </div>
      )}

      <div className="space-y-4 max-h-none lg:max-h-[520px] overflow-y-auto pr-1">
        {isLoadingComments ? (
          <p className={isDark ? 'text-gray-300' : 'text-muted-foreground'}>Memuat komentar...</p>
        ) : comments.length === 0 ? (
          <p className={isDark ? 'text-gray-300' : 'text-muted-foreground'}>{emptyMessage}</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`rounded-xl p-3 border ${isDark ? 'bg-black/20 border-white/10' : 'bg-background border-border'
                }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center text-xs font-semibold">
                  {comment.user?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={comment.user.avatar}
                      alt={comment.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className={isDark ? 'text-white' : 'text-foreground'}>
                      {comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{comment.user?.name || 'Pengguna'}</span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>
                      {new Date(comment.created_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-200' : 'text-foreground/90'}`}>
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 pt-4 border-t border-border space-y-3">
        <textarea
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          className={`w-full rounded-xl p-3 text-sm min-h-[100px] focus:outline-none ${isDark
              ? 'bg-black/30 border border-white/20 text-white placeholder:text-gray-400 focus:border-accent'
              : 'bg-background border border-border text-foreground placeholder:text-muted-foreground focus:border-accent'
            }`}
          placeholder={
            !isMounted
              ? 'Memuat...'
              : isPublicUser
                ? placeholder
                : 'Login akun user publik untuk menulis komentar...'
          }
          disabled={!isMounted || isAuthLoading || !targetId}
        />

        <div className="flex justify-between items-center gap-3">
          {!isMounted ? (
            <span className="text-xs text-muted-foreground">Menyiapkan...</span>
          ) : !isPublicUser ? (
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className={`text-sm font-semibold px-4 py-2 rounded-full ${isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
            >
              Login untuk Komentar
            </button>
          ) : (
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>
              Login sebagai {user?.name}
            </span>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isAuthLoading || !targetId}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-60 ${isDark
                ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Mengirim...' : 'Kirim Komentar'}
          </button>
        </div>
      </form>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        initialMode="login"
        message="Login akun user publik diperlukan untuk mengirim komentar."
      />
    </div>
  );
}
