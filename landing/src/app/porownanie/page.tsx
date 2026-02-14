import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import PorownanieClient from './PorownanieClient';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Porównanie narzędzi SEO — SiteSpector vs Screaming Frog vs Ahrefs vs SEMrush',
  description:
    'Porównaj SiteSpector z Screaming Frog, Ahrefs i SEMrush. Execution Plan, AI Overviews, Senuto, 3-fazowy audyt. Od $29/mc — wszystko w jednym narzędziu.',
  keywords: ['porównanie SEO', 'SiteSpector vs Screaming Frog', 'SiteSpector vs Ahrefs', 'narzędzie audytu SEO', 'cena SEO'],
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
            title: 'Porównanie narzędzi SEO — SiteSpector vs Screaming Frog vs Ahrefs vs SEMrush',
            description:
              'Porównaj SiteSpector z Screaming Frog, Ahrefs i SEMrush. Execution Plan, AI Overviews, Senuto, 3-fazowy audyt. Od $29/mc — wszystko w jednym narzędziu.',
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
