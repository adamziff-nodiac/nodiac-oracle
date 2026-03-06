import { IppPortfolioView } from '@/components/screening/IppPortfolioView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function IppPortfolioPage({ params }: PageProps) {
  const { id } = await params

  return <IppPortfolioView ippId={id} />
}
