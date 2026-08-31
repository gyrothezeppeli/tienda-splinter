import { prisma } from '@/lib/prisma'
import AdminClient from './AdminClient'

// =========================================================================
// SERVER COMPONENT - Obtiene datos (sin "use client")
// =========================================================================
export default async function AdminPage() {
  const productos = await prisma.producto.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return <AdminClient productos={productos} />
}