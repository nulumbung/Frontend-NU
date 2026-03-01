'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  ExternalLink,
  Eye,
  Loader2,
  MessageSquare,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Users,
  RefreshCcw,
} from 'lucide-react';
import { useAuth, api } from '@/components/auth/auth-context';
import { LoginModal } from '@/components/auth/login-modal';
import { CommentSection } from '@/components/comments/comment-section';
import { createLiveStreamService } from '@/lib/services/live-stream.service';
import {
  getMySubscription,
  getMyVideoRating,
  rateVideo,
  subscribeToChannel,
  unsubscribeFromChannel,
  YouTubeChannelDetails,
  YouTubeChatMessage,
  YouTubeVideoDetails,
  YouTubeVideoRating,
} from '@/lib/youtube';

declare global {
  interface Window {
    google?: {
      accounts: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'small' | 'medium' | 'large';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: string | number;
              logo_alignment?: 'left' | 'center';
            }
          ) => void;
        };
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: '' | 'consent' }) => void;
          };
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_SCRIPT_ID = 'google-identity-services-script';
const YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube.force-ssl';

const liveStreamService = createLiveStreamService(api);

const toNumber = (value?: string | number | null) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCount = (value?: string | number | null) => {
  return toNumber(value).toLocaleString('id-ID');
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: string }).message;
    if (maybeMessage) return maybeMessage;
  }

  return fallback;
};

const getWatchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;

interface BackendLiveStream {
  id: number;
  title: string;
  description?: string | null;
  youtube_id: string;
  channel_name?: string | null;
  thumbnail_url?: string | null;
  status?: string | null;
  view_count?: number | string | null;
  is_active?: boolean;
  scheduled_start_time?: string | null;
}

