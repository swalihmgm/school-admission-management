'use client';

import React from 'react';
import { AdminSidebarLayout } from '@/components/admin-sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminSidebarLayout>{children}</AdminSidebarLayout>;
}
