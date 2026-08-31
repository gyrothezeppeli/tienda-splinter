import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// ✅ GET - Obtener un producto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ← Promise
) {
  try {
    // 🔑 CLAVE: Desenvolver params con await
    const { id } = await params
    
    console.log('🔍 API GET - Buscando producto:', id)
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID no proporcionado' },
        { status: 400 }
      )
    }
    
    const producto = await prisma.producto.findUnique({
      where: { id }
    })
    
    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(producto)
    
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener el producto' },
      { status: 500 }
    )
  }
}

// ✅ PUT - Actualizar un producto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ← Promise
) {
  try {
    const { id } = await params  // ← await
    const data = await request.json()
    
    console.log('🔄 API PUT - Actualizando:', id)
    
    const producto = await prisma.producto.update({
      where: { id },
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
    
    return NextResponse.json(producto)
    
  } catch (error) {
    console.error('❌ Error en PUT:', error)
    return NextResponse.json(
      { error: 'Error al actualizar' },
      { status: 500 }
    )
  }
}

// ✅ DELETE - Eliminar un producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ← Promise
) {
  try {
    const { id } = await params  // ← await
    
    console.log('🗑️ API DELETE - Eliminando:', id)
    
    await prisma.producto.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Eliminado' })
    
  } catch (error) {
    console.error('❌ Error en DELETE:', error)
    return NextResponse.json(
      { error: 'Error al eliminar' },
      { status: 500 }
    )
  }
}