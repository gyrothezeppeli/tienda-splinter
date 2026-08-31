"use client";

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// =========================================================================
// PALETA NEUMÓRFICA
// =========================================================================
const PALETTE = {
  bg: '#E0E5EC',
  bgCard: '#E8EDF2',
  bgLight: '#F0F4F8',
  textPrimary: '#4A5568',
  textSecondary: '#718096',
  textMuted: '#A0AEC0',
  shadowLight: '#FFFFFF',
  shadowDark: '#A3B1C6',
  accent: '#3182CE',
  accentHover: '#2B6CB0',
  green: '#38A169',
  red: '#E53E3E',
  border: 'rgba(163, 177, 198, 0.3)',
};

export default function NuevoProducto() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'guitarras',
    price: '',
    originalPrice: '',
    status: 'Nuevo',
    label: '',
    badge: '',
    fallbackIcon: '🎸',
  })

  // Estado para la imagen (archivo y URL temporal)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona una imagen válida')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar los 5MB')
      return
    }

    setImageFile(file)
    
    // Crear URL para vista previa
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (productoId: string): Promise<string | null> => {
    if (!imageFile) return null

    try {
      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('productoId', productoId)

      const response = await fetch('/api/productos/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        return data.url
      }
      return null
    } catch (error) {
      console.error('Error al subir imagen:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Crear el producto sin imagen
      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          image: null, // Temporalmente null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert('Error al crear el producto: ' + (errorData.error || 'Error desconocido'))
        setLoading(false)
        return
      }

      const producto = await response.json()
      let imageUrl = null

      // 2. Subir la imagen si existe
      if (imageFile) {
        setUploadingImage(true)
        imageUrl = await uploadImage(producto.id)
        setUploadingImage(false)

        // 3. Actualizar el producto con la URL de la imagen
        if (imageUrl) {
          await fetch(`/api/productos/${producto.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...formData,
              price: parseFloat(formData.price),
              originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
              image: imageUrl,
            }),
          })
        }
      }

      router.push('/admin')
      router.refresh()

    } catch (error) {
      console.error('Error:', error)
      alert('Error de conexión')
    } finally {
      setLoading(false)
      setUploadingImage(false)
    }
  }

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      backgroundColor: PALETTE.bg,
      minHeight: '100vh',
      padding: '30px 6%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      
      {/* Estilos globales neumórficos */}
      <style>{`
        .neu-card {
          background: ${PALETTE.bgCard};
          border-radius: 28px;
          box-shadow: 12px 12px 24px ${PALETTE.shadowDark}, -12px -12px 24px ${PALETTE.shadowLight};
        }
        
        .neu-input {
          width: 100%;
          padding: 12px 16px;
          border: none;
          border-radius: 14px;
          background: ${PALETTE.bgLight};
          box-shadow: inset 4px 4px 8px ${PALETTE.shadowDark}, inset -4px -4px 8px ${PALETTE.shadowLight};
          font-size: 1rem;
          outline: none;
          color: ${PALETTE.textPrimary};
          font-family: inherit;
          transition: all 0.3s ease;
        }
        
        .neu-input:focus {
          box-shadow: inset 4px 4px 8px ${PALETTE.shadowDark}, inset -4px -4px 8px ${PALETTE.shadowLight}, 0 0 0 3px rgba(49, 130, 206, 0.15);
        }
        
        .neu-input::placeholder {
          color: ${PALETTE.textMuted};
        }
        
        .neu-select {
          width: 100%;
          padding: 12px 16px;
          border: none;
          border-radius: 14px;
          background: ${PALETTE.bgLight};
          box-shadow: inset 4px 4px 8px ${PALETTE.shadowDark}, inset -4px -4px 8px ${PALETTE.shadowLight};
          font-size: 1rem;
          outline: none;
          color: ${PALETTE.textPrimary};
          font-family: inherit;
          appearance: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .neu-select:focus {
          box-shadow: inset 4px 4px 8px ${PALETTE.shadowDark}, inset -4px -4px 8px ${PALETTE.shadowLight}, 0 0 0 3px rgba(49, 130, 206, 0.15);
        }
        
        .neu-btn {
          background: ${PALETTE.bgCard};
          border: none;
          border-radius: 14px;
          box-shadow: 5px 5px 10px ${PALETTE.shadowDark}, -5px -5px 10px ${PALETTE.shadowLight};
          cursor: pointer;
          font-weight: 700;
          color: ${PALETTE.textPrimary};
          transition: all 0.2s ease;
          padding: 12px 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .neu-btn:hover {
          box-shadow: 7px 7px 14px ${PALETTE.shadowDark}, -7px -7px 14px ${PALETTE.shadowLight};
          transform: translateY(-2px);
        }
        
        .neu-btn:active {
          box-shadow: inset 3px 3px 6px ${PALETTE.shadowDark}, inset -3px -3px 6px ${PALETTE.shadowLight};
          transform: translateY(1px);
        }
        
        .neu-btn-primary {
          background: ${PALETTE.accent};
          color: white;
          box-shadow: 6px 6px 12px ${PALETTE.shadowDark}, -6px -6px 12px ${PALETTE.shadowLight};
        }
        
        .neu-btn-primary:hover {
          background: ${PALETTE.accentHover};
          box-shadow: 8px 8px 16px ${PALETTE.shadowDark}, -8px -8px 16px ${PALETTE.shadowLight};
        }
        
        .neu-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }
        
        .neu-btn-cancel {
          width: 100%;
          background: ${PALETTE.bgCard};
          box-shadow: 4px 4px 8px ${PALETTE.shadowDark}, -4px -4px 8px ${PALETTE.shadowLight};
        }
        
        .neu-label {
          display: block;
          margin-bottom: 6px;
          font-weight: 700;
          font-size: 0.85rem;
          color: ${PALETTE.textPrimary};
          letter-spacing: 0.3px;
        }
        
        .neu-label-required::after {
          content: ' *';
          color: ${PALETTE.red};
        }
        
        .loading-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .image-preview {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 12px;
          border: 2px solid ${PALETTE.border};
          box-shadow: 4px 4px 8px ${PALETTE.shadowDark}, -4px -4px 8px ${PALETTE.shadowLight};
        }
      `}</style>

      {/* Contenedor del formulario */}
      <div className="neu-card" style={{
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
      }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: `1px solid ${PALETTE.border}`,
        }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '1.8rem',
              fontWeight: '800',
              color: PALETTE.textPrimary,
            }}>
              ➕ Nuevo Producto
            </h1>
            <p style={{ 
              margin: '4px 0 0 0', 
              color: PALETTE.textSecondary,
              fontSize: '0.85rem',
            }}>
              Completa los campos para agregar un producto
            </p>
          </div>
          <Link href="/admin">
            <button className="neu-btn" style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
            }}>
              ✖ Cancelar
            </button>
          </Link>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {/* Nombre */}
          <div style={{ marginBottom: '20px' }}>
            <label className="neu-label neu-label-required">
              Nombre del Producto
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Fender Stratocaster"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="neu-input"
            />
          </div>

          {/* Categoría - ACTUALIZADA con Accesorios */}
          <div style={{ marginBottom: '20px' }}>
            <label className="neu-label neu-label-required">
              Categoría
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="neu-select"
            >
              <option value="guitarras">🎸 Guitarras</option>
              <option value="pedales">🎛️ Pedales</option>
              <option value="cuerdas">〰️ Cuerdas</option>
              <option value="cables">🔌 Cables</option>
              <option value="correas">🎗️ Correas</option>
              <option value="accesorios">🎧 Accesorios</option> {/* ✅ NUEVO */}
            </select>
          </div>

          {/* Precios */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px', 
            marginBottom: '20px' 
          }}>
            <div>
              <label className="neu-label neu-label-required">
                Precio
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="neu-input"
              />
            </div>
            <div>
              <label className="neu-label">
                Precio Original
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className="neu-input"
              />
              <span style={{ 
                fontSize: '0.65rem', 
                color: PALETTE.textMuted,
                display: 'block',
                marginTop: '4px',
              }}>
                Dejar vacío si no aplica descuento
              </span>
            </div>
          </div>

          {/* Estado */}
          <div style={{ marginBottom: '20px' }}>
            <label className="neu-label">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="neu-select"
            >
              <option value="Nuevo">🆕 Nuevo</option>
              <option value="Segunda mano - Impecable">🔄 Segunda mano - Impecable</option>
              <option value="Segunda mano">🔄 Segunda mano</option>
            </select>
          </div>

          {/* Badge (opcional) */}
          <div style={{ marginBottom: '20px' }}>
            <label className="neu-label">
              Badge (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Oferta, Outlet, Reacondicionado"
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
              className="neu-input"
            />
          </div>

          {/* Campo de Imagen */}
          <div style={{ marginBottom: '20px' }}>
            <label className="neu-label">
              Imagen del Producto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploadingImage}
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderRadius: '12px',
                background: PALETTE.bgLight,
                boxShadow: 'inset 4px 4px 8px #A3B1C6, inset -4px -4px 8px #FFFFFF',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            />
            {uploadingImage && (
              <p style={{ 
                color: PALETTE.textMuted, 
                fontSize: '0.85rem',
                marginTop: '8px',
              }}>
                ⏳ Subiendo imagen...
              </p>
            )}
            {imagePreview && (
              <div style={{ marginTop: '12px' }}>
                <img 
                  src={imagePreview} 
                  alt="Vista previa" 
                  className="image-preview"
                />
                <p style={{ 
                  fontSize: '0.7rem', 
                  color: PALETTE.textMuted,
                  marginTop: '4px',
                }}>
                  ✅ Imagen seleccionada
                </p>
              </div>
            )}
          </div>

          {/* Icono (fallback) */}
          <div style={{ marginBottom: '24px' }}>
            <label className="neu-label">
              Icono (emoji) <span style={{ color: PALETTE.textMuted, fontWeight: '400' }}>(si no hay imagen)</span>
            </label>
            <input
              type="text"
              placeholder="🎸"
              value={formData.fallbackIcon}
              onChange={(e) => setFormData({ ...formData, fallbackIcon: e.target.value })}
              className="neu-input"
              style={{ fontSize: '1.5rem' }}
            />
          </div>

          {/* Botones */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '8px',
            paddingTop: '20px',
            borderTop: `1px solid ${PALETTE.border}`,
          }}>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="neu-btn neu-btn-primary"
              style={{ flex: 1 }}
            >
              {loading || uploadingImage ? (
                <>
                  <span className="loading-spinner" />
                  {uploadingImage ? 'Subiendo imagen...' : 'Guardando...'}
                </>
              ) : (
                '💾 Guardar Producto'
              )}
            </button>
            <Link href="/admin" style={{ flex: 1 }}>
              <button
                type="button"
                className="neu-btn neu-btn-cancel"
                style={{ width: '100%' }}
              >
                Cancelar
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}