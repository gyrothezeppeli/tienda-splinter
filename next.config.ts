import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  images: {
    domains: ['wotofmlingncpeuiyorb.supabase.co'],
  },
  
  // ⚠️ Algunas configuraciones se mueven a experimental
  experimental: {
    // Configuración opcional
  },
}

// ⚠️ Para ignorar errores de ESLint y TypeScript, usa variables de entorno
// en el comando de build: NEXT_TYPESCRIPT_IGNORE_BUILD_ERRORS=true npm run build

export default nextConfig