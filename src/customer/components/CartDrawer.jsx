import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '@shared/contexts/CartContext'
import { formatCurrency } from '@shared/utils/formatters'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export const CartDrawer = () => {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getTotalAmount, getTotalItems, getItemPrice } = useCart()
  const navigate = useNavigate()

  const handleCheckout = () => {
    closeCart()
    navigate('cart')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        onClick={closeCart}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-[#070C1A] shadow-2xl z-50 flex flex-col border-l border-white/[0.06]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-xl font-bold text-white">Your Cart</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={closeCart}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <ShoppingBag className="w-9 h-9 text-zinc-700" />
              </div>
              <p className="text-zinc-400 font-medium text-base mb-1">Your cart is empty</p>
              <p className="text-zinc-600 text-sm">Start adding delicious items</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {items.map((item) => {
                  const cartKey = item._cartKey || item.id
                  const itemPrice = getItemPrice(item)
                  return (
                    <motion.div
                      key={cartKey}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.06] hover:border-white/10 transition-colors"
                    >
                      <div className="flex gap-3">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-white text-sm truncate">{item.name}</h3>
                              {item.selectedVariant && (
                                <p className="text-[11px] text-violet-400 font-medium mt-0.5">Variant: {item.selectedVariant.name}</p>
                              )}
                              {item.selectedAddons?.length > 0 && (
                                <div className="mt-0.5">
                                  {item.selectedAddons.map(a => (
                                    <p key={a.name} className="text-[11px] text-pink-400 font-medium">+ {a.name}</p>
                                  ))}
                                </div>
                              )}
                              {item.comboSelections?.length > 0 && (
                                <div className="mt-0.5 space-y-0.5">
                                  {item.comboSelections.map(selection => (
                                    <p key={`${selection.groupId || selection.groupName}-${selection.itemId || selection.name}`} className="text-[11px] text-emerald-400 font-medium">
                                      {selection.groupName ? `${selection.groupName}: ` : ''}
                                      {selection.name}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {item.notes && (
                                <p className="text-[10px] text-zinc-400 italic mt-1 bg-black/20 p-1 rounded border border-white/5 line-clamp-2">"{item.notes}"</p>
                              )}
                            </div>
                            <button onClick={() => removeItem(cartKey)} className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-2.5">
                            {/* Qty controls */}
                            <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg border border-white/[0.08] overflow-hidden">
                              <button onClick={() => updateQuantity(cartKey, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center text-pink-400 hover:bg-white/5 transition-colors">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-white">{item.quantity}</span>
                              <button onClick={() => updateQuantity(cartKey, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center text-violet-400 hover:bg-white/5 transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Price Breakdown */}
                            <div className="text-right">
                              {item.quantity > 1 && (
                                <p className="text-[10px] text-zinc-500 font-medium mb-0.5">{formatCurrency(itemPrice, item.currency)} each</p>
                              )}
                              <span className="text-sm font-bold text-white">{formatCurrency(itemPrice * item.quantity, item.currency)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-white/[0.06] px-5 py-5 bg-[#050816]">
            {/* Summary */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <span className="text-zinc-300 font-medium">{formatCurrency(getTotalAmount())}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Taxes</span>
                <span className="text-zinc-400 font-medium">Included</span>
              </div>
              <div className="h-px bg-white/[0.06] my-1" />
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-white">Total</span>
                <span className="text-xl font-bold text-white">{formatCurrency(getTotalAmount())}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold text-base hover:shadow-xl hover:shadow-violet-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </motion.div>
    </>
  )
}
