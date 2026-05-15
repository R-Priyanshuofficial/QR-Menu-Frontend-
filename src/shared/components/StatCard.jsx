import { cn } from '../utils/cn'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { motion } from 'framer-motion'

export const StatCard = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'primary',
  trend, // 'up' | 'down' | 'neutral'
  className,
  index = 0,
  sparkline,
}) => {
  const iconColors = {
    primary:  'bg-primary-500/10 text-primary-400 shadow-primary-500/5',
    emerald:  'bg-emerald-500/10 text-emerald-400 shadow-emerald-500/5',
    sky:      'bg-sky-500/10 text-sky-400 shadow-sky-500/5',
    amber:    'bg-amber-500/10 text-amber-400 shadow-amber-500/5',
    violet:   'bg-violet-500/10 text-violet-400 shadow-violet-500/5',
    orange:   'bg-orange-500/10 text-orange-400 shadow-orange-500/5',
    blue:     'bg-blue-500/10 text-blue-400 shadow-blue-500/5',
    rose:     'bg-rose-500/10 text-rose-400 shadow-rose-500/5',
  }

  const accentColors = {
    primary: 'from-primary-500/30',
    emerald: 'from-emerald-500/30',
    sky:     'from-sky-500/30',
    amber:   'from-amber-500/30',
    violet:  'from-violet-500/30',
    orange:  'from-orange-500/30',
    blue:    'from-blue-500/30',
    rose:    'from-rose-500/30',
  }

  const trendColors = {
    up:      'text-emerald-400',
    down:    'text-red-400',
    neutral: 'text-surface-500',
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative rounded-2xl p-5 overflow-hidden',
        'bg-white dark:bg-surface-900/[0.82]',
        'border border-surface-200/80 dark:border-surface-700/40',
        'shadow-elevated dark:shadow-dark-elevated',
        'hover:shadow-elevated-lg dark:hover:shadow-dark-elevated-md hover:border-surface-300/90 dark:hover:border-surface-700/60 hover:-translate-y-0.5',
        'transition-all duration-250',
        'group',
        className
      )}
    >
      {/* Subtle top accent gradient */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-px bg-gradient-to-r to-transparent',
        accentColors[iconColor] || accentColors.primary,
      )} />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{title}</p>
          {Icon && (
            <div className={cn(
              'p-2 rounded-lg shadow-sm',
              iconColors[iconColor],
            )}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-surface-900 dark:text-surface-50 mb-1.5 tracking-tight font-display">{value}</p>
        {(change || changeLabel) && (
          <div className="flex items-center gap-1.5">
            {trend && <TrendIcon className={cn('w-3.5 h-3.5', trendColors[trend])} />}
            {change && <span className={cn('text-xs font-semibold', trendColors[trend] || 'text-surface-500')}>{change}</span>}
            {changeLabel && <span className="text-xs text-surface-500">{changeLabel}</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
}
