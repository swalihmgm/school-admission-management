'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../hooks/use-auth';
import { UserRole } from '../types';
import { ArrowRightOnRectangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // Safety catch
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  if (!user) return null;

  const isActiveLink = (href: string) => {
    if (href === '/parent/students') {
      return (
        pathname === '/parent/students' ||
        (pathname.startsWith('/parent/students/') && pathname !== '/parent/students/new')
      );
    }
    return pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
  };

  const getLinkStyle = (href: string) => {
    const active = isActiveLink(href);
    return {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '6px 14px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: active ? 600 : 500,
      color: active ? '#ffffff' : '#94a3b8',
      background: active ? 'rgba(99, 102, 241, 0.22)' : 'transparent',
      border: active ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid transparent',
      boxShadow: active ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none',
      transition: 'all 0.15s ease',
      textDecoration: 'none',
      lineHeight: '1.2',
    };
  };

  return (
    <>
      <nav
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link
            href={user.role === UserRole.ADMIN ? '/admission/dashboard' : '/parent/dashboard'}
            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <span className="gradient-text" style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.01em' }}>
              School Admission System
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {user.role === UserRole.PARENT && (
              <>
                <Link href="/parent/dashboard" style={getLinkStyle('/parent/dashboard')}>
                  Dashboard
                </Link>
                <Link href="/parent/students" style={getLinkStyle('/parent/students')}>
                  My Applications
                </Link>
                <Link href="/parent/students/new" style={getLinkStyle('/parent/students/new')}>
                  New Application
                </Link>
              </>
            )}
            {user.role === UserRole.ADMIN && (
              <>
                <Link href="/admission/dashboard" style={getLinkStyle('/admission/dashboard')}>
                  Admission Dashboard
                </Link>
                <Link href="/admission/applications" style={getLinkStyle('/admission/applications')}>
                  Manage Applications
                </Link>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px' }}>{user.fullName}</span>
            <span
              style={{
                background: user.role === UserRole.ADMIN ? 'rgba(139, 92, 246, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                color: user.role === UserRole.ADMIN ? '#c084fc' : '#818cf8',
                border: `1px solid ${
                  user.role === UserRole.ADMIN ? 'rgba(139, 92, 246, 0.4)' : 'rgba(99, 102, 241, 0.4)'
                }`,
                padding: '3px 9px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                lineHeight: '1.2',
              }}
            >
              {user.role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="btn"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#fca5a5',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '34px',
            }}
          >
            {isLoggingOut ? (
              <>
                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                Logging Out...
              </>
            ) : (
              <>
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Logout
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Logout Glass Overlay Feedback UX */}
      {isLoggingOut && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: '32px 40px',
              textAlign: 'center',
              maxWidth: '400px',
              background: '#0f172a',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 16px auto',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowPathIcon className="w-6 h-6 animate-spin" style={{ color: '#818cf8' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
              Signing Out
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
              Clearing session & redirecting safely to the login page...
            </p>
          </div>
        </div>
      )}
    </>
  );
}


