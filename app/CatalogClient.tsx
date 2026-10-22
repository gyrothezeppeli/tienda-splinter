"use client";

import Image from 'next/image'
import { startTransition, useEffect, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  Headphones,
  Music2,
  Pencil,
  Search,
  Settings,
  Sparkles,
  ShoppingCart,
  UserRound,
} from 'lucide-react'
import type { Product } from './page'
import { CategoryIcon } from '@/components/category-icon'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'
import { Input } from '@/components/ui/input'

const PALETTE = {
  bg: '#e0e5ec',
  shadowLight: '#ffffff',
  shadowDark: '#a3b1c6',
  
  textPrimary: '#2d3748',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  
  aquaAccent: '#00b894',
  aquaSubtle: 'rgba(0, 184, 148, 0.12)',
  btnColor: '#00b894',
};

const CATEGORY_FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "guitarras", label: "Guitarras" },
  { id: "cuerdas", label: "Cuerdas" },
  { id: "cables", label: "Cables" },
  { id: "pedales", label: "Pedales" },
  { id: "correas", label: "Correas" },
  { id: "accesorios", label: "Accesorios" }
];

function subscribeToWindowResize(callback: () => void) {
  window.addEventListener('resize', callback)
  return () => window.removeEventListener('resize', callback)
}

function getWindowWidth() {
  return window.innerWidth
}

function getServerWindowWidth() {
  return 1024
}

