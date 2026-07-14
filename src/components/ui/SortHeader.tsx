import { useMemo, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

export type SortAccessor<T> = (item: T) => string | number | null | undefined

/**
 * Client-side kolomsortering voor tabellen.
 * Klikgedrag: 1e klik oplopend → 2e klik aflopend → 3e klik terug naar standaardvolgorde.
 * Lege waarden sorteren altijd onderaan; gelijke waarden behouden hun oorspronkelijke volgorde.
 * Definieer de accessor-map op moduleniveau (buiten de component) zodat hij stabiel is.
 */
export function useSort<T>(items: T[], accessors: Record<string, SortAccessor<T>>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const toggleSort = (key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc') }
    else if (sortDir === 'asc') setSortDir('desc')
    else { setSortKey(null); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    const accessor = sortKey ? accessors[sortKey] : undefined
    if (!accessor) return items

    const indexed = items.map((item, i) => ({ item, i }))
    indexed.sort((a, b) => {
      const va = accessor(a.item)
      const vb = accessor(b.item)
      const aEmpty = va === null || va === undefined || va === ''
      const bEmpty = vb === null || vb === undefined || vb === ''
      if (aEmpty && bEmpty) return a.i - b.i
      if (aEmpty) return 1
      if (bEmpty) return -1

      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'nl', { sensitivity: 'base', numeric: true })

      if (cmp === 0) return a.i - b.i
      return sortDir === 'asc' ? cmp : -cmp
    })
    return indexed.map(x => x.item)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sortKey, sortDir])

  return { sorted, sortKey, sortDir, toggleSort }
}

export function SortHeader({ label, sortKey, activeKey, dir, onToggle, className = '' }: {
  label: string
  /** Geen sortKey = niet-sorteerbare kolom (bv. actie-kolom) */
  sortKey?: string
  activeKey: string | null
  dir: 'asc' | 'desc'
  onToggle: (key: string) => void
  className?: string
}) {
  if (!sortKey) {
    return (
      <span className={`text-xs font-semibold text-slate-500 uppercase tracking-wider truncate ${className}`}>
        {label}
      </span>
    )
  }
  const active = activeKey === sortKey
  return (
    <button
      type="button"
      onClick={() => onToggle(sortKey)}
      title="Sorteren"
      className={`flex items-center gap-1 min-w-0 text-left text-xs font-semibold uppercase tracking-wider transition-colors ${
        active
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
      } ${className}`}
    >
      <span className="truncate">{label}</span>
      {active && (dir === 'asc'
        ? <ChevronUp size={11} className="flex-shrink-0" />
        : <ChevronDown size={11} className="flex-shrink-0" />)}
    </button>
  )
}
