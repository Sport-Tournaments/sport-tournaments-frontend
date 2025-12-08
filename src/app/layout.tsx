import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Football EU - Tournament Management Platform',
    template: '%s | Football EU',
  },
  description: 'The ultimate platform for organizing and participating in youth football tournaments across Europe.',
  keywords: ['football', 'tournament', 'youth football', 'soccer', 'competition', 'sports management'],
  authors: [{ name: 'Football EU' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://football-eu.com',
    siteName: 'Football EU',
    title: 'Football EU - Tournament Management Platform',
    description: 'The ultimate platform for organizing and participating in youth football tournaments across Europe.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Football EU - Tournament Management Platform',
    description: 'The ultimate platform for organizing and participating in youth football tournaments across Europe.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
