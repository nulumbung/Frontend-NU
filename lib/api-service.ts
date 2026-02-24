import axios, { AxiosError, AxiosInstance } from 'axios';

interface ApiError {
  message: string;
  status: number;
  data?: unknown;
}

export class ApiService {
  private api: AxiosInstance;
  private retryCount: number = 3;
  private retryDelay: number = 1000;

  constructor(baseURL: string = '/api') {
    this.api = axios.create({
      baseURL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  private handleError(error: AxiosError): Promise<AxiosError> {
    const status = error.response?.status;
    const data = error.response?.data;

    // Log the error
    console.error('[API Error]', {
      status,
      message: error.message,
      data,
      url: error.config?.url,
    });

    // Network error (no response)
    if (!error.response) {
      console.error('[Network Error]', error.message);
    }

    // 401 Unauthorized - redirect to login
    if (status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_session');
        window.location.href = '/admin/login';
      }
    }

    // 403 Forbidden - user doesn't have permission
    if (status === 403) {
      console.error('[Permission Denied] User does not have permission for this action');
    }

    // 500+ Server errors
    if (status && status >= 500) {
      console.error('[Server Error] The server encountered an error');
    }

    return Promise.reject(error);
  }

  // Add auth token to requests
  setAuthToken(token: string | null) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  // Generic retry logic
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = this.retryCount
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const delay = this.retryDelay * Math.pow(2, i); // Exponential backoff

        // Don't retry on client errors (4xx)
        if (
          error instanceof AxiosError &&
          error.response?.status &&
          error.response.status >= 400 &&
          error.response.status < 500
        ) {
          throw error;
        }

        if (i < maxRetries - 1) {
          console.warn(`[Retry ${i + 1}/${maxRetries - 1}] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  // GET request with retry
  async get<T>(url: string, config = {}) {
    return this.retryWithBackoff(() => this.api.get<T>(url, config));
  }

  // POST request with retry
  async post<T>(url: string, data?: unknown, config = {}) {
    return this.retryWithBackoff(() => this.api.post<T>(url, data, config));
  }

  // PUT request with retry
  async put<T>(url: string, data?: unknown, config = {}) {
    return this.retryWithBackoff(() => this.api.put<T>(url, data, config));
  }

  // PATCH request with retry
  async patch<T>(url: string, data?: unknown, config = {}) {
    return this.retryWithBackoff(() => this.api.patch<T>(url, data, config));
  }

  // DELETE request with retry
  async delete<T>(url: string, config = {}) {
    return this.retryWithBackoff(() => this.api.delete<T>(url, config));
  }

  // Get raw axios instance for advanced use cases
  getAxiosInstance() {
    return this.api;
  }
}

// Export singleton instance
export const createApiService = (baseURL?: string) => new ApiService(baseURL);
