import type { Metadata } from 'next';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import PorownanieClient from './PorownanieClient';

export const metadata: Metadata = {
  title: 'Porównanie narzędzi SEO — SiteSpector vs Screaming Frog vs Ahrefs vs SEMrush',
  description:
    'Porównaj SiteSpector z Screaming Frog, Ahrefs i SEMrush. Execution Plan, AI Overviews, Senuto, 3-fazowy audyt. Od $29/mc — wszystko w jednym narzędziu.',
  keywords: ['porównanie SEO', 'SiteSpector vs Screaming Frog', 'SiteSpector vs Ahrefs', 'narzędzie audytu SEO', 'cena SEO'],
};

export default function PorownaniePage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <PorownanieClient />
      </main>
      <Footer />
    </>
  );
}
