import { AlertTriangle, Lock, Zap } from 'lucide-react'
import type { MyPlanDto } from '@/types/platformPlan'

function daysLeft(dateStr: string | null) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

export function PlanBanner({ plan, noPlan }: { plan: MyPlanDto | null; noPlan?: boolean }) {
  if (noPlan) {
    return (
      <div className="flex-shrink-0 bg-red-600 text-white px-4 py-2 flex items-center gap-2 text-xs font-medium">
        <Lock size={12} />
        <span>
          Er is geen abonnement gekoppeld aan deze omgeving. Alles is alleen-lezen totdat uw MSP (of beheerder) een abonnement toewijst.
        </span>
      </div>
    )
  }

  if (!plan) return null

  if (plan.status === 'Trial') {
    const days = daysLeft(plan.trialEndsAt)
    if (days === null || days > 14) return null
    return (
      <div className="flex-shrink-0 bg-blue-600 text-white px-4 py-2 flex items-center gap-2 text-xs font-medium">
        <Zap size={12} />
        <span>
          Uw gratis proefperiode verloopt over <strong>{days} dag{days !== 1 ? 'en' : ''}</strong>.
          Kies een abonnement om uw data te behouden.
        </span>
      </div>
    )
  }

  if (plan.status === 'GracePeriod') {
    const days = daysLeft(plan.graceEndsAt)
    return (
      <div className="flex-shrink-0 bg-amber-500 text-white px-4 py-2 flex items-center gap-2 text-xs font-medium">
        <AlertTriangle size={12} />
        <span>
          Proefperiode verlopen — u kunt alleen nog lezen.{' '}
          {days !== null && days > 0 && <>Nog <strong>{days} dag{days !== 1 ? 'en' : ''}</strong> voor het account wordt geblokkeerd.</>}
          {' '}Neem contact op met uw beheerder om een abonnement te activeren.
        </span>
      </div>
    )
  }

  if (plan.status === 'Blocked') {
    return (
      <div className="flex-shrink-0 bg-red-600 text-white px-4 py-2 flex items-center gap-2 text-xs font-medium">
        <Lock size={12} />
        <span>Uw account is geblokkeerd. Neem contact op met uw beheerder om uw abonnement te activeren.</span>
      </div>
    )
  }

  return null
}

export function PlanBadge({ plan }: { plan: MyPlanDto | null }) {
  if (!plan) return null

  const statusMap = {
    Trial:       { label: 'Trial',              color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    GracePeriod: { label: 'Grace',              color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    Active:      { label: plan.planName ?? 'Actief', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    Blocked:     { label: 'Geblokkeerd',        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    None:        { label: 'Geen abonnement',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  }

  const s = statusMap[plan.status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      {s.label}
    </span>
  )
}
