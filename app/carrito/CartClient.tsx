'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowLeft,
  Check,
  LoaderCircle,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { CategoryIcon } from '@/components/category-icon'
import { useAuth } from '@/lib/auth-context'
import type { ShippingAddress } from '@/lib/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const PALETTE = {
  bg: '#e0e5ec',
  shadowLight: '#ffffff',
  shadowDark: '#a3b1c6',
  textPrimary: '#2d3748',
  textSecondary: '#64748b',
  aquaAccent: '#00b894',
  red: '#dc2626',
}

export default function CartClient() {
  const { items, itemCount, isHydrated, updateQuantity, removeFromCart, clearCart } = useCart()
  const { user, getAccessToken } = useAuth()
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [orderConfirmation, setOrderConfirmation] = useState('')
  const [whatsappUrl, setWhatsappUrl] = useState('')
  const [deliveryDraft, setDeliveryDraft] = useState<{
    userId: string
    address: ShippingAddress
  } | null>(null)
  const savedDelivery = user?.user_metadata.direccion_envio
  const defaultDelivery: ShippingAddress = {
    method: savedDelivery?.method === 'delivery' ? 'delivery' : 'messenger',
    recipientFirstName: typeof savedDelivery?.recipientFirstName === 'string'
      ? savedDelivery.recipientFirstName
      : typeof user?.user_metadata.nombre === 'string' ? user.user_metadata.nombre : '',
    recipientLastName: typeof savedDelivery?.recipientLastName === 'string'
      ? savedDelivery.recipientLastName
      : typeof user?.user_metadata.apellido === 'string' ? user.user_metadata.apellido : '',
    phone: typeof savedDelivery?.phone === 'string'
      ? savedDelivery.phone
      : typeof user?.user_metadata.telefono === 'string' ? user.user_metadata.telefono : '',
    phone2: typeof savedDelivery?.phone2 === 'string' ? savedDelivery.phone2 : '',
    address: typeof savedDelivery?.address === 'string' ? savedDelivery.address : '',
    agency: typeof savedDelivery?.agency === 'string' ? savedDelivery.agency : '',
    city: typeof savedDelivery?.city === 'string' ? savedDelivery.city : '',
    postalCode: typeof savedDelivery?.postalCode === 'string' ? savedDelivery.postalCode : '',
    mapsLink: typeof savedDelivery?.mapsLink === 'string' ? savedDelivery.mapsLink : '',
    notes: typeof savedDelivery?.notes === 'string' ? savedDelivery.notes : '',
  }
  const delivery = deliveryDraft && user && deliveryDraft.userId === user.id
    ? deliveryDraft.address
    : defaultDelivery

  const updateDelivery = (field: keyof ShippingAddress, value: string) => {
    if (!user) return
    setDeliveryDraft(current => ({
      userId: user.id,
      address: {
        ...(current && current.userId === user.id ? current.address : defaultDelivery),
        [field]: value,
      },
    }))
  }

  const selectedProducts = items.filter(({ product }) =>
    selectedIds === null || selectedIds.has(product.id)
  )
  const selectedItemCount = selectedProducts.reduce((sum, item) => sum + item.quantity, 0)
  const selectedTotal = selectedProducts.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const allSelected = items.length > 0 && selectedProducts.length === items.length

  const toggleSelection = (productId: string) => {
    setSelectedIds(current => {
      const next = new Set(current ?? items.map(item => item.product.id))
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const handleCheckout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedProducts.length === 0) {
      setCheckoutError('Selecciona al menos un producto para generar el pedido.')
      return
    }

    setIsSubmitting(true)
    setCheckoutError('')
    setOrderConfirmation('')
    setWhatsappUrl('')
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.')
      if (delivery.mapsLink && !isGoogleMapsLink(delivery.mapsLink)) {
        throw new Error('El enlace de ubicación debe ser de Google Maps.')
      }
      const response = await fetch('/api/cuenta/pedidos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: delivery.method,
          recipientFirstName: delivery.recipientFirstName,
          recipientLastName: delivery.recipientLastName,
          phone2: delivery.phone2,
          address: delivery.method === 'delivery' ? delivery.address : '',
          agency: delivery.method === 'messenger' ? delivery.agency : '',
          city: delivery.method === 'delivery' ? 'Caracas' : '',
          postalCode: '',
          phone: delivery.phone,
          mapsLink: delivery.method === 'delivery' ? delivery.mapsLink : '',
          notes: delivery.notes,
          items: selectedProducts.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo crear el pedido.')

      selectedProducts.forEach(({ product }) => removeFromCart(product.id))
      setSelectedIds(new Set())
      setOrderConfirmation(`Pedido ${data.order.id.slice(0, 8)} creado. Envíanos los datos por WhatsApp para coordinar el pago y la entrega.`)
      setWhatsappUrl(data.whatsappUrl)
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'No se pudo crear el pedido.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      padding: '28px 6%',
      background: PALETTE.bg,
      color: PALETTE.textPrimary,
      fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: PALETTE.textSecondary,
          textDecoration: 'none',
          fontWeight: 700,
          marginBottom: '24px',
        }}>
          <ArrowLeft size={17} aria-hidden="true" /> Seguir comprando
        </Link>

        <header style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <ShoppingCart size={27} color={PALETTE.aquaAccent} aria-hidden="true" />
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>Mi carrito</h1>
            <p style={{ margin: '4px 0 0', color: PALETTE.textSecondary }}>
              {isHydrated ? `${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}` : 'Cargando carrito...'}
            </p>
          </div>
          {items.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={() => setSelectedIds(allSelected ? new Set() : new Set(items.map(item => item.product.id)))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '10px 14px',
                  border: 0,
                  borderRadius: '14px',
                  background: PALETTE.bg,
                  boxShadow: `4px 4px 9px ${PALETTE.shadowDark}, -4px -4px 9px ${PALETTE.shadowLight}`,
                  color: PALETTE.textPrimary,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Check size={16} aria-hidden="true" /> {allSelected ? 'Deseleccionar' : 'Seleccionar todos'}
              </button>
              <button
                type="button"
                onClick={clearCart}
                style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 14px',
                border: 0,
                borderRadius: '14px',
                background: PALETTE.bg,
                boxShadow: `4px 4px 9px ${PALETTE.shadowDark}, -4px -4px 9px ${PALETTE.shadowLight}`,
                color: PALETTE.red,
                fontWeight: 700,
                cursor: 'pointer',
                }}
              >
                <Trash2 size={16} aria-hidden="true" /> Vaciar carrito
              </button>
            </div>
          )}
        </header>
        {orderConfirmation && (
          <div role="status" style={{ ...successStyle, display: 'grid', gap: '10px' }}>
            <span>{orderConfirmation}</span>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer" style={whatsappButtonStyle}>
                Enviar datos del pedido por WhatsApp
              </a>
            )}
            <span style={{ fontSize: '0.76rem' }}>WhatsApp abrirá el mensaje preparado; pulsa «Enviar» en la aplicación para compartirlo.</span>
          </div>
        )}

        {!isHydrated ? (
          <div role="status" style={panelStyle}>Cargando tu carrito...</div>
        ) : items.length === 0 ? (
          <section style={{ ...panelStyle, textAlign: 'center', padding: '56px 24px' }}>
            <ShoppingBag size={52} color={PALETTE.aquaAccent} strokeWidth={1.5} aria-hidden="true" />
            <h2 style={{ margin: '16px 0 8px' }}>Tu carrito está vacío</h2>
            <p style={{ color: PALETTE.textSecondary, margin: '0 0 24px' }}>
              Explora el catálogo y agrega los productos que te interesan.
            </p>
            <Link href="/#productos" style={primaryLinkStyle}>
              Explorar productos
            </Link>
          </section>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 320px)',
            gap: '24px',
            alignItems: 'start',
          }} className="cart-layout">
            <section aria-label="Productos en el carrito" style={{ display: 'grid', gap: '14px' }}>
              {items.map(({ product, quantity }) => (
                <article key={product.id} style={{
                  ...panelStyle,
                  display: 'grid',
                  gridTemplateColumns: '24px 100px minmax(0, 1fr) auto',
                  gap: '18px',
                  alignItems: 'center',
                  padding: '16px',
                }}>
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${product.name} para el pedido`}
                    checked={selectedIds === null || selectedIds.has(product.id)}
                    onChange={() => toggleSelection(product.id)}
                    style={{ width: '18px', height: '18px', accentColor: PALETTE.aquaAccent, cursor: 'pointer' }}
                  />
                  <div style={{
                    position: 'relative',
                    width: '100px',
                    height: '100px',
                    display: 'grid',
                    placeItems: 'center',
                    overflow: 'hidden',
                    borderRadius: '16px',
                    background: PALETTE.bg,
                    boxShadow: `inset 3px 3px 7px ${PALETTE.shadowDark}, inset -3px -3px 7px ${PALETTE.shadowLight}`,
                  }}>
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="100px"
                        unoptimized
                        style={{ objectFit: 'contain', padding: '8px' }}
                      />
                    ) : (
                      <CategoryIcon category={product.category} size={38} />
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <Badge variant="secondary" style={{ color: PALETTE.aquaAccent, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                      {product.category}
                    </Badge>
                    <h2 style={{ margin: '4px 0 8px', fontSize: '1rem' }}>{product.name}</h2>
                    <strong>${product.price.toFixed(2)}</strong>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '12px',
                      padding: '4px',
                      borderRadius: '12px',
                      boxShadow: `inset 2px 2px 5px ${PALETTE.shadowDark}, inset -2px -2px 5px ${PALETTE.shadowLight}`,
                    }}>
                      <button
                        type="button"
                        aria-label={`Disminuir cantidad de ${product.name}`}
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        disabled={quantity <= 1}
                        style={quantityButtonStyle}
                      >
                        <Minus size={15} aria-hidden="true" />
                      </button>
                      <span aria-label={`Cantidad: ${quantity}`} style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700 }}>
                        {quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Aumentar cantidad de ${product.name}`}
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        style={quantityButtonStyle}
                      >
                        <Plus size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', justifyItems: 'end', gap: '14px' }}>
                    <button
                      type="button"
                      aria-label={`Eliminar ${product.name}`}
                      onClick={() => removeFromCart(product.id)}
                      style={{ ...quantityButtonStyle, color: PALETTE.red }}
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                    <strong>${(product.price * quantity).toFixed(2)}</strong>
                  </div>
                </article>
              ))}
            </section>

            <aside style={{ position: 'sticky', top: '20px' }}>
              <Card style={{ ...panelStyle, padding: '22px' }} className="ring-0">
                <h2 style={{ margin: '0 0 18px', fontSize: '1.1rem' }}>Resumen del pedido</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: PALETTE.textSecondary }}>
                  <span>Seleccionados ({selectedItemCount})</span>
                  <span>${selectedTotal.toFixed(2)}</span>
                </div>
                <div style={{ height: '1px', margin: '18px 0', background: `${PALETTE.textSecondary}33` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '1.05rem', fontWeight: 800 }}>
                  <span>Total</span>
                  <span>${selectedTotal.toFixed(2)}</span>
                </div>
                <div style={{ height: '1px', margin: '18px 0', background: `${PALETTE.textSecondary}33` }} />
                {!user ? (
                  <>
                    <p style={{ color: PALETTE.textSecondary, fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 14px' }}>
                      Inicia sesión para confirmar el pedido y guardar tus compras en tu perfil.
                    </p>
                    <Button render={<Link href="/cuenta" />} className="h-auto" style={primaryLinkStyle}>Iniciar sesión</Button>
                  </>
                ) : (
                  <form onSubmit={handleCheckout} style={{ display: 'grid', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Datos de entrega</h3>
                    <label style={fieldLabelStyle}>Método de envío
                      <select value={delivery.method} onChange={event => updateDelivery('method', event.target.value as ShippingAddress['method'])} style={inputStyle}>
                        <option value="delivery">Delivery (solo Caracas, Venezuela)</option>
                        <option value="messenger">Mensajería</option>
                      </select>
                    </label>
                    {delivery.method === 'delivery' ? (
                      <>
                        <p style={{ ...errorStyle, background: '#dbeafe', color: '#1e40af' }}>
                          Delivery disponible únicamente en Caracas, Venezuela.
                        </p>
                        <label style={fieldLabelStyle}>Nombre de quien recibe
                          <Input required minLength={2} maxLength={80} autoComplete="given-name" value={delivery.recipientFirstName} onChange={event => updateDelivery('recipientFirstName', event.target.value)} style={inputStyle} />
                        </label>
                        <label style={fieldLabelStyle}>Apellido de quien recibe
                          <Input required minLength={2} maxLength={80} autoComplete="family-name" value={delivery.recipientLastName} onChange={event => updateDelivery('recipientLastName', event.target.value)} style={inputStyle} />
                        </label>
                        <label style={fieldLabelStyle}>Número de teléfono 1
                          <Input required type="tel" minLength={7} maxLength={30} autoComplete="tel" value={delivery.phone} onChange={event => updateDelivery('phone', event.target.value)} style={inputStyle} />
                        </label>
                        <label style={fieldLabelStyle}>Número de teléfono 2 (opcional)
                          <Input type="tel" minLength={7} maxLength={30} value={delivery.phone2} onChange={event => updateDelivery('phone2', event.target.value)} style={inputStyle} />
                        </label>
                        <label style={fieldLabelStyle}>Ubicación exacta en Caracas
                          <Input required minLength={5} maxLength={300} autoComplete="street-address" value={delivery.address} onChange={event => updateDelivery('address', event.target.value)} placeholder="Urbanización, calle, edificio, piso, apartamento..." style={inputStyle} />
                        </label>
                        <label style={fieldLabelStyle}>Enlace de Google Maps (opcional)
                          <Input type="url" maxLength={500} value={delivery.mapsLink} onChange={event => updateDelivery('mapsLink', event.target.value)} placeholder="https://maps.google.com/..." style={inputStyle} />
                        </label>
                      </>
                    ) : (
                      <>
                        <label style={fieldLabelStyle}>Nombre de quien recibe
                          <Input required minLength={2} maxLength={80} autoComplete="given-name" value={delivery.recipientFirstName} onChange={event => updateDelivery('recipientFirstName', event.target.value)} style={inputStyle} />
                        </label>
                        <label style={fieldLabelStyle}>Apellido de quien recibe
                          <Input required minLength={2} maxLength={80} autoComplete="family-name" value={delivery.recipientLastName} onChange={event => updateDelivery('recipientLastName', event.target.value)} style={inputStyle} />
                        </label>
                        <label style={fieldLabelStyle}>Número de teléfono 1
                          <Input required type="tel" minLength={7} maxLength={30} autoComplete="tel" value={delivery.phone} onChange={event => updateDelivery('phone', event.target.value)} style={inputStyle} />
                        </label>
                        <label style={fieldLabelStyle}>Número de teléfono 2 (opcional)
                          <Input type="tel" minLength={7} maxLength={30} value={delivery.phone2} onChange={event => updateDelivery('phone2', event.target.value)} style={inputStyle} />
                        </label>
                        <label style={fieldLabelStyle}>Agencia a la que se envía
                          <Input required minLength={2} maxLength={150} value={delivery.agency} onChange={event => updateDelivery('agency', event.target.value)} placeholder="Nombre y ciudad de la agencia" style={inputStyle} />
                        </label>
                      </>
                    )}
                    <label style={fieldLabelStyle}>Notas (opcional)
                      <textarea maxLength={1000} value={delivery.notes} onChange={event => updateDelivery('notes', event.target.value)} style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }} />
                    </label>
                    {checkoutError && <p role="alert" style={errorStyle}>{checkoutError}</p>}
                    {orderConfirmation && <p role="status" style={successStyle}>{orderConfirmation}</p>}
                    <Button type="submit" disabled={isSubmitting || selectedProducts.length === 0} className="h-auto w-full" style={{ ...primaryLinkStyle, border: 0, cursor: isSubmitting ? 'wait' : 'pointer', opacity: isSubmitting || selectedProducts.length === 0 ? 0.65 : 1 }}>
                      {isSubmitting ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}
                      Confirmar pedido
                    </Button>
                    <p style={{ color: PALETTE.textSecondary, fontSize: '0.76rem', lineHeight: 1.5, margin: 0 }}>
                      El pedido quedará pendiente. Coordinaremos el pago y el envío contigo; no se realiza ningún cobro en línea.
                    </p>
                    {delivery.method === 'delivery' && delivery.mapsLink && isGoogleMapsLink(delivery.mapsLink) && (
                      <a href={delivery.mapsLink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: PALETTE.aquaAccent, fontWeight: 700 }}>
                        <MapPin size={16} aria-hidden="true" /> Ver ubicación en Google Maps
                      </a>
                    )}
                  </form>
                )}
              </Card>
            </aside>
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 760px) {
          .cart-layout { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .cart-layout article { grid-template-columns: 20px 64px minmax(0, 1fr) auto !important; gap: 9px !important; }
          .cart-layout article > div:first-of-type { width: 64px !important; height: 64px !important; }
        }
      `}</style>
    </main>
  )
}

const panelStyle = {
  borderRadius: '22px',
  padding: '24px',
  background: PALETTE.bg,
  boxShadow: `7px 7px 15px ${PALETTE.shadowDark}, -7px -7px 15px ${PALETTE.shadowLight}`,
}

const quantityButtonStyle = {
  width: '32px',
  height: '32px',
  display: 'grid',
  placeItems: 'center',
  padding: 0,
  border: 0,
  borderRadius: '9px',
  background: PALETTE.bg,
  color: PALETTE.textPrimary,
  cursor: 'pointer',
}

const primaryLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 20px',
  borderRadius: '16px',
  background: PALETTE.aquaAccent,
  color: 'white',
  fontWeight: 800,
  textDecoration: 'none',
}

const fieldLabelStyle = {
  display: 'grid',
  gap: '6px',
  color: PALETTE.textSecondary,
  fontSize: '0.8rem',
  fontWeight: 700,
}

const inputStyle = {
  width: '100%',
  padding: '10px 11px',
  border: 0,
  borderRadius: '10px',
  background: PALETTE.bg,
  color: PALETTE.textPrimary,
  boxShadow: `inset 2px 2px 5px ${PALETTE.shadowDark}, inset -2px -2px 5px ${PALETTE.shadowLight}`,
  font: 'inherit',
}

const errorStyle = {
  margin: 0,
  padding: '10px',
  borderRadius: '10px',
  background: '#fee2e2',
  color: '#991b1b',
  fontSize: '0.82rem',
}

const successStyle = {
  margin: 0,
  padding: '10px',
  borderRadius: '10px',
  background: '#dcfce7',
  color: '#166534',
  fontSize: '0.82rem',
}

const whatsappButtonStyle = {
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '11px 14px',
  borderRadius: '12px',
  background: '#25d366',
  color: '#ffffff',
  fontWeight: 800,
  textDecoration: 'none',
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
