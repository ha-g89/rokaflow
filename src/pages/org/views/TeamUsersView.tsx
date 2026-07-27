import { useEffect, useState } from 'react'
import { UserPlus, KeyRound, Mail, ShieldOff } from 'lucide-react'
import api from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LoadingState } from '@/components/ui/LoadingState'
import { InviteMspUserModal } from '@/components/InviteMspUserModal'
import type { MspUserListItem } from '@/types/mspUser'

const STATUS_TONE: Record<MspUserListItem['status'], string> = {
  Actief:               'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  UitnodigingVerstuurd: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  ToegangIngetrokken:   'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
}
const STATUS_LABEL: Record<MspUserListItem['status'], string> = {
  Actief: 'Actief',
  UitnodigingVerstuurd: 'Uitnodiging verstuurd',
  ToegangIngetrokken: 'Toegang ingetrokken',
}

export function TeamUsersView() {
  const [users, setUsers]               = useState<MspUserListItem[]>([])
  const [loading, setLoading]           = useState(true)
  const [showInvite, setShowInvite]     = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<MspUserListItem | null>(null)
  const [revoking, setRevoking]         = useState(false)
  const [revokeError, setRevokeError]   = useState<string | null>(null)

  const fetchUsers = () => {
    setLoading(true)
    api.get<MspUserListItem[]>('/msp/users')
      .then(r => setUsers(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const handleRevoke = async () => {
    if (!revokeTarget) return
    setRevoking(true)
    setRevokeError(null)
    try {
      await api.post(`/msp/users/${revokeTarget.id}/revoke`)
      setRevokeTarget(null)
      fetchUsers()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setRevokeError(msg ?? 'Intrekken is mislukt. Probeer het opnieuw.')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <Card className="flex-1">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Teamleden</h2>
            <p className="text-xs text-slate-400 mt-0.5">Beheer wie namens jouw organisatie kan inloggen.</p>
          </div>
          <Button size="sm" onClick={() => setShowInvite(true)}>
            <UserPlus size={14} /> Teamlid toevoegen
          </Button>
        </div>

        {loading ? (
          <LoadingState />
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Nog geen teamleden.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    {u.firstName} {u.lastName}
                    {u.role === 'MspAdmin' && (
                      <span className="ml-2 text-xs font-normal text-slate-400">(hoofdgebruiker)</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                    <Mail size={11} /> {u.email}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_TONE[u.status]}`}>
                    {STATUS_LABEL[u.status]}
                  </span>
                  {u.role === 'MspMember' && u.status !== 'ToegangIngetrokken' && (
                    <button
                      onClick={() => { setRevokeError(null); setRevokeTarget(u) }}
                      title="Toegang intrekken"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                    >
                      <ShieldOff size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <InviteMspUserModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        onSuccess={() => { setShowInvite(false); fetchUsers() }}
      />

      <Modal
        open={!!revokeTarget}
        onClose={() => !revoking && setRevokeTarget(null)}
        title="Toegang intrekken"
        className="max-w-sm"
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
            <KeyRound size={22} className="text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Weet je zeker dat je de toegang van{' '}
              <span className="font-semibold">"{revokeTarget?.firstName} {revokeTarget?.lastName}"</span>{' '}
              wilt intrekken?
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Dit teamlid kan hierna niet meer inloggen.
            </p>
          </div>
          {revokeError && (
            <div className="w-full rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3">
              <p className="text-sm text-red-700 dark:text-red-400">{revokeError}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-6">
          <Button variant="secondary" className="flex-1" onClick={() => setRevokeTarget(null)} disabled={revoking}>
            Annuleren
          </Button>
          <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={handleRevoke} disabled={revoking}>
            {revoking ? 'Bezig…' : 'Intrekken'}
          </Button>
        </div>
      </Modal>
    </Card>
  )
}
