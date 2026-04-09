import '@/styles/globals.css';
import { RootProvider } from '@/components/providers/RootProvider';

export const metadata = {
  title: 'QUIZZ — Викторина в реальном времени',
  description: 'Многопользовательская викторина в реальном времени',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
