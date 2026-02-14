import type { MetadataRoute } from 'next';
import { getAllContentSlugs } from '@/lib/content';
import { getSortedPostsData } from '@/lib/blog';

const BASE_URL = 'https://sitespector.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { pages, caseStudies } = getAllContentSlugs();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Content pages
  const contentPages: MetadataRoute.Sitemap = pages
    .filter((slug) => !slug.startsWith('_'))
    .map((slug) => ({
      url: `${BASE_URL}/${slug}`,
      lastModified: new Date(),
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

  // Other fixed pages
  const otherPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/docs`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/changelog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
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
