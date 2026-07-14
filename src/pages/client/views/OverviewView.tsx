import { useState, useEffect } from 'react'
import {
  Users, Laptop, CreditCard, Phone as PhoneIcon, Download,
  TrendingUp, TrendingDown, AlertTriangle,
} from 'lucide-react'
import api from '@/lib/axios'
import { LoadingState } from '@/components/ui/LoadingState'
import { HARDWARE_TYPE_LABEL } from '@/types/hardware'

interface PortalOverview {
  employeeTotal: number; employeeInService: number; employeeLeavePlanned: number; employeeStartPlanned: number
  hardwareTotal: number; hardwareInUse: number; hardwareInStock: number; hardwareUnderRepair: number
  hardwareOnOrder: number; hardwareTotalValue: number; hardwareByType: Record<string, number>
  licenseTotal: number; licenseActive: number; licenseExpired: number; licenseTotalSeats: number; licenseUsedSeats: number
  softwareTotal: number; softwarePaid: number; softwareFree: number
  phoneTotal: number; phoneInUse: number; simCardTotal: number; simCardInUse: number
  subscriptionTotal: number; subscriptionActive: number; subscriptionMonthlyCost: number
}

const fmtEur = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

// ── KPI stat tile ─────────────────────────────────────────────────────────────

function StatTile({ icon, label, value, sub }: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-slate-400 dark:text-slate-500">{icon}</span>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
      <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 leading-none">{value}</p>
      {sub && <div className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-snug">{sub}</div>}
    </div>
  )
}

// ── Kaart-omhulsel voor grafieken ─────────────────────────────────────────────

