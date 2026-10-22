import { NextResponse } from 'next/server'
import { getAuthenticatedUser, isAuthenticatedUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request)
  if (!isAuthenticatedUser(authUser)) return authUser

  const firstName = typeof authUser.user_metadata.nombre === 'string'
    ? authUser.user_metadata.nombre.trim()
    : ''
  const lastName = typeof authUser.user_metadata.apellido === 'string'
    ? authUser.user_metadata.apellido.trim()
    : ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || null

  try {
    const user = await prisma.usuario.upsert({
      where: { id: authUser.id },
      create: {
        id: authUser.id,
        email: authUser.email!,
        nombre: fullName,
      },
      update: {
        email: authUser.email!,
        nombre: fullName ?? undefined,
      },
    })

    const [orders, favorites] = await Promise.all([
      prisma.pedido.findMany({
        where: { usuarioId: user.id },
        orderBy: { fechaPedido: 'desc' },
        include: {
          detalles: {
            include: {
              producto: {
                select: { id: true, name: true, category: true, image: true },
              },
            },
          },
        },
      }),
      prisma.favorito.findMany({
        where: { usuarioId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          producto: {
            select: { id: true, name: true, category: true, price: true, image: true },
          },
        },
      }),
    ])

    return NextResponse.json({
      profile: { id: user.id, name: user.nombre, email: user.email },
      orders,
      favorites: favorites.map(favorite => favorite.producto),
    })
  } catch (error) {
    console.error('No se pudo cargar el perfil del comprador:', error)
    return NextResponse.json({ error: 'No se pudo cargar tu perfil.' }, { status: 500 })
  }
}
