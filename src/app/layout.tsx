import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Providers } from './providers';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'tournamente.com - Tournament Management Platform',
    template: '%s | tournamente.com',
  },
  description: 'The ultimate platform for organizing and participating in youth football tournaments across Europe.',
  keywords: ['football', 'tournament', 'youth football', 'soccer', 'competition', 'sports management'],
  authors: [{ name: 'tournamente.com' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tournamente.com',
    siteName: 'tournamente.com',
    title: 'tournamente.com - Tournament Management Platform',
    description: 'The ultimate platform for organizing and participating in youth football tournaments worldwide.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'tournamente.com - Tournament Management Platform',
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
        // Always use light theme, ignore system color scheme
        document.documentElement.classList.add('light');
      } catch (e) {
        // Fallback to light theme on error
        document.documentElement.classList.add('light');
      }
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DFVS7HMLSN"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-DFVS7HMLSN');
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
