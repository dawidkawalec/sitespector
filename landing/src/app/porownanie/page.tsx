import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import PorownanieClient from './PorownanieClient';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Porownanie narzedzi SEO 2026 — SiteSpector vs Ahrefs vs SEMrush vs Screaming Frog',
  description:
    'Porownaj 6 narzedzi SEO: SiteSpector, Ahrefs, SEMrush, Screaming Frog, SE Ranking, Mangools. 14 kryteriow, aktualne ceny 2026, tabela funkcji. Od $9.99/mies.',
  keywords: ['porownanie narzedzi SEO', 'SiteSpector vs Ahrefs', 'SiteSpector vs SEMrush', 'Screaming Frog alternatywa', 'narzedzie audytu SEO', 'cena SEO 2026', 'SE Ranking vs Ahrefs'],
  path: '/porownanie',
  ogImageType: 'page',
});

export default function PorownaniePage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageSchema({
            path: '/porownanie',
            title: 'Porownanie narzedzi SEO 2026 — SiteSpector vs Ahrefs vs SEMrush vs Screaming Frog',
            description:
              'Porownaj 6 narzedzi SEO: SiteSpector, Ahrefs, SEMrush, Screaming Frog, SE Ranking, Mangools. 14 kryteriow, aktualne ceny 2026.',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'Porównanie', path: '/porownanie' },
          ]),
        ]}
      />
      <Topbar />
      <main className="pt-5 mt-5">
        <PorownanieClient />
      </main>
      <Footer />
    </>
  );
}
