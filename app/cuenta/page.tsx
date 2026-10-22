'use client'

import Image from 'next/image'
import Link from 'next/link'
import { startTransition, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Heart,
  LoaderCircle,
  LogOut,
  MapPin,
  Package,
  UserRound,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import type { ShippingAddress } from '@/lib/auth-context'
import { CategoryIcon } from '@/components/category-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const PALETTE = {
  bg: '#e0e5ec',
  light: '#ffffff',
  dark: '#a3b1c6',
  primary: '#2d3748',
  secondary: '#64748b',
  accent: '#00b894',
  red: '#dc2626',
}

interface AccountData {
  profile: { id: string; name: string | null; email: string }
  orders: Array<{
    id: string
    total: number
    estado: string
    fechaPedido: string
    detalles: Array<{
      id: string
      cantidad: number
      subtotal: number
      producto: { id: string; name: string; category: string; image: string | null }
    }>
  }>
  favorites: Array<{
    id: string
    name: string
    category: string
    price: number
    image: string | null
  }>
}

export default function AccountPage() {
  const { user, isLoading, signUp, signIn, signOut, getAccessToken, saveShippingAddress } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [activeAccountTab, setActiveAccountTab] = useState<'activity' | 'delivery'>('activity')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [account, setAccount] = useState<AccountData | null>(null)
  const [accountError, setAccountError] = useState('')
  const [isAccountLoading, setIsAccountLoading] = useState(false)
  const [shippingAddressDraft, setShippingAddressDraft] = useState<{
    userId: string
    address: ShippingAddress
  } | null>(null)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [addressMessage, setAddressMessage] = useState('')

  const savedAddress = user?.user_metadata.direccion_envio
  const defaultShippingAddress: ShippingAddress = {
    method: savedAddress?.method === 'delivery' ? 'delivery' : 'messenger',
    recipientFirstName: typeof savedAddress?.recipientFirstName === 'string'
      ? savedAddress.recipientFirstName
      : typeof user?.user_metadata.nombre === 'string' ? user.user_metadata.nombre : '',
    recipientLastName: typeof savedAddress?.recipientLastName === 'string'
      ? savedAddress.recipientLastName
      : typeof user?.user_metadata.apellido === 'string' ? user.user_metadata.apellido : '',
    phone2: typeof savedAddress?.phone2 === 'string' ? savedAddress.phone2 : '',
    agency: typeof savedAddress?.agency === 'string' ? savedAddress.agency : '',
    address: typeof savedAddress?.address === 'string' ? savedAddress.address : '',
    city: typeof savedAddress?.city === 'string' ? savedAddress.city : '',
    postalCode: typeof savedAddress?.postalCode === 'string' ? savedAddress.postalCode : '',
    phone: typeof savedAddress?.phone === 'string'
      ? savedAddress.phone
      : typeof user?.user_metadata.telefono === 'string'
        ? user.user_metadata.telefono
        : '',
    mapsLink: typeof savedAddress?.mapsLink === 'string' ? savedAddress.mapsLink : '',
    notes: typeof savedAddress?.notes === 'string' ? savedAddress.notes : '',
  }
  const shippingAddress = shippingAddressDraft && user && shippingAddressDraft.userId === user.id
    ? shippingAddressDraft.address
    : defaultShippingAddress

  const updateShippingAddress = (field: keyof ShippingAddress, value: string) => {
    if (!user) return
    setShippingAddressDraft(current => ({
      userId: user.id,
      address: {
        ...(current && current.userId === user.id ? current.address : defaultShippingAddress),
        [field]: value,
      },
    }))
  }

  useEffect(() => {
    if (!user) {
      startTransition(() => setAccount(null))
      return
    }

    const controller = new AbortController()
    const loadAccount = async () => {
      setIsAccountLoading(true)
      setAccountError('')
      try {
        const token = await getAccessToken()
        if (!token) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.')
        const response = await fetch('/api/cuenta', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar tu perfil.')
        setAccount(data as AccountData)
      } catch (error) {
        if (controller.signal.aborted) return
        setAccountError(error instanceof Error ? error.message : 'No se pudo cargar tu perfil.')
      } finally {
        if (!controller.signal.aborted) setIsAccountLoading(false)
      }
    }

    void loadAccount()
    return () => controller.abort()
  }, [user, getAccessToken])

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setFormError('')
    setMessage('')
    try {
      if (mode === 'register') {
        const hasSession = await signUp({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          nationalId: nationalId.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
        })
        if (!hasSession) {
          setMessage('Te enviamos un correo para confirmar la creación de tu cuenta. Abre el enlace para activarla y después inicia sesión.')
        }
      } else {
        await signIn(email.trim(), password)
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo completar la autenticación.')
    } finally {
      setBusy(false)
    }
  }

  const removeFavorite = async (productId: string) => {
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.')
      const response = await fetch('/api/cuenta/favoritos', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo quitar el favorito.')
      setAccount(current => current
        ? { ...current, favorites: current.favorites.filter(product => product.id !== productId) }
        : current)
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'No se pudo quitar el favorito.')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setMessage('')
      setFormError('')
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'No se pudo cerrar sesión.')
    }
  }

  const handleSaveShippingAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (shippingAddress.method === 'delivery' && shippingAddress.address.trim().length < 5) {
      setAccountError('Indica la ubicación exacta en Caracas para el delivery.')
      return
    }
    setIsSavingAddress(true)
    setAddressMessage('')
    setAccountError('')
    try {
      await saveShippingAddress({
        method: shippingAddress.method,
        recipientFirstName: shippingAddress.recipientFirstName.trim(),
        recipientLastName: shippingAddress.recipientLastName.trim(),
        phone2: shippingAddress.phone2.trim(),
        address: shippingAddress.method === 'delivery' ? shippingAddress.address.trim() : '',
        agency: shippingAddress.method === 'messenger' ? shippingAddress.agency.trim() : '',
        city: shippingAddress.method === 'delivery' ? 'Caracas' : '',
        postalCode: '',
        phone: shippingAddress.phone.trim(),
        mapsLink: shippingAddress.method === 'delivery' ? shippingAddress.mapsLink.trim() : '',
        notes: shippingAddress.notes.trim(),
      })
      setAddressMessage('Dirección de envío guardada. Se usará como predeterminada al hacer tus pedidos.')
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'No se pudo guardar la dirección de envío.')
    } finally {
      setIsSavingAddress(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      padding: '28px 6%',
      background: PALETTE.bg,
      color: PALETTE.primary,
      fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <style>{`
          .account-name-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          .account-tabs { display: flex; flex-wrap: wrap; gap: 10px; }
          @media (max-width: 520px) { .account-name-fields { grid-template-columns: 1fr; } }
        `}</style>
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: PALETTE.secondary,
          textDecoration: 'none',
          fontWeight: 700,
          marginBottom: '24px',
        }}>
          <ArrowLeft size={17} aria-hidden="true" /> Volver a la tienda
        </Link>

        {isLoading ? (
          <div role="status" style={panelStyle}>
            <LoaderCircle className="animate-spin" size={22} aria-hidden="true" /> Cargando cuenta...
          </div>
        ) : user ? (
          <div style={{ display: 'grid', gap: '24px' }}>
            <header style={{ ...panelStyle, display: 'flex', alignItems: 'center', gap: '14px' }}>
              <UserRound size={30} color={PALETTE.accent} aria-hidden="true" />
              <div style={{ minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Hola, {account?.profile.name || user.user_metadata.nombre || 'comprador'}</h1>
                <p style={{ margin: '4px 0 0', color: PALETTE.secondary }}>{user.email}</p>
              </div>
              <Button type="button" variant="secondary" className="h-auto" onClick={() => void handleSignOut()} style={secondaryButtonStyle}>
                <LogOut size={16} aria-hidden="true" /> Cerrar sesión
              </Button>
            </header>

            {accountError && <p role="alert" style={alertStyle}>{accountError}</p>}

            {isAccountLoading ? (
              <div role="status" style={panelStyle}>Cargando compras y favoritos...</div>
            ) : account && (
              <>
                <div role="tablist" aria-label="Secciones de cuenta" className="account-tabs">
                  <Button
                    id="account-activity-tab"
                    type="button"
                    role="tab"
                    aria-selected={activeAccountTab === 'activity'}
                    aria-controls="account-activity-panel"
                    className="h-auto"
                    style={activeAccountTab === 'activity' ? { ...primaryButtonStyle, width: 'auto' } : { ...secondaryButtonStyle, marginLeft: 0 }}
                    onClick={() => setActiveAccountTab('activity')}
                  >
                    <Package size={16} aria-hidden="true" /> Compras y favoritos
                  </Button>
                  <Button
                    id="account-delivery-tab"
                    type="button"
                    role="tab"
                    aria-selected={activeAccountTab === 'delivery'}
                    aria-controls="account-delivery-panel"
                    className="h-auto"
                    style={activeAccountTab === 'delivery' ? { ...primaryButtonStyle, width: 'auto' } : { ...secondaryButtonStyle, marginLeft: 0 }}
                    onClick={() => setActiveAccountTab('delivery')}
                  >
                    <MapPin size={16} aria-hidden="true" /> Dirección de envío
                  </Button>
                </div>
                {activeAccountTab === 'activity' ? (
                  <div id="account-activity-panel" role="tabpanel" aria-labelledby="account-activity-tab" style={{ display: 'grid', gap: '24px' }}>
                <Card role="region" aria-labelledby="orders-heading" style={panelStyle} className="ring-0">
                  <CardHeader style={{ padding: 0 }}>
                    <h2 id="orders-heading" style={sectionTitleStyle}><Package size={20} color={PALETTE.accent} aria-hidden="true" /> Mis compras</h2>
                  </CardHeader>
                  {account.orders.length === 0 ? (
                    <p style={{ color: PALETTE.secondary, marginBottom: 0 }}>Todavía no tienes compras registradas.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {account.orders.map(order => (
                        <article key={order.id} style={orderCardStyle}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <strong>Pedido #{order.id.slice(0, 8)}</strong>
                            <Badge variant="secondary" style={statusStyle}>{order.estado}</Badge>
                          </div>
                          <p style={{ color: PALETTE.secondary, fontSize: '0.85rem', margin: '6px 0 10px' }}>
                            {new Date(order.fechaPedido).toLocaleDateString('es', { dateStyle: 'medium' })}
                          </p>
                          <ul style={{ margin: 0, paddingLeft: '20px', color: PALETTE.secondary }}>
                            {order.detalles.map(detail => (
                              <li key={detail.id}>{detail.cantidad} × {detail.producto.name} — ${detail.subtotal.toFixed(2)}</li>
                            ))}
                          </ul>
                          <strong style={{ display: 'block', textAlign: 'right', marginTop: '10px' }}>Total: ${order.total.toFixed(2)}</strong>
                        </article>
                      ))}
                    </div>
                  )}
                </Card>

                <Card role="region" aria-labelledby="favorites-heading" style={panelStyle} className="ring-0">
                  <CardHeader style={{ padding: 0 }}>
                    <h2 id="favorites-heading" style={sectionTitleStyle}><Heart size={20} color={PALETTE.accent} aria-hidden="true" /> Mis favoritos</h2>
                  </CardHeader>
                  {account.favorites.length === 0 ? (
                    <p style={{ color: PALETTE.secondary, marginBottom: 0 }}>Todavía no has guardado productos favoritos.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px' }}>
                      {account.favorites.map(product => (
                        <article key={product.id} style={{ ...orderCardStyle, display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ position: 'relative', width: '62px', height: '62px', flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                            {product.image
                              ? <Image src={product.image} alt={product.name} fill sizes="62px" unoptimized style={{ objectFit: 'contain' }} />
                              : <CategoryIcon category={product.category} size={30} />}
                          </div>
                          <div style={{ minWidth: 0, flexGrow: 1 }}>
                            <span style={{ color: PALETTE.accent, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>{product.category}</span>
                            <h3 style={{ margin: '3px 0', fontSize: '0.9rem' }}>{product.name}</h3>
                            <strong>${product.price.toFixed(2)}</strong>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Quitar ${product.name} de favoritos`}
                            onClick={() => void removeFavorite(product.id)}
                            style={{ ...secondaryButtonStyle, padding: '8px', color: PALETTE.red, marginLeft: 0 }}
                          >
                            <Heart size={17} fill="currentColor" aria-hidden="true" />
                          </Button>
                        </article>
                      ))}
                    </div>
                  )}
                </Card>
                  </div>
                ) : (
                  <Card id="account-delivery-panel" role="tabpanel" aria-labelledby="account-delivery-tab" style={panelStyle} className="ring-0">
                    <CardHeader style={{ padding: 0 }}>
                      <h2 style={sectionTitleStyle}><MapPin size={20} color={PALETTE.accent} aria-hidden="true" /> Datos de entrega</h2>
                    </CardHeader>
                    <p style={{ color: PALETTE.secondary, margin: '0 0 18px' }}>
                      Elige cómo recibir tus pedidos y guarda los datos para usarlos al comprar.
                    </p>
                    <form onSubmit={handleSaveShippingAddress} style={{ display: 'grid', gap: '14px', maxWidth: '620px' }}>
                      <label style={labelStyle}>
                        Método de envío
                        <select value={shippingAddress.method} onChange={event => updateShippingAddress('method', event.target.value as ShippingAddress['method'])} style={inputStyle}>
                          <option value="delivery">Delivery (solo Caracas, Venezuela)</option>
                          <option value="messenger">Mensajería</option>
                        </select>
                      </label>
                      {shippingAddress.method === 'delivery' ? (
                        <>
                          <p style={{ ...alertStyle, background: '#dbeafe', color: '#1e40af' }}>
                            El servicio de delivery está disponible únicamente en Caracas, Venezuela.
                          </p>
                          <label style={labelStyle}>
                            Nombre de quien recibe
                            <Input required minLength={2} maxLength={80} autoComplete="given-name" value={shippingAddress.recipientFirstName} onChange={event => updateShippingAddress('recipientFirstName', event.target.value)} style={inputStyle} />
                          </label>
                          <label style={labelStyle}>
                            Apellido de quien recibe
                            <Input required minLength={2} maxLength={80} autoComplete="family-name" value={shippingAddress.recipientLastName} onChange={event => updateShippingAddress('recipientLastName', event.target.value)} style={inputStyle} />
                          </label>
                          <div className="account-name-fields">
                            <label style={labelStyle}>
                              Número de teléfono 1
                              <Input required type="tel" minLength={7} maxLength={30} autoComplete="tel" value={shippingAddress.phone} onChange={event => updateShippingAddress('phone', event.target.value)} style={inputStyle} />
                            </label>
                            <label style={labelStyle}>
                              Número de teléfono 2 (opcional)
                              <Input type="tel" minLength={7} maxLength={30} value={shippingAddress.phone2} onChange={event => updateShippingAddress('phone2', event.target.value)} style={inputStyle} />
                            </label>
                          </div>
                          <label style={labelStyle}>
                            Ubicación exacta en Caracas
                            <Input required minLength={5} maxLength={300} autoComplete="street-address" value={shippingAddress.address} onChange={event => updateShippingAddress('address', event.target.value)} placeholder="Urbanización, calle, edificio, piso, apartamento..." style={inputStyle} />
                          </label>
                          <label style={labelStyle}>
                            Enlace de Google Maps (opcional)
                            <Input type="url" maxLength={500} value={shippingAddress.mapsLink} onChange={event => updateShippingAddress('mapsLink', event.target.value)} placeholder="https://maps.google.com/..." style={inputStyle} />
                          </label>
                        </>
                      ) : (
                        <>
                          <label style={labelStyle}>
                            Nombre de quien recibe
                            <Input required minLength={2} maxLength={80} autoComplete="given-name" value={shippingAddress.recipientFirstName} onChange={event => updateShippingAddress('recipientFirstName', event.target.value)} style={inputStyle} />
                          </label>
                          <label style={labelStyle}>
                            Apellido de quien recibe
                            <Input required minLength={2} maxLength={80} autoComplete="family-name" value={shippingAddress.recipientLastName} onChange={event => updateShippingAddress('recipientLastName', event.target.value)} style={inputStyle} />
                          </label>
                          <label style={labelStyle}>
                            Número de teléfono 1
                            <Input required type="tel" minLength={7} maxLength={30} autoComplete="tel" value={shippingAddress.phone} onChange={event => updateShippingAddress('phone', event.target.value)} style={inputStyle} />
                          </label>
                          <label style={labelStyle}>
                            Número de teléfono 2 (opcional)
                            <Input type="tel" minLength={7} maxLength={30} value={shippingAddress.phone2} onChange={event => updateShippingAddress('phone2', event.target.value)} style={inputStyle} />
                          </label>
                          <label style={labelStyle}>
                            Agencia a la que se envía
                            <Input required minLength={2} maxLength={150} value={shippingAddress.agency} onChange={event => updateShippingAddress('agency', event.target.value)} placeholder="Nombre y ciudad de la agencia" style={inputStyle} />
                          </label>
                        </>
                      )}
                      <label style={labelStyle}>
                        Indicaciones para la entrega (opcional)
                        <textarea maxLength={1000} value={shippingAddress.notes} onChange={event => updateShippingAddress('notes', event.target.value)} style={{ ...inputStyle, minHeight: '88px', resize: 'vertical' }} />
                      </label>
                      {addressMessage && <p role="status" style={successStyle}><Check size={16} aria-hidden="true" /> {addressMessage}</p>}
                      <Button type="submit" disabled={isSavingAddress} className="h-auto" style={{ ...primaryButtonStyle, width: 'fit-content', opacity: isSavingAddress ? 0.7 : 1 }}>
                        {isSavingAddress ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <Check size={17} aria-hidden="true" />}
                        {isSavingAddress ? 'Guardando...' : 'Guardar dirección'}
                      </Button>
                    </form>
                  </Card>
                )}
              </>
            )}
          </div>
        ) : (
          <Card style={{ ...panelStyle, maxWidth: '480px', margin: '0 auto', padding: '32px' }} className="ring-0">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <UserRound size={34} color={PALETTE.accent} aria-hidden="true" />
            </div>
            <h1 style={{ textAlign: 'center', margin: '0 0 8px', fontSize: '1.5rem' }}>
              {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
            </h1>
            <p style={{ textAlign: 'center', margin: '0 0 22px', color: PALETTE.secondary }}>
              {mode === 'login' ? 'Accede a tus compras y productos favoritos.' : 'Regístrate para guardar favoritos y consultar tus pedidos.'}
            </p>
            <form onSubmit={handleAuth} style={{ display: 'grid', gap: '14px' }}>
              {mode === 'register' && (
                <>
                  <div className="account-name-fields">
                    <label style={labelStyle}>
                      Nombre
                      <Input required value={firstName} onChange={event => setFirstName(event.target.value)} autoComplete="given-name" minLength={2} maxLength={80} style={inputStyle} />
                    </label>
                    <label style={labelStyle}>
                      Apellido
                      <Input required value={lastName} onChange={event => setLastName(event.target.value)} autoComplete="family-name" minLength={2} maxLength={80} style={inputStyle} />
                    </label>
                  </div>
                  <label style={labelStyle}>
                    Cédula
                    <Input required value={nationalId} onChange={event => setNationalId(event.target.value)} autoComplete="off" minLength={4} maxLength={30} style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    Número de teléfono
                    <Input required type="tel" value={phone} onChange={event => setPhone(event.target.value)} autoComplete="tel" minLength={7} maxLength={30} style={inputStyle} />
                  </label>
                </>
              )}
              <label style={labelStyle}>
                Correo electrónico
                <Input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Contraseña
                <Input required type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} style={inputStyle} />
                {mode === 'register' && <span style={{ color: PALETTE.secondary, fontSize: '0.75rem' }}>Usa al menos 8 caracteres.</span>}
              </label>
              {formError && <p role="alert" style={alertStyle}>{formError}</p>}
              {message && <p role="status" style={successStyle}>{message}</p>}
              <Button type="submit" disabled={busy} className="h-auto w-full" style={{ ...primaryButtonStyle, opacity: busy ? 0.7 : 1 }}>
                {busy ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : null}
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </Button>
            </form>
            <p style={{ textAlign: 'center', margin: '20px 0 0', color: PALETTE.secondary }}>
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setMode(current => current === 'login' ? 'register' : 'login')
                  setFormError('')
                  setMessage('')
                }}
                className="h-auto"
                style={{ color: PALETTE.primary, fontWeight: 800, cursor: 'pointer' }}
              >
                {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
              </Button>
            </p>
          </Card>
        )}
      </div>
    </main>
  )
}

const panelStyle = {
  padding: '24px',
  borderRadius: '22px',
  background: PALETTE.bg,
  boxShadow: `7px 7px 15px ${PALETTE.dark}, -7px -7px 15px ${PALETTE.light}`,
}

const sectionTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  margin: '0 0 18px',
  fontSize: '1.15rem',
}

const orderCardStyle = {
  padding: '14px',
  borderRadius: '16px',
  background: PALETTE.bg,
  boxShadow: `inset 3px 3px 7px ${PALETTE.dark}, inset -3px -3px 7px ${PALETTE.light}`,
}

const statusStyle = {
  padding: '4px 10px',
  borderRadius: '99px',
  background: `${PALETTE.accent}22`,
  color: PALETTE.accent,
  fontSize: '0.75rem',
  fontWeight: 800,
  textTransform: 'capitalize' as const,
}

const labelStyle = {
  display: 'grid',
  gap: '7px',
  fontSize: '0.88rem',
  fontWeight: 700,
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: 0,
  borderRadius: '12px',
  outlineColor: PALETTE.accent,
  background: PALETTE.bg,
  color: PALETTE.primary,
  boxShadow: `inset 3px 3px 7px ${PALETTE.dark}, inset -3px -3px 7px ${PALETTE.light}`,
  font: 'inherit',
}

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  width: '100%',
  padding: '13px 18px',
  border: 0,
  borderRadius: '14px',
  background: PALETTE.accent,
  color: 'white',
  fontWeight: 800,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
  marginLeft: 'auto',
  padding: '10px 13px',
  border: 0,
  borderRadius: '12px',
  background: PALETTE.bg,
  color: PALETTE.primary,
  boxShadow: `4px 4px 9px ${PALETTE.dark}, -4px -4px 9px ${PALETTE.light}`,
  fontWeight: 700,
  cursor: 'pointer',
}

const alertStyle = {
  margin: 0,
  padding: '10px 12px',
  borderRadius: '12px',
  background: '#fee2e2',
  color: '#991b1b',
}

const successStyle = {
  margin: 0,
  padding: '10px 12px',
  borderRadius: '12px',
  background: '#dcfce7',
  color: '#166534',
}
