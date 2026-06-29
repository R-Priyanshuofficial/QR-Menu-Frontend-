import { Sparkles, Package, Settings2, Clock, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCurrency } from '@shared/utils/formatters'
import { cn } from '@shared/utils/cn'
import { getComboPresentation, getComboTagList, formatCombinationCount, isComboItem } from '@shared/utils/comboPricing'

const BADGE_MAP = {
  bestseller: { label: 'Bestseller', className: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
  popular: { label: 'Popular', className: 'bg-sky-500/15 text-sky-300 border-sky-500/20' },
  new: { label: 'New', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
  trending: { label: 'Trending', className: 'bg-pink-500/15 text-pink-300 border-pink-500/20' },
  limited: { label: 'Limited Offer', className: 'bg-violet-500/15 text-violet-300 border-violet-500/20' },
  limited_offer: { label: 'Limited Offer', className: 'bg-violet-500/15 text-violet-300 border-violet-500/20' },
  'chef-choice': { label: "Chef's Choice", className: 'bg-orange-500/15 text-orange-300 border-orange-500/20' },
  'chef-special': { label: "Chef's Choice", className: 'bg-orange-500/15 text-orange-300 border-orange-500/20' },
}

const Badge = ({ children, className = '' }) => (
  <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md', className)}>
    {children}
  </span>
)

export const ComboCard = ({ item, onOpenDetail, index = 0 }) => {
  const isCombo = isComboItem(item)
  const isCustomCombo = isCombo && item?.comboType === 'custom'
  const comboInfo = isCombo ? getComboPresentation(item) : null
  const comboTags = getComboTagList(item)
  const previewItems = comboInfo?.fixedItems?.slice(0, 3) || []
  const previewGroups = comboInfo?.groups?.slice(0, 3) || []
  const badgeKeys = [
    ...(Array.isArray(item?.badges) ? item.badges : []),
    item?.badge,
  ].filter(Boolean)

  const badges = badgeKeys
    .map((value) => {
      const key = String(value).toLowerCase().replace(/\s+/g, '-')
      return BADGE_MAP[key] ? { key, ...BADGE_MAP[key] } : null
    })
    .filter(Boolean)

  const savings = isCustomCombo
    ? comboInfo?.savings || 0
    : comboInfo?.savings || 0

  const handleOpen = () => onOpenDetail?.(item)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.28 }}
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleOpen()
        }
      }}
      className={cn(
        'group w-full text-left rounded-[28px] overflow-hidden border transition-all',
        isCustomCombo
          ? 'border-violet-500/15 bg-gradient-to-br from-violet-500/8 via-[#0D1324] to-pink-500/8 hover:border-violet-500/30'
          : 'border-emerald-500/15 bg-gradient-to-br from-emerald-500/8 via-[#0D1324] to-amber-500/8 hover:border-emerald-500/25'
      )}
    >
      <div className="relative">
        <div className="h-56 sm:h-64 overflow-hidden">
          {item?.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className={cn(
              'h-full w-full flex items-center justify-center',
              isCustomCombo
                ? 'bg-gradient-to-br from-violet-900/30 via-slate-950 to-pink-900/20'
                : 'bg-gradient-to-br from-emerald-900/30 via-slate-950 to-amber-900/20'
            )}>
              <div className="text-center">
                <Sparkles className="w-10 h-10 text-white/30 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Premium combo</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/35 to-transparent" />
        </div>

        <div className="absolute left-0 right-0 bottom-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className={isCustomCombo ? 'bg-violet-500/15 text-violet-200 border-violet-500/20' : 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'}>
              {isCustomCombo ? <Settings2 className="w-3 h-3" /> : <Package className="w-3 h-3" />}
              {isCustomCombo ? 'Build Your Own' : 'Ready Combo'}
            </Badge>
            {item?.isVeg !== undefined && (
              <Badge className="bg-black/35 text-white/80 border-white/10">
                <span className={cn('w-2 h-2 rounded-[2px] border flex items-center justify-center', item.isVeg ? 'border-emerald-400' : 'border-red-400')}>
                  <span className={cn('w-1 h-1 rounded-full', item.isVeg ? 'bg-emerald-400' : 'bg-red-400')} />
                </span>
                {item.isVeg ? 'Veg' : 'Non-Veg'}
              </Badge>
            )}
            {item?.preparationTime > 0 && (
              <Badge className="bg-black/35 text-white/80 border-white/10">
                <Clock className="w-3 h-3" />
                {item.preparationTime} min
              </Badge>
            )}
            {item?.rating > 0 && (
              <Badge className="bg-amber-500/15 text-amber-200 border-amber-500/20">
                <Star className="w-3 h-3" />
                {item.rating.toFixed(1)}
              </Badge>
            )}
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight line-clamp-2">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-zinc-300/85 line-clamp-2 mt-1.5">{item.description}</p>
              )}
            </div>

            <div className="hidden sm:flex flex-col items-end text-right shrink-0">
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Price</span>
              <span className="text-lg font-bold text-white">{formatCurrency(comboInfo?.comboPrice || item.price || 0, item.currency)}</span>
            </div>
          </div>

          {badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.slice(0, 3).map((badge) => (
                <span
                  key={badge.key}
                  className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold', badge.className)}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-5 pt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
            <p className="text-[10px] text-zinc-500">Included Items</p>
            <p className="mt-1 text-lg font-bold text-white">{isCustomCombo ? comboInfo?.groupCount || 0 : comboInfo?.fixedItems?.length || 0}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {isCustomCombo ? 'Choice groups' : 'Items in the bundle'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
            <p className="text-[10px] text-zinc-500">Savings</p>
            <p className="mt-1 text-lg font-bold text-emerald-300">{formatCurrency(savings, item.currency)}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Live discount</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
            <p className="text-[10px] text-zinc-500">Experience</p>
            <p className="mt-1 text-lg font-bold text-white">{isCustomCombo ? formatCombinationCount(comboInfo?.totalCombinations || 0) : 'Ready to serve'}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {isCustomCombo ? 'Possible combinations' : 'Fixed bundle'}
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-white/[0.06] bg-black/15 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-semibold text-white">{isCustomCombo ? 'Build preview' : 'Included items'}</p>
                <p className="text-xs text-zinc-500">{isCustomCombo ? 'Tap to customize' : 'Tap to view the full set'}</p>
              </div>
              <span className="text-[10px] font-semibold text-zinc-400 bg-white/5 border border-white/8 rounded-full px-2.5 py-1">
                {isCustomCombo ? `${comboInfo?.availableChoiceCount || 0} options` : `${comboInfo?.fixedItems?.length || 0} items`}
              </span>
            </div>

            <div className="space-y-2">
              {isCustomCombo
                ? previewGroups.map((group) => (
                    <div key={group.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{group.name}</p>
                        <p className="text-[11px] text-zinc-500">{group.minSelections === group.maxSelections ? 'Single choice' : `${group.minSelections}-${group.maxSelections} selections`}</p>
                      </div>
                      <span className="text-xs font-semibold text-violet-300">Choose</span>
                    </div>
                  ))
                : previewItems.map((entry) => (
                    <div key={entry.id || entry.name} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{entry.name}</p>
                        <p className="text-[11px] text-zinc-500">{entry.quantity || 1} included</p>
                      </div>
                      <span className="text-sm font-semibold text-white">{formatCurrency(entry.price, item.currency)}</span>
                    </div>
                  ))}
              {((isCustomCombo && previewGroups.length === 0) || (!isCustomCombo && previewItems.length === 0)) && (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/3 p-4 text-sm text-zinc-500">
                  Combo details will appear after the product is configured.
                </div>
              )}
            </div>

            {isCustomCombo && comboTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {comboTags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-zinc-300">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Original price</p>
                <p className="mt-1 text-base font-semibold text-zinc-500 line-through">
                  {formatCurrency(comboInfo?.regularTotal || 0, item.currency)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Combo price</p>
                <p className={cn('mt-1 text-3xl font-black', isCustomCombo ? 'text-violet-300' : 'text-emerald-300')}>
                  {isCustomCombo && !comboInfo?.hasExplicitSelections
                    ? `From ${formatCurrency(comboInfo?.startingFrom || 0, item.currency)}`
                    : formatCurrency(comboInfo?.comboPrice || item.price || 0, item.currency)}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/80">You save</p>
                <p className="mt-1 text-lg font-bold text-emerald-200">{formatCurrency(savings, item.currency)}</p>
              </div>
              {comboInfo?.summaryText && (
                <p className="text-xs text-zinc-400 leading-relaxed">{comboInfo.summaryText}</p>
              )}
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleOpen()
              }}
              className={cn(
                'mt-4 w-full rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98]',
                isCustomCombo
                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30'
                  : 'bg-gradient-to-r from-emerald-500 to-amber-500 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30'
              )}
            >
              {isCustomCombo ? 'Customize now' : 'View Combo'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
