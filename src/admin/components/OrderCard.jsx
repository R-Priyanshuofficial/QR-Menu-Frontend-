import { cn } from '@shared/utils/cn'
import { Clock, CheckCircle, ChefHat, ArrowRight, User, Hash, MapPin } from 'lucide-react'
import { Badge } from '@shared/components/Badge'
import { Button } from '@shared/components/Button'
import { formatCurrency } from '@shared/utils/formatters'
import { motion } from 'framer-motion'

const statusConfig = {
  pending: {
    color: 'warning',
    label: 'Pending',
    icon: Clock,
    accent: 'border-l-amber-500',
  },
  ready: {
    color: 'info',
    label: 'Ready',
    icon: ChefHat,
    accent: 'border-l-sky-500',
  },
  completed: {
    color: 'success',
    label: 'Completed',
    icon: CheckCircle,
    accent: 'border-l-emerald-500',
  },
}

export const OrderCard = ({ order, onMarkReady, onMarkCompleted }) => {
  const config = statusConfig[order.status] || statusConfig.pending
  const StatusIcon = config.icon

  const timeAgo = () => {
    if (!order.createdAt) return ''
    const now = Date.now()
    const time = new Date(order.createdAt).getTime()
    const diffMinutes = Math.floor((now - time) / (1000 * 60))
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'relative rounded-xl overflow-hidden',
        'bg-surface-900/80 border border-surface-700/40',
        'shadow-dark-elevated hover:shadow-dark-elevated-md',
        'transition-all duration-200',
        'border-l-[3px]',
        config.accent,
      )}
    >
      {/* Header */}
      <div className="px-4 py-3.5 flex items-center justify-between border-b border-surface-700/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            order.status === 'pending' && 'bg-amber-500/10',
            order.status === 'ready' && 'bg-sky-500/10',
            order.status === 'completed' && 'bg-emerald-500/10',
          )}>
            <StatusIcon className={cn(
              'w-4 h-4',
              order.status === 'pending' && 'text-amber-400',
              order.status === 'ready' && 'text-sky-400',
              order.status === 'completed' && 'text-emerald-400',
            )} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-surface-100 truncate">
              Order #{order.id?.slice(-6).toUpperCase()}
            </p>
            <p className="text-[11px] text-surface-500">{timeAgo()}</p>
          </div>
        </div>
        <Badge variant={config.color} size="sm" dot>
          {config.label}
        </Badge>
      </div>

      {/* Customer & Table Info */}
      <div className="px-4 py-3 flex items-center gap-4 border-b border-surface-800/30">
        {order.customerName && (
          <div className="flex items-center gap-1.5 text-xs text-surface-400 min-w-0">
            <User className="w-3.5 h-3.5 flex-shrink-0 text-surface-500" />
            <span className="truncate">{order.customerName}</span>
          </div>
        )}
        {order.tableNumber && (
          <div className="flex items-center gap-1.5 text-xs text-surface-400">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-surface-500" />
            <span>Table {order.tableNumber}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="px-4 py-3">
        <div className="space-y-1.5">
          {order.items?.slice(0, 4).map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded bg-surface-800/60 flex items-center justify-center text-[10px] font-bold text-surface-400 flex-shrink-0">
                  {item.quantity}
                </span>
                <span className="text-surface-300 truncate">{item.name}</span>
              </div>
              <span className="text-surface-400 text-xs font-medium flex-shrink-0 ml-2">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
          {order.items?.length > 4 && (
            <p className="text-xs text-surface-500 pt-1">
              +{order.items.length - 4} more items
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-surface-700/30 bg-surface-950/20 flex items-center justify-between">
        <div>
          <p className="text-xs text-surface-500">Total</p>
          <p className="text-lg font-bold text-surface-100 font-display">
            {formatCurrency(order.totalAmount)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {order.status === 'pending' && (
            <Button
              variant="gradient"
              size="sm"
              onClick={() => onMarkReady(order.id)}
            >
              Mark Ready
            </Button>
          )}
          {order.status === 'ready' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => onMarkCompleted(order.id)}
            >
              Complete
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