function ChartCard({ title, children, className = '' }: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 ${className}`}>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4">{title}</p>
      {children}
    </div>
  )
}

// ── Horizontale staafgrafiek (één reeks, sequentieel blauw) ──────────────────

function HBarChart({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map(i => i.value))
  return (
    <div className="space-y-2.5">
      {items.map(i => (
        <div key={i.label} className="group flex items-center gap-3">
          <span className="w-20 flex-shrink-0 text-xs text-slate-500 dark:text-slate-400 truncate">{i.label}</span>
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div
              className="h-4 rounded-r bg-[#2563eb] dark:bg-[#3b82f6] transition-all duration-500 group-hover:opacity-80"
              style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }}
              title={`${i.label}: ${i.value}`}
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex-shrink-0">{i.value}</span>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-slate-400">Nog geen hardware.</p>}
    </div>
  )
}

// ── 100%-gestapelde balk met legenda ─────────────────────────────────────────
// Kleuren gevalideerd (CVD/contrast) in licht én donker; amber heeft in licht
// een contrast-waarschuwing → de legenda met labels+aantallen is de verplichte
// secundaire encoding.

function StackedBar({ segments, total }: {
  segments: { label: string; value: number; light: string; dark?: string }[]
  total: number
}) {
  const visible = segments.filter(s => s.value > 0)
  return (
    <div>
      <div className="flex h-4 rounded-full overflow-hidden gap-[2px] bg-slate-100 dark:bg-slate-700">
        {visible.map(s => (
          <div
            key={s.label}
            className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
            style={{ width: `${(s.value / Math.max(1, total)) * 100}%` }}
            title={`${s.label}: ${s.value}`}
          >
            <div className={`h-full w-full ${s.light} ${s.dark ?? ''}`} title={`${s.label}: ${s.value}`} />
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map(s => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className={`w-2 h-2 rounded-full ${s.light} ${s.dark ?? ''}`} />
            {s.label} <span className="font-semibold text-slate-700 dark:text-slate-200">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Meter (ratio tegen een limiet) ────────────────────────────────────────────

function Meter({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
  const fill = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500 dark:bg-[#d97706]' : 'bg-[#2563eb] dark:bg-[#3b82f6]'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className="text-slate-700 dark:text-slate-200 font-semibold">{used} / {total} <span className="font-normal text-slate-400">({pct}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-blue-100 dark:bg-blue-950/60 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── View ──────────────────────────────────────────────────────────────────────

export function OverviewView() {
  const [data, setData]           = useState<PortalOverview | null>(null)
  const [loading, setLoading]     = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    api.get<PortalOverview>('/portal/overview')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await api.get('/portal/export', { responseType: 'blob' })
      const contentDisposition = response.headers['content-disposition'] as string | undefined
      const fileNameMatch = contentDisposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      const fileName = fileNameMatch?.[1]?.replace(/['"]/g, '') ?? 'RokaFlow_export.xlsx'
      const url = URL.createObjectURL(new Blob([response.data]))
      const a   = document.createElement('a')
      a.href    = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch { /* silently ignore */ }
    finally { setExporting(false) }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingState label="Overzicht laden…" size="lg" />
      </div>
    )
  }
  if (!data) return null

  // ?? 0: een backend van vóór deze release stuurt hardwareOnOrder/hardwareByType nog niet mee
  const hardwareOnOrder = data.hardwareOnOrder ?? 0
  const decommissioned = Math.max(0,
    data.hardwareTotal - data.hardwareInUse - data.hardwareInStock - data.hardwareUnderRepair - hardwareOnOrder)

  const hardwareByType = Object.entries(data.hardwareByType ?? {})
    .map(([type, value]) => ({ label: HARDWARE_TYPE_LABEL[type] ?? type, value }))

  return (
    <div className="h-full overflow-y-auto pb-2">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Live overzicht van alle activa binnen deze organisatie
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                     bg-slate-800 text-white hover:bg-slate-700
                     dark:bg-slate-700 dark:hover:bg-slate-600
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={13} className={exporting ? 'animate-bounce' : ''} />
          {exporting ? 'Exporteren…' : 'Exporteren naar Excel'}
        </button>
      </div>

      <div className="space-y-4">
        {/* ── KPI-strip ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatTile
            icon={<Users size={15} />}
            label="Medewerkers"
            value={data.employeeTotal}
            sub={
              (data.employeeStartPlanned > 0 || data.employeeLeavePlanned > 0) ? (
                <span className="flex items-center gap-3">
                  {data.employeeStartPlanned > 0 && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp size={11} /> {data.employeeStartPlanned} starten
                    </span>
                  )}
                  {data.employeeLeavePlanned > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <TrendingDown size={11} /> {data.employeeLeavePlanned} vertrekken
                    </span>
                  )}
                </span>
              ) : `${data.employeeInService} in dienst`
            }
          />
          <StatTile
            icon={<Laptop size={15} />}
            label="Hardware-assets"
            value={data.hardwareTotal}
            sub={`${fmtEur(data.hardwareTotalValue)} totale waarde`}
          />
          <StatTile
            icon={<PhoneIcon size={15} />}
            label="Telefonie"
            value={data.phoneTotal + data.simCardTotal}
            sub={`${data.phoneTotal} telefoons · ${data.simCardTotal} SIM-kaarten`}
          />
          <StatTile
            icon={<CreditCard size={15} />}
            label="Maandkosten abonnementen"
            value={fmtEur(data.subscriptionMonthlyCost)}
            sub={`${data.subscriptionActive} van ${data.subscriptionTotal} abonnementen actief`}
          />
        </div>

        {/* ── Grafieken rij 1 ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <ChartCard title="Hardware per type" className="xl:col-span-2">
            <HBarChart items={hardwareByType} />
          </ChartCard>

          <ChartCard title="Licenties">
            <div className="space-y-4">
              <Meter label="Seats in gebruik" used={data.licenseUsedSeats} total={data.licenseTotalSeats} />
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-200 leading-none">{data.licenseTotal}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Licenties</p>
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-200 leading-none">{data.licenseActive}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Actief</p>
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-200 leading-none">{data.licenseExpired}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Verlopen</p>
                </div>
              </div>
              {data.licenseExpired > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                  <AlertTriangle size={12} /> {data.licenseExpired} verlopen licentie{data.licenseExpired !== 1 ? 's' : ''} vraagt aandacht
                </p>
              )}
            </div>
          </ChartCard>
        </div>

        {/* ── Grafieken rij 2 ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <ChartCard title="Hardwarestatus">
            <StackedBar
              total={data.hardwareTotal}
              segments={[
                { label: 'In gebruik',    value: data.hardwareInUse,       light: 'bg-[#059669]' },
                { label: 'In reparatie',  value: data.hardwareUnderRepair, light: 'bg-[#ea580c]' },
                { label: 'Op voorraad',   value: data.hardwareInStock,     light: 'bg-[#2563eb]', dark: 'dark:bg-[#3b82f6]' },
                { label: 'In bestelling', value: hardwareOnOrder,          light: 'bg-[#f59e0b]', dark: 'dark:bg-[#d97706]' },
                { label: 'Afgeschreven',  value: decommissioned,           light: 'bg-slate-300', dark: 'dark:bg-slate-500' },
              ]}
            />
          </ChartCard>

          <ChartCard title="Telefonie-bezetting">
            <div className="space-y-4">
              <Meter label="Telefoons in gebruik" used={data.phoneInUse} total={data.phoneTotal} />
              <Meter label="SIM-kaarten in gebruik" used={data.simCardInUse} total={data.simCardTotal} />
            </div>
          </ChartCard>

          <ChartCard title="Softwarecatalogus">
            <div className="space-y-4">
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 leading-none">{data.softwareTotal}</p>
              <StackedBar
                total={data.softwareTotal}
                segments={[
                  { label: 'Betaald', value: data.softwarePaid, light: 'bg-[#2563eb]', dark: 'dark:bg-[#3b82f6]' },
                  { label: 'Gratis',  value: data.softwareFree, light: 'bg-blue-300', dark: 'dark:bg-blue-800' },
                ]}
              />
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
