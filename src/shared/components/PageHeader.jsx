import { cn } from '../utils/cn'
import { motion } from 'framer-motion'

export const PageHeader = ({
  title,
  subtitle,
  actions,
  badge,
  icon: Icon,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5',
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-1.5">
          {Icon && (
            <div className="p-2.5 rounded-xl bg-primary-500/10 border border-primary-500/20 shadow-sm shadow-primary-500/10">
              <Icon className="w-5 h-5 text-primary-400" />
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-50 tracking-tight font-display">
              {title}
            </h1>
            {badge}
          </div>
        </div>
        {subtitle && (
          <p className="text-sm text-surface-500 mt-1 ml-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </motion.div>
  )
}
