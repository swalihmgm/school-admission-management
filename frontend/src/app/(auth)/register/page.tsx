'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/use-auth';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        fullName,
        email,
        phone,
        password,
        confirmPassword,
      });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to create parent account');
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
      background: 'radial-gradient(circle at top, rgba(139, 92, 246, 0.15) 0%, rgba(15, 23, 42, 1) 70%)',
    }}>
      <div className="glass-card" style={{ maxWidth: '460px', width: '100%', padding: '32px' }}>
        <h2 className="gradient-text" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px', textAlign: 'center' }}>
          Parent Registration
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
          Create an account to submit student applications
        </p>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Full Name
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="John Parent"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
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
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Phone Number
            </label>
            <input
              type="tel"
              required
              className="input-field"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Confirm Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              className="input-field"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="gradient-btn"
            style={{ marginTop: '8px', padding: '12px' }}
          >
            {isSubmitting ? <span className="spinner" /> : 'Create Parent Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '20px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            Log in here
          </Link>
        </p>
      </div>
    </main>
  );
}