export default function CatalogClient({ products }: { products: Product[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("todos")
  const [searchTerm, setSearchTerm] = useState("")
  const [heroProductIndex, setHeroProductIndex] = useState(0)
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({})
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({})
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null)
  const { addToCart, itemCount } = useCart()
  const { user, getAccessToken } = useAuth()
  const router = useRouter()
  const windowWidth = useSyncExternalStore(
    subscribeToWindowResize,
    getWindowWidth,
    getServerWindowWidth
  )

  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024

  useEffect(() => {
    if (products.length < 2) return

    const intervalId = window.setInterval(() => {
      setHeroProductIndex(index => (index + 1) % products.length)
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [products.length])

  useEffect(() => {
    if (!recentlyAddedId) return
    const timeoutId = window.setTimeout(() => setRecentlyAddedId(null), 1600)
    return () => window.clearTimeout(timeoutId)
  }, [recentlyAddedId])

  useEffect(() => {
    if (!user) {
      startTransition(() => setFavorites({}))
      return
    }

    let active = true
    const loadFavorites = async () => {
      try {
        const token = await getAccessToken()
        if (!token) return
        const response = await fetch('/api/cuenta/favoritos', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los favoritos.')
        if (active) {
          setFavorites(Object.fromEntries(data.productIds.map((id: string) => [id, true])))
        }
      } catch (error) {
        console.error('No se pudieron sincronizar los favoritos:', error)
      }
    }

    void loadFavorites()
    return () => { active = false }
  }, [user, getAccessToken])

  const handleAddToCart = (product: Product) => {
    addToCart(product)
    setRecentlyAddedId(product.id)
  }

  const toggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      router.push('/cuenta')
      return
    }

    const wasFavorite = Boolean(favorites[id])
    setFavorites(prev => ({ ...prev, [id]: !wasFavorite }))
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.')
      const response = await fetch('/api/cuenta/favoritos', {
        method: wasFavorite ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: id }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar el favorito.')
    } catch (error) {
      setFavorites(prev => ({ ...prev, [id]: wasFavorite }))
      console.error('No se pudo actualizar el favorito:', error)
      window.alert(error instanceof Error ? error.message : 'No se pudo actualizar el favorito.')
    }
  }

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }))
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "todos" || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const accesoriosDestacados = products.filter(product => 
    product.category === 'accesorios'
  )
  const latestProducts = products.slice(0, 3)
  const heroProduct = products[heroProductIndex] ?? products[0]

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
          <Music2 size={64} strokeWidth={1.5} aria-hidden="true" />
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
          background: ${PALETTE.btnColor};
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

        .new-arrival-card {
          display: flex;
          align-items: center;
          gap: 18px;
          min-width: 0;
          padding: 20px;
        }

        @media (max-width: 767px) {
          .new-arrival-card {
            padding: 16px;
          }
        }

        .accesorios-banner {
          background: linear-gradient(135deg, ${PALETTE.aquaSubtle} 0%, ${PALETTE.aquaAccent}22 100%);
          border: 1px solid ${PALETTE.aquaAccent}33;
          border-radius: 20px;
          padding: 18px 22px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .accesorios-banner h2 {
          margin: 0;
          font-size: 1.05rem;
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

      <div style={{ position: 'relative', zIndex: 1 }}>

        <header style={{
          paddingBottom: isMobile ? '20px' : '40px',
          marginBottom: '20px',
        }}>
          <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
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
                <Music2 size={20} aria-hidden="true" />
              </div>
              SONICLAB
            </div>

            {!isMobile && (
              <div style={{ display: 'flex', gap: '32px' }}>
                <a href="#productos" style={{ color: PALETTE.textSecondary, textDecoration: 'none', fontWeight: '600' }}>Catálogo</a>
                <a href="#novedades" style={{ color: PALETTE.textSecondary, textDecoration: 'none', fontWeight: '600' }}>Novedades</a>
                <a href="#accesorios" style={{ color: PALETTE.textSecondary, textDecoration: 'none', fontWeight: '600' }}>Accesorios</a>
              </div>
            )}

            <div className="neu-input-container" style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: isMobile ? '100%' : 'min(30vw, 340px)',
              order: isMobile ? 3 : 0,
            }}>
              <Search size={18} style={{ marginLeft: '16px', color: PALETTE.aquaAccent, flexShrink: 0 }} aria-hidden="true" />
              <Input
                type="search"
                aria-label="Buscar productos"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="neu-input"
                style={{ padding: '12px 14px', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <Link href="/admin">
                <button className="neu-btn-circle" style={{ 
                  width: isMobile ? '38px' : '44px',
                  height: isMobile ? '38px' : '44px',
                }}>
                  <span className="sr-only">Administrar productos</span>
                  <Settings size={20} aria-hidden="true" />
                </button>
              </Link>
            </div>
            <Link
              href="/cuenta"
              aria-label={user ? `Mi perfil, ${user.email}` : 'Iniciar sesión o crear cuenta'}
              style={{
                display: 'grid',
                placeItems: 'center',
                width: isMobile ? '38px' : '44px',
                height: isMobile ? '38px' : '44px',
                borderRadius: '50%',
                color: PALETTE.textPrimary,
                boxShadow: `4px 4px 9px ${PALETTE.shadowDark}, -4px -4px 9px ${PALETTE.shadowLight}`,
              }}
            >
              <UserRound size={19} aria-hidden="true" />
            </Link>
            <Link
              href="/carrito"
              aria-label={`Abrir carrito, ${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '16px',
                color: PALETTE.textPrimary,
                textDecoration: 'none',
                boxShadow: `4px 4px 9px ${PALETTE.shadowDark}, -4px -4px 9px ${PALETTE.shadowLight}`,
                fontWeight: 700,
              }}
            >
              <ShoppingCart size={19} aria-hidden="true" />
              <span>Carrito</span>
              <span aria-live="polite" style={{
                display: 'grid',
                placeItems: 'center',
                minWidth: '22px',
                height: '22px',
                padding: '0 5px',
                borderRadius: '99px',
                background: PALETTE.aquaAccent,
                color: 'white',
                fontSize: '0.7rem',
              }}>
                {itemCount}
              </span>
            </Link>
          </nav>

          <div className="neu-card" style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
            padding: isMobile ? '1.8rem 1.2rem' : '3.5rem 3rem',
            alignItems: 'center',
            gap: isMobile ? '25px' : '40px',
            overflow: 'hidden',
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
                Instrumentos para <br />
                <span style={{ color: PALETTE.aquaAccent }}>encontrar tu sonido.</span>
              </h1>

              <p style={{
                fontSize: isMobile ? '0.85rem' : '1rem',
                color: PALETTE.textSecondary,
                maxWidth: isMobile ? '100%' : '480px',
                lineHeight: '1.6',
                margin: '0 0 1.8rem 0'
              }}>
                Explora instrumentos y accesorios seleccionados para acompañar cada idea, ensayo y escenario.
              </p>

              <a href="#productos" className="neu-btn" style={{
                padding: isMobile ? '12px 24px' : '14px 28px',
                fontSize: '0.85rem',
                width: isMobile ? '100%' : 'auto',
                gap: '8px',
                borderRadius: '25px',
                color: PALETTE.aquaAccent,
                textDecoration: 'none',
              }}>
                Explorar Catálogo <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>

            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: isMobile ? '220px' : '320px',
              borderRadius: '24px',
              background: `radial-gradient(circle at center, ${PALETTE.shadowLight} 0%, ${PALETTE.bg} 70%)`,
            }}>
              {heroProduct?.image && !imageErrors[heroProduct.id] ? (
                <Image
                  src={heroProduct.image}
                  alt={heroProduct.name}
                  fill
                  sizes="(max-width: 768px) 90vw, 40vw"
                  className="product-image"
                  unoptimized
                  onError={() => handleImageError(heroProduct.id)}
                  key={heroProduct.id}
                  priority={heroProductIndex === 0}
                />
              ) : (
                <CategoryIcon category={heroProduct?.category ?? 'todos'} size={isMobile ? 88 : 124} />
              )}
              {heroProduct && (
                <div style={{
                  position: 'absolute',
                  left: isMobile ? '14px' : '24px',
                  right: isMobile ? '14px' : '24px',
                  bottom: isMobile ? '14px' : '24px',
                  padding: '14px 18px',
                  borderRadius: '18px',
                  background: `${PALETTE.bg}eF`,
                  boxShadow: `5px 5px 12px ${PALETTE.shadowDark}, -5px -5px 12px ${PALETTE.shadowLight}`,
                }}>
                  <span style={{ color: PALETTE.aquaAccent, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    {heroProduct.category}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                    <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{heroProduct.name}</strong>
                    <strong style={{ flexShrink: 0 }}>${heroProduct.price.toFixed(2)}</strong>
                  </div>
                </div>
              )}
              {products.length > 1 && (
                <>
                  <button
                    type="button"
                    className="neu-btn-circle"
                    aria-label="Producto destacado anterior"
                    onClick={() => setHeroProductIndex(index => (index - 1 + products.length) % products.length)}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '38px', height: '38px', zIndex: 2 }}
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="neu-btn-circle"
                    aria-label="Siguiente producto destacado"
                    onClick={() => setHeroProductIndex(index => (index + 1) % products.length)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '38px', height: '38px', zIndex: 2 }}
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                  <div aria-label={`Producto ${heroProductIndex + 1} de ${products.length}`} style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', gap: '6px', zIndex: 2 }}>
                    {products.map((product, index) => (
                      <button
                        key={product.id}
                        type="button"
                        aria-label={`Mostrar ${product.name}`}
                        aria-current={index === heroProductIndex ? 'true' : undefined}
                        onClick={() => setHeroProductIndex(index)}
                        style={{
                          width: index === heroProductIndex ? '18px' : '8px',
                          height: '8px',
                          padding: 0,
                          border: 0,
                          borderRadius: '99px',
                          background: index === heroProductIndex ? PALETTE.aquaAccent : `${PALETTE.textSecondary}88`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {latestProducts.length > 0 && (
          <section id="novedades" style={{ marginBottom: '36px', scrollMarginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <Sparkles size={22} color={PALETTE.aquaAccent} aria-hidden="true" />
              <h2 style={{ margin: 0, fontSize: isMobile ? '1.15rem' : '1.35rem', fontWeight: 800 }}>Recién ingresados</h2>
              <span className="neu-badge" style={{ marginLeft: 'auto' }}>NOVEDADES</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : `repeat(${latestProducts.length}, minmax(0, 1fr))`,
              gap: '18px',
            }}>
              {latestProducts.map((product) => (
                <article key={`new-${product.id}`} className="neu-card new-arrival-card">
                  <div style={{
                    position: 'relative',
                    width: isMobile ? '84px' : '104px',
                    height: isMobile ? '84px' : '104px',
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '16px',
                    background: PALETTE.bg,
                    boxShadow: `inset 3px 3px 7px ${PALETTE.shadowDark}, inset -3px -3px 7px ${PALETTE.shadowLight}`,
                    overflow: 'hidden',
                  }}>
                    {product.image && !imageErrors[product.id] ? (
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        sizes="104px"
                        style={{ objectFit: 'contain', padding: '6px' }}
                        unoptimized
                        onError={() => handleImageError(product.id)}
                      />
                    ) : (
                      <CategoryIcon category={product.category} size={30} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ color: PALETTE.aquaAccent, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                      {product.category}
                    </span>
                    <h3 style={{ margin: '5px 0', fontSize: isMobile ? '0.98rem' : '1.08rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.name}
                    </h3>
                    <strong style={{ fontSize: '0.92rem' }}>${product.price.toFixed(2)}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {accesoriosDestacados.length > 0 && (
          <section id="accesorios" style={{ marginBottom: '40px', scrollMarginTop: '24px' }}>
            <div className="accesorios-banner">
              <div>
                <h2>
                  <Headphones size={20} aria-hidden="true" /> <span>Accesorios</span> Destacados
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
              gap: isMobile ? '12px' : '18px',
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
                      padding: isMobile ? '12px' : '15px',
                      position: 'relative',
                      border: `1px solid ${PALETTE.aquaAccent}22`,
                    }}
                  >
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '1.5 / 1',
                      background: PALETTE.bg,
                      borderRadius: '20px',
                      boxShadow: `inset 4px 4px 8px ${PALETTE.shadowDark}, inset -4px -4px 8px ${PALETTE.shadowLight}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                      overflow: 'hidden',
                    }}>
                      <button
                        onClick={(e) => toggleFavorite(product.id, e)}
                        className="neu-btn-circle"
                        aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
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
                        <Heart size={17} fill={isFav ? 'currentColor' : 'none'} aria-hidden="true" />
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
                        <Image
                          src={product.image!}
                          alt={product.name}
                          className="product-image"
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          unoptimized
                          onError={() => handleImageError(product.id)}
                          loading="lazy"
                        />
                      ) : (
                        <CategoryIcon category={product.category} size={isMobile ? 44 : 60} />
                      )}
                    </div>

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
                          <button className="neu-btn-circle" aria-label={`Editar ${product.name}`} style={{
                            width: '32px',
                            height: '32px',
                          }}>
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                        </Link>
                      </div>

                      <button
                        className="neu-buy-btn"
                        onClick={() => handleAddToCart(product)}
                        aria-live="polite"
                        style={{ padding: '9px', fontSize: '0.72rem' }}
                      >
                        <ShoppingCart size={15} aria-hidden="true" /> {recentlyAddedId === product.id ? 'AGREGADO' : 'AGREGAR AL CARRITO'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>


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
                  Ver todos los accesorios ({accesoriosDestacados.length}) <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </section>
        )}


        <section id="productos" style={{ paddingBottom: '30px', scrollMarginTop: '24px' }}>
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {filter.id !== 'todos' && <CategoryIcon category={filter.id} size={16} />}
                  {filter.label}
                </button>
              )
            })}
          </div>
        </section>


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
              {selectedCategory === 'accesorios' ? <><Headphones size={20} aria-hidden="true" /> Accesorios</> : 'Línea de Equipamiento'}
            </h3>
            <span className="neu-badge">
              {filteredProducts.length} DISPONIBLES
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '14px' : '22px',
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
                    padding: isMobile ? '13px' : '16px',
                    position: 'relative',
                    ...(product.category === 'accesorios' ? {
                      border: `1px solid ${PALETTE.aquaAccent}22`,
                    } : {}),
                  }}
                >
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1.45 / 1',
                    background: PALETTE.bg,
                    borderRadius: '20px',
                    boxShadow: `inset 4px 4px 8px ${PALETTE.shadowDark}, inset -4px -4px 8px ${PALETTE.shadowLight}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    overflow: 'hidden',
                  }}>
                    <button
                      onClick={(e) => toggleFavorite(product.id, e)}
                      className="neu-btn-circle"
                      aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
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
                      <Heart size={17} fill={isFav ? 'currentColor' : 'none'} aria-hidden="true" />
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
                      <Image
                        src={product.image!}
                        alt={product.name}
                        className="product-image"
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        unoptimized
                        onError={() => handleImageError(product.id)}
                        loading="lazy"
                      />
                    ) : (
                      <CategoryIcon category={product.category} size={isMobile ? 44 : 60} />
                    )}

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
                        <Headphones size={12} aria-hidden="true" /> Accesorio
                      </span>
                    )}
                  </div>

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
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      color: PALETTE.textPrimary,
                      margin: '0 0 8px 0',
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
                        <button className="neu-btn-circle" aria-label={`Editar ${product.name}`} style={{
                          width: '36px',
                          height: '36px',
                        }}>
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                      </Link>
                    </div>

                    <button
                      className="neu-buy-btn"
                      onClick={() => handleAddToCart(product)}
                      aria-live="polite"
                      style={{ padding: '10px', fontSize: '0.75rem' }}
                    >
                      <ShoppingCart size={15} aria-hidden="true" /> {recentlyAddedId === product.id ? 'AGREGADO' : 'AGREGAR AL CARRITO'}
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