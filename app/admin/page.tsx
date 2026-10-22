import { prisma } from '@/lib/prisma'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const productos = await prisma.producto.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return <AdminClient productos={productos} />
}