'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '../types';
import { AuthService, LoginPayload, RegisterParentPayload } from '../services/auth.service';
import { setAccessToken } from '../lib/api-client';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterParentPayload) => Promise<any>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      // First try refreshing the session using the HttpOnly cookie
      const refreshRes = await AuthService.refresh();
      if (refreshRes && refreshRes.accessToken) {
        setAccessTokenState(refreshRes.accessToken);
        setUser(refreshRes.user);
      } else {
        setUser(null);
        setAccessTokenState(null);
      }
    } catch {
      setUser(null);
      setAccessTokenState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await AuthService.login(payload);
    setUser(res.user);
    setAccessTokenState(res.accessToken);
    return res;
  };

  const register = async (payload: RegisterParentPayload): Promise<any> => {
    return AuthService.registerParent(payload);
  };

  const logout = useCallback(async (): Promise<void> => {
    setUser(null);
    setAccessTokenState(null);
    setAccessToken(null);
    try {
      await Promise.race([
        AuthService.logout(),
        new Promise((resolve) => setTimeout(resolve, 300)),
      ]);
    } catch {
      // Ignore network errors
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
