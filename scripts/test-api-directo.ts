import { prisma } from '@/lib/prisma'

async function main() {
  try {
    console.log('🔍 Probando acceso directo a la base de datos...\n')
    
    // 1. Buscar el producto específico
    const id = 'e3487938-abf4-4121-bb8d-e9945d103e80'
    console.log('1️⃣ Buscando producto con ID:', id)
    
    const producto = await prisma.producto.findUnique({
      where: { id: id }
    })
    
    if (producto) {
      console.log('✅ Producto encontrado:')
      console.log(`   ID: ${producto.id}`)
      console.log(`   Nombre: ${producto.name}`)
      console.log(`   Categoría: ${producto.category}`)
      console.log(`   Precio: $${producto.price}`)
    } else {
      console.log('❌ Producto NO encontrado')
    }
    
    // 2. Listar todos los productos
    console.log('\n2️⃣ Listando todos los productos:')
    const todos = await prisma.producto.findMany()
    console.log(`Total: ${todos.length} productos`)
    todos.forEach(p => {
      console.log(`   - ${p.id.slice(0,8)}: ${p.name} ($${p.price})`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()