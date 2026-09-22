'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  Squares2X2Icon,
  AcademicCapIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export function ParentSidebarLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Desktop sidebar collapsed state
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Mobile drawer open state
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Logout in-progress state
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Handle Escape key press to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  // Handle Logout action
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // Ignore error
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/parent/dashboard',
      icon: Squares2X2Icon,
    },
    {
      name: 'Students',
      href: '/parent/students',
      icon: AcademicCapIcon,
    },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/parent/students') {
      return (
        pathname === '/parent/students' ||
        pathname === '/parent/students/new' ||
        (pathname.startsWith('/parent/students/') && pathname !== '/parent/students/new')
      );
    }
    return pathname === href || (href !== '/parent/dashboard' && pathname.startsWith(href));
  };

  // Get current page title for top mobile header bar
  const currentNavItem = navItems.find((item) => isActiveLink(item.href)) || {
    name: 'Parent Portal',
  };

  if (!user) return <>{children}</>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Mobile Bar (< 768px) */}
      <div
        style={{
          display: 'none',
          padding: '12px 16px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
        className="mobile-top-bar"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setIsMobileOpen(true)}
            className="btn"
            style={{
              padding: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              borderRadius: '8px',
            }}
            aria-label="Open Navigation Drawer"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div>
            <div className="gradient-text" style={{ fontWeight: 700, fontSize: '15px' }}>
              School Admission System
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{currentNavItem.name}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="btn"
          style={{
            padding: '7px 9px',
            fontSize: '11.5px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Logout"
          aria-label="Logout"
        >
          {isLoggingOut ? (
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Layout Container (Sidebar + Page Content) */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Desktop Collapsible Sidebar (>= 768px) */}
        <aside
          style={{
            width: isCollapsed ? '72px' : '240px',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            top: 0,
            height: '100vh',
            zIndex: 30,
            flexShrink: 0,
            overflowY: 'auto',
          }}
          className="desktop-sidebar"
        >
          {/* Brand Header */}
          <div
            style={{
              padding: isCollapsed ? '16px 12px' : '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {!isCollapsed && (
              <div>
                <span className="gradient-text" style={{ fontWeight: 800, fontSize: '16.5px', letterSpacing: '-0.01em' }}>
                  Admission System
                </span>
                <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', marginTop: '1px' }}>
                  Parent Portal
                </div>
              </div>
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="btn"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              style={{
                padding: '5px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {isCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item) => {
              const active = isActiveLink(item.href);
              const IconComp = item.icon;

              return (
                <div key={item.href} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Link
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: isCollapsed ? '10px 0' : '10px 14px',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: active ? 600 : 500,
                      color: active ? '#ffffff' : '#94a3b8',
                      background: active
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)'
                        : 'transparent',
                      border: active
                        ? '1px solid rgba(99, 102, 241, 0.45)'
                        : '1px solid transparent',
                      boxShadow: active ? '0 4px 12px rgba(99, 102, 241, 0.18)' : 'none',
                      transition: 'all 0.15s ease',
                      textDecoration: 'none',
                    }}
                  >
                    <IconComp
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: active ? '#818cf8' : '#64748b' }}
                    />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>

                  {/* Sub-action under Students: Create New Application */}
                  {item.href === '/parent/students' && !isCollapsed && (
                    <Link
                      href="/parent/students/new"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginLeft: '36px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: pathname === '/parent/students/new' ? '#6366f1' : '#94a3b8',
                        background: pathname === '/parent/students/new' ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <PlusIcon className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
                      <span>New Application</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Parent User Footer Section */}
          <div
            style={{
              padding: '14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            {!isCollapsed && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.fullName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span
                    style={{
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#818cf8',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      padding: '2px 7px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    PARENT
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="btn"
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#fca5a5',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
              title={isCollapsed ? 'Logout' : undefined}
            >
              {isLoggingOut ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              )}
              {!isCollapsed && <span>{isLoggingOut ? 'Logging Out...' : 'Logout'}</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Slide-Over Drawer (< 768px) */}
        {isMobileOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
            }}
            onClick={() => setIsMobileOpen(false)}
          >
            <div
              style={{
                width: '260px',
                background: '#0f172a',
                borderRight: '1px solid rgba(255, 255, 255, 0.15)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div>
                  <span className="gradient-text" style={{ fontWeight: 800, fontSize: '17px' }}>
                    Admission Portal
                  </span>
                  <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600 }}>
                    Parent Menu
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="btn"
                  style={{
                    padding: '5px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    borderRadius: '50%',
                  }}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {navItems.map((item) => {
                  const active = isActiveLink(item.href);
                  const IconComp = item.icon;

                  return (
                    <div key={item.href} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '11px 16px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: active ? 600 : 500,
                          color: active ? '#ffffff' : '#94a3b8',
                          background: active
                            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)'
                            : 'transparent',
                          border: active
                            ? '1px solid rgba(99, 102, 241, 0.45)'
                            : '1px solid transparent',
                          textDecoration: 'none',
                        }}
                      >
                        <IconComp
                          className="w-5 h-5"
                          style={{ color: active ? '#818cf8' : '#64748b' }}
                        />
                        <span>{item.name}</span>
                      </Link>

                      {item.href === '/parent/students' && (
                        <Link
                          href="/parent/students/new"
                          onClick={() => setIsMobileOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginLeft: '40px',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: pathname === '/parent/students/new' ? '#6366f1' : '#94a3b8',
                            background: pathname === '/parent/students/new' ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                            textDecoration: 'none',
                          }}
                        >
                          <PlusIcon className="w-4 h-4" style={{ color: '#818cf8' }} />
                          <span>New Application</span>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </nav>

              <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 0, 0, 0.3)' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                  {user.fullName}
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '12.5px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {isLoggingOut ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  )}
                  <span>{isLoggingOut ? 'Logging Out...' : 'Logout'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Page Content Viewport */}
        <main
          className="main-content-viewport"
          style={{
            flex: 1,
            padding: '24px',
            maxWidth: '1400px',
            width: '100%',
            minWidth: 0,
            marginLeft: isCollapsed ? '72px' : '240px',
            transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {children}
        </main>
      </div>

      {/* Logout Overlay Feedback UX */}
      {isLoggingOut && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
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
              Clearing session & redirecting safely to login...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
