'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/use-auth';
import { UserRole } from '../types';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === UserRole.ADMIN) {
        router.push('/admission/dashboard');
      } else {
        router.push('/parent/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
      }}>
        <div className="spinner" style={{ width: '32px', height: '32px' }} />
      </div>
    );
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at top, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 1) 70%)',
    }}>
      <div className="glass-card" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '36px',
        textAlign: 'center',
      }}>
        <h1 className="gradient-text" style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>
          School Admission Management System
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>
          Streamlined student application lifecycle, fee payments, entrance exam slot booking, and grade assignments.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/login" className="gradient-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Log In
          </Link>
          <Link href="/register" style={{
            display: 'block',
            textAlign: 'center',
            padding: '10px 18px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            background: 'rgba(255, 255, 255, 0.03)',
          }}>
            Register Parent Account
          </Link>
        </div>
      </div>
    </main>
  );
}
