import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function getAuthenticatedUser(request: Request): Promise<User | NextResponse> {
  const authorization = request.headers.get('authorization')
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!accessToken) {
    return NextResponse.json({ error: 'Inicia sesión para continuar.' }, { status: 401 })
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Falta configurar Supabase Auth en el servidor.')
    return NextResponse.json({ error: 'La autenticación no está configurada.' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await supabase.auth.getUser(accessToken)

  if (error || !data.user) {
    return NextResponse.json({ error: 'La sesión no es válida o ha expirado.' }, { status: 401 })
  }
  if (!data.user.email) {
    return NextResponse.json({ error: 'La cuenta no tiene un correo verificado.' }, { status: 403 })
  }

  return data.user
}

export function isAuthenticatedUser(value: User | NextResponse): value is User {
  return !(value instanceof NextResponse)
}
