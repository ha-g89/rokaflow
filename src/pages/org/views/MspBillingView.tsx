import { BillingProfileForm } from '@/components/billing/BillingProfileForm'
import { InvoiceList } from '@/components/billing/InvoiceList'

export function MspBillingView() {
  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Facturatie</h2>
        <p className="text-xs text-slate-400 mt-0.5">Uw factuurgegevens en facturen van RokaFlow.</p>
      </div>

      <BillingProfileForm baseUrl="/msp/billing" />

      <div>
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Facturen</h3>
        <InvoiceList baseUrl="/msp/billing" />
      </div>

    </div>
  )
}
