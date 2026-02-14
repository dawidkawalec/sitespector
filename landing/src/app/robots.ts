import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/audits/', '/settings/', '/invite/', '/auth/', '/_next/', '/logs/'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'Claude-Web', 'Google-Extended'],
        allow: ['/', '/blog/', '/docs/', '/case-study/', '/llms.txt'],
        disallow: ['/api/', '/dashboard/', '/audits/', '/settings/', '/invite/', '/auth/', '/_next/', '/logs/'],
      },
    ],
    sitemap: 'https://sitespector.app/sitemap.xml',
  };
}

