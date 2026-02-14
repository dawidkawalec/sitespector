import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute['robots'] {
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
