import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import 'swiper/css';
import 'swiper/css/navigation';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/assets/scss/style.scss';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SiteSpector - Profesjonalne Audyty SEO i Wydajności',
  description: 'Kompleksowa platforma do audytów SEO, analizy wydajności i monitorowania konkurencji z wykorzystaniem AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${outfit.variable}`}>{children}</body>
    </html>
  );
}
