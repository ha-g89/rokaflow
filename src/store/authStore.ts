import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/auth'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      login: (accessToken, refreshToken, user) => {
        localStorage.setItem('refreshToken', refreshToken)
        set({ accessToken, refreshToken, user })
      },

      logout: () => {
        localStorage.removeItem('refreshToken')
        set({ accessToken: null, refreshToken: null, user: null })
      },

      isAuthenticated: () => get().accessToken !== null && get().user !== null,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
)
