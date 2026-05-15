import { cn } from '../utils/cn'
import { Button } from './Button'
import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className,
  compact = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-10 px-4' : 'py-16 sm:py-20 px-6',
        className
      )}
    >
      {Icon && (
        <div className={cn(
          'rounded-2xl flex items-center justify-center mb-4',
          'bg-surface-100 dark:bg-surface-800/40 border border-surface-200/90 dark:border-surface-700/30',
          compact ? 'w-12 h-12' : 'w-16 h-16',
        )}>
          <Icon className={cn(
            'text-surface-500',
            compact ? 'w-6 h-6' : 'w-7 h-7'
          )} />
        </div>
      )}
      <h3 className={cn(
        'font-semibold text-surface-800 dark:text-surface-200 mb-1 font-display',
        compact ? 'text-sm' : 'text-base'
      )}>
        {title}
      </h3>
      {description && (
        <p className={cn(
          'text-surface-500 max-w-sm',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {description}
        </p>
      )}
      {(action || onAction) && (
        <div className="mt-5">
          {action || (
            <Button variant="outline" size="sm" onClick={onAction}>
              {actionLabel || 'Get Started'}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}
