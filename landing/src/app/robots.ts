import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/login', '/register', '/api/', '/lp-assets/_next/'],
      },
    ],
    sitemap: 'https://sitespector.app/sitemap.xml',
  };
}
