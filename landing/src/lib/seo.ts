import type { Metadata } from 'next';

export const SITE_URL = 'https://sitespector.app';
export const SITE_NAME = 'SiteSpector';
export const DEFAULT_LOCALE = 'pl_PL';

export type OgImageType = 'page' | 'blog' | 'casestudy' | 'docs';

export function toPathname(path: string): `/${string}` {
  if (!path) return '/';
  return (path.startsWith('/') ? path : `/${path}`) as `/${string}`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${toPathname(path)}`;
}

export function buildOgImageUrl(params: { title: string; subtitle?: string; type?: OgImageType }): string {
  const url = new URL('/og', SITE_URL);
  url.searchParams.set('title', params.title);
  if (params.subtitle) url.searchParams.set('subtitle', params.subtitle);
  if (params.type) url.searchParams.set('type', params.type);
  return url.toString();
}

export type BuildMetadataOptions = {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  locale?: string;
  keywords?: string[];
  ogImage?: string;
  ogImageAlt?: string;
  ogImageType?: OgImageType;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  robots?: Metadata['robots'];
};

export function buildMetadata(opts: BuildMetadataOptions): Metadata {
  const pathname = toPathname(opts.path);
  const ogImage =
    opts.ogImage ??
    buildOgImageUrl({
      title: opts.title,
      subtitle: opts.description,
      type: opts.ogImageType ?? 'page',
    });

  const isArticle = (opts.type ?? 'website') === 'article';

  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords,
    robots: opts.robots,
    alternates: {
      canonical: pathname,
    },
    openGraph: {
      type: opts.type ?? 'website',
      locale: opts.locale ?? DEFAULT_LOCALE,
      siteName: SITE_NAME,
      title: opts.title,
      description: opts.description,
      url: absoluteUrl(pathname),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: opts.ogImageAlt ?? opts.title,
        },
      ],
      ...(isArticle
        ? {
            publishedTime: opts.publishedTime,
            modifiedTime: opts.modifiedTime ?? opts.publishedTime,
            authors: opts.authors,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images: [ogImage],
    },
  };
}

