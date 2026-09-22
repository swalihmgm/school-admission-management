'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { ParentSidebarLayout } from '@/components/parent-sidebar';
import { UserRole } from '@/types';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.PARENT]}>
      <ParentSidebarLayout>{children}</ParentSidebarLayout>
    </ProtectedRoute>
  );
}
