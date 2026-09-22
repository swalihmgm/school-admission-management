const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

let inMemoryToken: string | null = null;
let refreshTokenPromise: Promise<string | null> | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryToken = token;
};

export const getAccessToken = () => inMemoryToken;

export interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { skipAuth = false, headers = {}, ...restOptions } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (!skipAuth && inMemoryToken) {
    requestHeaders['Authorization'] = `Bearer ${inMemoryToken}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
    credentials: 'include', // Ensures HttpOnly cookies (refreshToken) are sent
  });

  // Handle 401 Unauthorized with token refresh retry
  if (
    response.status === 401 &&
    !skipAuth &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/refresh') &&
    !endpoint.includes('/auth/register') &&
    !endpoint.includes('/auth/logout')
  ) {
    if (!refreshTokenPromise) {
      refreshTokenPromise = refreshAccessToken();
    }

    const newToken = await refreshTokenPromise;
    refreshTokenPromise = null;

    if (newToken) {
      requestHeaders['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
        credentials: 'include',
      });
    }
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (Array.isArray(data?.message)) {
      errorMessage = data.message.join(', ');
    } else if (typeof data?.message === 'string' && data.message.trim()) {
      errorMessage = data.message;
    } else if (response.status === 401) {
      errorMessage = 'Invalid email or password';
    } else if (response.status === 403) {
      errorMessage = 'Access denied: You do not have permission to perform this action.';
    } else if (response.status === 404) {
      errorMessage = 'Requested resource not found.';
    } else if (response.status >= 500) {
      errorMessage = 'Server error. Please try again in a few moments.';
    }

    const errorObj: any = new Error(errorMessage);
    errorObj.status = response.status;
    errorObj.data = data;
    errorObj.response = {
      status: response.status,
      data,
    };
    throw errorObj;
  }

  return data as T;
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { method: 'GET', ...options }),

  post: <T = any>(endpoint: string, body?: any, options?: FetchOptions) =>
    fetchApi<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: FetchOptions) =>
    fetchApi<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T = any>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { method: 'DELETE', ...options }),
};

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      setAccessToken(null);
      return null;
    }

    const data = await res.json();
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch {
    setAccessToken(null);
    return null;
  }
}

