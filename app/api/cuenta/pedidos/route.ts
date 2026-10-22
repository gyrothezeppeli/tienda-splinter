import { NextResponse } from 'next/server'
import { getAuthenticatedUser, isAuthenticatedUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

interface OrderRequest {
  items: Array<{ productId: string; quantity: number }>
  method: 'delivery' | 'messenger'
  recipientFirstName: string
  recipientLastName: string
  phone2?: string
  address?: string
  agency?: string
  city?: string
  postalCode?: string
  phone: string
  mapsLink?: string
  notes?: string
}

function isGoogleMapsLink(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' &&
      ['google.com', 'www.google.com', 'maps.google.com', 'maps.app.goo.gl', 'goo.gl'].includes(url.hostname)
  } catch {
    return false
  }
}

function isOrderRequest(value: unknown): value is OrderRequest {
  if (!value || typeof value !== 'object') return false
  const order = value as Partial<OrderRequest>
  const commonFieldsValid =
    (order.method === 'delivery' || order.method === 'messenger') &&
    typeof order.recipientFirstName === 'string' && order.recipientFirstName.trim().length >= 2 && order.recipientFirstName.length <= 80 &&
    typeof order.recipientLastName === 'string' && order.recipientLastName.trim().length >= 2 && order.recipientLastName.length <= 80 &&
    typeof order.phone === 'string' && order.phone.trim().length >= 7 && order.phone.length <= 30 &&
    (order.phone2 === undefined || (typeof order.phone2 === 'string' && order.phone2.length <= 30)) &&
    (order.mapsLink === undefined || (typeof order.mapsLink === 'string' && order.mapsLink.length <= 500 && (!order.mapsLink || isGoogleMapsLink(order.mapsLink)))) &&
    (order.notes === undefined || (typeof order.notes === 'string' && order.notes.length <= 1000))
  const shippingFieldsValid = order.method === 'delivery'
    ? typeof order.address === 'string' && order.address.trim().length >= 5 && order.address.length <= 300 &&
      order.city === 'Caracas' && (order.postalCode === '' || order.postalCode === undefined) &&
      (order.agency === undefined || order.agency === '')
    : typeof order.agency === 'string' && order.agency.trim().length >= 2 && order.agency.length <= 150 &&
      (order.address === undefined || order.address === '') &&
      (order.city === undefined || order.city === '') &&
      (order.postalCode === undefined || order.postalCode === '')

  return commonFieldsValid && shippingFieldsValid && Array.isArray(order.items) &&
    order.items.length > 0 &&
    order.items.length <= 100 &&
    order.items.every(item =>
      Boolean(
        item &&
        typeof item.productId === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.productId) &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1 &&
        item.quantity <= 100
      )
    ) &&
    new Set(order.items.map(item => item.productId)).size === order.items.length
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request)
  if (!isAuthenticatedUser(authUser)) return authUser

  const body: unknown = await request.json().catch(() => null)
  if (!isOrderRequest(body)) {
    return NextResponse.json({ error: 'Revisa los datos de entrega y los productos seleccionados.' }, { status: 400 })
  }

  const whatsappPhone = process.env.WHATSAPP_ORDER_PHONE?.replace(/\D/g, '')
  if (!whatsappPhone) {
    console.error('Falta configurar WHATSAPP_ORDER_PHONE para compartir los pedidos por WhatsApp.')
    return NextResponse.json(
      { error: 'No se puede completar el pedido porque falta configurar el número de WhatsApp.' },
      { status: 500 },
    )
  }

  try {
    const products = await prisma.producto.findMany({
      where: { id: { in: body.items.map(item => item.productId) } },
      select: { id: true, name: true, price: true },
    })
    if (products.length !== body.items.length) {
      return NextResponse.json({ error: 'Uno o más productos ya no están disponibles.' }, { status: 409 })
    }

    const productById = new Map(products.map(product => [product.id, product]))
    const details = body.items.map(item => {
      const product = productById.get(item.productId)
      if (!product) return null
      return {
        productoId: product.id,
        cantidad: item.quantity,
        precioUnitario: product.price,
        descuento: 0,
        subtotal: product.price * item.quantity,
      }
    })
    if (details.some(detail => detail === null)) {
      return NextResponse.json({ error: 'Uno o más productos ya no están disponibles.' }, { status: 409 })
    }
    const validDetails = details.filter((detail): detail is NonNullable<typeof detail> => detail !== null)
    const subtotal = validDetails.reduce((sum, item) => sum + item.subtotal, 0)

    const order = await prisma.$transaction(async transaction => {
      const user = await transaction.usuario.upsert({
        where: { id: authUser.id },
        create: {
          id: authUser.id,
          email: authUser.email!,
          nombre: typeof authUser.user_metadata.nombre === 'string'
            ? authUser.user_metadata.nombre
            : null,
        },
        update: { email: authUser.email! },
      })

      return transaction.pedido.create({
        data: {
          usuarioId: user.id,
          subtotal,
          impuestos: 0,
          envio: 0,
          total: subtotal,
          estado: 'pendiente',
          direccion: (body.method === 'delivery' ? body.address : body.agency)?.trim() ?? '',
          ciudad: body.method === 'delivery' ? 'Caracas, Venezuela' : 'Agencia de mensajería',
          codigoPostal: '',
          telefono: body.phone.trim(),
          notas: [
            `Método de envío: ${body.method === 'delivery' ? 'Delivery' : 'Mensajería'}`,
            `Recibe: ${body.recipientFirstName.trim()} ${body.recipientLastName.trim()}`,
            body.phone2?.trim() ? `Teléfono 2: ${body.phone2.trim()}` : null,
            body.mapsLink?.trim() ? `Google Maps: ${body.mapsLink.trim()}` : null,
            body.notes?.trim() ? `Indicaciones: ${body.notes.trim()}` : null,
          ].filter(Boolean).join('\n'),
          metodoPago: 'por_coordinar',
          detalles: { create: validDetails },
        },
        select: { id: true, total: true, estado: true, fechaPedido: true },
      })
    })

    const recipientName = `${body.recipientFirstName.trim()} ${body.recipientLastName.trim()}`
    const productLines = validDetails.map(item => {
      const product = productById.get(item.productoId)
      return `- ${item.cantidad} x ${product?.name ?? 'Producto'}: $${item.subtotal.toFixed(2)}`
    })
    const message = [
      `Nuevo pedido SonicLab #${order.id.slice(0, 8)}`,
      '',
      `Cliente: ${[authUser.user_metadata.nombre, authUser.user_metadata.apellido].filter(value => typeof value === 'string').join(' ') || recipientName}`,
      `Correo: ${authUser.email ?? 'No indicado'}`,
      `Recibe: ${recipientName}`,
      `Teléfono 1: ${body.phone.trim()}`,
      body.phone2?.trim() ? `Teléfono 2: ${body.phone2.trim()}` : null,
      `Método de envío: ${body.method === 'delivery' ? 'Delivery (Caracas, Venezuela)' : 'Mensajería'}`,
      body.method === 'delivery' ? `Ubicación: ${body.address?.trim()}` : `Agencia: ${body.agency?.trim()}`,
      body.method === 'delivery' && body.mapsLink?.trim() ? `Google Maps: ${body.mapsLink.trim()}` : null,
      body.notes?.trim() ? `Indicaciones: ${body.notes.trim()}` : null,
      '',
      'Productos:',
      ...productLines,
      '',
      `Total: $${order.total.toFixed(2)}`,
      'Solicito coordinar el pago y la entrega.',
    ].filter(Boolean).join('\n')
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`

    return NextResponse.json({ order, whatsappUrl }, { status: 201 })
  } catch (error) {
    console.error('No se pudo registrar el pedido:', error)
    return NextResponse.json({ error: 'No se pudo registrar el pedido.' }, { status: 500 })
  }
}
