export interface PhoneNumberListItem {
  id: string
  type: string
  startNumber: string
  endNumber: string | null
  notes: string | null
  createdAt: string
}

export const PHONE_NUMBER_TYPE_OPTIONS = [
  { value: 0, label: 'Enkel' },
  { value: 1, label: '10-blok' },
  { value: 2, label: '100-blok' },
  { value: 3, label: '1000-blok' },
] as const

export const PHONE_NUMBER_TYPE_VALUE: Record<string, number> = {
  Single: 0, Block10: 1, Block100: 2, Block1000: 3,
}

export const PHONE_NUMBER_TYPE_LABEL: Record<string, string> = {
  Single: 'Enkel',
  Block10: '10-blok',
  Block100: '100-blok',
  Block1000: '1000-blok',
}

export const PHONE_NUMBER_TYPE_TONE: Record<string, string> = {
  Single: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Block10: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  Block100: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  Block1000: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}
