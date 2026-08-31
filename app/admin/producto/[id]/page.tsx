"use client";

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// =========================================================================
// PALETA NEUMÓRFICA (coincide con el catálogo y admin)
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

// =========================================================================
// CLIENT COMPONENT
// =========================================================================
export default function EditarProducto({ params }: { params: Promise<{ id: string }> }) {
  // ✅ Desenvolver params con React.use()
  const { id } = use(params)
  
  console.log('🔍 ID del producto a editar:', id)
  
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  // ✅ Usar id correctamente
  useEffect(() => {
    const loadProduct = async () => {
      try {
        console.log('🔄 Cargando producto...')
        setError(null)
        
        const url = `/api/productos/${id}`
        console.log('📡 URL de la API:', url)
        
        const response = await fetch(url)
        console.log('📡 Status de respuesta:', response.status)
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ Error de API:', errorData)
          throw new Error(errorData.error || `Error ${response.status}`)
        }
        
        const data = await response.json()
        console.log('✅ Producto cargado:', data)
        
        setFormData({
          name: data.name,
          category: data.category,
          price: data.price.toString(),
          originalPrice: data.originalPrice?.toString() || '',
          status: data.status,
          label: data.label || '',
          badge: data.badge || '',
          fallbackIcon: data.fallbackIcon || '🎸',
        })
      } catch (error) {
        console.error('❌ Error al cargar producto:', error)
        setError(error instanceof Error ? error.message : 'Error al cargar el producto')
      } finally {
        setCargandoDatos(false)
      }
    }
    
    if (id) {
      loadProduct()
    } else {
      console.warn('⚠️ No hay ID disponible')
      setError('ID de producto no válido')
      setCargandoDatos(false)
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        }),
      })

      if (response.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(`Error al actualizar: ${errorData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      alert('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Mostrar estado de carga
  if (cargandoDatos) {
    return (
      <div style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        backgroundColor: PALETTE.bg,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          background: PALETTE.bg,
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '8px 8px 16px #A3B1C6, -8px -8px 16px #FFFFFF',
        }}>
          Cargando producto...
        </div>
      </div>
    )
  }

  // Mostrar error
  if (error) {
    return (
      <div style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        backgroundColor: PALETTE.bg,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '20px',
      }}>
        <div style={{
          background: PALETTE.bg,
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '8px 8px 16px #A3B1C6, -8px -8px 16px #FFFFFF',
          maxWidth: '500px',
        }}>
          <span style={{ fontSize: '4rem' }}>😕</span>
          <h2 style={{ color: PALETTE.textPrimary }}>Error al cargar el producto</h2>
          <p style={{ color: PALETTE.textSecondary }}>{error}</p>
          <p style={{ fontSize: '0.8rem', color: PALETTE.textMuted, marginTop: '10px' }}>
            ID: <code style={{ background: '#E8EDF2', padding: '2px 8px', borderRadius: '4px' }}>{id}</code>
          </p>
          <Link href="/admin">
            <button className="neu-btn neu-btn-primary" style={{ marginTop: '20px' }}>
              ← Volver al panel
            </button>
          </Link>
        </div>
      </div>
    )
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
      `}</style>

      {/* Contenedor del formulario */}
      <div className="neu-card" style={{
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
      }}>
        
        {/* Header del formulario */}
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
              ✏️ Editar Producto
            </h1>
            <p style={{ 
              margin: '4px 0 0 0', 
              color: PALETTE.textSecondary,
              fontSize: '0.85rem',
            }}>
              Modifica los campos del producto
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

          {/* Icono */}
          <div style={{ marginBottom: '24px' }}>
            <label className="neu-label">
              Icono (emoji)
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

          {/* Botones de acción */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '8px',
            paddingTop: '20px',
            borderTop: `1px solid ${PALETTE.border}`,
          }}>
            <button
              type="submit"
              disabled={loading}
              className="neu-btn neu-btn-primary"
              style={{ flex: 1 }}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" />
                  Guardando...
                </>
              ) : (
                '💾 Actualizar Producto'
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