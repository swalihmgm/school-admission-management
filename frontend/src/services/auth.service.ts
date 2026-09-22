import { fetchApi, setAccessToken } from '../lib/api-client';
import { AuthResponse, User } from '../types';

export interface RegisterParentPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export class AuthService {
  static async registerParent(payload: RegisterParentPayload) {
    return fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  }

  static async login(payload: LoginPayload): Promise<AuthResponse> {
    const data = await fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });

    if (data?.accessToken) {
      setAccessToken(data.accessToken);
    }
    return data;
  }

  static async refresh(): Promise<AuthResponse | null> {
    try {
      const data = await fetchApi<AuthResponse>('/auth/refresh', {
        method: 'POST',
        skipAuth: true,
      });
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
      }
      return data;
    } catch {
      setAccessToken(null);
      return null;
    }
  }

  static async logout(): Promise<void> {
    try {
      await fetchApi('/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {
      // Ignore network/backend errors during logout so client state is always cleared
    } finally {
      setAccessToken(null);
    }
  }

  static async getMe(): Promise<{ user: User }> {
    return fetchApi<{ user: User }>('/auth/me', { method: 'GET' });
  }
}
