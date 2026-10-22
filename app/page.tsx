import { prisma } from '@/lib/prisma'
import CatalogClient from './CatalogClient'

export const dynamic = 'force-dynamic'

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
}

export default async function HomePage() {
  const productos = await prisma.producto.findMany({
    orderBy: { createdAt: 'desc' }
  })

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
  }))

  return <CatalogClient products={products} />
}