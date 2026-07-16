import { memo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Clock, ChefHat, CheckCircle, Check, UtensilsCrossed, Package,
  Puzzle, User, Phone, MapPin, Receipt
} from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { formatCurrency, formatDateTime } from '@shared/utils/formatters'
import {
  statusConfig, timeAgo, getQuantity, getUnitPrice, getSubtotal,
  hasComboSelections, isCustomCombo, getAddons, getComboSelections,
  getAddonPrice, getSelectionPrice, getOrderNumber
} from './order-card/orderCardUtils'

/* ───────── Motion preset (project signature easing) ───────── */

const EASE = [0.16, 1, 0.3, 1]

/* ───────── Status color mapping ───────── */

const statusColors = {
  pending:   { bg: 'bg-amber-500',   text: 'text-amber-400',   bgLight: 'bg-amber-500/15' },
  preparing: { bg: 'bg-orange-500',  text: 'text-orange-400',  bgLight: 'bg-orange-500/15' },
  ready:     { bg: 'bg-sky-500',     text: 'text-sky-400',     bgLight: 'bg-sky-500/15' },
  completed: { bg: 'bg-emerald-500', text: 'text-emerald-400', bgLight: 'bg-emerald-500/15' },
  cancelled: { bg: 'bg-red-500',     text: 'text-red-400',     bgLight: 'bg-red-500/15' },
}

/* ───────── Timeline ───────── */

const timelineSteps = ['pending', 'preparing', 'ready', 'completed']
const timelineLabels = {
  pending: 'Order Received',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
}

const getStepState = (step, currentStatus) => {
  const currentIdx = timelineSteps.indexOf(currentStatus)
  const stepIdx = timelineSteps.indexOf(step)
  if (stepIdx < currentIdx) return 'past'
  if (stepIdx === currentIdx) return 'active'
  return 'future'
}

