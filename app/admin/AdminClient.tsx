"use client";

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

interface Product {
  id: string
  name: string
  category: string
  price: number
  status: string
}

// =========================================================================
// PALETA NEUMÓRFICA (coincide con el catálogo)
// =========================================================================
const PALETTE = {
  bg: '#E0E5EC',
  bgCard: '#E8EDF2',
  textPrimary: '#4A5568',
  textSecondary: '#718096',
  textMuted: '#A0AEC0',
  shadowLight: '#FFFFFF',
  shadowDark: '#A3B1C6',
  accent: '#3182CE',
  accentHover: '#2B6CB0',
  red: '#E53E3E',
  redHover: '#C53030',
  green: '#38A169',
  border: 'rgba(163, 177, 198, 0.3)',
};

// ✅ Mapa de íconos por categoría
const CATEGORY_ICONS: Record<string, string> = {
  'guitarras': '🎸',
  'pedales': '🎛️',
  'cuerdas': '〰️',
  'cables': '🔌',
  'correas': '🎗️',
  'accesorios': '🎧',
};

export default function AdminClient({ productos }: { productos: Product[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto permanentemente?')) return
    
    setDeletingId(id)
    try {
      const response = await fetch(`/api/productos/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        router.refresh()
      } else {
        alert('Error al eliminar el producto')
      }
    } catch (error) {
      alert('Error de conexión')
    } finally {
      setDeletingId(null)
    }
  }

  // ✅ Función para obtener el ícono de la categoría
  const getCategoryIcon = (category: string) => {
    return CATEGORY_ICONS[category] || '📦'
  }

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      backgroundColor: PALETTE.bg,
      minHeight: '100vh',
      padding: '30px 6%',
    }}>
      
      {/* Estilos globales neumórficos */}
      <style>{`
        .neu-card {
          background: ${PALETTE.bgCard};
          border-radius: 24px;
          box-shadow: 9px 9px 18px ${PALETTE.shadowDark}, -9px -9px 18px ${PALETTE.shadowLight};
          transition: all 0.3s ease;
        }
        
        .neu-btn {
          background: ${PALETTE.bgCard};
          border: none;
          border-radius: 12px;
          box-shadow: 5px 5px 10px ${PALETTE.shadowDark}, -5px -5px 10px ${PALETTE.shadowLight};
          cursor: pointer;
          font-weight: 700;
          color: ${PALETTE.textPrimary};
          transition: all 0.2s ease;
          padding: 10px 20px;
          display: inline-flex;
          align-items: center;
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
        
        .neu-btn-danger {
          background: ${PALETTE.red};
          color: white;
        }
        
        .neu-btn-danger:hover {
          background: ${PALETTE.redHover};
        }
        
        .neu-pill {
          background: ${PALETTE.bgCard};
          border: none;
          border-radius: 50px;
          box-shadow: inset 3px 3px 6px ${PALETTE.shadowDark}, inset -3px -3px 6px ${PALETTE.shadowLight};
          padding: 4px 14px;
          font-size: 0.7rem;
          font-weight: 700;
          color: ${PALETTE.textSecondary};
        }
        
        .neu-pill-green {
          background: ${PALETTE.green};
          color: white;
          box-shadow: inset 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .neu-pill-red {
          background: ${PALETTE.red};
          color: white;
          box-shadow: inset 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .neu-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .neu-table th {
          text-align: left;
          padding: 16px 20px;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: ${PALETTE.textMuted};
          font-weight: 700;
        }
        
        .neu-table td {
          padding: 14px 20px;
          border-bottom: 1px solid ${PALETTE.border};
          color: ${PALETTE.textPrimary};
        }
        
        .neu-table tr:last-child td {
          border-bottom: none;
        }
        
        .neu-table tr:hover td {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .neu-icon-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 6px 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        .neu-icon-btn:hover {
          background: ${PALETTE.bg};
          box-shadow: inset 2px 2px 4px ${PALETTE.shadowDark}, inset -2px -2px 4px ${PALETTE.shadowLight};
        }
        
        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid ${PALETTE.shadowDark};
          border-top: 2px solid ${PALETTE.accent};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px 30px',
        background: PALETTE.bgCard,
        borderRadius: '24px',
        boxShadow: '8px 8px 16px #A3B1C6, -8px -8px 16px #FFFFFF',
      }}>
        <div>
          <Link href="/" style={{ 
            textDecoration: 'none', 
            color: PALETTE.textSecondary,
            fontSize: '0.9rem',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            ← Volver a la tienda
          </Link>
          <h1 style={{ 
            margin: '8px 0 4px 0', 
            fontSize: '1.8rem',
            fontWeight: '800',
            color: PALETTE.textPrimary,
          }}>
            ⚙️ Administrar Productos
          </h1>
          <p style={{ 
            color: PALETTE.textSecondary,
            margin: 0,
            fontSize: '0.9rem',
          }}>
            {productos.length} productos en total
          </p>
        </div>
        <Link href="/admin/nuevo">
          <button className="neu-btn neu-btn-primary" style={{
            padding: '12px 28px',
            fontSize: '0.9rem',
          }}>
            ➕ Nuevo Producto
          </button>
        </Link>
      </header>

      {/* Tabla de productos */}
      <div className="neu-card" style={{
        overflow: 'hidden',
        padding: '4px 0',
      }}>
        <table className="neu-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={5} style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: PALETTE.textMuted,
                }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>📦</span>
                  No hay productos registrados aún
                </td>
              </tr>
            ) : (
              productos.map((producto) => (
                <tr key={producto.id}>
                  <td style={{ fontWeight: '700' }}>
                    {producto.name}
                  </td>
                  <td>
                    <span className="neu-pill">
                      {getCategoryIcon(producto.category)} {producto.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700' }}>
                    ${producto.price.toFixed(2)}
                  </td>
                  <td>
                    <span className={`neu-pill ${producto.status === 'Nuevo' ? 'neu-pill-green' : 'neu-pill-red'}`}>
                      {producto.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '6px',
                    }}>
                      <Link href={`/admin/producto/${producto.id}`}>
                        <button className="neu-icon-btn" title="Editar">
                          ✏️
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(producto.id)}
                        className="neu-icon-btn"
                        style={{ 
                          color: PALETTE.red,
                          opacity: deletingId === producto.id ? 0.5 : 1,
                          cursor: deletingId === producto.id ? 'not-allowed' : 'pointer',
                        }}
                        disabled={deletingId === producto.id}
                        title="Eliminar"
                      >
                        {deletingId === producto.id ? (
                          <span className="loading-spinner" />
                        ) : (
                          '🗑️'
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de página con estadísticas */}
      <div style={{
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: PALETTE.bgCard,
        borderRadius: '16px',
        boxShadow: '4px 4px 8px #A3B1C6, -4px -4px 8px #FFFFFF',
        fontSize: '0.85rem',
        color: PALETTE.textSecondary,
      }}>
        <div>
          <strong style={{ color: PALETTE.textPrimary }}>{productos.length}</strong> productos activos
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>
            🆕 <strong>{productos.filter(p => p.status === 'Nuevo').length}</strong> nuevos
          </span>
          <span>
            🔄 <strong>{productos.filter(p => p.status !== 'Nuevo').length}</strong> usados
          </span>
          {/* ✅ Estadística de accesorios */}
          <span>
            🎧 <strong>{productos.filter(p => p.category === 'accesorios').length}</strong> accesorios
          </span>
        </div>
      </div>
    </div>
  )
}