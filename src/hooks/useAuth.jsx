import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithOtp = async (email) => {
    return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
  }

  const signOut = async () => {
    return supabase.auth.signOut()
  }

  const updateProfile = async (data) => {
    const { data: result, error } = await supabase.auth.updateUser({ data })
    if (result?.user) setUser(result.user)
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithOtp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
