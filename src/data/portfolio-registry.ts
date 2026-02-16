/**
 * Registry of pre-built portfolios available for viewing without upload.
 */

export interface PrebuiltPortfolio {
  slug: string
  name: string
  description: string
  jsonPath: string // Path relative to public/
}

export const PREBUILT_PORTFOLIOS: PrebuiltPortfolio[] = [
  {
    slug: 'greenbacker',
    name: 'Greenbacker Portfolio',
    description: '135 screened sites from Fleet CIR Validated master sheet',
    jsonPath: '/data/portfolios/greenbacker.json',
  },
  {
    slug: 'greenbacker-full',
    name: 'Greenbacker Full Portfolio',
    description: '462 sites from Fleet CIR Validated expanded dataset',
    jsonPath: '/data/portfolios/greenbacker-full.json',
  },
  {
    slug: 'powerbank',
    name: 'Powerbank Portfolio',
    description: '53 sites across US and Canada',
    jsonPath: '/data/portfolios/powerbank.json',
  },
]

export function getPortfolioBySlug(slug: string): PrebuiltPortfolio | undefined {
  return PREBUILT_PORTFOLIOS.find(p => p.slug === slug)
}
