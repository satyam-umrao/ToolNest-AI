import type { Metadata } from 'next';
import { Sora, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import SplashScreen from '@/components/SplashScreen';
import '@/styles/globals.css';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ToolNest AI - Premium Document & Image Processing',
    template: '%s | ToolNest AI',
  },
  description:
    'Privacy-focused, 100% client-side document and image processing tools. Convert, edit, enhance, and transform your files directly on your device with $0 cost forever.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  icons: {
    icon: '/logo-icon.png',
    shortcut: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
  openGraph: {
    title: 'ToolNest AI',
    description:
      'Privacy-focused, 100% client-side document and image processing tools.',
    url: '/',
    siteName: 'ToolNest AI',
    images: ['/logo-full.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/logo-full.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${sora.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground overflow-x-hidden min-h-screen selection:bg-primary/30 selection:text-white`}
      >
        {/* Animated App Splash Screen */}
        <SplashScreen />

        {/* Background glow layers */}
        <div className="fixed inset-0 -z-30 bg-background pointer-events-none" />
        <div className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_40%)] pointer-events-none" />
        <div className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_80%_70%,rgba(236,72,153,0.07),transparent_45%)] pointer-events-none" />

        {/* Sidebar & Mobile Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="relative lg:pl-72 transition-[padding] duration-300 min-h-screen flex flex-col">
          <main className="flex-1 w-full px-3.5 py-4 sm:px-6 lg:px-10 pt-20 lg:pt-8 pb-12 max-w-7xl mx-auto">
            {children}
          </main>
        </div>

        {/* Toasts */}
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              'rounded-2xl border border-white/10 bg-black/85 backdrop-blur-2xl shadow-2xl text-xs sm:text-sm font-medium',
            style: {
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
