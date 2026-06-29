import { createContext, useContext, useState, useEffect } from 'react'
import { calculateUnitPrice } from '@shared/utils/priceEngine'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try { setItems(JSON.parse(savedCart)) } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  // Generate a unique cart key from item + variant + addons + combo selections
  const getCartKey = (item) => {
    const variantPart = item.selectedVariant?.name || ''
    const addonsPart = (item.selectedAddons || []).map(a => a.name).sort().join(',')
    const comboPart = (item.comboSelections || []).map(selection => `${selection.groupId || selection.groupName || ''}:${selection.itemId || selection.name || ''}`).sort().join('|')
    return `${item.id}__${variantPart}__${addonsPart}__${comboPart}`
  }

  const addItem = (item) => {
    setItems((prev) => {
      const cartKey = getCartKey(item)
      const existingIndex = prev.findIndex((i) => i._cartKey === cartKey)

      if (existingIndex >= 0) {
        const newItems = [...prev]
        newItems[existingIndex].quantity += (item.quantity || 1)
        toast.success(`Added another ${item.name}`)
        return newItems
      } else {
        toast.success(`${item.name} added to cart`)
        return [...prev, { ...item, _cartKey: cartKey, quantity: item.quantity || 1 }]
      }
    })
  }

  const removeItem = (cartKey) => {
    setItems((prev) => {
      const item = prev.find((i) => i._cartKey === cartKey || i.id === cartKey)
      if (item) toast.success(`${item.name} removed`)
      return prev.filter((i) => i._cartKey !== cartKey && i.id !== cartKey)
    })
  }

  const updateQuantity = (cartKey, quantity) => {
    if (quantity <= 0) { removeItem(cartKey); return }
    setItems((prev) =>
      prev.map((item) =>
        (item._cartKey === cartKey || item.id === cartKey) ? { ...item, quantity } : item
      )
    )
  }

  const replaceItem = (cartKey, item) => {
    setItems((prev) => {
      const nextItem = { ...item, _cartKey: getCartKey(item), quantity: item.quantity || 1 }
      const index = prev.findIndex((entry) => entry._cartKey === cartKey || entry.id === cartKey)
      if (index < 0) return prev

      const next = [...prev]
      next[index] = nextItem
      toast.success(`${item.name} updated`)
      return next
    })
  }

  const clearCart = () => { setItems([]); toast.success('Cart cleared') }

  // Use centralized price engine for consistent pricing
  const getItemPrice = (item) => {
    return calculateUnitPrice(item, item.selectedVariant, item.selectedAddons)
  }

  const getTotalAmount = () => items.reduce((total, item) => total + getItemPrice(item) * item.quantity, 0)
  const getTotalItems = () => items.reduce((total, item) => total + item.quantity, 0)

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)

  const value = {
    items, isOpen, addItem, removeItem, updateQuantity, clearCart,
    replaceItem, getTotalAmount, getTotalItems, getItemPrice, openCart, closeCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
