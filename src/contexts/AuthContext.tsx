import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { clearStore, hydrate } from '@/lib/store'
import type { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string }>
  requestPasswordReset: (email: string) => Promise<{ error?: string }>
  setNewPassword: (newPassword: string) => Promise<{ error?: string }>
}

const Ctx = createContext<AuthState>({
  user: null,
  loading: true,
  signIn: async () => ({ error: 'not implemented' }),
  signOut: async () => {},
  changePassword: async () => ({ error: 'not implemented' }),
  requestPasswordReset: async () => ({ error: 'not implemented' }),
  setNewPassword: async () => ({ error: 'not implemented' }),
})

function mapUser(session: { user: { id: string; email?: string; user_metadata?: Record<string, unknown> } }): AuthUser {
  const u = session.user
  return {
    id: u.id,
    email: u.email ?? '',
    display_name:
      (u.user_metadata?.display_name as string | undefined) ??
      u.email?.split('@')[0] ??
      'Utilisateur',
    avatar_url: (u.user_metadata?.avatar_url as string | null | undefined) ?? null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      // Hard requirement now — there is no demo mode anymore.
      setLoading(false)
      return
    }

    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      if (data.session?.user) {
        setUser(mapUser(data.session))
        void hydrate().catch(() => {})
      }
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null)
        clearStore()
      } else {
        setUser(mapUser(session))
        void hydrate().catch(() => {})
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn: AuthState['signIn'] = async (email, password) => {
    if (!supabase) return { error: 'Supabase non configuré.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    clearStore()
  }

  const requestPasswordReset: AuthState['requestPasswordReset'] = async (email) => {
    if (!supabase) return { error: 'Supabase non configuré.' }
    const origin =
      typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/mot-de-passe/reinitialiser`,
    })
    if (error) return { error: error.message }
    return {}
  }

  const setNewPassword: AuthState['setNewPassword'] = async (newPassword) => {
    if (!supabase) return { error: 'Supabase non configuré.' }
    // Requires an active session (the recovery link landed and the client
    // auto-exchanged the token for a session).
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: error.message }
    return {}
  }

  const changePassword: AuthState['changePassword'] = async (currentPassword, newPassword) => {
    if (!supabase) return { error: 'Supabase non configuré.' }
    if (!user?.email) return { error: 'Aucune session active.' }

    // Re-verify the current password by attempting to sign in — Supabase
    // doesn't gate updateUser on it, so we do it explicitly. Successful
    // re-sign-in just refreshes the existing session.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (verifyError) return { error: 'current_invalid' }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) return { error: updateError.message }
    return {}
  }

  return (
    <Ctx.Provider value={{ user, loading, signIn, signOut, changePassword, requestPasswordReset, setNewPassword }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
