import { Plus, Minus, Clock, Star, Zap, TrendingUp, ChefHat, Flame, Leaf } from 'lucide-react'
import { formatCurrency } from '@shared/utils/formatters'
import { useCart } from '@shared/contexts/CartContext'
import { cn } from '@shared/utils/cn'
import { motion } from 'framer-motion'

const BADGE_META = {
  bestseller: { label: 'Bestseller', icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  new: { label: 'New', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  'chef-special': { label: 'Chef Special', icon: ChefHat, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  trending: { label: 'Trending', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
}

const SPICE_META = {
  mild: { label: 'Mild', emoji: '🌶️' },
  medium: { label: 'Medium', emoji: '🌶️🌶️' },
  hot: { label: 'Hot', emoji: '🔥' },
  'very-hot': { label: 'Very Hot', emoji: '🔥🔥' },
}

export const ItemCard = ({ item, onOpenDetail, index = 0 }) => {
  const { items, addItem, updateQuantity } = useCart()
  const totalQty = items.filter(i => i.id === item.id).reduce((s, i) => s + i.quantity, 0)

  const hasVariants = item.variants?.length > 0
  const hasAddons = item.addons?.length > 0
  const isOOS = item.availability?.status === 'out-of-stock' || !item.isAvailable
  const badgeMeta = item.badge && item.badge !== 'none' ? BADGE_META[item.badge] : null
  const spiceMeta = item.spiceLevel && item.spiceLevel !== 'none' ? SPICE_META[item.spiceLevel] : null

  // Display price logic — NEVER show ₹0
  const getDisplayPrice = () => {
    if (hasVariants) {
      const availableVariants = item.variants.filter(v => v.isAvailable !== false)
      if (availableVariants.length > 0) {
        return Math.min(...availableVariants.map(v => v.price))
      }
    }
    const hasOffer = item.offerPrice > 0 && item.offerPrice < item.price
    return hasOffer ? item.offerPrice : (item.price || 0)
  }

  const displayPrice = getDisplayPrice()
  const hasOffer = !hasVariants && item.offerPrice > 0 && item.offerPrice < item.price
  const showCompare = !hasVariants && item.comparePrice > 0 && item.comparePrice > displayPrice

  const handleAdd = (e) => {
    e?.stopPropagation()
    if (isOOS) return
    if (hasVariants || hasAddons) {
      onOpenDetail?.(item)
    } else {
      addItem(item)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={() => onOpenDetail?.(item)}
      className={cn(
        'group relative rounded-2xl overflow-hidden transition-all cursor-pointer',
        'bg-[#0D1324] border border-white/[0.06]',
        isOOS ? 'opacity-50' : 'hover:border-violet-500/20 hover:bg-[#0F1628]'
      )}
    >
      <div className="flex gap-3 p-3.5">
        {/* LEFT — Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          {/* Top: badges */}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              {/* Veg/Non-veg */}
              {item.isVeg !== undefined && (
                <span className={cn(
                  'w-4 h-4 rounded-[3px] border-[1.5px] flex items-center justify-center flex-shrink-0',
                  item.isVeg ? 'border-emerald-500' : 'border-red-500'
                )}>
                  <span className={cn('w-[7px] h-[7px] rounded-full', item.isVeg ? 'bg-emerald-500' : 'bg-red-500')} />
                </span>
              )}
              {badgeMeta && (
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold', badgeMeta.bg, badgeMeta.color)}>
                  <badgeMeta.icon className="w-2.5 h-2.5" /> {badgeMeta.label}
                </span>
              )}
              {spiceMeta && (
                <span className="text-[10px]">{spiceMeta.emoji}</span>
              )}
            </div>

            {/* Name */}
            <h3 className="font-semibold text-white text-[15px] leading-snug line-clamp-2 mb-1">{item.name}</h3>

            {/* Description */}
            {item.description && (
              <p className="text-xs text-zinc-500 line-clamp-2 mb-2 leading-relaxed">{item.description}</p>
            )}

            {/* Meta: prep time, variants, addons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.preparationTime > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                  <Clock className="w-3 h-3" />{item.preparationTime}m
                </span>
              )}
              {hasVariants && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 text-[10px] font-semibold">
                  {item.variants.length} Variant{item.variants.length > 1 ? 's' : ''}
                </span>
              )}
              {hasAddons && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 text-[10px] font-semibold">
                  {item.addons.length} Add-on{item.addons.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Bottom: Price */}
          <div className="mt-2.5">
            {hasVariants && <p className="text-[10px] text-zinc-500 font-medium mb-0.5">Starting from</p>}
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white">
                {displayPrice > 0 ? formatCurrency(displayPrice, item.currency) : ''}
              </span>
              {showCompare && (
                <span className="text-xs text-zinc-600 line-through">{formatCurrency(item.comparePrice, item.currency)}</span>
              )}
              {hasOffer && (
                <span className="text-xs text-zinc-600 line-through">{formatCurrency(item.price, item.currency)}</span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Image + Add Button */}
        <div className="relative flex-shrink-0 w-[110px]" onClick={(e) => e.stopPropagation()}>
          <div className="w-[110px] h-[110px] rounded-xl overflow-hidden bg-white/5">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900/20 to-pink-900/20">
                <span className="text-3xl opacity-20">🍽️</span>
              </div>
            )}
            {isOOS && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                <span className="px-2.5 py-1 rounded-lg bg-red-500/90 text-white text-[10px] font-bold">Sold Out</span>
              </div>
            )}
          </div>

          {/* Add button positioned below image */}
          {!isOOS && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              {totalQty === 0 ? (
                <button onClick={handleAdd}
                  className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all active:scale-95 border border-violet-400/20">
                  ADD
                </button>
              ) : (hasVariants || hasAddons) ? (
                <div className="flex items-center gap-1">
                  <span className="px-2.5 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 text-xs font-bold border border-violet-500/20">{totalQty} added</span>
                  <button onClick={handleAdd}
                    className="w-7 h-7 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 text-white flex items-center justify-center hover:scale-110 transition-all shadow-md">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 bg-[#0D1324] border border-white/10 rounded-lg overflow-hidden">
                  <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, totalQty - 1) }}
                    className="w-8 h-8 flex items-center justify-center text-pink-400 hover:bg-white/5 transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-white">{totalQty}</span>
                  <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, totalQty + 1) }}
                    className="w-8 h-8 flex items-center justify-center text-violet-400 hover:bg-white/5 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
