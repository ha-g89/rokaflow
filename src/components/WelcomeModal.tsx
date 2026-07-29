import { useEffect, useRef, useState } from 'react'
import {
  X, Users, Laptop, Building2, ChevronRight, ChevronLeft, Sparkles,
  Upload, Download, UserPlus, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'
import logo from '@/assets/RokaFlow_icon_dark_transparent.png'

export type WelcomeAction = 'employees' | 'employees-import' | 'hardware' | 'departments'

const INTRO_MS = 2100

const INTRO_CSS = `
  @keyframes rfwSplashIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes rfwLogo {
    from { opacity: 0; transform: scale(0.8) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes rfwText {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes rfwLine {
    from { opacity: 0; transform: scaleX(0); }
    to   { opacity: 1; transform: scaleX(1); }
  }
  /* 'backwards' i.p.v. 'both': een 'both'/'forwards'-fill pint opacity:1 permanent vast
     en wint van de opacity-0-class waarmee de splash later moet wegfaden. */
  .rfw-splash { animation: rfwSplashIn 0.25s ease backwards; }
  .rfw-logo   { animation: rfwLogo 0.75s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
  .rfw-text   { animation: rfwText 0.65s cubic-bezier(0.16,1,0.3,1) 0.6s both; }
  .rfw-line   { animation: rfwLine 0.5s cubic-bezier(0.16,1,0.3,1) 1.0s both; transform-origin: center; }
`

interface Props {
  open: boolean
  firstName?: string
  onClose: () => void
  onAction: (action: WelcomeAction) => void
}

function OptionCard({ icon, title, desc, onClick, trailing }: {
  icon: React.ReactNode
  title: string
  desc: string
  onClick: () => void
  trailing?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 text-left px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/60 hover:border-blue-200 hover:bg-blue-50/30 dark:hover:border-blue-800/50 dark:hover:bg-blue-900/10 transition-colors group"
    >
      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
      </div>
      {trailing ?? (
        <ChevronRight size={16} className="flex-shrink-0 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
      )}
    </button>
  )
}

export function WelcomeModal({ open, firstName, onClose, onAction }: Props) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<'intro' | 'card'>('intro')
  const [step, setStep] = useState<'main' | 'employees'>('main')
  const [templateDownloaded, setTemplateDownloaded] = useState(false)
  const introTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showCard = () => {
    setPhase('card')
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
  }

  useEffect(() => {
    if (open) {
      setMounted(true)
      setStep('main')
      setTemplateDownloaded(false)
      setVisible(false)
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) {
        showCard()
      } else {
        setPhase('intro')
        introTimer.current = setTimeout(showCard, INTRO_MS)
      }
      return () => { if (introTimer.current) clearTimeout(introTimer.current) }
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 220)
      return () => clearTimeout(t)
    }
  }, [open])

  const skipIntro = () => {
    if (phase !== 'intro') return
    if (introTimer.current) clearTimeout(introTimer.current)
    showCard()
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/portal/employees/import-template', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'medewerkers-import-template.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      setTemplateDownloaded(true)
    } catch { /* silent */ }
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
      <style>{INTRO_CSS}</style>
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200',
          mounted ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Kaart met opties */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={cn(
            'relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden',
            'transition-all duration-300 ease-out',
            visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'
          )}
        >
          {/* Header */}
          <div className="relative px-7 pt-8 pb-6 bg-blue-50/70 dark:bg-blue-900/15 border-b border-blue-100/70 dark:border-blue-900/30">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg p-1 hover:bg-white/60 dark:hover:bg-slate-700"
              title="Sluiten"
            >
              <X size={18} />
            </button>
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-sm">
              <Sparkles size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Welkom bij RokaFlow{firstName ? `, ${firstName}` : ''}!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Uw omgeving staat klaar. Kies waar u mee wilt beginnen, dan bent u
              binnen een paar minuten operationeel.
            </p>
          </div>

          {/* Sliding panels */}
          <div className="overflow-hidden">
            <div
              className={cn(
                'flex w-[200%] transition-transform duration-300 ease-out',
                step === 'employees' ? '-translate-x-1/2' : 'translate-x-0'
              )}
            >
              {/* Panel 1: hoofdkeuzes */}
              <div className="w-1/2 px-7 py-5 space-y-2.5" aria-hidden={step !== 'main'}>
                <OptionCard
                  icon={<Users size={18} />}
                  title="Medewerkers toevoegen"
                  desc="Voer uw team in of importeer medewerkers vanuit Excel."
                  onClick={() => setStep('employees')}
                />
                <OptionCard
                  icon={<Laptop size={18} />}
                  title="Hardware registreren"
                  desc="Leg laptops en apparatuur vast, handmatig of via import."
                  onClick={() => onAction('hardware')}
                />
                <OptionCard
                  icon={<Building2 size={18} />}
                  title="Organisatie inrichten"
                  desc="Maak afdelingen en locaties aan voor uw structuur."
                  onClick={() => onAction('departments')}
                />
              </div>

              {/* Panel 2: medewerkers-opties */}
              <div className="w-1/2 px-7 py-5" aria-hidden={step !== 'employees'}>
                <button
                  onClick={() => setStep('main')}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-3 transition-colors"
                >
                  <ChevronLeft size={14} /> Terug
                </button>
                <div className="space-y-2.5">
                  <OptionCard
                    icon={<Upload size={18} />}
                    title="Importeren vanuit Excel"
                    desc="Zet uw huidige personeelslijst in één keer over."
                    onClick={() => onAction('employees-import')}
                  />
                  <OptionCard
                    icon={templateDownloaded ? <Check size={18} /> : <Download size={18} />}
                    title={templateDownloaded ? 'Template gedownload' : 'Template downloaden'}
                    desc="Excel-sjabloon met de juiste kolommen, klaar om in te vullen."
                    onClick={handleDownloadTemplate}
                    trailing={templateDownloaded
                      ? <Check size={16} className="flex-shrink-0 text-emerald-500" />
                      : undefined}
                  />
                  <OptionCard
                    icon={<UserPlus size={18} />}
                    title="Naar het medewerkersscherm"
                    desc="Medewerkers handmatig toevoegen en beheren."
                    onClick={() => onAction('employees')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 pb-6 flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">Dit venster verschijnt eenmalig.</p>
            <button
              onClick={onClose}
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Zelf verkennen
            </button>
          </div>
        </div>
      </div>

      {/* Intro-splash: logo + welkom, vloeit daarna weg naar de kaart */}
      <div
        onClick={skipIntro}
        className={cn(
          'rfw-splash fixed inset-0 z-10 flex items-center justify-center bg-slate-950/95',
          'transition-opacity duration-500 ease-out',
          phase === 'intro' ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="flex flex-col items-center gap-5 px-6 text-center">
          <img src={logo} alt="RokaFlow" className="rfw-logo h-16 w-auto object-contain" />
          <p className="rfw-text text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welkom bij RokaFlow{firstName ? `, ${firstName}` : ''}
          </p>
          <div className="rfw-line h-1 w-12 rounded-full bg-blue-500" />
        </div>
      </div>
    </div>
  )
}
