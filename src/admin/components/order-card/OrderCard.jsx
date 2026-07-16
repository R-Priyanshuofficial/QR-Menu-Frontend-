import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@shared/utils/cn'
import { formatCurrency } from '@shared/utils/formatters'
import { getSummary, timeAgo } from './orderCardUtils'
import { UtensilsCrossed, Plus, Settings, ChevronRight, User, MapPin, MoreVertical, Clock, ChefHat, CheckCircle, XCircle } from 'lucide-react'

const statusConfig = {
  completed: {
    iconBg: 'bg-emerald-500',
    Icon: CheckCircle,
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    label: 'Completed',
  },
  pending: {
    iconBg: 'bg-amber-500',
    Icon: Clock,
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    label: 'Pending',
  },
  ready: {
    iconBg: 'bg-sky-500',
    Icon: ChefHat,
    badgeBg: 'bg-sky-500/15',
    badgeText: 'text-sky-400',
    label: 'Ready',
  },
  cancelled: {
    iconBg: 'bg-red-500',
    Icon: XCircle,
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-400',
    label: 'Cancelled',
  },
}

const DetailRow = ({ icon: Icon, label, count, showBorder = true }) => (
  <div
    className={cn(
      'flex items-center justify-between px-3 h-9',
      showBorder && 'border-b border-white/[0.04]'
    )}
  >
    <div className="flex items-center gap-2 text-white/50">
      <Icon size={14} strokeWidth={1.8} />
      <span className="text-xs">{label}</span>
    </div>
    <span className="text-xs font-medium text-white/80">{count}</span>
  </div>
)

const OrderCard = memo(function OrderCard({ order, onClick }) {
  const status = statusConfig[order.status] || statusConfig.pending
  const StatusIcon = status.Icon

  const summary = useMemo(() => getSummary(order), [order])
  const elapsed = useMemo(() => timeAgo(order.createdAt), [order.createdAt])
  const orderId = useMemo(
    () => String(order.id).slice(-6).toUpperCase(),
    [order.id]
  )

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'bg-[#1a1f2e] border border-white/[0.04] rounded-xl',
        'flex flex-col cursor-pointer select-none',
        'transition-[transform,box-shadow,border-color] duration-200 ease-out',
        'hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:border-white/[0.08]'
      )}
      onClick={() => onClick?.(order.id)}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {/* Status icon square */}
        <div
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
            status.iconBg
          )}
        >
          <StatusIcon size={18} className="text-white" strokeWidth={2} />
        </div>

        {/* Order ID + badge */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-bold text-white whitespace-nowrap">
            #{orderId}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold leading-none whitespace-nowrap transition-colors duration-300',
              status.badgeBg,
              status.badgeText
            )}
          >
            <CheckCircle size={10} strokeWidth={2.5} />
            {status.label}
          </span>
        </div>

        {/* 3-dot menu */}
        <button
          type="button"
          className="flex-shrink-0 p-1 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* ── Customer + meta ── */}
      <div className="px-4 pb-3 space-y-1">
        <div className="flex items-center gap-1.5 text-white/60">
          <User size={13} strokeWidth={1.8} />
          <span className="text-xs font-medium truncate">
            {order.customerName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-white/35 text-[11px]">
          <span>{elapsed}</span>
          <span className="w-[3px] h-[3px] rounded-full bg-white/25" />
          <MapPin size={11} strokeWidth={1.8} />
          <span>Table {order.tableNumber}</span>
        </div>
      </div>

      {/* ── Detail rows ── */}
      <div className="mx-3 mb-3 rounded-lg bg-[#141824] overflow-hidden">
        <DetailRow
          icon={UtensilsCrossed}
          label="Items"
          count={summary.items}
        />
        <DetailRow icon={Plus} label="Add-ons" count={summary.addons} />
        <DetailRow
          icon={Settings}
          label="Customizations"
          count={summary.customCombos}
          showBorder={false}
        />
      </div>

      {/* ── Footer ── */}
      <div className="flex items-end justify-between px-4 pb-4 pt-1 mt-auto">
        <div>
          <span className="block text-[10px] uppercase tracking-wider text-white/30 mb-0.5">
            Total Amount
          </span>
          <span className="text-lg font-bold text-white leading-none">
            {formatCurrency(order.totalAmount, order.currency)}
          </span>
        </div>
        <button
          type="button"
          className="group flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.(order.id)
          }}
        >
          View Details
          <ChevronRight
            size={14}
            className="opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-[transform,opacity] duration-200"
          />
        </button>
      </div>
    </motion.article>
  )
})

export { OrderCard }
