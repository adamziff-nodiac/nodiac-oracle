import { getDepositSites } from '@/lib/tracker/queries'
import { DepositsClient } from '@/components/tracker/DepositsClient'

export default async function DepositsPage() {
  const sites = await getDepositSites()

  return (
    <div className="max-w-[1200px]">
      <DepositsClient initialSites={sites} />
    </div>
  )
}
