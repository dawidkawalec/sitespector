export const SITE_URL = 'https://sitespector.app'
export const SITE_NAME = 'SiteSpector'

export function absoluteUrl(path: string): string {
  const p = (path || '').trim()
  if (!p || p === '/') return SITE_URL
  return `${SITE_URL}${p.startsWith('/') ? p : `/${p}`}`
}

