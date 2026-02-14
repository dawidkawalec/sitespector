import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import 'swiper/css';
import 'swiper/css/navigation';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/assets/scss/style.scss';
import { SITE_URL, SITE_NAME, buildOgImageUrl } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/schema';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SiteSpector - Profesjonalne Audyty SEO i Wydajności',
    template: '%s | SiteSpector',
  },
  description: 'Kompleksowa platforma do audytów SEO, analizy wydajności i monitorowania konkurencji z wykorzystaniem AI.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    siteName: SITE_NAME,
    images: [
      {
        url: buildOgImageUrl({
          title: SITE_NAME,
          subtitle: 'Profesjonalne audyty SEO, wydajności i widoczności z AI',
          type: 'page',
        }),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <head>
        <JsonLd data={[buildOrganizationSchema(), buildWebSiteSchema()]} />
      </head>
      <body className={`${outfit.variable}`}>{children}</body>
    </html>
  );
}
