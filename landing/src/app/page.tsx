import About from '@/component/About';
import Brands from '@/component/Brands';
import Counter from '@/component/Counter';
import Cta from '@/component/Cta';
import Faq from '@/component/Faq';
import Feature from '@/component/Feature';
import Footer from '@/component/layout/Footer/page';
import Topbar from '@/component/layout/Topbar/page';
import Pricing from '@/component/Pricing';
import Services from '@/component/Services';
import Testimonials from '@/component/Testimonials';
import TrustBadges from '@/component/TrustBadges';
import DemoVideo from '@/component/DemoVideo';
import IntegrationsSection from '@/component/IntegrationsSection';
import Hero from './Hero';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { faqData } from '@/component/Faq';
import { buildFAQSchema, buildSoftwareApplicationSchema, buildWebPageSchema } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'SiteSpector — Kompleksowe audyty SEO z AI i planem wykonania',
  description:
    'Audyt SEO, wydajności i widoczności w jednym narzędziu. Screaming Frog + Lighthouse + Senuto + AI. Plan wykonania z kodem, 3 fazy. Oferta wkrótce. Dane w UE.',
  path: '/',
  ogImageType: 'page',
});

const Page = () => {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageSchema({
            path: '/',
            title: 'SiteSpector — Kompleksowe audyty SEO z AI i planem wykonania',
            description:
              'Audyt SEO, wydajności i widoczności w jednym narzędziu. Screaming Frog + Lighthouse + Senuto + AI. Plan wykonania z kodem, 3 fazy. Oferta wkrótce. Dane w UE.',
          }),
          buildSoftwareApplicationSchema({
            path: '/',
            description:
              'Platforma do audytów SEO, wydajności i widoczności z wykorzystaniem AI, z Execution Planem i raportami PDF.',
          }),
          buildFAQSchema(faqData.map((f) => ({ question: f.question, answer: f.answer }))),
        ]}
      />
      <Topbar />
      <Hero />
      <DemoVideo />
      <Brands />
      <About />
      <Feature />
      <IntegrationsSection />
      <Services />
      <Counter />
      <TrustBadges />
      <Pricing />
      <Testimonials />
      <Faq />
      <Cta />
      <Footer />
    </>
  );
};

export default Page;
