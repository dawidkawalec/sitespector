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

const Page = () => {
  return (
    <>
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
