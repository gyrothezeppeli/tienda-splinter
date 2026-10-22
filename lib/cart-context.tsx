'use client'

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

const CART_STORAGE_KEY = 'soniclab-cart'

export interface CartProduct {
  id: string
  name: string
  category: string
  price: number
  image: string | null
}

export interface CartItem {
  product: CartProduct
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  total: number
  isHydrated: boolean
  addToCart: (product: CartProduct) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false

  const item = value as Partial<CartItem>
  const product = item.product

  return Boolean(
    product &&
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    typeof product.category === 'string' &&
    typeof product.price === 'number' &&
    (typeof product.image === 'string' || product.image === null) &&
    Number.isInteger(item.quantity) &&
    Number(item.quantity) > 0
  )
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    let loadedItems: CartItem[] | null = null
    try {
      const storedCart = window.localStorage.getItem(CART_STORAGE_KEY)
      if (storedCart) {
        const parsed: unknown = JSON.parse(storedCart)
        if (Array.isArray(parsed)) {
          loadedItems = parsed.filter(isCartItem)
        } else {
          console.error('El contenido guardado del carrito no tiene un formato válido.')
        }
      }
    } catch (error) {
      console.error('No se pudo cargar el carrito guardado:', error)
    } finally {
      startTransition(() => {
        if (loadedItems) setItems(loadedItems)
        setIsHydrated(true)
      })
    }

    const syncCart = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY) return
      if (!event.newValue) {
        setItems([])
        return
      }

      try {
        const parsed: unknown = JSON.parse(event.newValue)
        if (Array.isArray(parsed)) {
          startTransition(() => setItems(parsed.filter(isCartItem)))
        } else {
          console.error('El carrito sincronizado desde otra pestaña no tiene un formato válido.')
        }
      } catch (error) {
        console.error('No se pudo sincronizar el carrito entre pestañas:', error)
      }
    }

    window.addEventListener('storage', syncCart)
    return () => window.removeEventListener('storage', syncCart)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('No se pudo guardar el carrito en este navegador:', error)
    }
  }, [items, isHydrated])

  const addToCart = useCallback((product: CartProduct) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.product.id === product.id)
      if (existingItem) {
        return currentItems.map(item =>
          item.product.id === product.id
            ? { ...item, product, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...currentItems, { product, quantity: 1 }]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1) return
    setItems(currentItems =>
      currentItems.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.product.id !== productId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const value = useMemo(() => ({
    items,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    isHydrated,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  }), [items, isHydrated, addToCart, updateQuantity, removeFromCart, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe utilizarse dentro de CartProvider.')
  }
  return context
}
