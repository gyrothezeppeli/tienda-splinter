import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// ✅ El bucket se llama 'productos'
const BUCKET_NAME = 'productos'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 API upload-image - Iniciando...')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const productoId = formData.get('productoId') as string

    console.log('📤 Archivo:', file?.name, 'Tamaño:', file?.size)
    console.log('📤 Producto ID:', productoId)

    if (!file || !productoId) {
      return NextResponse.json(
        { error: 'Archivo o ID de producto no proporcionado' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen' },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'La imagen no puede superar los 5MB' },
        { status: 400 }
      )
    }

    // Generar nombre único
    const fileExt = file.name.split('.').pop()
    const fileName = `${productoId}-${uuidv4()}.${fileExt}`
    const filePath = `productos/${fileName}`

    console.log('📤 Guardando como:', filePath)

    // Convertir a Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // ✅ Usar el bucket 'productos'
    console.log('📤 Bucket:', BUCKET_NAME)
    
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('❌ Error en upload:', error)
      return NextResponse.json(
        { error: 'Error al subir la imagen: ' + error.message },
        { status: 500 }
      )
    }

    console.log('✅ Imagen subida:', data)

    // Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    console.log('✅ URL pública:', urlData.publicUrl)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    })

  } catch (error) {
    console.error('❌ Error general:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la imagen' },
      { status: 500 }
    )
  }
}