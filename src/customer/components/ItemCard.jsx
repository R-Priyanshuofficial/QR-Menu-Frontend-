import { Plus, Minus, Sparkles, Package, Settings2 } from 'lucide-react'
import { formatCurrency } from '@shared/utils/formatters'
import { useCart } from '@shared/contexts/CartContext'
import { cn } from '@shared/utils/cn'
import { motion } from 'framer-motion'
import { getDisplayPriceInfo } from '@shared/utils/priceEngine'
import { getComboPresentation, getComboTagList, formatCombinationCount, isComboItem } from '@shared/utils/comboPricing'

export const ItemCard = ({ item, onOpenDetail, index = 0 }) => {
  const { items, addItem, updateQuantity } = useCart()
  const totalQty = items.filter(i => i.id === item.id).reduce((sum, i) => sum + i.quantity, 0)

  const isOOS = item.availability?.status === 'out-of-stock' || !item.isAvailable
  const priceInfo = getDisplayPriceInfo(item)
  const isCombo = isComboItem(item)
  const isCustomCombo = isCombo && item?.comboType === 'custom'
  const comboInfo = isCombo ? getComboPresentation(item) : null
  const comboTags = isCombo ? getComboTagList(item) : []

  if (!priceInfo.isValid) {
    return null
  }

  const handleAdd = (event) => {
    event?.stopPropagation()
    if (isOOS) return
    if (isCombo || priceInfo.hasVariants || priceInfo.hasAddons) {
      onOpenDetail?.(item)
    } else {
      addItem(item)
    }
  }

  if (isCombo) {
    const fixedItems = comboInfo?.fixedItems || []
    const groups = comboInfo?.groups || []
    const totalIncludedItems = fixedItems.reduce((sum, entry) => sum + (entry.quantity || 1), 0)
    const previewItems = fixedItems.slice(0, 3)
    const remainingItems = Math.max(0, fixedItems.length - previewItems.length)
    const combinationLabel = formatCombinationCount(comboInfo?.totalCombinations || 0)

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
        onClick={() => onOpenDetail?.(item)}
        className={cn(
          'group relative overflow-hidden cursor-pointer rounded-[28px] border transition-all',
          isCustomCombo
            ? 'border-violet-500/15 bg-gradient-to-br from-violet-500/8 via-[#0D1324] to-pink-500/8 hover:border-violet-500/30'
            : 'border-emerald-500/15 bg-gradient-to-br from-emerald-500/8 via-[#0D1324] to-amber-500/8 hover:border-emerald-500/25',
          isOOS && 'opacity-50'
        )}
      >
        <div className="relative h-52 sm:h-60">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className={cn(
              'h-full w-full flex items-center justify-center',
              isCustomCombo
                ? 'bg-gradient-to-br from-violet-900/30 via-slate-950 to-pink-900/20'
                : 'bg-gradient-to-br from-emerald-900/30 via-slate-950 to-amber-900/20'
            )}>
              <Sparkles className="w-12 h-12 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/30 to-transparent" />

          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md',
              isCustomCombo
                ? 'bg-violet-500/15 text-violet-200 border-violet-500/20'
                : 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
            )}>
              {isCustomCombo ? <Settings2 className="w-3 h-3" /> : <Package className="w-3 h-3" />}
              {isCustomCombo ? 'Build Your Own' : 'Ready Combo'}
            </span>

            {item.isVeg !== undefined && (
              <span className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md',
                item.isVeg
                  ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
                  : 'bg-red-500/15 text-red-200 border-red-500/20'
              )}>
                <span className={cn('w-2 h-2 rounded-[2px] border flex items-center justify-center', item.isVeg ? 'border-emerald-400' : 'border-red-400')}>
                  <span className={cn('w-1 h-1 rounded-full', item.isVeg ? 'bg-emerald-400' : 'bg-red-400')} />
                </span>
                {item.isVeg ? 'Veg' : 'Non-Veg'}
              </span>
            )}

            {comboTags.slice(0, 1).map(tag => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-md capitalize"
              >
                {tag}
              </span>
            ))}
          </div>

          {item.preparationTime > 0 && (
            <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-md">
              {item.preparationTime}m
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight line-clamp-2">{item.name}</h3>
            {item.description && <p className="mt-1.5 text-sm text-zinc-300/85 line-clamp-2">{item.description}</p>}
          </div>
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-[10px] text-zinc-500">Included</p>
              <p className="mt-1 text-lg font-bold text-white">{isCustomCombo ? comboInfo?.groupCount || 0 : totalIncludedItems}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-[10px] text-zinc-500">Savings</p>
              <p className="mt-1 text-lg font-bold text-emerald-300">{formatCurrency(comboInfo?.savings || 0, item.currency)}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-[10px] text-zinc-500">Mode</p>
              <p className="mt-1 text-lg font-bold text-white">{isCustomCombo ? combinationLabel : 'Ready'}</p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="rounded-2xl border border-white/[0.06] bg-black/15 p-4">
              <p className="text-sm font-semibold text-white mb-3">{isCustomCombo ? 'Build preview' : 'Included items'}</p>
              <div className="space-y-2">
                {isCustomCombo
                  ? groups.slice(0, 3).map(group => (
                      <div key={group.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{group.name}</p>
                          <p className="text-[11px] text-zinc-500">
                            {group.minSelections === group.maxSelections ? 'Single selection' : `${group.minSelections}-${group.maxSelections} selections`}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-violet-300">Choose</span>
                      </div>
                    ))
                  : previewItems.map(entry => (
                      <div key={entry.id || entry.name} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{entry.name}</p>
                          <p className="text-[11px] text-zinc-500">{entry.quantity || 1} included</p>
                        </div>
                        <span className="text-sm font-semibold text-white">{formatCurrency(entry.price, item.currency)}</span>
                      </div>
                    ))}
                {((isCustomCombo && groups.length === 0) || (!isCustomCombo && previewItems.length === 0)) && (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500">
                    Combo details will appear after configuration.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Price</p>
                  <p className={cn('mt-1 text-3xl font-black', isCustomCombo ? 'text-violet-300' : 'text-emerald-300')}>
                    {isCustomCombo
                      ? `From ${formatCurrency(comboInfo?.startingFrom || 0, item.currency)}`
                      : formatCurrency(comboInfo?.comboPrice || priceInfo.display, item.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Original</p>
                  <p className="mt-1 text-base font-semibold text-zinc-500 line-through">
                    {formatCurrency(comboInfo?.regularTotal || 0, item.currency)}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/80">You save</p>
                  <p className="mt-1 text-lg font-bold text-emerald-200">{formatCurrency(comboInfo?.savings || 0, item.currency)}</p>
                </div>
              </div>

              <button
                type="button"
                className={cn(
                  'mt-4 w-full rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98]',
                  isCustomCombo
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30'
                    : 'bg-gradient-to-r from-emerald-500 to-amber-500 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30'
                )}
                onClick={handleAdd}
              >
                {isCustomCombo ? 'Customize now' : 'View combo'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={() => onOpenDetail?.(item)}
      className={cn(
        'group relative overflow-hidden cursor-pointer rounded-[28px] border transition-all',
        'bg-gradient-to-br from-[#10172A] via-[#0D1324] to-[#080D1A]',
        isOOS
          ? 'opacity-50 border-white/[0.06]'
          : 'border-white/[0.08] hover:border-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/10'
      )}
    >
      <div className="relative h-44 sm:h-48">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-violet-900/20 via-[#0D1324] to-pink-900/20 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-zinc-500/70" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/35 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          {item.isVeg !== undefined && (
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md',
              item.isVeg ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20' : 'bg-red-500/15 text-red-200 border-red-500/20'
            )}>
              <span className={cn('w-2 h-2 rounded-[2px] border flex items-center justify-center', item.isVeg ? 'border-emerald-400' : 'border-red-400')}>
                <span className={cn('w-1 h-1 rounded-full', item.isVeg ? 'bg-emerald-400' : 'bg-red-400')} />
              </span>
              {item.isVeg ? 'Veg' : 'Non-Veg'}
            </span>
          )}
          {item.badge && (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-md capitalize">
              {typeof item.badge === 'string' ? item.badge.replace(/[-_]/g, ' ') : item.badge?.text || 'Featured'}
            </span>
          )}
        </div>

        {item.preparationTime > 0 && (
          <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-md">
            {item.preparationTime}m
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400 mb-1">{item.category}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight line-clamp-2">{item.name}</h3>
          {item.description && <p className="mt-1.5 text-sm text-zinc-300/85 line-clamp-2">{item.description}</p>}
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Price</p>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              {priceInfo.strikePrice && (
                <span className="text-xs text-zinc-500 line-through">{formatCurrency(priceInfo.strikePrice, item.currency)}</span>
              )}
              <span className="text-2xl font-black text-white">
                {priceInfo.hasVariants ? `From ${formatCurrency(priceInfo.display, item.currency)}` : formatCurrency(priceInfo.display, item.currency)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0" onClick={(event) => event.stopPropagation()}>
            {priceInfo.hasVariants || priceInfo.hasAddons ? (
              <button
                onClick={handleAdd}
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/35 active:scale-[0.98]"
              >
                Customize
              </button>
            ) : totalQty === 0 ? (
              <button
                onClick={handleAdd}
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/35 active:scale-[0.98]"
              >
                Add
              </button>
            ) : (
              <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
                <button
                  onClick={(event) => { event.stopPropagation(); updateQuantity(item.id, totalQty - 1) }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-pink-400 transition-colors hover:bg-white/5"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-white">{totalQty}</span>
                <button
                  onClick={(event) => { event.stopPropagation(); updateQuantity(item.id, totalQty + 1) }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-violet-400 transition-colors hover:bg-white/5"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
