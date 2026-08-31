import { prisma } from '@/lib/prisma'
import CatalogClient from './CatalogClient'

// =========================================================================
// INTERFACES (compartidas)
// =========================================================================
export interface Product {
  id: string
  name: string
  category: string
  price: number
  originalPrice: number | null
  status: string
  label: string | null
  badge: string | null
  image: string | null
  fallbackIcon: string
}

// =========================================================================
// SERVER COMPONENT - Obtiene datos (sin "use client")
// =========================================================================
export default async function HomePage() {
  // ✅ Prisma funciona aquí (Server Component)
  const productos = await prisma.producto.findMany({
    orderBy: { createdAt: 'desc' }
  })

  // Convertir datos
  const products: Product[] = productos.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    originalPrice: p.originalPrice,
    status: p.status,
    label: p.label,
    badge: p.badge,
    image: p.image,
    fallbackIcon: p.fallbackIcon || '📦'
  }))

  // ✅ Pasa los datos al Client Component
  return <CatalogClient products={products} />
}