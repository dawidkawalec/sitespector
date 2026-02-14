import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

// ============================================================
// SiteSpector Content Library
// Reads content from landing/content/ directory (JSON + Markdown)
// ============================================================

const contentDirectory = path.join(process.cwd(), 'content');

// -----------------------------------------------------------
// JSON Data Helpers (content/data/*.json)
// -----------------------------------------------------------

export function getJsonData<T>(filename: string): T {
  const filePath = path.join(contentDirectory, 'data', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Content data file not found: ${filename}`);
  }
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents) as T;
}

// -----------------------------------------------------------
// Markdown Page Helpers (content/pages/*.md)
// -----------------------------------------------------------

export interface PageContent {
  slug: string;
  frontmatter: Record<string, unknown>;
  contentHtml: string;
}

export async function getPageContent(slug: string): Promise<PageContent> {
  const filePath = path.join(contentDirectory, 'pages', `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Page content not found: ${slug}`);
  }
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    frontmatter: matterResult.data,
    contentHtml,
  };
}

export function getPageFrontmatter(slug: string): Record<string, unknown> {
  const filePath = path.join(contentDirectory, 'pages', `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Page content not found: ${slug}`);
  }
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const matterResult = matter(fileContents);
  return matterResult.data;
}

// -----------------------------------------------------------
// Case Studies (content/case-studies/*.md)
// -----------------------------------------------------------

export interface CaseStudy {
  slug: string;
  frontmatter: Record<string, unknown>;
  contentHtml: string;
}

export async function getCaseStudies(): Promise<CaseStudy[]> {
  const dir = path.join(contentDirectory, 'case-studies');
  if (!fs.existsSync(dir)) return [];

  const fileNames = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));

  const studies = await Promise.all(
    fileNames.map(async (fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const filePath = path.join(dir, fileName);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const matterResult = matter(fileContents);

      const processedContent = await remark()
        .use(html)
        .process(matterResult.content);

      return {
        slug,
        frontmatter: matterResult.data,
        contentHtml: processedContent.toString(),
      };
    })
  );

  // Sort by date descending
  return studies.sort((a, b) => {
    const dateA = String(a.frontmatter.date ?? '');
    const dateB = String(b.frontmatter.date ?? '');
    return dateA < dateB ? 1 : -1;
  });
}

export async function getCaseStudy(slug: string): Promise<CaseStudy> {
  const filePath = path.join(contentDirectory, 'case-studies', `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Case study not found: ${slug}`);
  }
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);

  return {
    slug,
    frontmatter: matterResult.data,
    contentHtml: processedContent.toString(),
  };
}

// -----------------------------------------------------------
// Changelog (content/changelog/*.md)
// -----------------------------------------------------------

export interface ChangelogEntry {
  slug: string;
  frontmatter: Record<string, unknown>;
  contentHtml: string;
}

export async function getChangelogEntries(): Promise<ChangelogEntry[]> {
  const dir = path.join(contentDirectory, 'changelog');
  if (!fs.existsSync(dir)) return [];

  const fileNames = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));

  const entries = await Promise.all(
    fileNames.map(async (fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const filePath = path.join(dir, fileName);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const matterResult = matter(fileContents);

      const processedContent = await remark()
        .use(html)
        .process(matterResult.content);

      return {
        slug,
        frontmatter: matterResult.data,
        contentHtml: processedContent.toString(),
      };
    })
  );

  // Sort by date descending (newest first)
  return entries.sort((a, b) => {
    const dateA = String(a.frontmatter.date ?? '');
    const dateB = String(b.frontmatter.date ?? '');
    return dateA < dateB ? 1 : -1;
  });
}

// -----------------------------------------------------------
// Docs / Help Center (content/docs/*.md)
// -----------------------------------------------------------

export interface DocsSection {
  slug: string;
  frontmatter: Record<string, unknown>;
  contentHtml: string;
}

export async function getDocsSections(): Promise<DocsSection[]> {
  const dir = path.join(contentDirectory, 'docs');
  if (!fs.existsSync(dir)) return [];

  const fileNames = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));

  const sections = await Promise.all(
    fileNames.map(async (fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const filePath = path.join(dir, fileName);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const matterResult = matter(fileContents);

      const processedContent = await remark()
        .use(html)
        .process(matterResult.content);

      return {
        slug,
        frontmatter: matterResult.data,
        contentHtml: processedContent.toString(),
      };
    })
  );

  // Sort by order field
  return sections.sort((a, b) => {
    const orderA = Number(a.frontmatter.order ?? 999);
    const orderB = Number(b.frontmatter.order ?? 999);
    return orderA - orderB;
  });
}

// -----------------------------------------------------------
// Metadata (content/data/metadata.json)
// -----------------------------------------------------------

interface PageMetadata {
  title: string;
  description: string;
  og_image?: { src: string; placeholder: string };
  keywords?: string[];
}

export function getPageMetadata(pageSlug: string): PageMetadata | null {
  try {
    const allMetadata = getJsonData<Record<string, PageMetadata>>('metadata.json');
    return allMetadata[pageSlug] ?? null;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------
// Navigation (content/data/navigation.json)
// -----------------------------------------------------------

interface NavigationData {
  topbar: {
    logo: { text: string; icon: string };
    sections: Array<{ id: string; label: string; href: string; is_hash: boolean }>;
    cta: { text: string; href: string };
  };
  footer: {
    description: string;
    newsletter: { heading: string; placeholder: string };
    columns: Array<{
      title: string;
      links: Array<{ label: string; href: string }>;
    }>;
  };
}

export function getNavigation(): NavigationData {
  return getJsonData<NavigationData>('navigation.json');
}

// -----------------------------------------------------------
// All content slugs (for sitemap generation)
// -----------------------------------------------------------

export function getAllContentSlugs(): {
  pages: string[];
  blogPosts: string[];
  caseStudies: string[];
} {
  const getSlugList = (subdir: string): string[] => {
    const dir = path.join(contentDirectory, subdir);
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
  };

  return {
    pages: getSlugList('pages'),
    blogPosts: getSlugList('blog'),
    caseStudies: getSlugList('case-studies'),
  };
}
