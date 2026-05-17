import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import type { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  isMock: boolean
}

const Ctx = createContext<AuthState>({
  user: null,
  loading: true,
  signIn: async () => ({ error: 'not implemented' }),
  signOut: async () => {},
  isMock: !supabaseConfigured,
})

const MOCK_KEY = 'tf-mock-session'
const DEMO_USER: AuthUser = {
  id: 'mock-admin',
  email: 'admin@tontonfrancky.com',
  display_name: 'François — Gérant',
  avatar_url: null,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (!active) return
        const s = data.session
        if (s?.user) {
          setUser({
            id: s.user.id,
            email: s.user.email ?? '',
            display_name:
              (s.user.user_metadata?.display_name as string | undefined) ??
              s.user.email?.split('@')[0] ??
              'Utilisateur',
            avatar_url: (s.user.user_metadata?.avatar_url as string | null | undefined) ?? null,
          })
        }
        setLoading(false)
      })

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) setUser(null)
        else
          setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            display_name:
              (session.user.user_metadata?.display_name as string | undefined) ??
              session.user.email?.split('@')[0] ??
              'Utilisateur',
            avatar_url:
              (session.user.user_metadata?.avatar_url as string | null | undefined) ?? null,
          })
      })

      return () => {
        active = false
        sub.subscription.unsubscribe()
      }
    } else {
      // Mock session via localStorage
      const raw = localStorage.getItem(MOCK_KEY)
      if (raw) {
        try {
          setUser(JSON.parse(raw) as AuthUser)
        } catch {
          /* noop */
        }
      }
      setLoading(false)
    }
  }, [])

  const signIn: AuthState['signIn'] = async (email, password) => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      return {}
    }
    // Mock: accept any non-empty email + password >= 4 chars
    if (!email || password.length < 4) {
      return { error: 'Identifiants invalides' }
    }
    const u: AuthUser = {
      ...DEMO_USER,
      email,
      display_name: email.split('@')[0] || DEMO_USER.display_name,
    }
    localStorage.setItem(MOCK_KEY, JSON.stringify(u))
    setUser(u)
    return {}
  }

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    } else {
      localStorage.removeItem(MOCK_KEY)
    }
    setUser(null)
  }

  return (
    <Ctx.Provider value={{ user, loading, signIn, signOut, isMock: !supabaseConfigured }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
