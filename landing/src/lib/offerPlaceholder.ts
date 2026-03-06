export const OFFER_PLACEHOLDER_TOKEN = {
  id: 'offer_placeholder_2026_03',
  what: 'Hide concrete prices and plan tiers on marketing-facing surfaces.',
  where: [
    'Landing navigation labels',
    'Landing pricing sections and CTAs',
    'Marketing pages metadata and hero copy',
  ],
  how: [
    'Use neutral wording: "Oferta jest w przygotowaniu"',
    'Use single CTA: "Skontaktuj się z nami" -> /kontakt',
    'Keep /cennik route active for IA/SEO continuity',
  ],
} as const;

export const OFFER_PLACEHOLDER_COPY = {
  navLabel: 'Oferta (wkrótce)',
  sectionLabel: 'OFERTA',
  title: 'Oferta jest w przygotowaniu',
  subtitle: 'Szczegóły oferty wkrótce',
  cta: 'Skontaktuj się z nami',
} as const;
