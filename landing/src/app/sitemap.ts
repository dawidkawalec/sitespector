import type { MetadataRoute } from 'next';
import { getAllContentSlugs } from '@/lib/content';
import { getSortedPostsData } from '@/lib/blog';

const BASE_URL = 'https://sitespector.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { pages, caseStudies } = getAllContentSlugs();
  const now = new Date();

  // Static pages – główne wejścia
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/sitemap`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // Content pages (o-nas, kontakt, regulamin, funkcje, etc.)
  const contentPages: MetadataRoute.Sitemap = pages
    .filter((slug) => !slug.startsWith('_'))
    .map((slug) => ({
      url: `${BASE_URL}/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));

  // Blog posts
  const blogPosts = await getSortedPostsData();
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Blog index
  const blogIndex: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Case studies
  const caseStudyPages: MetadataRoute.Sitemap = caseStudies.map((slug) => ({
    url: `${BASE_URL}/case-study/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Case study index
  const caseStudyIndex: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/case-study`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Docs, changelog, inne stałe
  const otherPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/docs`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/changelog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
  ];

  return [
    ...staticPages,
    ...contentPages,
    ...blogIndex,
    ...blogPages,
    ...caseStudyIndex,
    ...caseStudyPages,
    ...otherPages,
  ];
}
