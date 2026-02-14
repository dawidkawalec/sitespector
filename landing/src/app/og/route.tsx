import { ImageResponse } from 'next/og';

export const runtime = 'edge';

function clamp(s: string, max: number): string {
  const trimmed = (s || '').trim();
  if (!trimmed) return '';
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function pickAccent(type: string | null): { accent: string; label: string } {
  const t = (type || '').toLowerCase();
  if (t === 'blog') return { accent: '#2563EB', label: 'Blog' };
  if (t === 'casestudy') return { accent: '#16A34A', label: 'Case study' };
  if (t === 'docs') return { accent: '#7C3AED', label: 'Dokumentacja' };
  return { accent: '#F97316', label: 'SiteSpector' };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = clamp(searchParams.get('title') || 'SiteSpector', 90);
  const subtitle = clamp(searchParams.get('subtitle') || 'Profesjonalne audyty SEO, wydajności i widoczności z AI', 140);
  const { accent, label } = pickAccent(searchParams.get('type'));

  const res = new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          background: 'linear-gradient(135deg, #0B1220 0%, #111827 55%, #0B1220 100%)',
          color: '#F9FAFB',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '22px',
              }}
            >
              S
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.01em' }}>SiteSpector</div>
          </div>

          <div
            style={{
              fontSize: '16px',
              color: '#E5E7EB',
              padding: '10px 14px',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.14)',
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          >
            {label}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ fontSize: '60px', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.03em' }}>{title}</div>
          <div style={{ fontSize: '26px', lineHeight: 1.35, color: '#D1D5DB', maxWidth: '980px' }}>{subtitle}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#D1D5DB' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '999px',
                background: accent,
              }}
            />
            <div style={{ fontSize: '18px' }}>sitespector.app</div>
          </div>
          <div style={{ fontSize: '18px', color: '#9CA3AF' }}>Audyty SEO, Performance, Widoczność, AI</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );

  // Cache aggressively - content changes rarely and the URL is param-based.
  res.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
  return res;
}

