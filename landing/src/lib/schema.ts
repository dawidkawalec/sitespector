import { SITE_NAME, SITE_URL, absoluteUrl, buildOgImageUrl } from '@/lib/seo';

function toAbsoluteUrl(urlOrPath: string): string {
  const v = (urlOrPath || '').trim();
  if (!v) return SITE_URL;
  if (v.startsWith('http://') || v.startsWith('https://')) return v;
  return absoluteUrl(v);
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/sitespector_logo_dark.svg'),
    },
    // Add social profiles here when available.
    sameAs: [],
  };
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function buildBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export type BuildArticleSchemaArgs = {
  path: string;
  title: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  image?: string; // absolute or path
  type?: 'Article' | 'BlogPosting' | 'TechArticle';
};

export function buildArticleSchema(args: BuildArticleSchemaArgs) {
  const url = absoluteUrl(args.path);
  const image =
    args.image ||
    buildOgImageUrl({
      title: args.title,
      subtitle: args.description || '',
      type: 'page',
    });

  const publisher = {
    '@type': 'Organization',
    name: SITE_NAME,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/sitespector_logo_dark.svg'),
    },
  };

  const authorName = (args.authorName || '').trim();

  return {
    '@context': 'https://schema.org',
    '@type': args.type || 'Article',
    headline: args.title,
    description: args.description,
    image: [toAbsoluteUrl(image)],
    datePublished: args.datePublished,
    dateModified: args.dateModified || args.datePublished,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    publisher,
    ...(authorName ? { author: { '@type': 'Person', name: authorName } } : {}),
  };
}

export function buildWebPageSchema(args: { path: string; title: string; description?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: args.title,
    description: args.description,
    url: absoluteUrl(args.path),
  };
}

export function buildSoftwareApplicationSchema(args: { path: string; description?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: absoluteUrl(args.path),
    description: args.description,
  };
}

export function buildFAQSchema(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items
      .map((it) => ({
        q: (it.question || '').trim(),
        a: (it.answer || '').trim(),
      }))
      .filter((it) => it.q && it.a)
      .map((it) => ({
        '@type': 'Question',
        name: it.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: it.a,
        },
      })),
  };
}

export function buildContactPageSchema(args: { path: string; title: string; description?: string; email?: string }) {
  const email = (args.email || '').trim();
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: args.title,
    description: args.description,
    url: absoluteUrl(args.path),
    mainEntity: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      ...(email
        ? {
            contactPoint: [
              {
                '@type': 'ContactPoint',
                contactType: 'customer support',
                email,
              },
            ],
          }
        : {}),
    },
  };
}

