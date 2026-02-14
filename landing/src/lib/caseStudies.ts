import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const caseStudiesDirectory = path.join(process.cwd(), 'content/case-studies');
const DEFAULT_COVER_IMAGE_SRC = '/images/placeholder.svg';

export type KeyMetric = { label: string; before: string; after: string };
export type CoverImage = { src: string; alt?: string };
export type Testimonial = { quote: string; author?: string; role?: string };

export interface CaseStudyData {
  slug: string;
  title: string;
  date: string;
  category: string;
  clientType?: string;
  challengeSummary?: string;
  resultsSummary?: string;
  keyMetrics?: KeyMetric[];
  coverImage?: CoverImage;
  testimonial?: Testimonial;
  contentHtml?: string;
}

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : String(v ?? '');
}

function safeKeyMetrics(v: unknown): KeyMetric[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const metrics = v
    .map((m): KeyMetric | null => {
      if (!m || typeof m !== 'object') return null;
      const rec = m as Record<string, unknown>;
      const label = safeString(rec.label).trim();
      const before = safeString(rec.before).trim();
      const after = safeString(rec.after).trim();
      if (!label && !before && !after) return null;
      return { label, before, after };
    })
    .filter((m): m is KeyMetric => Boolean(m));
  return metrics.length ? metrics : undefined;
}

function safeCoverImage(v: unknown): CoverImage | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const rec = v as Record<string, unknown>;
  const src = safeString(rec.src).trim();
  if (!src) return undefined;
  const alt = safeString(rec.alt).trim() || undefined;
  return { src, alt };
}

function safeTestimonial(v: unknown): Testimonial | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const rec = v as Record<string, unknown>;
  const quote = safeString(rec.quote).trim();
  if (!quote) return undefined;
  const author = safeString(rec.author).trim() || undefined;
  const role = safeString(rec.role).trim() || undefined;
  return { quote, author, role };
}

export async function getSortedCaseStudiesData(): Promise<CaseStudyData[]> {
  if (!fs.existsSync(caseStudiesDirectory)) return [];

  const fileNames = fs.readdirSync(caseStudiesDirectory);
  const allData: CaseStudyData[] = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map((fileName): CaseStudyData => {
      const slugFromFile = fileName.replace(/\.md$/, '');
      const fullPath = path.join(caseStudiesDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const matterResult = matter(fileContents);
      const data = matterResult.data as Record<string, unknown>;

      const slug = safeString(data.slug).trim() || slugFromFile;
      const title = safeString(data.title);

      return {
        slug,
        title,
        date: safeString(data.date),
        category: safeString(data.category),
        clientType: safeString(data.client_type).trim() || undefined,
        challengeSummary: safeString(data.challenge_summary).trim() || undefined,
        resultsSummary: safeString(data.results_summary).trim() || undefined,
        keyMetrics: safeKeyMetrics(data.key_metrics),
        // Use one universal placeholder cover everywhere (real covers can be added later).
        coverImage: { src: DEFAULT_COVER_IMAGE_SRC, alt: safeCoverImage(data.cover_image)?.alt || title || 'SiteSpector' },
        testimonial: safeTestimonial(data.testimonial),
      };
    });

  return allData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getCaseStudyData(slug: string): Promise<CaseStudyData> {
  const fullPath = path.join(caseStudiesDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Case study not found: ${slug}`);
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const matterResult = matter(fileContents);

  const processedContent = await remark().use(html).process(matterResult.content);
  const contentHtml = processedContent.toString();

  const data = matterResult.data as Record<string, unknown>;
  const title = safeString(data.title);

  return {
    slug: safeString(data.slug).trim() || slug,
    title,
    date: safeString(data.date),
    category: safeString(data.category),
    clientType: safeString(data.client_type).trim() || undefined,
    challengeSummary: safeString(data.challenge_summary).trim() || undefined,
    resultsSummary: safeString(data.results_summary).trim() || undefined,
    keyMetrics: safeKeyMetrics(data.key_metrics),
    coverImage: { src: DEFAULT_COVER_IMAGE_SRC, alt: safeCoverImage(data.cover_image)?.alt || title || 'SiteSpector' },
    testimonial: safeTestimonial(data.testimonial),
    contentHtml,
  };
}

