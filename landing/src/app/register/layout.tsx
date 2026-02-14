import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Rejestracja — SiteSpector',
  description: 'Załóż konto w SiteSpector i uruchom pierwszy audyt.',
  path: '/register',
  ogImageType: 'page',
  robots: { index: false, follow: false },
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}

