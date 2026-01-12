import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Worldwide Football - Tournament Management Platform',
    template: '%s | Worldwide Football',
  },
  description: 'The ultimate platform for organizing and participating in youth football tournaments across Europe.',
  keywords: ['football', 'tournament', 'youth football', 'soccer', 'competition', 'sports management'],
  authors: [{ name: 'Worldwide Football' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://football-eu.com',
    siteName: 'Worldwide Football',
    title: 'Worldwide Football - Tournament Management Platform',
    description: 'The ultimate platform for organizing and participating in youth football tournaments worldwide.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Worldwide Football - Tournament Management Platform',
    description: 'The ultimate platform for organizing and participating in youth football tournaments worldwide.',
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
  // Script to prevent flash of incorrect theme
  const themeScript = `
    (function() {
      try {
        const stored = localStorage.getItem('ui-storage');
        if (stored) {
          const { state } = JSON.parse(stored);
          const theme = state?.theme || 'system';
          const root = document.documentElement;
          
          if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
          } else {
            root.classList.add(theme);
          }
        }
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
