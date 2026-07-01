import { useEffect, useMemo, useState } from 'react'
import { X, Plus, Minus, ShoppingBag, Clock, Check, Image, Settings2, Package, Zap, Star } from 'lucide-react'
import { useCart } from '@shared/contexts/CartContext'
import { formatCurrency } from '@shared/utils/formatters'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@shared/utils/cn'
import { getComboPresentation, normalizeComboGroups, formatCombinationCount, isComboItem } from '@shared/utils/comboPricing'

const BADGE_LABELS = {
  bestseller: 'Bestseller',
  popular: 'Popular',
  new: 'New',
  trending: 'Trending',
  limited: 'Limited Offer',
  limited_offer: 'Limited Offer',
  'chef-choice': "Chef's Choice",
  'chef-special': "Chef's Choice",
}

const BADGE_STYLES = {
  bestseller: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  popular: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
  new: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  trending: 'bg-pink-500/15 text-pink-300 border-pink-500/20',
  limited: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  limited_offer: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  'chef-choice': 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  'chef-special': 'bg-orange-500/15 text-orange-300 border-orange-500/20',
}

const toSelectionMap = (comboSelections = []) => {
  return comboSelections.reduce((acc, selection) => {
    if (!selection?.groupId || !selection?.itemId) return acc
    acc[selection.groupId] = Array.isArray(acc[selection.groupId])
      ? [...acc[selection.groupId], selection.itemId]
      : [selection.itemId]
    return acc
  }, {})
}

const renderBadgeList = (item) => {
  const badges = []
  const rawBadges = [
    ...(Array.isArray(item?.badges) ? item.badges : []),
    item?.badge,
    item?.tag,
  ].filter(Boolean)

  rawBadges.forEach((badge) => {
    const key = String(badge).toLowerCase().replace(/\s+/g, '-')
    const label = BADGE_LABELS[key] || BADGE_LABELS[String(badge).toLowerCase()] || String(badge)
    if (!badges.find(entry => entry.key === key)) {
      badges.push({ key, label })
    }
  })

  return badges
}

const ComboMetaChip = ({ icon: Icon, children, tone = 'neutral' }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold border backdrop-blur-md',
      tone === 'emerald' && 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20',
      tone === 'violet' && 'bg-violet-500/15 text-violet-200 border-violet-500/20',
      tone === 'amber' && 'bg-amber-500/15 text-amber-200 border-amber-500/20',
      tone === 'slate' && 'bg-black/35 text-white/80 border-white/10',
      tone === 'neutral' && 'bg-white/5 text-zinc-200 border-white/10'
    )}
  >
    {Icon && <Icon className="w-3 h-3" />}
    {children}
  </span>
)

