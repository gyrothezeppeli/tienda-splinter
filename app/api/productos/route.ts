import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(productos)
    
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const producto = await prisma.producto.create({
      data: {
        name: data.name,
        category: data.category,
        price: parseFloat(data.price),
        originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : null,
        status: data.status,
        label: data.label || null,
        badge: data.badge || null,
        image: data.image || null,
        fallbackIcon: data.fallbackIcon || '📦',
      }
    })
    
    return NextResponse.json(producto, { status: 201 })
    
  } catch (error) {
    console.error('❌ Error en POST:', error)
    return NextResponse.json(
      { error: 'Error al crear el producto' },
      { status: 500 }
    )
  }
}