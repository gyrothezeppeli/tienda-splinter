"use client";

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Product } from './page'

// =========================================================================
// PALETA BASE CLARA NEUMÓRFICA CON DETALLES EN VERDE AGUA VIVO
// =========================================================================
const PALETTE = {
  bg: '#e0e5ec',
  shadowLight: '#ffffff',
  shadowDark: '#a3b1c6',
  
  textPrimary: '#2d3748',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  
  aquaAccent: '#00b894',
  aquaSubtle: 'rgba(0, 184, 148, 0.12)',
  btnGradient: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
};

const CATEGORY_FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "guitarras", label: "🎸 Guitarras" },
  { id: "cuerdas", label: "〰️ Cuerdas" },
  { id: "cables", label: "🔌 Cables" },
  { id: "pedales", label: "🎛️ Pedales" },
  { id: "correas", label: "🎗️ Correas" },
  { id: "accesorios", label: "🎧 Accesorios" } // ✅ Nueva categoría
];

export default function CatalogClient({ products }: { products: Product[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("todos")
  const [searchTerm, setSearchTerm] = useState("")
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({})
  const [isMounted, setIsMounted] = useState(false)
  const [windowWidth, setWindowWidth] = useState(1024)
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    setIsMounted(true)
    setWindowWidth(window.innerWidth)
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = isMounted ? windowWidth < 768 : false
  const isTablet = isMounted ? (windowWidth >= 768 && windowWidth < 1024) : false

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }))
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "todos" || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // ✅ Accesorios destacados (productos con categoría 'accesorios')
  const accesoriosDestacados = products.filter(product => 
    product.category === 'accesorios'
  )

  if (!isMounted) {
    return <div style={{ background: PALETTE.bg, minHeight: '100vh' }} />
  }

  if (products.length === 0) {
    return (
      <div style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        backgroundColor: PALETTE.bg,
        color: PALETTE.textPrimary,
        minHeight: '100vh',
        padding: '30px 6%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <div style={{
          background: PALETTE.bg,
          borderRadius: '32px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: `9px 9px 18px ${PALETTE.shadowDark}, -9px -9px 18px ${PALETTE.shadowLight}`,
        }}>
          <span style={{ fontSize: '4rem' }}>🎵</span>
          <h1 style={{ color: PALETTE.textPrimary, margin: '20px 0 10px' }}>¡Bienvenido a SonicLab!</h1>
          <p style={{ color: PALETTE.textSecondary }}>
            No hay productos aún. <br />
            Ve al <Link href="/admin" style={{ color: PALETTE.aquaAccent, fontWeight: 700, textDecoration: 'none' }}>panel de administración</Link> para agregar tu catálogo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      backgroundColor: PALETTE.bg,
      color: PALETTE.textPrimary,
      minHeight: '100vh',
      overflowX: 'hidden',
      padding: isMobile ? '16px 12px' : '30px 6%',
      position: 'relative'
    }}>
      
      {/* Estilos CSS globales */}
      <style>{`
        * {
          box-sizing: border-box;
        }
        
        .neu-card {
          background: ${PALETTE.bg};
          border-radius: 28px;
          box-shadow: 8px 8px 16px ${PALETTE.shadowDark}, -8px -8px 16px ${PALETTE.shadowLight};
          transition: all 0.25s ease;
        }
        
        .neu-card:hover {
          box-shadow: 12px 12px 24px ${PALETTE.shadowDark}, -12px -12px 24px ${PALETTE.shadowLight};
        }
        
        .neu-btn {
          background: ${PALETTE.bg};
          border: none;
          border-radius: 20px;
          box-shadow: 5px 5px 10px ${PALETTE.shadowDark}, -5px -5px 10px ${PALETTE.shadowLight};
          cursor: pointer;
          font-weight: 700;
          color: ${PALETTE.textPrimary};
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .neu-btn:hover {
          box-shadow: 7px 7px 14px ${PALETTE.shadowDark}, -7px -7px 14px ${PALETTE.shadowLight};
          transform: translateY(-1px);
        }
        
        .neu-btn:active {
          box-shadow: inset 3px 3px 6px ${PALETTE.shadowDark}, inset -3px -3px 6px ${PALETTE.shadowLight};
          transform: translateY(1px);
        }

        .neu-btn-circle {
          border-radius: 50%;
          background: ${PALETTE.bg};
          box-shadow: 5px 5px 10px ${PALETTE.shadowDark}, -5px -5px 10px ${PALETTE.shadowLight};
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .neu-btn-circle:active {
          box-shadow: inset 3px 3px 6px ${PALETTE.shadowDark}, inset -3px -3px 6px ${PALETTE.shadowLight};
        }
        
        .neu-input-container {
          background: ${PALETTE.bg};
          border-radius: 25px;
          box-shadow: inset 4px 4px 8px ${PALETTE.shadowDark}, inset -4px -4px 8px ${PALETTE.shadowLight};
          transition: border 0.3s ease;
        }

        .neu-input-container:focus-within {
          border: 1px solid ${PALETTE.aquaAccent};
        }
        
        .neu-input {
          background: transparent;
          border: none;
          outline: none;
          color: ${PALETTE.textPrimary};
          font-family: inherit;
          width: 100%;
        }
        
        .neu-input::placeholder {
          color: ${PALETTE.textMuted};
        }
        
        .neu-pill {
          background: ${PALETTE.bg};
          border-radius: 50px;
          box-shadow: 4px 4px 8px ${PALETTE.shadowDark}, -4px -4px 8px ${PALETTE.shadowLight};
          cursor: pointer;
          font-weight: 600;
          font-size: 0.8rem;
          padding: 8px 18px;
          color: ${PALETTE.textSecondary};
          transition: all 0.2s ease;
          white-space: nowrap;
          border: 1px solid transparent;
        }
        
        .neu-pill-active {
          box-shadow: inset 3px 3px 6px ${PALETTE.shadowDark}, inset -3px -3px 6px ${PALETTE.shadowLight};
          color: ${PALETTE.aquaAccent};
          border: 1px solid ${PALETTE.aquaAccent};
          font-weight: 700;
        }

        .neu-badge {
          background: ${PALETTE.bg};
          border-radius: 12px;
          box-shadow: inset 2px 2px 4px ${PALETTE.shadowDark}, inset -2px -2px 4px ${PALETTE.shadowLight};
          padding: 4px 12px;
          font-size: 0.7rem;
          font-weight: 700;
          color: ${PALETTE.aquaAccent};
        }

        .neu-buy-btn {
          background: ${PALETTE.btnGradient};
          border: none;
          border-radius: 25px;
          color: #FFFFFF;
          font-weight: 800;
          font-size: 0.8rem;
          padding: 12px;
          width: 100%;
          box-shadow: 4px 4px 10px ${PALETTE.shadowDark}, -4px -4px 10px ${PALETTE.shadowLight};
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.5px;
        }

        .neu-buy-btn:hover {
          opacity: 0.95;
          box-shadow: 6px 6px 14px ${PALETTE.shadowDark}, -6px -6px 14px ${PALETTE.shadowLight};
        }

        .neu-buy-btn:active {
          box-shadow: inset 2px 2px 5px rgba(0,0,0,0.2);
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
          padding: 16px;
        }

        .product-image:hover {
          transform: scale(1.05);
        }

        .product-fallback {
          font-size: 3.8rem;
          user-select: none;
        }

        .product-fallback-mobile {
          font-size: 2.8rem;
          user-select: none;
        }

        /* ✅ Estilos para la sección de accesorios */
        .accesorios-banner {
          background: linear-gradient(135deg, ${PALETTE.aquaSubtle} 0%, ${PALETTE.aquaAccent}22 100%);
          border: 1px solid ${PALETTE.aquaAccent}33;
          border-radius: 20px;
          padding: 24px 30px;
          margin-bottom: 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .accesorios-banner h2 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 800;
          color: ${PALETTE.textPrimary};
        }

        .accesorios-banner span {
          color: ${PALETTE.aquaAccent};
        }

        .accesorios-badge {
          background: ${PALETTE.aquaAccent};
          color: white;
          padding: 4px 14px;
          border-radius: 99px;
          font-size: 0.7rem;
          font-weight: 700;
          box-shadow: 0 2px 10px ${PALETTE.aquaAccent}44;
        }
      `}</style>

      {/* Contenedor Principal */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <header style={{
          paddingBottom: isMobile ? '20px' : '40px',
          marginBottom: '20px',
        }}>
          <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: isMobile ? '1rem' : '1.2rem 2.5rem',
            borderRadius: '24px',
            background: PALETTE.bg,
            boxShadow: `8px 8px 16px ${PALETTE.shadowDark}, -8px -8px 16px ${PALETTE.shadowLight}`,
            fontSize: '0.8rem',
            fontWeight: '700',
            letterSpacing: '1px',
            marginBottom: '30px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              color: PALETTE.textPrimary, 
              fontWeight: '900', 
              fontSize: isMobile ? '0.9rem' : '1.1rem',
            }}>
              <div className="neu-btn-circle" style={{ width: '36px', height: '36px', color: PALETTE.aquaAccent }}>
                ♪
              </div>
              SONICLAB
            </div>

            {!isMobile && (
              <div style={{ display: 'flex', gap: '32px' }}>
                <a href="#" style={{ color: PALETTE.textSecondary, textDecoration: 'none', fontWeight: '600' }}>Equipos</a>
                <a href="#" style={{ color: PALETTE.textSecondary, textDecoration: 'none', fontWeight: '600' }}>Novedades</a>
                <a href="#" style={{ color: PALETTE.textSecondary, textDecoration: 'none', fontWeight: '600' }}>Soporte</a>
              </div>
            )}

            <div>
              <Link href="/admin">
                <button className="neu-btn-circle" style={{ 
                  width: isMobile ? '38px' : '44px',
                  height: isMobile ? '38px' : '44px',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                }}>
                  ⚙️
                </button>
              </Link>
            </div>
          </nav>

          {/* Hero */}
          <div className="neu-card" style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr',
            padding: isMobile ? '1.8rem 1.2rem' : '3.5rem 3rem',
            alignItems: 'center',
            gap: isMobile ? '25px' : '20px',
          }}>
            <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <div className="neu-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PALETTE.aquaAccent, boxShadow: `0 0 6px ${PALETTE.aquaAccent}` }} />
                AUDIO & MUSIC LAB
              </div>

              <h1 style={{
                fontSize: isMobile ? '1.8rem' : '3rem',
                fontWeight: '800',
                lineHeight: '1.2',
                margin: '0 0 1rem 0',
                color: PALETTE.textPrimary,
              }}>
                Sonido de alta precisión, <br />
                <span style={{ color: PALETTE.aquaAccent }}>diseño impecable.</span>
              </h1>

              <p style={{
                fontSize: isMobile ? '0.85rem' : '1rem',
                color: PALETTE.textSecondary,
                maxWidth: isMobile ? '100%' : '480px',
                lineHeight: '1.6',
                margin: '0 0 1.8rem 0'
              }}>
                Explora el catálogo premium con las mejores herramientas analógicas y digitales, curadas especialmente para tu setup.
              </p>

              <button className="neu-btn" style={{
                padding: isMobile ? '12px 24px' : '14px 28px',
                fontSize: '0.85rem',
                width: isMobile ? '100%' : 'auto',
                gap: '8px',
                borderRadius: '25px',
                color: PALETTE.aquaAccent
              }}>
                Explorar Catálogo <span>→</span>
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div className="neu-card" style={{
                width: isMobile ? '140px' : '200px',
                height: isMobile ? '140px' : '200px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `inset 6px 6px 12px ${PALETTE.shadowDark}, inset -6px -6px 12px ${PALETTE.shadowLight}`
              }}>
                <div className="neu-btn-circle" style={{
                  width: isMobile ? '90px' : '130px',
                  height: isMobile ? '90px' : '130px',
                  fontSize: isMobile ? '2.5rem' : '3.8rem',
                  color: PALETTE.aquaAccent
                }}>
                  🎵
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ============================================================
            ✅ SECCIÓN DE ACCESORIOS DESTACADOS
            ============================================================ */}
        {accesoriosDestacados.length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <div className="accesorios-banner">
              <div>
                <h2>
                  🎧 <span>Accesorios</span> Destacados
                </h2>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  fontSize: '0.85rem', 
                  color: PALETTE.textSecondary 
                }}>
                  Complementos esenciales para tu setup musical
                </p>
              </div>
              <div className="accesorios-badge">
                {accesoriosDestacados.length} disponibles
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? '16px' : '24px',
            }}>
              {accesoriosDestacados.slice(0, 3).map((product) => {
                const isFav = !!favorites[product.id]
                const hasDiscount = product.originalPrice && product.originalPrice > product.price
                const hasImage = product.image && product.image.trim() !== '' && !imageErrors[product.id]

                return (
                  <div
                    key={product.id}
                    className="neu-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: isMobile ? '16px' : '20px',
                      position: 'relative',
                      border: `1px solid ${PALETTE.aquaAccent}22`,
                    }}
                  >
                    {/* Visor de Imagen */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '1.2 / 1',
                      background: PALETTE.bg,
                      borderRadius: '20px',
                      boxShadow: `inset 4px 4px 8px ${PALETTE.shadowDark}, inset -4px -4px 8px ${PALETTE.shadowLight}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      overflow: 'hidden',
                    }}>
                      <button
                        onClick={(e) => toggleFavorite(product.id, e)}
                        className="neu-btn-circle"
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          width: '34px',
                          height: '34px',
                          fontSize: '0.85rem',
                          zIndex: 3,
                        }}
                      >
                        {isFav ? '❤️' : '🤍'}
                      </button>

                      {product.badge && (
                        <span className="neu-badge" style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '10px',
                          zIndex: 2,
                          fontSize: '0.65rem'
                        }}>
                          {product.badge.toUpperCase()}
                        </span>
                      )}

                      {hasImage ? (
                        <img
                          src={product.image!}
                          alt={product.name}
                          className="product-image"
                          onError={() => handleImageError(product.id)}
                          loading="lazy"
                        />
                      ) : (
                        <span className={isMobile ? 'product-fallback-mobile' : 'product-fallback'}>
                          {product.fallbackIcon || '🎧'}
                        </span>
                      )}
                    </div>

                    {/* Info del Producto */}
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '0.65rem',
                          color: PALETTE.aquaAccent,
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {product.category}
                        </span>
                        <span style={{
                          fontSize: '0.6rem',
                          color: PALETTE.textMuted,
                          fontWeight: '600'
                        }}>
                          {product.status}
                        </span>
                      </div>

                      <h3 style={{
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        color: PALETTE.textPrimary,
                        margin: '0 0 10px 0',
                        lineHeight: '1.35',
                        height: '2.4em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {product.name}
                      </h3>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {hasDiscount && (
                            <span style={{ fontSize: '0.7rem', textDecoration: 'line-through', color: PALETTE.textMuted }}>
                              ${product.originalPrice?.toFixed(2)}
                            </span>
                          )}
                          <span style={{ 
                            fontSize: '1.1rem', 
                            fontWeight: '800', 
                            color: PALETTE.textPrimary,
                          }}>
                            ${product.price.toFixed(2)}
                          </span>
                        </div>

                        <Link href={`/admin/producto/${product.id}`}>
                          <button className="neu-btn-circle" style={{
                            width: '32px',
                            height: '32px',
                            fontSize: '0.8rem',
                          }}>
                            ✏️
                          </button>
                        </Link>
                      </div>

                      <button className="neu-buy-btn" style={{ padding: '10px', fontSize: '0.75rem' }}>
                        🛒 COMPRAR
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Ver más accesorios */}
            {accesoriosDestacados.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button 
                  onClick={() => setSelectedCategory('accesorios')}
                  className="neu-btn"
                  style={{
                    padding: '10px 28px',
                    fontSize: '0.85rem',
                    color: PALETTE.aquaAccent,
                    border: `1px solid ${PALETTE.aquaAccent}33`,
                  }}
                >
                  Ver todos los accesorios ({accesoriosDestacados.length}) →
                </button>
              </div>
            )}
          </section>
        )}

        {/* Buscador y Filtros */}
        <section style={{ paddingBottom: '30px' }}>
          <div style={{ marginBottom: isMobile ? '20px' : '30px', display: 'flex', justifyContent: 'center' }}>
            <div className="neu-input-container" style={{ position: 'relative', width: '100%', maxWidth: '600px', display: 'flex', alignItems: 'center' }}>
              <span style={{ paddingLeft: '20px', fontSize: '1.1rem', color: PALETTE.aquaAccent }}>🔍</span>
              <input
                type="text"
                placeholder="Buscar por nombre de producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neu-input"
                style={{
                  padding: isMobile ? '14px 16px' : '16px 20px',
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                }}
              />
            </div>
          </div>

          <div
            className="no-scrollbar"
            style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              padding: '10px 4px',
              justifyContent: isMobile ? 'flex-start' : 'center',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {CATEGORY_FILTERS.map((filter) => {
              const isActive = selectedCategory === filter.id
              return (
                <button
                  key={filter.id}
                  onClick={() => setSelectedCategory(filter.id)}
                  className={`neu-pill ${isActive ? 'neu-pill-active' : ''}`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Grilla de Productos (todos) */}
        <section style={{ paddingBottom: '60px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isMobile ? '20px' : '30px'
          }}>
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '800',
              margin: 0,
              color: PALETTE.textPrimary,
            }}>
              {selectedCategory === 'accesorios' ? '🎧 Accesorios' : 'Línea de Equipamiento'}
            </h3>
            <span className="neu-badge">
              {filteredProducts.length} DISPONIBLES
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '20px' : '32px',
          }}>
            {filteredProducts.map((product) => {
              const isFav = !!favorites[product.id]
              const hasDiscount = product.originalPrice && product.originalPrice > product.price
              const hasImage = product.image && product.image.trim() !== '' && !imageErrors[product.id]

              return (
                <div
                  key={product.id}
                  className="neu-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: isMobile ? '18px' : '22px',
                    position: 'relative',
                    ...(product.category === 'accesorios' ? {
                      border: `1px solid ${PALETTE.aquaAccent}22`,
                    } : {}),
                  }}
                >
                  {/* Visor de Imagen */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1.2 / 1',
                    background: PALETTE.bg,
                    borderRadius: '20px',
                    boxShadow: `inset 4px 4px 8px ${PALETTE.shadowDark}, inset -4px -4px 8px ${PALETTE.shadowLight}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '18px',
                    overflow: 'hidden',
                  }}>
                    <button
                      onClick={(e) => toggleFavorite(product.id, e)}
                      className="neu-btn-circle"
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        width: '34px',
                        height: '34px',
                        fontSize: '0.85rem',
                        zIndex: 3,
                      }}
                    >
                      {isFav ? '❤️' : '🤍'}
                    </button>

                    {product.badge && (
                      <span className="neu-badge" style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        zIndex: 2,
                        fontSize: '0.65rem'
                      }}>
                        {product.badge.toUpperCase()}
                      </span>
                    )}

                    {hasImage ? (
                      <img
                        src={product.image!}
                        alt={product.name}
                        className="product-image"
                        onError={() => handleImageError(product.id)}
                        loading="lazy"
                      />
                    ) : (
                      <span className={isMobile ? 'product-fallback-mobile' : 'product-fallback'}>
                        {product.fallbackIcon || '📦'}
                      </span>
                    )}

                    {/* ✅ Badge de accesorio en la tarjeta */}
                    {product.category === 'accesorios' && (
                      <span style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: PALETTE.aquaAccent,
                        color: 'white',
                        fontSize: '0.55rem',
                        fontWeight: '700',
                        padding: '2px 10px',
                        borderRadius: '6px',
                        zIndex: 2,
                      }}>
                        🎧 Accesorio
                      </span>
                    )}
                  </div>

                  {/* Info del Producto */}
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '0.65rem',
                        color: PALETTE.aquaAccent,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {product.category}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        color: PALETTE.textMuted,
                        fontWeight: '600'
                      }}>
                        {product.status}
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      color: PALETTE.textPrimary,
                      margin: '0 0 12px 0',
                      lineHeight: '1.35',
                      height: '2.7em',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {product.name}
                    </h3>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {hasDiscount && (
                          <span style={{ fontSize: '0.7rem', textDecoration: 'line-through', color: PALETTE.textMuted }}>
                            ${product.originalPrice?.toFixed(2)}
                          </span>
                        )}
                        <span style={{ 
                          fontSize: '1.2rem', 
                          fontWeight: '800', 
                          color: PALETTE.textPrimary,
                        }}>
                          ${product.price.toFixed(2)}
                        </span>
                      </div>

                      <Link href={`/admin/producto/${product.id}`}>
                        <button className="neu-btn-circle" style={{
                          width: '36px',
                          height: '36px',
                          fontSize: '0.85rem',
                        }}>
                          ✏️
                        </button>
                      </Link>
                    </div>

                    <button className="neu-buy-btn">
                      🛒 COMPRAR
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}