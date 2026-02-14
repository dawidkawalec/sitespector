import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export interface PostData {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  category?: string;
  coverImage?: { src: string; alt?: string };
  readingTimeMinutes?: number;
  contentHtml?: string;
}

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : String(v ?? '');
}

function computeReadingTimeMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  // ~200 wpm; keep min 1
  return Math.max(1, Math.round(words / 200));
}

export async function getSortedPostsData(): Promise<PostData[]> {
  if (!fs.existsSync(postsDirectory)) return [];

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData: PostData[] = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName): PostData => {
      const slugFromFile = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const matterResult = matter(fileContents);

      const data = matterResult.data as Record<string, unknown>;
      const content = matterResult.content || '';

      const coverImage =
        data.cover_image && typeof data.cover_image === 'object'
          ? {
              src: safeString((data.cover_image as { src?: unknown }).src).trim(),
              alt: safeString((data.cover_image as { alt?: unknown }).alt).trim() || undefined,
            }
          : undefined;

      return {
        slug: safeString(data.slug).trim() || slugFromFile,
        title: safeString(data.title),
        date: safeString(data.date),
        excerpt: safeString(data.excerpt),
        author: safeString(data.author).trim() || 'Zespół SiteSpector',
        category: safeString(data.category).trim() || undefined,
        coverImage: coverImage?.src ? coverImage : undefined,
        readingTimeMinutes:
          typeof data.reading_time === 'number'
            ? Math.max(1, Math.round(data.reading_time))
            : computeReadingTimeMinutes(content),
      };
    });

  return allPostsData.sort((a: PostData, b: PostData) => (a.date < b.date ? 1 : -1));
}

export async function getPostData(slug: string): Promise<PostData> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const matterResult = matter(fileContents);
  const data = matterResult.data as Record<string, unknown>;

  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  const coverImage =
    data.cover_image && typeof data.cover_image === 'object'
      ? {
          src: safeString((data.cover_image as { src?: unknown }).src).trim(),
          alt: safeString((data.cover_image as { alt?: unknown }).alt).trim() || undefined,
        }
      : undefined;

  return {
    slug: safeString(data.slug).trim() || slug,
    contentHtml,
    title: safeString(data.title),
    date: safeString(data.date),
    excerpt: safeString(data.excerpt),
    author: safeString(data.author).trim() || 'Zespół SiteSpector',
    category: safeString(data.category).trim() || undefined,
    coverImage: coverImage?.src ? coverImage : undefined,
    readingTimeMinutes:
      typeof data.reading_time === 'number'
        ? Math.max(1, Math.round(data.reading_time))
        : computeReadingTimeMinutes(matterResult.content || ''),
  };
}
