import type { Metadata } from 'next';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import KontaktClient from './KontaktClient';

export const metadata: Metadata = {
  title: 'Kontakt — SiteSpector | Skontaktuj się z nami',
  description:
    'Skontaktuj się z zespołem SiteSpector. Odpowiadamy w 24 godziny. Warszawa, Polska. Pomoc techniczna, sprzedaż, wsparcie.',
  keywords: ['kontakt SiteSpector', 'wsparcie SEO', 'audyt strony', 'pytania SiteSpector'],
};

export default function KontaktPage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <KontaktClient />
      </main>
      <Footer />
    </>
  );
}
