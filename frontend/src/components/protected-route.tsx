'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/use-auth';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === UserRole.PARENT) {
          router.push('/parent/dashboard');
        } else if (user.role === UserRole.ADMIN) {
          router.push('/admission/dashboard');
        }
      }
    }
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        backgroundColor: 'var(--bg-primary)',
      }}>
        <div className="spinner" style={{ width: '32px', height: '32px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading session...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
