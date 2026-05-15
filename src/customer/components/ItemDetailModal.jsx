import { useState, useMemo, useEffect } from 'react'
import { X, Plus, Minus, ShoppingBag, Clock, Leaf, Star, Check, Flame } from 'lucide-react'
import { useCart } from '@shared/contexts/CartContext'
import { formatCurrency } from '@shared/utils/formatters'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@shared/utils/cn'

const BADGE_LABELS = { bestseller: '⭐ Bestseller', new: '✨ New', 'chef-special': '👨‍🍳 Chef Special', trending: '🔥 Trending' }

export const ItemDetailModal = ({ item, isOpen, onClose }) => {
  const { addItem } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const hasVariants = item?.variants?.length > 0
  const hasAddons = item?.addons?.length > 0

  useEffect(() => {
    if (item && isOpen) {
      const defaultV = item.variants?.find(v => v.isDefault) || item.variants?.[0] || null
      setSelectedVariant(defaultV)
      setSelectedAddons([])
      setQuantity(1)
      setNotes('')
    }
  }, [item, isOpen])

  const unitPrice = useMemo(() => {
    if (!item) return 0
    const base = selectedVariant?.price || item?.price || 0
    const addonsTotal = selectedAddons.reduce((s, a) => s + (a.price || 0), 0)
    return base + addonsTotal
  }, [selectedVariant, selectedAddons, item])

  const totalPrice = unitPrice * quantity

  const toggleAddon = (addon) => {
    setSelectedAddons(prev =>
      prev.find(a => a.name === addon.name)
        ? prev.filter(a => a.name !== addon.name)
        : [...prev, addon]
    )
  }

  const canAddToCart = !hasVariants || selectedVariant !== null

  const handleAddToCart = () => {
    if (!item || !canAddToCart) return
    addItem({
      id: item.id, name: item.name, image: item.image,
      price: unitPrice, currency: item.currency,
      selectedVariant, selectedAddons, notes, quantity,
    })
    onClose()
  }

  if (!item) return null

  const badgeLabel = item.badge && item.badge !== 'none' ? BADGE_LABELS[item.badge] : null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg max-h-[92vh] bg-[#0A0F1E] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col z-10 shadow-2xl border border-white/[0.06]"
          >
            {/* Image Header */}
            <div className="relative h-52 sm:h-60 flex-shrink-0">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-950/50 to-pink-950/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-[#0A0F1E]/40 to-transparent" />

              {/* Close */}
              <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white/80 flex items-center justify-center hover:bg-black/60 transition-colors border border-white/10">
                <X className="w-5 h-5" />
              </button>

              {/* Badge */}
              {badgeLabel && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md text-xs font-bold text-white border border-white/10">{badgeLabel}</div>
              )}

              {/* Title on image */}
              <div className="absolute bottom-4 left-5 right-5">
                <h2 className="text-xl font-bold text-white mb-1">{item.name}</h2>
                <div className="flex items-center gap-3 text-white/60 text-xs">
                  {item.isVeg !== undefined && (
                    <span className="flex items-center gap-1">
                      <span className={cn('w-3 h-3 rounded-[2px] border-[1.5px] flex items-center justify-center', item.isVeg ? 'border-emerald-400' : 'border-red-400')}>
                        <span className={cn('w-[5px] h-[5px] rounded-full', item.isVeg ? 'bg-emerald-400' : 'bg-red-400')} />
                      </span>
                      {item.isVeg ? 'Veg' : 'Non-Veg'}
                    </span>
                  )}
                  {item.preparationTime > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.preparationTime} min</span>}
                  {item.calories > 0 && <span>{item.calories} cal</span>}
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Description */}
              {item.description && <p className="text-sm text-zinc-400 leading-relaxed">{item.description}</p>}

              {/* ─── Variants ─── */}
              {hasVariants && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-white">Choose Variant</p>
                    <span className="text-[10px] text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded">Required</span>
                  </div>
                  <div className="space-y-2">
                    {item.variants.filter(v => v.isAvailable !== false).map((v) => {
                      const isSelected = selectedVariant?.name === v.name
                      return (
                        <button key={v.name} onClick={() => setSelectedVariant(v)}
                          className={cn('w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left border',
                            isSelected
                              ? 'bg-violet-500/10 border-violet-500/30 ring-1 ring-violet-500/10'
                              : 'bg-white/[0.03] border-white/[0.06] hover:border-white/15'
                          )}>
                          <div className="flex items-center gap-3">
                            <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                              isSelected ? 'border-violet-500' : 'border-zinc-600'
                            )}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />}
                            </div>
                            <span className="text-sm font-medium text-white">{v.name}</span>
                          </div>
                          <span className={cn('text-sm font-bold', isSelected ? 'text-violet-400' : 'text-zinc-400')}>{formatCurrency(v.price, item.currency)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ─── Add-ons ─── */}
              {hasAddons && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-white">Customize Your Order</p>
                    <span className="text-[10px] text-zinc-500 font-medium">Optional</span>
                  </div>
                  <div className="space-y-2">
                    {item.addons.map((a) => {
                      const isSelected = selectedAddons.find(s => s.name === a.name)
                      return (
                        <button key={a.name} onClick={() => toggleAddon(a)}
                          className={cn('w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left border',
                            isSelected
                              ? 'bg-pink-500/10 border-pink-500/30 ring-1 ring-pink-500/10'
                              : 'bg-white/[0.03] border-white/[0.06] hover:border-white/15'
                          )}>
                          <div className="flex items-center gap-3">
                            <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                              isSelected ? 'border-pink-500 bg-pink-500' : 'border-zinc-600'
                            )}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-white block">{a.name}</span>
                              {a.isRequired && <span className="text-[10px] text-red-400 font-medium">Required</span>}
                            </div>
                          </div>
                          <span className={cn('text-sm font-bold', isSelected ? 'text-pink-400' : 'text-zinc-400')}>+{formatCurrency(a.price, item.currency)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ─── Notes ─── */}
              <div>
                <p className="text-sm font-bold text-white mb-2">Special Instructions</p>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. No onion, extra spicy..." rows={2}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 resize-none transition-all" />
              </div>
            </div>

            {/* ─── STICKY FOOTER ─── */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.06] bg-[#070C1A]">
              <div className="flex items-center justify-between mb-3">
                {/* Quantity */}
                <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl border border-white/[0.08] px-1 py-1">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-base font-bold text-white w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-600 text-white hover:bg-violet-500 transition-all">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Live Price */}
                <p className="text-xl font-bold text-white">{formatCurrency(totalPrice, item.currency)}</p>
              </div>

              {/* Add to Cart button */}
              <button onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={cn(
                  'w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all',
                  canAddToCart
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:shadow-xl hover:shadow-violet-500/20 hover:scale-[1.01] active:scale-[0.99]'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                )}>
                <ShoppingBag className="w-5 h-5" />
                {canAddToCart ? `Add to Cart · ${formatCurrency(totalPrice, item.currency)}` : 'Select a Variant'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
