
// This is a client-side library to interact with YouTube Data API
// In a production environment, you should proxy these requests through your backend
// to protect your API key.

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

type FetchOptions = RequestInit & {
  accessToken?: string;
  requireApiKey?: boolean;
};

async function youtubeFetch<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
  const { accessToken, requireApiKey = true, ...rest } = options;

  let requestUrl = url;
  if (requireApiKey) {
    if (!API_KEY) {
      throw new Error('YouTube API Key is missing');
    }

    requestUrl += requestUrl.includes('?')
      ? `&key=${API_KEY}`
      : `?key=${API_KEY}`;
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (rest.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(requestUrl, {
    ...rest,
    headers: {
      ...headers,
      ...(rest.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    const rawError = await response.text();
    let message = rawError || `YouTube API request failed (${response.status})`;

    try {
      const parsed = JSON.parse(rawError);
      message = parsed?.error?.message || message;
    } catch {
      // Keep raw message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export interface YouTubeVideoDetails {
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  thumbnail: string;
  liveBroadcastContent: string;
  activeLiveChatId?: string;
  concurrentViewers?: string;
  actualStartTime?: string;
  scheduledStartTime?: string;
  channel_name?: string;
  youtube_id?: string;
  view_count?: string | number;
}

export interface YouTubeChannelDetails {
  title: string;
  description: string;
  customUrl: string;
  publishedAt: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
}

export interface YouTubeChatMessage {
  id: string;
  authorDetails: {
    channelId: string;
    channelUrl: string;
    displayName: string;
    profileImageUrl: string;
    isVerified: boolean;
    isChatOwner: boolean;
    isChatSponsor: boolean;
    isChatModerator: boolean;
  };
  snippet: {
    type: string;
    hasDisplayContent: boolean;
    displayMessage: string;
    publishedAt: string;
  };
}

export type YouTubeVideoRating = 'like' | 'dislike' | 'none';

export async function getVideoDetails(videoId: string): Promise<YouTubeVideoDetails | null> {
  try {
    const data = await youtubeFetch<{
      items?: Array<{
        snippet: {
          title: string;
          description: string;
          channelTitle: string;
          channelId: string;
          publishedAt: string;
          thumbnails: {
            maxres?: { url: string };
            high?: { url: string };
            medium?: { url: string };
          };
          liveBroadcastContent: string;
        };
        statistics: {
          viewCount?: string;
          likeCount?: string;
        };
        liveStreamingDetails?: {
          activeLiveChatId?: string;
          concurrentViewers?: string;
          actualStartTime?: string;
          scheduledStartTime?: string;
        };
      }>;
    }>(`${BASE_URL}/videos?part=snippet,statistics,liveStreamingDetails&id=${videoId}`);

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const item = data.items[0];
    return {
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      viewCount: item.statistics.viewCount || '0',
      likeCount: item.statistics.likeCount || '0',
      thumbnail:
        item.snippet.thumbnails.maxres?.url ||
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        '',
      liveBroadcastContent: item.snippet.liveBroadcastContent,
      activeLiveChatId: item.liveStreamingDetails?.activeLiveChatId,
      concurrentViewers: item.liveStreamingDetails?.concurrentViewers,
      actualStartTime: item.liveStreamingDetails?.actualStartTime,
      scheduledStartTime: item.liveStreamingDetails?.scheduledStartTime,
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
}

export async function getChannelDetails(channelId: string): Promise<YouTubeChannelDetails | null> {
  try {
    const data = await youtubeFetch<{
      items?: Array<{
        snippet: {
          title: string;
          description: string;
          customUrl: string;
          publishedAt: string;
          thumbnails: YouTubeChannelDetails['thumbnails'];
        };
        statistics: YouTubeChannelDetails['statistics'];
      }>;
    }>(`${BASE_URL}/channels?part=snippet,statistics&id=${channelId}`);

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const item = data.items[0];
    return {
      title: item.snippet.title,
      description: item.snippet.description,
      customUrl: item.snippet.customUrl || '',
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails,
      statistics: item.statistics,
    };
  } catch (error) {
    console.error('Error fetching channel details:', error);
    return null;
  }
}

export async function getLiveChatMessages(liveChatId: string, pageToken?: string): Promise<{ messages: YouTubeChatMessage[], nextPageToken: string, pollingIntervalMillis: number } | null> {
  try {
    let url = `${BASE_URL}/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const data = await youtubeFetch<{
      items?: YouTubeChatMessage[];
      nextPageToken: string;
      pollingIntervalMillis: number;
    }>(url);

    if (!data.items) {
      return null;
    }

    return {
      messages: data.items,
      nextPageToken: data.nextPageToken,
      pollingIntervalMillis: data.pollingIntervalMillis,
    };
  } catch (error) {
    console.error('Error fetching live chat messages:', error);
    return null;
  }
}

export async function getMyVideoRating(videoId: string, accessToken: string): Promise<YouTubeVideoRating> {
  const data = await youtubeFetch<{
    items?: Array<{ rating?: YouTubeVideoRating }>;
  }>(`${BASE_URL}/videos/getRating?id=${videoId}`, {
    accessToken,
    requireApiKey: false,
  });

  const rating = data.items?.[0]?.rating;
  if (rating === 'like' || rating === 'dislike') {
    return rating;
  }

  return 'none';
}

export async function rateVideo(
  videoId: string,
  rating: YouTubeVideoRating,
  accessToken: string
): Promise<void> {
  await youtubeFetch(`${BASE_URL}/videos/rate?id=${videoId}&rating=${rating}`, {
    method: 'POST',
    accessToken,
    requireApiKey: false,
  });
}

export async function getMySubscription(channelId: string, accessToken: string): Promise<{ isSubscribed: boolean; subscriptionId: string | null }> {
  const data = await youtubeFetch<{
    items?: Array<{ id: string }>;
  }>(
    `${BASE_URL}/subscriptions?part=id&forChannelId=${channelId}&mine=true&maxResults=1`,
    {
      accessToken,
      requireApiKey: false,
    }
  );

  const subscriptionId = data.items?.[0]?.id ?? null;
  return {
    isSubscribed: Boolean(subscriptionId),
    subscriptionId,
  };
}

export async function subscribeToChannel(channelId: string, accessToken: string): Promise<string | null> {
  const data = await youtubeFetch<{ id?: string }>(
    `${BASE_URL}/subscriptions?part=snippet`,
    {
      method: 'POST',
      accessToken,
      requireApiKey: false,
      body: JSON.stringify({
        snippet: {
          resourceId: {
            kind: 'youtube#channel',
            channelId,
          },
        },
      }),
    }
  );

  return data?.id ?? null;
}

export async function unsubscribeFromChannel(subscriptionId: string, accessToken: string): Promise<void> {
  await youtubeFetch(`${BASE_URL}/subscriptions?id=${subscriptionId}`, {
    method: 'DELETE',
    accessToken,
    requireApiKey: false,
  });
}
