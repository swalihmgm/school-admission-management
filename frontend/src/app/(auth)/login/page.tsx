'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/use-auth';
import { UserRole } from '../../../types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login({ email, password });
      if (res.user.role === UserRole.ADMIN) {
        router.push('/admission/dashboard');
      } else {
        router.push('/parent/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at top, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 1) 70%)',
    }}>
      <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '32px' }}>
        <h2 className="gradient-text" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px', textAlign: 'center' }}>
          Welcome Back
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
          Log in to your account
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="gradient-btn"
            style={{ marginTop: '8px', padding: '12px' }}
          >
            {isSubmitting ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '20px' }}>
          Don&apos;t have a parent account?{' '}
          <Link href="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            Register here
          </Link>
        </p>
      </div>
    </main>
  );
}
