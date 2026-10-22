'use client'

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabaseBrowser } from '@/lib/supabase-browser'

export interface ShippingAddress {
  method: 'delivery' | 'messenger'
  recipientFirstName: string
  recipientLastName: string
  phone: string
  phone2: string
  address: string
  agency: string
  city: string
  postalCode: string
  mapsLink: string
  notes: string
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  signUp: (details: {
    firstName: string
    lastName: string
    nationalId: string
    phone: string
    email: string
    password: string
  }) => Promise<boolean>
  saveShippingAddress: (address: ShippingAddress) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabaseBrowser.auth.getSession().then(({ data, error }) => {
      if (error) console.error('No se pudo restaurar la sesión:', error)
      if (!active) return
      startTransition(() => {
        setSession(data.session)
        setIsLoading(false)
      })
    })

    const { data: authListener } = supabaseBrowser.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signUp = useCallback(async ({
    firstName,
    lastName,
    nationalId,
    phone,
    email,
    password,
  }: Parameters<AuthContextValue['signUp']>[0]) => {
    const { data, error } = await supabaseBrowser.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: firstName,
          apellido: lastName,
          nombre_completo: `${firstName} ${lastName}`,
          cedula: nationalId,
          telefono: phone,
        },
      },
    })
    if (error) throw error
    return Boolean(data.session)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const saveShippingAddress = useCallback(async (address: ShippingAddress) => {
    const { error } = await supabaseBrowser.auth.updateUser({
      data: { direccion_envio: address },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabaseBrowser.auth.signOut()
    if (error) throw error
  }, [])

  const getAccessToken = useCallback(async () => {
    const { data, error } = await supabaseBrowser.auth.getSession()
    if (error) throw error
    return data.session?.access_token ?? null
  }, [])

  const value = useMemo(() => ({
    user: session?.user ?? null,
    isLoading,
    signUp,
    saveShippingAddress,
    signIn,
    signOut,
    getAccessToken,
  }), [session, isLoading, signUp, saveShippingAddress, signIn, signOut, getAccessToken])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider.')
  return context
}
