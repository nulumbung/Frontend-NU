import { AxiosInstance } from 'axios';

export interface LiveStream {
  id: number;
  title: string | null;
  description?: string | null;
  youtube_id: string;
  youtube_url?: string;
  embed_url?: string;
  channel_name: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  status: string | null;
  view_count?: number | null;
  scheduled_start_time?: string | null;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  from?: number;
  to?: number;
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface LiveStreamResponse {
  data: LiveStream | LiveStream[];
  message?: string;
}

/**
 * Live Stream Service - Handles all API calls for live stream management
 */
export const createLiveStreamService = (api: AxiosInstance) => ({
  /**
   * Fetch all live streams (admin use) - handles pagination
   */
  async getAll(page = 1): Promise<{ streams: LiveStream[]; total: number; lastPage: number }> {
    try {
      const response = await api.get<PaginatedResponse<LiveStream>>('/live-streams', {
        params: { page },
      });

      // Handle paginated response from Laravel
      const data = response.data;
      return {
        streams: Array.isArray(data.data) ? data.data : [data.data],
        total: data.total || 0,
        lastPage: data.last_page || 1,
      };
    } catch (error) {
      console.error('Failed to fetch live streams:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch live streams'
      );
    }
  },

  /**
   * Fetch the currently active live stream
   */
  async getActive(): Promise<LiveStream | null> {
    try {
      const response = await api.get<LiveStreamResponse>('/live-streams/active');
      const data = response.data;
      
      // Handle both single object and data wrapper
      if (Array.isArray(data.data)) {
        return data.data[0] || null;
      }
      return data.data as LiveStream || null;
    } catch (error) {
      console.warn('No active live stream found:', error);
      return null;
    }
  },

  /**
   * Fetch a single live stream by ID
   */
  async getById(id: number): Promise<LiveStream> {
    try {
      const response = await api.get<LiveStreamResponse>(`/live-streams/${id}`);
      const data = response.data;
      
      if (Array.isArray(data.data)) {
        return data.data[0] as LiveStream;
      }
      return data.data as LiveStream;
    } catch (error) {
      console.error(`Failed to fetch live stream ${id}:`, error);
      throw new Error(
        error instanceof Error ? error.message : `Failed to fetch live stream ${id}`
      );
    }
  },

  /**
   * Create a new live stream
   */
  async create(payload: Partial<LiveStream>): Promise<LiveStream> {
    try {
      const response = await api.post<LiveStreamResponse>('/live-streams', payload);
      const data = response.data;
      
      if (Array.isArray(data.data)) {
        return data.data[0] as LiveStream;
      }
      return data.data as LiveStream;
    } catch (error) {
      console.error('Failed to create live stream:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to create live stream'
      );
    }
  },

  /**
   * Update an existing live stream
   */
  async update(id: number, payload: Partial<LiveStream>): Promise<LiveStream> {
    try {
      const response = await api.put<LiveStreamResponse>(
        `/live-streams/${id}`,
        payload
      );
      const data = response.data;
      
      if (Array.isArray(data.data)) {
        return data.data[0] as LiveStream;
      }
      return data.data as LiveStream;
    } catch (error) {
      console.error(`Failed to update live stream ${id}:`, error);
      throw new Error(
        error instanceof Error
          ? error.message
          : `Failed to update live stream ${id}`
      );
    }
  },

  /**
   * Delete a live stream
   */
  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/live-streams/${id}`);
    } catch (error) {
      console.error(`Failed to delete live stream ${id}:`, error);
      throw new Error(
        error instanceof Error
          ? error.message
          : `Failed to delete live stream ${id}`
      );
    }
  },

  /**
   * Refresh live stream data from YouTube
   */
  async refresh(id: number): Promise<LiveStream> {
    try {
      const response = await api.post<LiveStreamResponse>(
        `/live-streams/${id}/refresh`
      );
      const data = response.data;
      
      if (Array.isArray(data.data)) {
        return data.data[0] as LiveStream;
      }
      return data.data as LiveStream;
    } catch (error) {
      console.error(`Failed to refresh live stream ${id}:`, error);
      throw new Error(
        error instanceof Error
          ? error.message
          : `Failed to refresh data from YouTube`
      );
    }
  },
});

export type LiveStreamService = ReturnType<typeof createLiveStreamService>;
