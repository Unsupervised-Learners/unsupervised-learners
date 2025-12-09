// app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Human & Environment Visualization',
  description: 'Final project for ICS 484',
};
 
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header />
        {/* MAIN should expand to push footer down */}
        <main style={{ flex: 1, paddingTop: '64px' }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
