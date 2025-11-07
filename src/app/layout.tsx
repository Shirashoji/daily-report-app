// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthSessionProvider from '@/components/common/AuthSessionProvider';
import Header from '@/components/common/Header';
import { WorkTimeProvider } from '@/contexts/WorkTimeContext';
import type { ReactElement } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Daily Report App',
  description: 'An application to generate daily and meeting reports from GitHub commits.',
};

/**
 * The root layout for the application.
 * It sets up the fonts and wraps the application in necessary providers.
 * @param {object} props - The component's props.
 * @param {React.ReactNode} props.children - The component's children.
 * @returns {React.ReactElement} The root layout.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): ReactElement {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthSessionProvider>
          <WorkTimeProvider>
            <Header />
            <main>{children}</main>
          </WorkTimeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
