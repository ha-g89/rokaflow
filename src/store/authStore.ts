import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/auth'

// ── JWT claim parser (no external dep needed — just base64 decode) ─────────────
function parseTokenUser(token: string): AuthUser {
  const payload = JSON.parse(atob(token.split('.')[1]))
  return {
    id:                   payload.sub       ?? '',
    email:                payload.email     ?? '',
    role:                 payload.role      ?? 'employee',
    tenantId:             payload.tenant_id ?? null,
    tenantName:           payload.tenant_name ?? null,
    switchedFromOrgId:    payload.switched_from      ?? null,
    switchedFromOrgName:  payload.switched_from_name ?? null,
  }
}

interface AuthState {
  _hasHydrated: boolean
  setHasHydrated: (value: boolean) => void
  /** Primary access token (org login or client login) */
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null

  /**
   * Stored when an org-admin switches into a client portal.
   * Restoring this token + user brings you back to the org dashboard.
   */
  orgToken: string | null
  orgUser:  AuthUser | null

  login: (accessToken: string, refreshToken: string, user: AuthUser, keepSignedIn?: boolean) => void
  logout: () => void
  isAuthenticated: () => boolean

  /**
   * Called when an org-admin clicks "Beheer portaal →" on a client.
   * Swaps the active access token for the short-lived context-switch token.
   * The original token is saved in orgToken so we can switch back.
   */
  switchToClient: (switchToken: string) => void

  /**
   * Restores the org-admin token that was stashed during switchToClient.
   */
  switchBack: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      accessToken:  null,
      refreshToken: null,
      user:         null,
      orgToken:     null,
      orgUser:      null,

      login: (accessToken, refreshToken, user, keepSignedIn = true) => {
        if (keepSignedIn) {
          localStorage.setItem('refreshToken', refreshToken)
          sessionStorage.removeItem('refreshToken')
        } else {
          sessionStorage.setItem('refreshToken', refreshToken)
          localStorage.removeItem('refreshToken')
        }
        set({ accessToken, refreshToken, user, orgToken: null, orgUser: null })
      },

      logout: () => {
        localStorage.removeItem('refreshToken')
        sessionStorage.removeItem('refreshToken')
        set({ accessToken: null, refreshToken: null, user: null, orgToken: null, orgUser: null })
      },

      isAuthenticated: () => get().accessToken !== null && get().user !== null,

      switchToClient: (switchToken: string) => {
        const { accessToken, user } = get()
        const switchedUser = parseTokenUser(switchToken)
        set({
          // Stash current org context
          orgToken: accessToken,
          orgUser:  user,
          // Activate switch context
          accessToken: switchToken,
          user: switchedUser,
        })
      },

      switchBack: () => {
        const { orgToken, orgUser } = get()
        if (!orgToken || !orgUser) return
        set({
          accessToken:  orgToken,
          user:         orgUser,
          orgToken:     null,
          orgUser:      null,
        })
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      partialize: (state) => ({
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
        user:         state.user,
        orgToken:     state.orgToken,
        orgUser:      state.orgUser,
      }),
    }
  )
)