const SectionShell = ({ title, subtitle, children, accent = 'emerald' }) => (
  <section className={cn('rounded-2xl border overflow-hidden', accent === 'emerald' ? 'border-emerald-500/15 bg-emerald-500/5' : accent === 'violet' ? 'border-violet-500/15 bg-violet-500/5' : 'border-white/[0.06] bg-white/[0.03]')}>
    <div className="px-4 py-3 border-b border-white/[0.06]">
      <p className="text-sm font-bold text-white">{title}</p>
      {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </section>
)

export const ItemDetailModal = ({ item, isOpen, onClose, initialSelection = null, editingCartKey = null }) => {
  const { addItem, replaceItem } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [selectedComboItems, setSelectedComboItems] = useState({})
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const hasVariants = item?.variants?.length > 0
  const hasAddons = item?.addons?.length > 0
  const isCombo = isComboItem(item)
  const isCustomCombo = isCombo && item?.comboType === 'custom'
  const comboGroups = useMemo(() => normalizeComboGroups(item), [item])
  const comboPresentation = useMemo(
    () => getComboPresentation(item, selectedComboItems, { useDefaults: false }),
    [item, selectedComboItems]
  )
  const comboFixedItems = comboPresentation.fixedItems
  const comboItemCount = comboFixedItems.reduce((sum, entry) => sum + (entry.quantity || 1), 0)
  const comboValid = !isCustomCombo || comboGroups.every(group => {
    const selected = selectedComboItems[group.id] || []
    return selected.length >= group.minSelections && selected.length <= group.maxSelections
  })
  const badgeList = useMemo(() => renderBadgeList(item), [item])
  const comboTags = useMemo(() => {
    const tags = Array.isArray(item?.tags) ? item.tags : []
    return tags.filter(Boolean)
  }, [item])

  const showStartingFrom = isCustomCombo && !comboPresentation.hasExplicitSelections
  const displayUnitPrice = isCustomCombo
    ? (showStartingFrom ? comboPresentation.startingFrom : comboPresentation.currentPrice)
    : (comboPresentation.comboPrice || item?.sellingPrice || item?.price || 0)

  useEffect(() => {
    if (!item || !isOpen) return

    const initialVariant = initialSelection?.selectedVariant
      || item.variants?.find(v => v.isDefault)
      || item.variants?.[0]
      || null

    setSelectedVariant(initialVariant)
    setSelectedAddons(initialSelection?.selectedAddons || [])
    setQuantity(initialSelection?.quantity || 1)
    setNotes(initialSelection?.notes || '')
    setSelectedComboItems(toSelectionMap(initialSelection?.comboSelections || []))
  }, [item, isOpen, initialSelection])

  const unitPrice = useMemo(() => {
    if (!item) return 0
    if (isCombo && isCustomCombo) return displayUnitPrice
    if (isCombo) return comboPresentation.comboPrice || item?.sellingPrice || item?.price || 0
    const base = selectedVariant?.price || item?.price || 0
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + (addon.price || 0), 0)
    return base + addonsTotal
  }, [selectedVariant, selectedAddons, item, isCombo, isCustomCombo, comboPresentation, displayUnitPrice])

  const totalPrice = unitPrice * quantity

  const toggleAddon = (addon) => {
    setSelectedAddons((prev) => (
      prev.find(a => a.name === addon.name)
        ? prev.filter(a => a.name !== addon.name)
        : [...prev, addon]
    ))
  }

  const canAddToCart = (() => {
    if (isCombo && isCustomCombo) return comboValid
    if (hasVariants) return Boolean(selectedVariant)
    return Boolean(item)
  })()

  const handleComboSelection = (group, optionId) => {
    setSelectedComboItems(prev => {
      const current = Array.isArray(prev[group.id]) ? prev[group.id] : []
      const isSelected = current.includes(optionId)
      const isSingleSelect = group.maxSelections === 1

      if (isSingleSelect) {
        return { ...prev, [group.id]: isSelected ? [] : [optionId] }
      }

      if (isSelected) {
        return { ...prev, [group.id]: current.filter(id => id !== optionId) }
      }

      if (current.length >= group.maxSelections) {
        return prev
      }

      return { ...prev, [group.id]: [...current, optionId] }
    })
  }

  const handleAddToCart = () => {
    if (!item || !canAddToCart) return

    const comboSelections = isCustomCombo
      ? comboPresentation.selectedItems.map(selection => ({
          groupId: selection.groupId,
          groupName: selection.groupName,
          itemId: selection.itemId,
          name: selection.name,
          quantity: selection.quantity || 1,
          price: selection.price || 0,
        }))
      : comboFixedItems.flatMap((entry) => Array.from({ length: entry.quantity || 1 }, () => ({
          groupId: 'fixed',
          groupName: 'Included Items',
          itemId: entry.id,
          name: entry.name,
          quantity: 1,
          price: entry.price || 0,
        })))

    const payload = {
      id: item.id,
      name: item.name,
      image: item.image,
      price: unitPrice,
      currency: item.currency,
      selectedVariant,
      selectedAddons,
      comboSelections,
      comboType: item.comboType || 'fixed',
      comboBasePrice: comboPresentation.comboPrice,
      comboRegularTotal: comboPresentation.regularTotal,
      comboSavings: comboPresentation.savings,
      notes,
      quantity,
    }

    if (editingCartKey) {
      replaceItem(editingCartKey, payload)
    } else {
      addItem(payload)
    }
    onClose()
  }

  const renderPriceLabel = (size = 'lg') => {
    if (showStartingFrom && comboPresentation.startingFrom > 0) {
      return (
        <div className={cn('font-bold', size === 'lg' ? 'text-2xl' : 'text-lg')}>
          <span className="text-sm font-medium text-zinc-400 mr-1.5">Starting from</span>
          <span className={isCustomCombo ? 'text-violet-300' : 'text-emerald-300'}>
            {formatCurrency(comboPresentation.startingFrom, item?.currency)}
          </span>
        </div>
      )
    }

    if (displayUnitPrice > 0) {
      return (
        <p className={cn('font-bold text-white', size === 'lg' ? 'text-2xl' : 'text-lg')}>
          {formatCurrency(displayUnitPrice, item?.currency)}
        </p>
      )
    }

    return null
  }

  const renderComboStickyFooter = () => (
    <div className="flex-shrink-0 border-t border-white/[0.08] bg-[#0A0F1E]/95 backdrop-blur-xl px-5 py-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-2xl border border-white/[0.08] px-1 py-1">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all" aria-label="Decrease quantity">
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-base font-bold text-white w-9 text-center">{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500 text-white hover:bg-emerald-400 transition-all" aria-label="Increase quantity">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="text-right min-w-0">
          {comboPresentation.savings > 0 && (
            <p className="text-[10px] font-semibold text-emerald-400">
              Save {formatCurrency(comboPresentation.savings, item.currency)}
            </p>
          )}
          {renderPriceLabel('sm')}
          {quantity > 1 && displayUnitPrice > 0 && (
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Total {formatCurrency(totalPrice, item.currency)}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={!canAddToCart}
        className={cn(
          'w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all',
          canAddToCart
            ? isCustomCombo
              ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:shadow-xl hover:shadow-violet-500/20 hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-gradient-to-r from-emerald-500 to-amber-500 text-white hover:shadow-xl hover:shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99]'
            : 'bg-zinc-800/80 text-zinc-500 cursor-not-allowed'
        )}
      >
        <ShoppingBag className="w-5 h-5" />
        {canAddToCart
          ? `${editingCartKey ? 'Update Cart' : 'Add to Cart'}${displayUnitPrice > 0 ? ` · ${formatCurrency(totalPrice, item.currency)}` : ''}`
          : isCustomCombo ? 'Complete all required selections' : 'Unavailable'
        }
      </button>
    </div>
  )

  const renderComboSection = () => (
    <div className="space-y-5 pb-2">
      <div className="rounded-[28px] overflow-hidden border border-white/[0.08] bg-white/[0.03] shadow-2xl shadow-black/20">
        <div className="relative h-56 sm:h-64">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="eager" decoding="async" />
          ) : (
            <div className={cn(
              'w-full h-full flex items-center justify-center',
              isCustomCombo
                ? 'bg-gradient-to-br from-violet-900/30 via-slate-950 to-pink-900/20'
                : 'bg-gradient-to-br from-emerald-900/30 via-slate-950 to-amber-900/20'
            )}>
              <Image className="w-12 h-12 text-zinc-500 opacity-60" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/40 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white/90 flex items-center justify-center hover:bg-black/60 transition-colors border border-white/10" aria-label="Close details">
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <ComboMetaChip icon={isCustomCombo ? Settings2 : Package} tone={isCustomCombo ? 'violet' : 'emerald'}>
                {isCustomCombo ? 'Build Your Own' : 'Ready Combo'}
              </ComboMetaChip>
              {item.isVeg !== undefined && (
                <ComboMetaChip tone="slate">
                  <span className={cn('w-2.5 h-2.5 rounded-[2px] border flex items-center justify-center', item.isVeg ? 'border-emerald-400' : 'border-red-400')}>
                    <span className={cn('w-1 h-1 rounded-full', item.isVeg ? 'bg-emerald-400' : 'bg-red-400')} />
                  </span>
                  {item.isVeg ? 'Veg' : 'Non-Veg'}
                </ComboMetaChip>
              )}
              {item.preparationTime > 0 && (
                <ComboMetaChip icon={Clock} tone="slate">
                  {item.preparationTime} min
                </ComboMetaChip>
              )}
              {item.rating > 0 && (
                <ComboMetaChip icon={Star} tone="amber">
                  {item.rating.toFixed(1)}
                </ComboMetaChip>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-1">{item.name}</h2>
            {item.description && (
              <p className="text-sm text-zinc-300/90 line-clamp-2 mb-3">{item.description}</p>
            )}

            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>{renderPriceLabel()}</div>
              {!isCustomCombo && comboPresentation.savings > 0 && (
                <span className="text-sm font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/25 rounded-xl px-3 py-1.5">
                  You save {formatCurrency(comboPresentation.savings, item.currency)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {badgeList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badgeList.map((badge) => (
            <span
              key={badge.key}
              className={cn(
                'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold',
                BADGE_STYLES[badge.key] || 'bg-white/5 text-zinc-300 border-white/10'
              )}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {isCustomCombo && (
        <div className="rounded-2xl border border-violet-500/15 bg-gradient-to-r from-violet-500/8 to-pink-500/8 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">Build your combo</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Choose the required items in each section. Pricing updates live as you make selections.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isCustomCombo && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="text-[10px] text-zinc-500">Included Items</p>
            <p className="mt-1 text-2xl font-bold text-white">{comboItemCount}</p>
            <p className="text-xs text-zinc-400 mt-1">Items bundled in this combo</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="text-[10px] text-zinc-500">Savings</p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">{formatCurrency(comboPresentation.savings, item.currency)}</p>
            <p className="text-xs text-zinc-400 mt-1">Compared with item-by-item pricing</p>
          </div>
        </div>
      )}

      {!isCustomCombo && (
        <SectionShell title="Included Items" subtitle="Every item that ships with the combo." accent="emerald">
          <div className="space-y-2">
            {comboFixedItems.map((entry) => (
              <div key={entry.id || entry.name} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                  {entry.image ? (
                    <img src={entry.image} alt={entry.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">{entry.name}</p>
                    {entry.quantity > 1 && (
                      <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                        x{entry.quantity}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {entry.category ? `${entry.category} · ` : ''}Included in the combo
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-zinc-200">{formatCurrency(entry.price, item.currency)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionShell>
      )}

      {isCustomCombo && (
        <SectionShell title="Customization" subtitle="Complete each required selection to unlock Add to Cart." accent="violet">
          <div className="space-y-4">
            {comboGroups.map((group, gIdx) => {
              const selectedIds = selectedComboItems[group.id] || []
              const groupDone = selectedIds.length >= group.minSelections
              const isSingleSelect = group.maxSelections === 1

              return (
                <div key={group.id} className={cn('rounded-2xl border p-4 transition-all', groupDone ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-white/[0.06] bg-white/[0.03]')}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0', groupDone ? 'bg-emerald-500 text-white' : 'bg-white/10 text-zinc-400')}>
                          {groupDone ? <Check className="w-3.5 h-3.5" /> : gIdx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Step {gIdx + 1}</p>
                          <p className="text-sm font-semibold text-white/90">Choose {group.name}</p>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 ml-9">
                        {isSingleSelect
                          ? 'Select one option'
                          : `Choose ${group.minSelections}${group.maxSelections > group.minSelections ? ` to ${group.maxSelections}` : ''}`
                        }
                      </p>
                    </div>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-lg flex-shrink-0', groupDone ? 'text-emerald-300 bg-emerald-500/15' : 'text-zinc-400 bg-white/5')}>
                      {selectedIds.length}/{group.maxSelections}
                    </span>
                  </div>

                  <div className="grid gap-2">
                    {group.options.map((option) => {
                      const selected = selectedIds.includes(option.itemId)
                      const atMax = !selected && !isSingleSelect && selectedIds.length >= group.maxSelections

                      return (
                        <button
                          key={option.itemId}
                          type="button"
                          onClick={() => handleComboSelection(group, option.itemId)}
                          disabled={atMax}
                          className={cn(
                            'w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left border',
                            selected
                              ? 'bg-violet-500/10 border-violet-500/30 ring-1 ring-violet-500/10'
                              : atMax
                                ? 'opacity-40 cursor-not-allowed bg-black/20 border-white/5'
                                : 'bg-white/[0.03] border-white/[0.06] hover:border-white/15'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors', selected ? 'border-violet-500' : 'border-zinc-600')}>
                              {selected && <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-white block">{option.name}</span>
                              {option.category && (
                                <span className="text-[10px] text-zinc-500 capitalize">{option.category}</span>
                              )}
                            </div>
                          </div>
                          <span className={cn('text-sm font-bold', selected ? 'text-violet-400' : 'text-zinc-400')}>
                            {formatCurrency(option.price, item.currency)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </SectionShell>
      )}

      {isCustomCombo && (
        <SectionShell
          title="Live Price Engine"
          subtitle="Every selection updates your subtotal, savings, and total instantly."
          accent="emerald"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-[10px] text-zinc-500">Starting From</p>
              <p className="mt-1 text-base font-bold text-violet-300">{formatCurrency(comboPresentation.startingFrom, item.currency)}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-[10px] text-zinc-500">Current Price</p>
              <p className="mt-1 text-base font-bold text-white">{formatCurrency(comboPresentation.currentPrice, item.currency)}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-[10px] text-zinc-500">Available Options</p>
              <p className="mt-1 text-base font-bold text-white">{comboPresentation.availableChoiceCount} items</p>
            </div>
          </div>
          {comboPresentation.hasExplicitSelections && comboPresentation.savings > 0 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              Save {formatCurrency(comboPresentation.savings, item.currency)} with your current selections.
            </div>
          )}
          {!comboValid && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
              Complete all required groups before adding this combo.
            </div>
          )}
        </SectionShell>
      )}

      {!isCustomCombo && (
        <SectionShell title="Combo Details" subtitle="Important information for this bundled offer." accent="emerald">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-[10px] text-zinc-500">Price</p>
              <p className="mt-1 text-base font-bold text-emerald-300">{formatCurrency(comboPresentation.comboPrice, item.currency)}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-[10px] text-zinc-500">Original Price</p>
              <p className="mt-1 text-base font-bold text-white line-through">{formatCurrency(comboPresentation.regularTotal, item.currency)}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-[10px] text-zinc-500">Savings</p>
              <p className="mt-1 text-base font-bold text-emerald-300">{formatCurrency(comboPresentation.savings, item.currency)}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-[10px] text-zinc-500">Preparation Time</p>
              <p className="mt-1 text-base font-bold text-white">{item.preparationTime ? `${item.preparationTime} min` : 'Varies'}</p>
            </div>
          </div>
          {(item.servingSize || item.availability?.status || item.taxPercent) && (
            <div className="grid gap-3 sm:grid-cols-3">
              {item.servingSize && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-[10px] text-zinc-500">Serving Size</p>
                  <p className="mt-1 text-sm font-semibold text-white">{item.servingSize}</p>
                </div>
              )}
              {item.taxPercent !== undefined && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-[10px] text-zinc-500">Taxes</p>
                  <p className="mt-1 text-sm font-semibold text-white">{item.taxPercent ? `${item.taxPercent}%` : 'Included'}</p>
                </div>
              )}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                <p className="text-[10px] text-zinc-500">Availability</p>
                <p className="mt-1 text-sm font-semibold text-white capitalize">{item.availability?.status || 'Available'}</p>
              </div>
            </div>
          )}
        </SectionShell>
      )}

      {!!comboTags.length && (
        <div className="flex flex-wrap gap-2">
          {comboTags.map(tag => (
            <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-zinc-300">
              {tag}
            </span>
          ))}
        </div>
      )}

      <SectionShell title="Special Instructions" subtitle="Add notes the kitchen should know about.">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={isCustomCombo ? 'Any special notes for your custom combo?' : 'Any special notes for this combo?'}
          rows={2}
          className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 resize-none transition-all"
        />
      </SectionShell>
    </div>
  )

  const renderNormalSection = () => (
    <div className="space-y-5">
      <div className="rounded-[28px] overflow-hidden border border-white/[0.08] bg-white/[0.03] shadow-2xl shadow-black/20">
        <div className="relative h-56 sm:h-64">
          {item?.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="eager" decoding="async" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900/30 via-slate-950 to-pink-900/20">
              <Image className="w-12 h-12 text-zinc-500 opacity-60" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/40 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white/90 flex items-center justify-center hover:bg-black/60 transition-colors border border-white/10" aria-label="Close details">
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {badgeList.length > 0 && badgeList.slice(0, 2).map((badge) => (
                <ComboMetaChip key={badge.key} tone="slate">
                  {badge.label}
                </ComboMetaChip>
              ))}
              {item.isVeg !== undefined && (
                <ComboMetaChip tone="slate">
                  <span className={cn('w-2.5 h-2.5 rounded-[2px] border flex items-center justify-center', item.isVeg ? 'border-emerald-400' : 'border-red-400')}>
                    <span className={cn('w-1 h-1 rounded-full', item.isVeg ? 'bg-emerald-400' : 'bg-red-400')} />
                  </span>
                  {item.isVeg ? 'Veg' : 'Non-Veg'}
                </ComboMetaChip>
              )}
              {item.preparationTime > 0 && (
                <ComboMetaChip icon={Clock} tone="slate">
                  {item.preparationTime} min
                </ComboMetaChip>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-1">{item.name}</h2>
            {item.description && <p className="text-sm text-zinc-300/90 line-clamp-2">{item.description}</p>}
          </div>
        </div>
      </div>

      {hasVariants && (
        <SectionShell title="Choose Variant" subtitle="Select one variant before adding this item." accent="violet">
          <div className="space-y-2">
            {item.variants.map((v) => {
              const isAvailable = v.isAvailable !== false
              const isSelected = selectedVariant?.name === v.name && isAvailable
              return (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => isAvailable && setSelectedVariant(v)}
                  disabled={!isAvailable}
                  className={cn(
                    'w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left border',
                    !isAvailable
                      ? 'opacity-40 cursor-not-allowed bg-black/20 border-white/5'
                      : isSelected
                        ? 'bg-violet-500/10 border-violet-500/30 ring-1 ring-violet-500/10'
                        : 'bg-white/[0.03] border-white/[0.06] hover:border-white/15'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors', isSelected ? 'border-violet-500' : 'border-zinc-600')}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />}
                    </div>
                    <span className="text-sm font-medium text-white">{v.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.offerPrice > 0 && <span className="text-xs text-zinc-500 line-through">{formatCurrency(v.price, item.currency)}</span>}
                    <span className="text-sm font-semibold text-white">{!isAvailable ? 'Out of Stock' : formatCurrency(v.offerPrice > 0 ? v.offerPrice : v.price, item.currency)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </SectionShell>
      )}

      {hasAddons && (
        <SectionShell title="Customize Your Order" subtitle="Optional add-ons are applied instantly." accent="violet">
          <div className="space-y-2">
            {item.addons.map((a) => {
              const isSelected = selectedAddons.find(s => s.name === a.name)
              return (
                <button
                  key={a.name}
                  type="button"
                  onClick={() => toggleAddon(a)}
                  className={cn(
                    'w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left border',
                    isSelected
                      ? 'bg-pink-500/10 border-pink-500/30 ring-1 ring-pink-500/10'
                      : 'bg-white/[0.03] border-white/[0.06] hover:border-white/15'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all', isSelected ? 'border-pink-500 bg-pink-500' : 'border-zinc-600')}>
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
        </SectionShell>
      )}

      <SectionShell title="Special Instructions" subtitle="Add notes for the kitchen or service team.">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. No onion, extra spicy..."
          rows={2}
          className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 resize-none transition-all"
        />
      </SectionShell>

      <SectionShell title="Quantity and Price" subtitle="Review the final amount before adding to cart.">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl border border-white/[0.08] px-1 py-1">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all" aria-label="Decrease quantity">
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-base font-bold text-white w-8 text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-600 text-white hover:bg-violet-500 transition-all" aria-label="Increase quantity">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="text-right">
            <p className="text-xl font-bold text-white">{formatCurrency(totalPrice, item.currency)}</p>
            {quantity > 1 && (
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {quantity} x {formatCurrency(unitPrice, item.currency)}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className={cn(
            'w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all',
            canAddToCart
              ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:shadow-xl hover:shadow-violet-500/20 hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          )}
        >
          <ShoppingBag className="w-5 h-5" />
          {canAddToCart
            ? `${editingCartKey ? 'Update Cart' : 'Add to Cart'} · ${formatCurrency(totalPrice, item.currency)}`
            : 'Select the required options'
          }
        </button>
      </SectionShell>
    </div>
  )

  if (!item) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full h-[100dvh] sm:h-[94vh] max-w-5xl sm:max-h-[94vh] bg-[#0A0F1E] sm:rounded-3xl overflow-hidden flex flex-col z-10 shadow-2xl border border-white/[0.06]"
          >
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {isCombo ? renderComboSection() : renderNormalSection()}
            </div>
            {isCombo && renderComboStickyFooter()}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
