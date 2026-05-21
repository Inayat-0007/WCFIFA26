import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from 'react-hot-toast';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'World Cup Fantasy 2026', template: '%s | World Cup Fantasy 2026' },
  description: 'Dream11-style fantasy football for FIFA World Cup 2026. Build your team, join private leagues, and compete with friends!',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WCF 2026',
  },
  openGraph: {
    title: 'World Cup Fantasy 2026',
    description: 'Build your dream team for FIFA World Cup 2026',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#DC143C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${outfit.className} bg-dark-900 text-white antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#1A1A24',
                    color: '#fff',
                    border: '1px solid rgba(220, 20, 60, 0.3)',
                    borderRadius: '12px',
                    fontFamily: 'Outfit, sans-serif',
                  },
                  success: { iconTheme: { primary: '#FFD700', secondary: '#1A1A24' } },
                  error: { iconTheme: { primary: '#DC143C', secondary: '#fff' } },
                }}
              />
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
