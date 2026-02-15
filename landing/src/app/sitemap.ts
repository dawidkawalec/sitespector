import type { MetadataRoute } from 'next';
import { getSortedPostsData } from '@/lib/blog';
import { getSortedCaseStudiesData } from '@/lib/caseStudies';
import { DOC_PAGES } from '@/lib/docs';

const SITE_URL = 'https://sitespector.app';

function toDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

type StaticEntry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
};

const STATIC_PAGES: StaticEntry[] = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },

  { path: '/funkcje', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/jak-to-dziala', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/integracje', changeFrequency: 'weekly', priority: 0.85 },

  { path: '/blog', changeFrequency: 'daily', priority: 0.8 },
  { path: '/case-study', changeFrequency: 'daily', priority: 0.8 },
  { path: '/docs', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/changelog', changeFrequency: 'weekly', priority: 0.6 },

  { path: '/cennik', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/sitemap', changeFrequency: 'monthly', priority: 0.3 },

  { path: '/o-nas', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/kontakt', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/porownanie', changeFrequency: 'monthly', priority: 0.6 },

  // Solution pages
  { path: '/dla-agencji-seo', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/dla-ecommerce', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/dla-freelancerow', changeFrequency: 'monthly', priority: 0.65 },
  { path: '/dla-managerow', changeFrequency: 'monthly', priority: 0.65 },
  { path: '/sprawdz-agencje-seo', changeFrequency: 'monthly', priority: 0.65 },

  // Legal
  { path: '/regulamin', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/polityka-prywatnosci', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/polityka-cookies', changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [posts, caseStudies] = await Promise.all([getSortedPostsData(), getSortedCaseStudiesData()]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: toDate(post.date) ?? now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const caseStudyEntries: MetadataRoute.Sitemap = caseStudies.map((cs) => ({
    url: `${SITE_URL}/case-study/${cs.slug}`,
    lastModified: toDate(cs.date) ?? now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const docsEntries: MetadataRoute.Sitemap = DOC_PAGES.map((p) => ({
    url: `${SITE_URL}/docs/${p.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries, ...caseStudyEntries, ...docsEntries];
}

