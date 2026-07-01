import { Clock, Package, Settings2, Sparkles, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCurrency } from '@shared/utils/formatters'
import { cn } from '@shared/utils/cn'
import { getComboPresentation, getComboTagList, isComboItem } from '@shared/utils/comboPricing'

const Badge = ({ children, className = '' }) => (
  <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md', className)}>
    {children}
  </span>
)

const StatTile = ({ label, value, hint, className = '' }) => (
  <div className={cn('rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3', className)}>
    <p className="text-[10px] text-zinc-500 uppercase tracking-[0.14em]">{label}</p>
    <p className="mt-1 text-sm font-bold text-white leading-tight">{value}</p>
    {hint && <p className="mt-1 text-[11px] text-zinc-500">{hint}</p>}
  </div>
)

export const ComboCard = ({ item, onOpenDetail, index = 0 }) => {
  const isCombo = isComboItem(item)
  const isCustomCombo = isCombo && item?.comboType === 'custom'
  const comboInfo = isCombo ? getComboPresentation(item) : null
  const comboTags = getComboTagList(item)
  const fixedItems = comboInfo?.fixedItems || []
  const groups = comboInfo?.groups || []
  const includedCount = fixedItems.reduce((sum, entry) => sum + (entry.quantity || 1), 0)

  const handleOpen = () => onOpenDetail?.(item)

  if (!isCombo) return null

  if (isCustomCombo) {
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
        className="group overflow-hidden rounded-[28px] border border-violet-500/15 bg-gradient-to-br from-violet-500/8 via-[#0D1324] to-pink-500/8 hover:border-violet-500/30 transition-all"
      >
        <div className="relative h-36 sm:h-40">
          {item?.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-violet-900/30 via-slate-950 to-pink-900/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/35 to-transparent" />

          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <Badge className="bg-violet-500/15 text-violet-200 border-violet-500/20">
              <Settings2 className="w-3 h-3" />
              Build Your Own
            </Badge>
            {item?.isVeg !== undefined && (
              <Badge className={item.isVeg ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20' : 'bg-red-500/15 text-red-200 border-red-500/20'}>
                <span className={cn('w-2 h-2 rounded-[2px] border flex items-center justify-center', item.isVeg ? 'border-emerald-400' : 'border-red-400')}>
                  <span className={cn('w-1 h-1 rounded-full', item.isVeg ? 'bg-emerald-400' : 'bg-red-400')} />
                </span>
                {item.isVeg ? 'Veg' : 'Non-Veg'}
              </Badge>
            )}
            {item.preparationTime > 0 && (
              <Badge className="bg-black/35 text-white/80 border-white/10">
                <Clock className="w-3 h-3" />
                {item.preparationTime} min
              </Badge>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight line-clamp-2">{item.name}</h3>
              {item.description && <p className="mt-1.5 text-sm text-zinc-300/85 line-clamp-2">{item.description}</p>}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Starting from</p>
              <p className="mt-1 text-lg font-black text-violet-300">
                {formatCurrency(comboInfo?.startingFrom || item.price || 0, item.currency)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Groups"
              value={`${comboInfo?.groupCount || groups.length || 0}`}
              hint="Selectable sections"
            />
            <StatTile
              label="Combinations"
              value={comboInfo?.totalCombinations ? `${comboInfo.totalCombinations}+` : '1+'}
              hint="Possible builds"
            />
          </div>

          {!!comboTags.length && (
            <div className="flex flex-wrap gap-2">
              {comboTags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-zinc-300">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleOpen}
            className="w-full rounded-2xl px-4 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-pink-600 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Customize
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    )
  }

  const originalPrice = comboInfo?.regularTotal || 0
  const comboPrice = comboInfo?.comboPrice || item.price || 0
  const savings = comboInfo?.savings || 0

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
      className="group overflow-hidden rounded-[28px] border border-emerald-500/15 bg-gradient-to-br from-emerald-500/8 via-[#0D1324] to-amber-500/8 hover:border-emerald-500/30 transition-all"
    >
      <div className="relative h-48 sm:h-56">
        {item?.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-emerald-900/30 via-slate-950 to-amber-900/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/35 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          <Badge className="bg-emerald-500/15 text-emerald-200 border-emerald-500/20">
            <Package className="w-3 h-3" />
            Ready Combo
          </Badge>
          {item?.isVeg !== undefined && (
            <Badge className={item.isVeg ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20' : 'bg-red-500/15 text-red-200 border-red-500/20'}>
              <span className={cn('w-2 h-2 rounded-[2px] border flex items-center justify-center', item.isVeg ? 'border-emerald-400' : 'border-red-400')}>
                <span className={cn('w-1 h-1 rounded-full', item.isVeg ? 'bg-emerald-400' : 'bg-red-400')} />
              </span>
              {item.isVeg ? 'Veg' : 'Non-Veg'}
            </Badge>
          )}
          {item.preparationTime > 0 && (
            <Badge className="bg-black/35 text-white/80 border-white/10">
              <Clock className="w-3 h-3" />
              {item.preparationTime} min
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight line-clamp-2">{item.name}</h3>
            {item.description && <p className="mt-1.5 text-sm text-zinc-300/85 line-clamp-2">{item.description}</p>}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Combo Price</p>
            <p className="mt-1 text-lg font-black text-emerald-300">{formatCurrency(comboPrice, item.currency)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Original"
            value={formatCurrency(originalPrice, item.currency)}
            hint="Regular total"
          />
          <StatTile
            label="Save"
            value={formatCurrency(savings, item.currency)}
            hint="Live savings"
          />
          <StatTile
            label="Included"
            value={`${includedCount}`}
            hint="Items in bundle"
          />
          <StatTile
            label="Prep"
            value={item.preparationTime ? `${item.preparationTime} min` : 'Varies'}
            hint="Kitchen time"
          />
        </div>

        <button
          type="button"
          onClick={handleOpen}
          className="w-full rounded-2xl px-4 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-amber-500 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          View Combo
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
