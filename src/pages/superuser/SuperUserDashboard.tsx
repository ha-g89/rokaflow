import { useEffect, useState, useCallback } from 'react'
import {
  Building2,
  Users,
  Plus,
  ChevronRight,
  LogOut,
  Shield,
  Briefcase,
  Search,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AddOrganisationModal } from '@/components/AddOrganisationModal'
import { AddClientModal } from '@/components/AddClientModal'
import type { OrganisationListItem, OrganisationDetailResponse } from '@/types/organisation'

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SuperUserDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const [orgs, setOrgs] = useState<OrganisationListItem[]>([])
  const [detail, setDetail] = useState<OrganisationDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showAddOrg, setShowAddOrg] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)
  const [search, setSearch] = useState('')

  const fetchOrgs = useCallback(async () => {
    try {
      const { data } = await api.get<OrganisationListItem[]>('/organisations')
      setOrgs(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    try {
      const { data } = await api.get<OrganisationDetailResponse>(`/organisations/${id}`)
      setDetail(data)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrgs() }, [fetchOrgs])

  const handleLogout = () => { logout(); navigate('/superuser/login') }

  const filtered = orgs.filter(
    o =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase())
  )

  const totalClients = orgs.reduce((s, o) => s + o.clientCount, 0)
  const totalUsers = orgs.reduce((s, o) => s + o.userCount, 0)
  const activeOrgs = orgs.filter(o => o.isActive).length

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Shield size={20} className="text-indigo-400" />
          <span className="font-bold text-base tracking-tight">RokaFlow CMS</span>
          <span className="text-slate-500 text-xs ml-1.5 font-medium uppercase tracking-wider">SuperUser</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white">
            <LogOut size={14} />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-5 flex flex-col gap-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Building2 size={18} className="text-indigo-600" />} label="Total Organisations" value={orgs.length} color="bg-indigo-50" />
          <StatCard icon={<Building2 size={18} className="text-emerald-600" />} label="Active Organisations" value={activeOrgs} color="bg-emerald-50" />
          <StatCard icon={<Briefcase size={18} className="text-violet-600" />} label="Total Clients" value={totalClients} color="bg-violet-50" />
          <StatCard icon={<Users size={18} className="text-amber-600" />} label="Org Users" value={totalUsers} color="bg-amber-50" />
        </div>

        {/* Split layout */}
        <div className="flex gap-4 flex-1 min-h-0" style={{ minHeight: '480px' }}>
          {/* Left — Org list */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <Button size="sm" onClick={() => setShowAddOrg(true)} title="Add Organisation">
                <Plus size={14} />
              </Button>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Organisations</span>
                <span className="text-xs text-slate-400">{filtered.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center text-slate-400 text-sm">Loading…</div>
                ) : filtered.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">No organisations found.</div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {filtered.map(org => (
                      <li key={org.id}>
                        <button
                          onClick={() => fetchDetail(org.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 ${
                            detail?.id === org.id ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 truncate">{org.name}</p>
                            <p className="text-xs text-slate-400 truncate">/{org.slug}</p>
                            <div className="flex gap-2 mt-0.5">
                              <span className="text-xs text-slate-500">{org.clientCount} clients</span>
                              <span className="text-xs text-slate-300">·</span>
                              <span className="text-xs text-slate-500">{org.userCount} users</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex flex-col items-end gap-1">
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                org.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {org.isActive ? 'Active' : 'Off'}
                            </span>
                            <ChevronRight size={12} className="text-slate-300" />
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          {/* Right — Detail */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {!detail ? (
              <Card className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Building2 size={48} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-sm text-slate-400">Select an organisation to view details</p>
                </div>
              </Card>
            ) : detailLoading ? (
              <Card className="flex-1 flex items-center justify-center">
                <p className="text-sm text-slate-400">Loading…</p>
              </Card>
            ) : (
              <>
                {/* Org info bar */}
                <Card>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{detail.name}</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        /{detail.slug} &nbsp;·&nbsp; Created{' '}
                        {new Date(detail.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          detail.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {detail.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <Button size="sm" onClick={() => setShowAddClient(true)}>
                        <Plus size={14} />
                        Add Client
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4 flex-1 min-h-0">
                  {/* Clients panel */}
                  <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader>
                      <span className="text-sm font-semibold text-slate-700">Clients</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {detail.clients.length}
                      </span>
                    </CardHeader>
                    <div className="flex-1 overflow-y-auto">
                      {detail.clients.length === 0 ? (
                        <div className="p-6 text-center">
                          <Briefcase size={28} className="mx-auto mb-2 text-slate-200" />
                          <p className="text-sm text-slate-400">No clients yet</p>
                          <button
                            onClick={() => setShowAddClient(true)}
                            className="mt-2 text-xs text-indigo-500 hover:underline"
                          >
                            Add first client
                          </button>
                        </div>
                      ) : (
                        <ul className="divide-y divide-slate-100">
                          {detail.clients.map(c => (
                            <li key={c.id} className="px-5 py-3 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-slate-800">{c.name}</p>
                                <p className="text-xs text-slate-400">{c.userCount} users</p>
                              </div>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                  c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {c.isActive ? 'Active' : 'Off'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Card>

                  {/* Users panel */}
                  <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader>
                      <span className="text-sm font-semibold text-slate-700">Users</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {detail.users.length}
                      </span>
                    </CardHeader>
                    <div className="flex-1 overflow-y-auto">
                      {detail.users.length === 0 ? (
                        <div className="p-6 text-center">
                          <Users size={28} className="mx-auto mb-2 text-slate-200" />
                          <p className="text-sm text-slate-400">No users yet</p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-slate-100">
                          {detail.users.map(u => (
                            <li key={u.id} className="px-5 py-3 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-slate-800">{u.email}</p>
                                <p className="text-xs text-slate-400 capitalize">{u.role}</p>
                              </div>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                  u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {u.isActive ? 'Active' : 'Off'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AddOrganisationModal
        open={showAddOrg}
        onClose={() => setShowAddOrg(false)}
        onSuccess={fetchOrgs}
      />

      {detail && (
        <AddClientModal
          open={showAddClient}
          onClose={() => setShowAddClient(false)}
          onSuccess={() => fetchDetail(detail.id)}
          endpoint={`/organisations/${detail.id}/clients`}
        />
      )}
    </div>
  )
}
