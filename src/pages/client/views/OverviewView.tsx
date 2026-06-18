import { useState, useEffect } from 'react'
import { Users, Laptop, CreditCard, Shield, Phone as PhoneIcon, Activity, Download } from 'lucide-react'
import api from '@/lib/axios'
import { LoadingState } from '@/components/ui/LoadingState'

interface PortalOverview {
  employeeTotal: number; employeeInService: number; employeeLeavePlanned: number; employeeStartPlanned: number
  hardwareTotal: number; hardwareInUse: number; hardwareInStock: number; hardwareUnderRepair: number; hardwareTotalValue: number
  licenseTotal: number; licenseActive: number; licenseExpired: number; licenseTotalSeats: number; licenseUsedSeats: number
  softwareTotal: number; softwarePaid: number; softwareFree: number
  phoneTotal: number; phoneInUse: number; simCardTotal: number; simCardInUse: number
  subscriptionTotal: number; subscriptionActive: number; subscriptionMonthlyCost: number
}

function OverviewCard({
  title, icon, accentBar, iconCls,
  primary, primarySub,
  progress,
  stats,
}: {
  title: string
  icon: React.ReactNode
  accentBar: string
  iconCls: string
  primary: React.ReactNode
  primarySub: string
  progress?: { used: number; total: number; label: string; bar: string }
  stats: { label: string; value: React.ReactNode; tone?: string }[]
}) {
  const pct = progress && progress.total > 0
    ? Math.min(100, Math.round((progress.used / progress.total) * 100))
    : 0

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
      <div className={`h-1 ${accentBar}`} />
      <div className="p-5 flex flex-col flex-1 gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em]">{title}</p>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconCls}`}>{icon}</div>
        </div>
        <div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums leading-none">{primary}</p>
          <p className="text-xs text-slate-400 mt-1 leading-snug">{primarySub}</p>
        </div>
        {progress && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>{progress.label}</span>
              <span className="tabular-nums font-semibold">{progress.used} / {progress.total} <span className="font-normal">({pct}%)</span></span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ${progress.bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700 grid gap-3"
          style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
          {stats.map(s => (
            <div key={s.label}>
              <p className={`text-base font-bold tabular-nums leading-none ${s.tone ?? 'text-slate-800 dark:text-slate-200'}`}>{s.value}</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

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

  const fmt = (n: number) =>
    n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

  const hwPct  = data.hardwareTotal > 0 ? Math.round((data.hardwareInUse  / data.hardwareTotal)   * 100) : 0
  const licPct = data.licenseTotalSeats > 0 ? Math.round((data.licenseUsedSeats / data.licenseTotalSeats) * 100) : 0

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

      <div className="grid grid-cols-3 gap-4">
        <OverviewCard
          title="Medewerkers"
          icon={<Users size={15} />}
          accentBar="bg-emerald-500"
          iconCls="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
          primary={data.employeeTotal}
          primarySub="actieve medewerkers"
          stats={[
            { label: 'In dienst',       value: data.employeeInService },
            { label: 'Vertrek gepland', value: data.employeeLeavePlanned,
              tone: data.employeeLeavePlanned > 0 ? 'text-amber-600 dark:text-amber-400' : undefined },
            { label: 'Startend',        value: data.employeeStartPlanned,
              tone: data.employeeStartPlanned > 0 ? 'text-emerald-600 dark:text-emerald-400' : undefined },
          ]}
        />
        <OverviewCard
          title="Hardware"
          icon={<Laptop size={15} />}
          accentBar="bg-amber-500"
          iconCls="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
          primary={data.hardwareTotal}
          primarySub={`assets · ${fmt(data.hardwareTotalValue)} totale waarde`}
          progress={{
            used: data.hardwareInUse, total: data.hardwareTotal,
            label: 'In gebruik',
            bar: hwPct >= 90 ? 'bg-red-500' : hwPct >= 70 ? 'bg-amber-400' : 'bg-amber-500',
          }}
          stats={[
            { label: 'In gebruik',   value: data.hardwareInUse },
            { label: 'Op voorraad',  value: data.hardwareInStock },
            { label: 'In reparatie', value: data.hardwareUnderRepair,
              tone: data.hardwareUnderRepair > 0 ? 'text-orange-600 dark:text-orange-400' : undefined },
          ]}
        />
        <OverviewCard
          title="Licenties"
          icon={<CreditCard size={15} />}
          accentBar="bg-blue-500"
          iconCls="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
          primary={data.licenseTotal}
          primarySub={`licenties · ${data.licenseTotalSeats} seats totaal`}
          progress={{
            used: data.licenseUsedSeats, total: data.licenseTotalSeats,
            label: 'Seats in gebruik',
            bar: licPct >= 90 ? 'bg-red-500' : licPct >= 75 ? 'bg-amber-400' : 'bg-blue-500',
          }}
          stats={[
            { label: 'Actief',    value: data.licenseActive,  tone: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Verlopen', value: data.licenseExpired,  tone: data.licenseExpired > 0 ? 'text-red-600 dark:text-red-400' : undefined },
            { label: 'Seats vrij', value: Math.max(0, data.licenseTotalSeats - data.licenseUsedSeats) },
          ]}
        />
        <OverviewCard
          title="Software"
          icon={<Shield size={15} />}
          accentBar="bg-indigo-500"
          iconCls="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
          primary={data.softwareTotal}
          primarySub="softwaretitels in de catalogus"
          stats={[
            { label: 'Betaald', value: data.softwarePaid,  tone: 'text-blue-600 dark:text-blue-400' },
            { label: 'Gratis',  value: data.softwareFree,  tone: 'text-emerald-600 dark:text-emerald-400' },
          ]}
        />
        <OverviewCard
          title="Telefonie"
          icon={<PhoneIcon size={15} />}
          accentBar="bg-violet-500"
          iconCls="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
          primary={data.phoneTotal + data.simCardTotal}
          primarySub={`${data.phoneTotal} telefoons · ${data.simCardTotal} SIM-kaarten`}
          stats={[
            { label: 'Telefoons in gebruik', value: data.phoneInUse },
            { label: "SIM's in gebruik",     value: data.simCardInUse },
            { label: 'Op voorraad',          value: (data.phoneTotal - data.phoneInUse) + (data.simCardTotal - data.simCardInUse) },
          ]}
        />
        <OverviewCard
          title="Abonnementen"
          icon={<Activity size={15} />}
          accentBar="bg-orange-500"
          iconCls="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
          primary={fmt(data.subscriptionMonthlyCost)}
          primarySub="maandelijkse kosten (actieve abonnementen)"
          stats={[
            { label: 'Totaal',   value: data.subscriptionTotal },
            { label: 'Actief',   value: data.subscriptionActive, tone: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Inactief', value: data.subscriptionTotal - data.subscriptionActive,
              tone: (data.subscriptionTotal - data.subscriptionActive) > 0 ? 'text-slate-500' : undefined },
          ]}
        />
      </div>
    </div>
  )
}
