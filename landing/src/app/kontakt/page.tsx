import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import KontaktClient from './KontaktClient';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbSchema, buildContactPageSchema, buildWebPageSchema } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Kontakt — SiteSpector | Skontaktuj się z nami',
  description:
    'Skontaktuj się z zespołem SiteSpector. Odpowiadamy w 24 godziny. Warszawa, Polska. Pomoc techniczna, sprzedaż, wsparcie.',
  keywords: ['kontakt SiteSpector', 'wsparcie SEO', 'audyt strony', 'pytania SiteSpector'],
  path: '/kontakt',
  ogImageType: 'page',
});

export default function KontaktPage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageSchema({
            path: '/kontakt',
            title: 'Kontakt — SiteSpector | Skontaktuj się z nami',
            description:
              'Skontaktuj się z zespołem SiteSpector. Odpowiadamy w 24 godziny. Warszawa, Polska. Pomoc techniczna, sprzedaż, wsparcie.',
          }),
          buildContactPageSchema({
            path: '/kontakt',
            title: 'Kontakt — SiteSpector | Skontaktuj się z nami',
            description:
              'Skontaktuj się z zespołem SiteSpector. Odpowiadamy w 24 godziny. Pomoc techniczna, sprzedaż, wsparcie.',
            email: 'kontakt@sitespector.pl',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'Kontakt', path: '/kontakt' },
          ]),
        ]}
      />
      <Topbar />
      <main className="pt-5 mt-5">
        <KontaktClient />
      </main>
      <Footer />
    </>
  );
}