export default function LiveStreamPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [videoId, setVideoId] = useState<string>('Kz3FK5FbBz8');
  const [activeStreamId, setActiveStreamId] = useState<number | null>(null);
  const [liveStreamsData, setLiveStreamsData] = useState<BackendLiveStream[]>([]);

  const [videoDetails, setVideoDetails] = useState<YouTubeVideoDetails | null>(null);
  const [channelDetails, setChannelDetails] = useState<YouTubeChannelDetails | null>(null);
  const [chatMessages, setChatMessages] = useState<YouTubeChatMessage[]>([]);
  const [chatStatus, setChatStatus] = useState<'loading' | 'ready' | 'empty' | 'unavailable' | 'error'>('loading');

  const [liveLikeCount, setLiveLikeCount] = useState(0);
  const [liveViewCount, setLiveViewCount] = useState(0);
  const [liveConcurrentViewers, setLiveConcurrentViewers] = useState<number | null>(null);

  const [youtubeAccessToken, setYoutubeAccessToken] = useState<string | null>(null);
  const [videoRating, setVideoRating] = useState<YouTubeVideoRating>('none');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  const [isLoadingAction, setIsLoadingAction] = useState<'subscribe' | 'like' | 'dislike' | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [dataError, setDataError] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  const nextPageTokenRef = useRef<string | undefined>(undefined);
  const activeLiveChatIdRef = useRef<string | undefined>(undefined);
  const chatPollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const canAccessLive = isHydrated && !isLoading && Boolean(user);
  const isBlocked = isHydrated && !isLoading && !user;
  const currentStream = useMemo(
    () => liveStreamsData.find((stream) => stream.youtube_id === videoId),
    [liveStreamsData, videoId]
  );
  const otherStreams = useMemo(
    () => liveStreamsData.filter((stream) => stream.youtube_id !== videoId).slice(0, 6),
    [liveStreamsData, videoId]
  );
  const watchUrl = useMemo(() => getWatchUrl(videoId), [videoId]);

  const mainStreamTitle = videoDetails?.title || currentStream?.title || 'Siaran Langsung Nulumbung';
  const mainStreamer = videoDetails?.channel_name || currentStream?.channel_name || 'Official Channel';
  const mainStreamAvatar =
    channelDetails?.thumbnails.default.url ||
    (videoId && !videoId.startsWith('UC')
      ? `https://img.youtube.com/vi/${videoId}/default.jpg`
      : '/images/default-avatar.png');
  const mainStreamSubscribers = channelDetails?.statistics.hiddenSubscriberCount
    ? 'Subscriber disembunyikan'
    : `${formatCount(channelDetails?.statistics.subscriberCount)} subscribers`;
  const mainStreamDescription =
    videoDetails?.description ||
    currentStream?.description ||
    'Saksikan siaran langsung resmi Nulumbung melalui channel YouTube terkait.';
  const liveNowViewers = liveConcurrentViewers ?? liveViewCount;

  const loadGoogleScript = useCallback(async () => {
    if (window.google?.accounts?.oauth2) return;

    await new Promise<void>((resolve, reject) => {
      let script = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;

      const onLoad = () => resolve();
      const onError = () => reject(new Error('Gagal memuat Google Identity Services.'));

      if (!script) {
        script = document.createElement('script');
        script.id = GOOGLE_SCRIPT_ID;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.addEventListener('load', onLoad, { once: true });
        script.addEventListener('error', onError, { once: true });
        document.head.appendChild(script);
        return;
      }

      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
    });
  }, []);

  const requestYouTubeAccessToken = useCallback(
    async (prompt: '' | 'consent' = '') => {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID belum diisi.');
      }

      await loadGoogleScript();

      return new Promise<string>((resolve, reject) => {
        if (!window.google?.accounts?.oauth2) {
          reject(new Error('Google OAuth belum siap.'));
          return;
        }

        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: YOUTUBE_SCOPE,
          callback: (response) => {
            if (response.error || !response.access_token) {
              reject(
                new Error(
                  response.error_description ||
                  response.error ||
                  'Gagal mendapatkan token YouTube.'
                )
              );
              return;
            }

            resolve(response.access_token);
          },
        });

        tokenClient.requestAccessToken({ prompt });
      });
    },
    [loadGoogleScript]
  );

  const ensureYouTubeAccessToken = useCallback(async () => {
    const token = await requestYouTubeAccessToken(youtubeAccessToken ? '' : 'consent');
    setYoutubeAccessToken(token);
    return token;
  }, [requestYouTubeAccessToken, youtubeAccessToken]);

  const syncEngagementState = useCallback(
    async (token: string, channelId: string, videoId: string) => {
      const [ratingResult, subscriptionResult] = await Promise.all([
        getMyVideoRating(videoId, token),
        getMySubscription(channelId, token),
      ]);

      setVideoRating(ratingResult);
      setIsSubscribed(subscriptionResult.isSubscribed);
      setSubscriptionId(subscriptionResult.subscriptionId);
    },
    []
  );

  const refreshLiveData = useCallback(async () => {
    try {
      // Use backend proxy instead of direct lib/youtube call
      const latestVideo = await liveStreamService.getProxyVideoDetails(videoId);
      if (!latestVideo) {
        setDataError('Data video live tidak ditemukan di YouTube.');
        return;
      }

      setDataError('');
      setVideoDetails(latestVideo);

      // If the backend resolved a Channel ID to a new Video ID, update state
      if (latestVideo.youtube_id && latestVideo.youtube_id !== videoId) {
        console.log(`Resolving ID: ${videoId} -> ${latestVideo.youtube_id}`);
        setVideoId(latestVideo.youtube_id);
      }

      setLiveLikeCount(toNumber(latestVideo.likeCount));
      setLiveViewCount(toNumber(latestVideo.view_count || latestVideo.viewCount));
      setLiveConcurrentViewers(
        latestVideo.concurrentViewers ? toNumber(latestVideo.concurrentViewers) : null
      );

      if (latestVideo.channelId) {
        // Use backend proxy instead of direct lib/youtube call
        const latestChannel = await liveStreamService.getProxyChannelDetails(latestVideo.channelId);
        setChannelDetails(latestChannel);
      } else {
        setChannelDetails(null);
      }

      if (latestVideo.activeLiveChatId !== activeLiveChatIdRef.current) {
        nextPageTokenRef.current = undefined;
        setChatMessages([]);
      }

      activeLiveChatIdRef.current = latestVideo.activeLiveChatId;
      setChatStatus(latestVideo.activeLiveChatId ? 'loading' : 'unavailable');
    } catch (error: unknown) {
      const apiError = error as { response?: { status?: number } };
      if (apiError?.response?.status === 404) {
        setVideoDetails(null);
        setChatStatus('unavailable');
        setDataError('Belum ada siaran aktif di channel ini.');
      } else {
        console.error('Failed to refresh live data:', error);
        setDataError(getErrorMessage(error, 'Gagal mengambil data live YouTube.'));
      }
    } finally {
      setIsLoadingAction(null);
    }
  }, [videoId]);

  const handleManualRefresh = async () => {
    setIsLoadingAction('like'); // Reusing loading state for visual feedback
    await refreshLiveData();
    setIsLoadingAction(null);
    setActionMessage('Data diperbarui dari YouTube.');
    setTimeout(() => setActionMessage(''), 3000);
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    async function fetchStreams() {
      try {
        const res = await fetch('/api/live-streams');
        if (!res.ok) return;
        const raw = await res.json();
        const rows: BackendLiveStream[] = Array.isArray(raw?.data) ? raw.data : [];
        setLiveStreamsData(rows);
      } catch (error) {
        console.error('Failed to fetch live streams list:', error);
      }
    }

    fetchStreams();
  }, []);

  useEffect(() => {
    if (!user) return;

    async function fetchActiveStream() {
      try {
        const res = await fetch('/api/live-streams/active');
        if (!res.ok) return;

        const raw = await res.json();
        const data = raw?.data ?? raw;

        if (data?.youtube_id) setVideoId(data.youtube_id);
        if (data?.id) setActiveStreamId(data.id);
      } catch (error) {
        console.error('Failed to fetch active stream from backend:', error);
      }
    }

    fetchActiveStream();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    refreshLiveData();
    const interval = setInterval(refreshLiveData, 15000);
    return () => clearInterval(interval);
  }, [user, refreshLiveData]);

  useEffect(() => {
    if (!user) return;

    setChatStatus('loading');
    let cancelled = false;

    const pollChat = async () => {
      if (cancelled) return;

      const liveChatId = activeLiveChatIdRef.current;
      if (!liveChatId) {
        setChatStatus('unavailable');
        chatPollingTimeoutRef.current = setTimeout(pollChat, 4000);
        return;
      }

      try {
        // Use backend proxy instead of direct lib/youtube call
        const chatData = await liveStreamService.getProxyLiveChat(liveChatId, nextPageTokenRef.current);

        if (!chatData) {
          setChatStatus('empty');
          chatPollingTimeoutRef.current = setTimeout(pollChat, 5000);
          return;
        }

        nextPageTokenRef.current = chatData.nextPageToken;

        let hasMessages = false;
        setChatMessages((prev) => {
          const messageMap = new Map(prev.map((msg) => [msg.id, msg]));
          chatData.messages.forEach((msg: YouTubeChatMessage) => messageMap.set(msg.id, msg));
          const merged = Array.from(messageMap.values()).sort(
            (a, b) =>
              new Date(a.snippet.publishedAt).getTime() -
              new Date(b.snippet.publishedAt).getTime()
          );
          hasMessages = merged.length > 0;
          return merged;
        });

        setChatStatus(hasMessages ? 'ready' : 'empty');

        const nextDelay = Math.max(2000, chatData.pollingIntervalMillis || 5000);
        chatPollingTimeoutRef.current = setTimeout(pollChat, nextDelay);
      } catch (error) {
        console.error('Failed to fetch live chat:', error);
        setChatStatus('error');
        chatPollingTimeoutRef.current = setTimeout(pollChat, 6000);
      }
    };

    pollChat();

    return () => {
      cancelled = true;
      if (chatPollingTimeoutRef.current) {
        clearTimeout(chatPollingTimeoutRef.current);
        chatPollingTimeoutRef.current = null;
      }
    };
  }, [user, videoId]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [chatMessages.length]);

  useEffect(() => {
    if (!youtubeAccessToken || !videoDetails?.channelId || !videoId) return;

    syncEngagementState(youtubeAccessToken, videoDetails.channelId, videoId).catch((error) => {
      console.error('Failed to sync engagement state:', error);
    });
  }, [youtubeAccessToken, videoDetails?.channelId, videoId, syncEngagementState]);

  const clearActionFeedback = () => {
    setActionMessage('');
    setActionError('');
  };

  const handleSubscribeToggle = async () => {
    if (!videoDetails?.channelId) return;

    clearActionFeedback();
    setIsLoadingAction('subscribe');

    try {
      const token = await ensureYouTubeAccessToken();

      let currentSubscriptionId = subscriptionId;
      let currentlySubscribed = isSubscribed;

      if (!currentlySubscribed || !currentSubscriptionId) {
        const current = await getMySubscription(videoDetails.channelId, token);
        currentlySubscribed = current.isSubscribed;
        currentSubscriptionId = current.subscriptionId;
      }

      if (currentlySubscribed && currentSubscriptionId) {
        await unsubscribeFromChannel(currentSubscriptionId, token);
        setIsSubscribed(false);
        setSubscriptionId(null);
        setActionMessage('Berhasil unsubscribe dari channel.');
      } else {
        const newSubscriptionId = await subscribeToChannel(videoDetails.channelId, token);
        setIsSubscribed(true);
        setSubscriptionId(newSubscriptionId);
        setActionMessage('Berhasil subscribe channel.');
      }

      if (videoDetails.channelId) {
        // Use backend proxy instead of direct lib/youtube call
        const latestChannel = await liveStreamService.getProxyChannelDetails(videoDetails.channelId);
        if (latestChannel) {
          setChannelDetails(latestChannel);
        }
      }
    } catch (error) {
      setActionError(getErrorMessage(error, 'Gagal memproses subscribe YouTube.'));
      window.open(
        `https://www.youtube.com/channel/${videoDetails.channelId}?sub_confirmation=1`,
        '_blank',
        'noopener,noreferrer'
      );
    } finally {
      setIsLoadingAction(null);
    }
  };

  const handleRateVideo = async (targetRating: 'like' | 'dislike') => {
    clearActionFeedback();
    setIsLoadingAction(targetRating);

    try {
      const token = await ensureYouTubeAccessToken();
      const nextRating: YouTubeVideoRating = videoRating === targetRating ? 'none' : targetRating;
      const previousRating = videoRating;

      await rateVideo(videoId, nextRating, token);
      setVideoRating(nextRating);

      setLiveLikeCount((prev) => {
        if (previousRating === 'like' && nextRating !== 'like') {
          return Math.max(0, prev - 1);
        }
        if (previousRating !== 'like' && nextRating === 'like') {
          return prev + 1;
        }
        return prev;
      });

      if (nextRating === 'like') {
        setActionMessage('Like terkirim ke YouTube.');
      } else if (nextRating === 'dislike') {
        setActionMessage('Dislike terkirim ke YouTube.');
      } else {
        setActionMessage('Rating YouTube dihapus.');
      }
    } catch (error) {
      setActionError(getErrorMessage(error, 'Gagal mengirim rating ke YouTube.'));
      window.open(watchUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsLoadingAction(null);
    }
  };

  const handleShare = async () => {
    clearActionFeedback();
    setIsSharing(true);

    const shareText = `${mainStreamTitle}
${watchUrl}

Data live saat ini:
- Menonton sekarang: ${formatCount(liveNowViewers)}
- Total likes: ${formatCount(liveLikeCount)}
- Total subscribers channel: ${formatCount(channelDetails?.statistics.subscriberCount)}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: mainStreamTitle,
          text: shareText,
          url: watchUrl,
        });
        setActionMessage('Live stream berhasil dibagikan.');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setActionMessage('Data dan link live disalin ke clipboard.');
      } else {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `${mainStreamTitle} ${watchUrl}`
          )}`,
          '_blank',
          'noopener,noreferrer'
        );
        setActionMessage('Membuka halaman share di browser.');
      }
    } catch (error) {
      if ((error as { name?: string }).name === 'AbortError') {
        setActionMessage('Berbagi dibatalkan.');
      } else {
        setActionError(getErrorMessage(error, 'Gagal membagikan live stream.'));
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <LoginModal
        isOpen={isBlocked}
        onClose={() => router.push('/')}
        message="Anda wajib login untuk mengakses siaran langsung dan berpartisipasi dalam live."
      />

      {isBlocked && <div className="absolute inset-0 z-40 bg-background/80 backdrop-blur-md" />}

      <div
        className={`bg-black/95 text-white transition-opacity duration-500 ${!canAccessLive ? 'opacity-20 pointer-events-none' : 'opacity-100'
          }`}
      >
        <div className="container mx-auto px-4 py-6 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            <div className="lg:col-span-8 flex flex-col">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl group">
                <iframe
                  className="w-full h-full"
                  src={canAccessLive ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1` : 'about:blank'}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <div className="mt-6">
                <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2 leading-tight">
                  {mainStreamTitle}
                </h1>

                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-accent">
                      <Image src={mainStreamAvatar} alt={mainStreamer} fill className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{mainStreamer}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        {mainStreamSubscribers}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSubscribeToggle}
                      disabled={isLoadingAction === 'subscribe'}
                      className={`ml-2 text-xs font-bold px-4 py-1.5 rounded-full transition-colors disabled:opacity-60 ${isSubscribed
                        ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                        : 'bg-white text-black hover:bg-gray-200'
                        }`}
                    >
                      {isLoadingAction === 'subscribe' ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Memproses...
                        </span>
                      ) : isSubscribed ? (
                        'Subscribed'
                      ) : (
                        'Subscribe'
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium">
                      <Eye className="w-4 h-4" />
                      {formatCount(liveNowViewers)} menonton sekarang
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRateVideo('like')}
                      disabled={isLoadingAction === 'like'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-60 ${videoRating === 'like'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 hover:bg-white/20'
                        }`}
                    >
                      {isLoadingAction === 'like' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="w-4 h-4" />
                      )}
                      {formatCount(liveLikeCount)}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRateVideo('dislike')}
                      disabled={isLoadingAction === 'dislike'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-60 ${videoRating === 'dislike'
                        ? 'bg-red-500 text-white'
                        : 'bg-white/10 hover:bg-white/20'
                        }`}
                    >
                      {isLoadingAction === 'dislike' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ThumbsDown className="w-4 h-4" />
                      )}
                      Dislike
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={isSharing}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-60"
                    >
                      {isSharing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                      Share
                    </button>

                    <a
                      href={watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      YouTube
                    </a>

                    <button
                      type="button"
                      onClick={handleManualRefresh}
                      disabled={isLoadingAction !== null}
                      title="Perbarui data dari YouTube"
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <RefreshCcw className={`w-4 h-4 ${isLoadingAction === 'like' ? 'animate-spin' : ''}`} />
                      Refresh Data
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-400 flex flex-wrap gap-3">
                  <span>Total tayangan: {formatCount(liveViewCount)}</span>
                  <span>Total subscribers channel: {formatCount(channelDetails?.statistics.subscriberCount)}</span>
                </div>

                {(actionMessage || actionError || dataError) && (
                  <div className="mt-4 space-y-2">
                    {actionMessage && (
                      <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                        {actionMessage}
                      </p>
                    )}
                    {actionError && (
                      <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {actionError}
                      </p>
                    )}
                    {dataError && (
                      <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                        {dataError}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6 bg-white/5 rounded-xl p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                  <p>{mainStreamDescription}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 h-[600px] lg:h-[760px] flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-accent" /> Live Chat YouTube
                </h3>
                <span className="text-xs text-gray-500">Realtime</span>
              </div>

              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
              >
                {chatStatus === 'loading' && chatMessages.length === 0 && (
                  <p className="text-sm text-gray-400">Memuat live chat real-time...</p>
                )}

                {chatStatus === 'unavailable' && (
                  <p className="text-sm text-gray-400">
                    Live chat tidak tersedia untuk siaran ini (stream mungkin belum aktif).
                  </p>
                )}

                {chatStatus === 'error' && (
                  <p className="text-sm text-red-300">
                    Gagal memuat live chat YouTube. Sistem akan mencoba lagi otomatis.
                  </p>
                )}

                {chatStatus === 'empty' && chatMessages.length === 0 && (
                  <p className="text-sm text-gray-400">Belum ada pesan chat dari YouTube.</p>
                )}

                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2 text-sm mb-2">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                      <Image
                        src={msg.authorDetails.profileImageUrl}
                        alt={msg.authorDetails.displayName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <span
                        className={`font-bold mr-2 ${msg.authorDetails.isChatModerator
                          ? 'text-accent'
                          : msg.authorDetails.isChatOwner
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                          }`}
                      >
                        {msg.authorDetails.displayName}
                      </span>
                      <span className="text-gray-200">{msg.snippet.displayMessage}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/10 bg-white/5">
                {canAccessLive ? (
                  <a
                    href="#live-comments"
                    className="block w-full text-center bg-accent text-accent-foreground py-2 rounded-full text-sm font-semibold hover:bg-accent/90 transition-colors"
                  >
                    Buka Komentar Komunitas Nulumbung
                  </a>
                ) : (
                  <div className="text-center text-sm text-gray-500 italic">
                    Silakan login untuk berpartisipasi.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold mb-8 flex items-center gap-3">
          <span className="w-1 h-8 bg-accent rounded-full" />
          Siaran Lainnya
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherStreams.map((stream) => (
            <div
              key={stream.id}
              className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="relative aspect-video bg-gray-900">
                <Image
                  src={stream.thumbnail_url || `https://img.youtube.com/vi/${stream.youtube_id}/hqdefault.jpg`}
                  alt={stream.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />

                {stream.status === 'live' || stream.is_active ? (
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                  </div>
                ) : (
                  <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{' '}
                    {stream.scheduled_start_time
                      ? new Date(stream.scheduled_start_time).toLocaleDateString('id-ID')
                      : 'Terjadwal'}
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex gap-3 items-start">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border shrink-0">
                    <Image
                      src={`https://img.youtube.com/vi/${stream.youtube_id}/default.jpg`}
                      alt={stream.channel_name || stream.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground line-clamp-2 leading-snug mb-1 group-hover:text-accent transition-colors">
                      {stream.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">{stream.channel_name || 'Channel'}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {stream.status === 'live' || stream.is_active ? (
                        <span className="text-red-500 font-bold">
                          {Number(stream.view_count || 0).toLocaleString('id-ID')} menonton
                        </span>
                      ) : (
                        <span className="text-accent font-bold">Segera Tayang</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="live-comments" className="container mx-auto px-4 pb-4">
        <CommentSection
          contentType="live-stream"
          target={activeStreamId ?? 'active'}
          variant="light"
          title="Komentar Live Nulumbung"
          placeholder="Tulis komentar saat live berlangsung..."
          emptyMessage="Belum ada komentar live. Mulai diskusi sekarang."
        />
      </div>
    </div>
  );
}
