import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../hooks/use-auth';

export const metadata: Metadata = {
  title: 'School Admission Management System',
  description: 'Manage student applications, fee payments, entrance exam slots, and grade assignments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
