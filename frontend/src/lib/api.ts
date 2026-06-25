const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  token?: string;
  skipAuth?: boolean;
}

type AuthInterceptor = (error: Error, statusCode?: number) => Promise<boolean> | boolean;
type TokenRefreshFn = () => Promise<{ accessToken: string; refreshToken: string }>;

class ApiClient {
  private baseUrl: string;
  private authInterceptor: AuthInterceptor | null = null;
  private tokenRefreshFn: TokenRefreshFn | null = null;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAuthInterceptor(interceptor: AuthInterceptor) {
    this.authInterceptor = interceptor;
  }

  setTokenRefreshFn(fn: TokenRefreshFn) {
    this.tokenRefreshFn = fn;
  }

  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private async refreshAccessToken(): Promise<string> {
    if (!this.tokenRefreshFn) {
      throw new Error('No token refresh function available');
    }

    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.subscribeTokenRefresh((token) => resolve(token));
      });
    }

    this.isRefreshing = true;
    try {
      const { accessToken } = await this.tokenRefreshFn();
      this.onTokenRefreshed(accessToken);
      return accessToken;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, skipAuth, ...fetchOptions } = options;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    if (token && !skipAuth) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const statusCode = response.status;
      
      // Handle 401 Unauthorized with token refresh
      if (statusCode === 401 && !skipAuth && token && this.tokenRefreshFn) {
        try {
          const newToken = await this.refreshAccessToken();
          // Retry the original request with new token
          headers.Authorization = `Bearer ${newToken}`;
          const retryResponse = await fetch(`${this.baseUrl}/api${endpoint}`, {
            ...fetchOptions,
            headers,
            credentials: 'include',
          });

          if (!retryResponse.ok) {
            const error = await retryResponse.json().catch(() => ({ message: 'Request failed after refresh' }));
            throw new Error(error.message || `HTTP ${retryResponse.status}`);
          }

          return retryResponse.json();
        } catch (refreshError) {
          // Refresh failed, trigger logout via auth interceptor
          if (this.authInterceptor) {
            const shouldLogout = await this.authInterceptor(
              new Error('Token refresh failed'),
              statusCode
            );
            if (shouldLogout) {
              throw new Error('SESSION_EXPIRED');
            }
          }
          throw refreshError;
        }
      }

      // Handle 401 without refresh capability or skipAuth
      if (statusCode === 401 && this.authInterceptor) {
        const error = await response.json().catch(() => ({ message: 'Unauthorized' }));
        const shouldLogout = await this.authInterceptor(
          new Error(error.message || 'Unauthorized'),
          statusCode
        );
        
        if (shouldLogout) {
          throw new Error('SESSION_EXPIRED');
        }
      }

      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${statusCode}`);
    }

    return response.json();
  }

  get<T>(endpoint: string, options?: FetchOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown, options?: FetchOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown, options?: FetchOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: FetchOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  patch<T>(endpoint: string, data?: unknown, options?: FetchOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const api = new ApiClient(API_URL);
