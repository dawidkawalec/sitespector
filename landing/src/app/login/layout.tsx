import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Logowanie — SiteSpector',
  description: 'Zaloguj się lub załóż konto w SiteSpector, aby uruchomić audyt.',
  path: '/login',
  ogImageType: 'page',
  robots: { index: false, follow: false },
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

