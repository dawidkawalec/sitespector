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
  contentHtml?: string;
}

export async function getSortedPostsData(): Promise<PostData[]> {
  if (!fs.existsSync(postsDirectory)) return [];

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData: PostData[] = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName): PostData => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const matterResult = matter(fileContents);

      const data = matterResult.data as Partial<PostData>;

      return {
        slug,
        title: String(data.title ?? ''),
        date: String(data.date ?? ''),
        excerpt: String(data.excerpt ?? ''),
        author: String(data.author ?? ''),
      };
    });

  return allPostsData.sort((a: PostData, b: PostData) => (a.date < b.date ? 1 : -1));
}

export async function getPostData(slug: string): Promise<PostData> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    contentHtml,
    ...(matterResult.data as { title: string; date: string; excerpt: string; author: string }),
  };
}
