import { cn } from '../utils/cn'

export const Card = ({ children, className, hover = false, glass = false, glow = false, accent, padding = true, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-250 relative overflow-hidden',
        glass
          ? 'glass'
          : 'bg-surface-900/75 border border-surface-700/45 dark:shadow-dark-elevated shadow-elevated',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-300 before:bg-gradient-to-br before:from-white/[0.05] before:to-transparent',
        'dark:before:from-white/[0.03]',
        hover && 'hover:-translate-y-0.5 cursor-pointer hover:border-surface-600/55 hover:dark:shadow-dark-elevated-md hover:shadow-elevated-lg hover:before:opacity-100',
        glow && 'hover:shadow-glow-sm',
        'bg-white dark:bg-surface-900/[0.85]',
        className
      )}
      {...props}
    >
      {/* Top accent line */}
      {accent && (
        <div className={cn(
          'absolute top-0 left-0 right-0 h-px rounded-t-xl',
          accent === 'primary' && 'bg-gradient-to-r from-transparent via-primary-500/50 to-transparent',
          accent === 'emerald' && 'bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent',
          accent === 'amber' && 'bg-gradient-to-r from-transparent via-amber-500/50 to-transparent',
          accent === 'sky' && 'bg-gradient-to-r from-transparent via-sky-500/50 to-transparent',
          accent === 'violet' && 'bg-gradient-to-r from-transparent via-violet-500/50 to-transparent',
          accent === 'gradient' && 'bg-gradient-to-r from-primary-500/40 via-violet-500/40 to-sky-500/40',
        )} />
      )}
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className, action }) => {
  return (
    <div className={cn(
      'px-6 py-4 border-b border-surface-200/80 dark:border-surface-700/40',
      'flex items-center justify-between',
      className
    )}>
      <div className="flex-1 min-w-0">{children}</div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  )
}

export const CardContent = ({ children, className }) => {
  return <div className={cn('p-6', className)}>{children}</div>
}

export const CardFooter = ({ children, className }) => {
  return (
    <div className={cn(
      'px-6 py-4 border-t border-surface-200/80 dark:border-surface-700/40',
      'bg-surface-50/70 dark:bg-surface-950/35 rounded-b-2xl',
      className
    )}>
      {children}
    </div>
  )
}
