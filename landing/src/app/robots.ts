import type { MetadataRoute } from 'next';

const BASE = 'https://sitespector.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard',
          '/audits/',
          '/settings/',
          '/invite/',
          '/auth/',
          '/_next/',
          '/lp-assets/_next/',
          '/logs',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/audits/', '/settings/', '/invite/', '/auth/', '/_next/', '/logs'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/audits/', '/settings/', '/invite/', '/auth/', '/_next/', '/logs'],
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/audits/', '/settings/', '/invite/', '/auth/', '/_next/', '/logs'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/audits/', '/settings/', '/invite/', '/auth/', '/_next/', '/logs'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
