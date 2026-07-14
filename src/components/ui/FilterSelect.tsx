/**
 * Compact waarde-filter voor tabel-toolbars ("Type: Alle" / "Status: In gebruik").
 * Een actief filter kleurt blauw zodat direct zichtbaar is dát er gefilterd wordt.
 * Lege waarde ('') betekent: geen filter.
 */
export function FilterSelect({ label, value, options, onChange }: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const active = value !== ''
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      title={`Filter op ${label.toLowerCase()}`}
      className={`px-2.5 py-2 text-xs font-medium rounded-lg border cursor-pointer flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25 transition-colors ${
        active
          ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700/60 dark:bg-blue-900/20 dark:text-blue-300'
          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-300 dark:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.4)]'
      }`}
    >
      <option value="">{label}: Alle</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