const Timeline = ({ status, order }) => (
  <div className="flex items-start justify-between px-2">
    {timelineSteps.map((step, idx) => {
      const state = getStepState(step, status)
      const isLast = idx === timelineSteps.length - 1

      return (
        <div key={step} className="flex flex-col items-center relative" style={{ flex: 1 }}>
          {/* Connector line */}
          {!isLast && (
            <div
              className={cn(
                'absolute top-[14px] h-[2px]',
                state === 'past' || (state === 'active' && idx < timelineSteps.indexOf(status))
                  ? 'bg-red-500' : 'bg-[#1e2538]'
              )}
              style={{ left: '50%', right: '-50%' }}
            />
          )}

          {/* Circle */}
          <div className={cn(
            'relative z-10 flex items-center justify-center w-7 h-7 rounded-full border-2',
            state === 'past' ? 'bg-red-500 border-red-500' :
            state === 'active' ? 'bg-red-500 border-red-500' :
            'bg-[#1a1f2e] border-[#2a3040]'
          )}>
            {state === 'past' || state === 'active' ? (
              <Check className="w-3.5 h-3.5 text-white" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-[#2a3040]" />
            )}
          </div>

          {/* Label */}
          <p className={cn(
            'mt-2 text-[10px] font-medium text-center leading-tight',
            state === 'future' ? 'text-slate-500' : 'text-slate-300'
          )}>
            {timelineLabels[step]}
          </p>

          {/* Time under label */}
          {order?.createdAt && state !== 'future' && (
            <p className="text-[9px] text-slate-500 mt-0.5">
              {timeAgo(order.createdAt)}
            </p>
          )}
        </div>
      )
    })}
  </div>
)

/* ───────── Drawer Item Card ───────── */

const DrawerItemCard = ({ item, currency }) => {
  const addons = getAddons(item)
  const comboSelections = getComboSelections(item)
  const isCombo = hasComboSelections(item)
  const isCustom = isCustomCombo(item)
  const note = item?.notes || item?.instructions

  return (
    <div className="flex gap-3.5 py-3">
      {/* Item Image */}
      <div className="w-14 h-14 rounded-lg bg-[#1e2538] flex items-center justify-center shrink-0 overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <UtensilsCrossed className="w-5 h-5 text-slate-600" />
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h4 className="text-[13px] font-semibold text-white truncate">{item.name || 'Item'}</h4>

            {/* Customizations / Combo selections as bullet list */}
            {comboSelections.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {comboSelections.map((sel, i) => (
                  <p key={i} className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="text-slate-500">•</span> {sel.name || 'Selection'}
                  </p>
                ))}
              </div>
            )}

            {addons.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {addons.map((addon, i) => (
                  <p key={i} className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="text-slate-500">•</span> {addon.name || 'Add-on'}
                  </p>
                ))}
              </div>
            )}

            {note && (
              <p className="text-[11px] text-amber-400/80 mt-1 italic">⚠ {note}</p>
            )}
          </div>

          {/* Qty + Price aligned right */}
          <div className="text-right shrink-0">
            <p className="text-[11px] text-slate-400">x{getQuantity(item)}</p>
            <p className="text-[13px] font-bold text-white tabular-nums mt-0.5">
              {formatCurrency(getSubtotal(item), currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────── Main Drawer ───────── */

const OrderDetailDrawerContent = ({
  order, isOpen, onClose, onMarkReady, onMarkCompleted,
}) => {
  const drawerRef = useRef(null)

  // ESC key closes drawer
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!order) return null

  const config = statusConfig[order.status] || statusConfig.pending
  const colors = statusColors[order.status] || statusColors.pending
  const items = Array.isArray(order.items) ? order.items : []
  const currency = order.currency || items[0]?.currency || 'INR'
  const orderNumber = getOrderNumber(order)

  // Bill summary from backend values ONLY
  const subtotal = order.subtotal ?? items.reduce((sum, item) => sum + getSubtotal(item), 0)
  const discount = order.discount || 0
  const gst = order.gst || order.taxes || order.tax || 0
  const serviceCharge = order.serviceCharge || 0
  const roundingOff = order.roundingOff || order.roundOff || 0
  const totalAmount = order.totalAmount || subtotal
  const grandTotal = order.grandTotal || totalAmount

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.26, ease: EASE }}
            className="fixed inset-0 z-[100] bg-black/50"
            onClick={onClose}
            aria-label="Close drawer"
          />

          {/* Drawer Panel */}
          <motion.aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Order Details"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: EASE }}
            style={{ willChange: 'transform' }}
            className={cn(
              'fixed inset-y-0 right-0 z-[101] flex flex-col',
              'w-full sm:w-[420px] md:w-[440px]',
              'bg-[#111827] border-l border-white/[0.06]',
              'shadow-[-8px_0_30px_rgba(0,0,0,0.4)]',
            )}
          >
            {/* ── Header ── */}
            <div className="shrink-0 px-6 pt-5 pb-5 border-b border-white/[0.06]">
              {/* Top row: Title + Close */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-white">Order Details</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Order ID + Status + Total Amount */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    {/* Colored square icon */}
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', colors.bg)}>
                      <config.icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">#{orderNumber}</span>
                    <motion.span
                      key={order.status}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors duration-300',
                        colors.bgLight, colors.text,
                      )}
                    >
                      <CheckCircle className="w-3 h-3" />
                      {config.label}
                    </motion.span>
                  </div>
                  {/* Meta line */}
                  <p className="text-[12px] text-slate-400 mt-1.5">
                    {order.customerName || 'Guest'}
                    {order.tableNumber && <> &bull; Table {order.tableNumber}</>}
                  </p>
                  {order.createdAt && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Placed on {formatDateTime(order.createdAt)}
                    </p>
                  )}
                </div>

                {/* Total right-aligned */}
                <div className="text-right shrink-0 ml-4">
                  <p className="text-2xl font-black text-white tabular-nums leading-none">
                    {formatCurrency(grandTotal, currency)}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">
                    Total Amount
                  </p>
                </div>
              </div>
            </div>

            {/* ── Scrollable Content ── */}
            <div className="flex-1 overflow-y-auto thin-scrollbar">

              {/* Timeline */}
              <div className="px-6 py-5 border-b border-white/[0.06]">
                <Timeline status={order.status} order={order} />
              </div>

              {/* Ordered Items */}
              <div className="px-6 py-5 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold text-white mb-1">
                  Items ({items.length})
                </h3>
                <div className="divide-y divide-white/[0.04]">
                  {items.length > 0 ? items.map((item, idx) => (
                    <DrawerItemCard key={idx} item={item} currency={currency} />
                  )) : (
                    <p className="py-4 text-sm text-slate-500">No items in this order.</p>
                  )}
                </div>
              </div>

              {/* Bill Summary */}
              <div className="px-6 py-5 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold text-white mb-4">Bill Summary</h3>
                <div className="space-y-2.5 text-[13px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="tabular-nums text-slate-300">{formatCurrency(subtotal, currency)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Discount</span>
                      <span className="tabular-nums text-red-400">-{formatCurrency(discount, currency)}</span>
                    </div>
                  )}
                  {gst > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>GST</span>
                      <span className="tabular-nums text-slate-300">{formatCurrency(gst, currency)}</span>
                    </div>
                  )}
                  {serviceCharge > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Service Charge</span>
                      <span className="tabular-nums text-slate-300">{formatCurrency(serviceCharge, currency)}</span>
                    </div>
                  )}

                  {/* Total Amount line */}
                  <div className="pt-2.5 mt-2.5 border-t border-white/[0.06] flex justify-between font-semibold">
                    <span className="text-slate-300">Total Amount</span>
                    <span className="tabular-nums text-white">{formatCurrency(totalAmount, currency)}</span>
                  </div>

                  {roundingOff !== 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Rounding Off</span>
                      <span className={cn('tabular-nums', roundingOff < 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {roundingOff < 0 ? '-' : '+'}{formatCurrency(Math.abs(roundingOff), currency)}
                      </span>
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="pt-3 mt-1 border-t border-white/[0.06] flex justify-between items-center">
                    <span className="text-sm font-bold text-white">Grand Total</span>
                    <span className="text-lg font-black text-white tabular-nums">{formatCurrency(grandTotal, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div className="px-6 py-5 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold text-white mb-3">Customer</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1e2538] flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{order.customerName || 'Guest'}</p>
                    {order.customerPhone && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {order.customerPhone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(order.notes || order.specialInstructions || order.instructions) && (
                <div className="px-6 py-5">
                  <h3 className="text-sm font-bold text-white mb-2">Notes</h3>
                  <p className="text-[13px] text-slate-400 leading-relaxed">
                    {order.notes || order.specialInstructions || order.instructions}
                  </p>
                </div>
              )}

              {/* No notes message */}
              {!order.notes && !order.specialInstructions && !order.instructions && (
                <div className="px-6 py-5">
                  <h3 className="text-sm font-bold text-white mb-2">Notes</h3>
                  <p className="text-[13px] text-slate-500">No special notes</p>
                </div>
              )}
            </div>

            {/* ── Bottom Actions ── */}
            <div className="shrink-0 px-5 py-4 border-t border-white/[0.06] bg-[#0d1117] flex gap-3">
              {order.status === 'pending' && (
                <button
                  onClick={() => onMarkReady?.(order.id)}
                  className="w-full h-11 rounded-lg font-semibold text-sm bg-amber-500 text-black hover:bg-amber-400 transition-colors duration-150"
                >
                  Mark Ready
                </button>
              )}
              {order.status === 'ready' && (
                <button
                  onClick={() => onMarkCompleted?.(order.id)}
                  className="w-full h-11 rounded-lg font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-400 transition-colors duration-150"
                >
                  Complete Order
                </button>
              )}
              {order.status === 'completed' && (
                <button
                  onClick={onClose}
                  className="w-full h-11 rounded-lg font-semibold text-sm bg-[#1e2538] text-slate-300 hover:bg-[#252d42] transition-colors duration-150"
                >
                  Close
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export const OrderDetailDrawer = memo(OrderDetailDrawerContent)
