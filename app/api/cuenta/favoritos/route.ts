import { NextResponse } from 'next/server'
import { getAuthenticatedUser, isAuthenticatedUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

function isProductId(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request)
  if (!isAuthenticatedUser(authUser)) return authUser

  try {
    const user = await prisma.usuario.upsert({
      where: { id: authUser.id },
      create: { id: authUser.id, email: authUser.email! },
      update: { email: authUser.email! },
    })
    const favorites = await prisma.favorito.findMany({
      where: { usuarioId: user.id },
      select: { productoId: true },
    })
    return NextResponse.json({ productIds: favorites.map(favorite => favorite.productoId) })
  } catch (error) {
    console.error('No se pudieron cargar los favoritos:', error)
    return NextResponse.json({ error: 'No se pudieron cargar tus favoritos.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request)
  if (!isAuthenticatedUser(authUser)) return authUser

  const body: unknown = await request.json().catch(() => null)
  const productId = body && typeof body === 'object' && 'productId' in body
    ? body.productId
    : null
  if (!isProductId(productId)) {
    return NextResponse.json({ error: 'Selecciona un producto válido.' }, { status: 400 })
  }

  try {
    const product = await prisma.producto.findUnique({ where: { id: productId }, select: { id: true } })
    if (!product) return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 })

    await prisma.$transaction(async transaction => {
      await transaction.usuario.upsert({
        where: { id: authUser.id },
        create: { id: authUser.id, email: authUser.email! },
        update: { email: authUser.email! },
      })
      await transaction.favorito.upsert({
        where: { usuarioId_productoId: { usuarioId: authUser.id, productoId: productId } },
        create: { usuarioId: authUser.id, productoId: productId },
        update: {},
      })
    })
    return NextResponse.json({ saved: true })
  } catch (error) {
    console.error('No se pudo guardar el favorito:', error)
    return NextResponse.json({ error: 'No se pudo guardar el favorito.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const authUser = await getAuthenticatedUser(request)
  if (!isAuthenticatedUser(authUser)) return authUser

  const body: unknown = await request.json().catch(() => null)
  const productId = body && typeof body === 'object' && 'productId' in body
    ? body.productId
    : null
  if (!isProductId(productId)) {
    return NextResponse.json({ error: 'Selecciona un producto válido.' }, { status: 400 })
  }

  try {
    await prisma.favorito.deleteMany({
      where: { usuarioId: authUser.id, productoId: productId },
    })
    return NextResponse.json({ saved: false })
  } catch (error) {
    console.error('No se pudo quitar el favorito:', error)
    return NextResponse.json({ error: 'No se pudo quitar el favorito.' }, { status: 500 })
  }
}
