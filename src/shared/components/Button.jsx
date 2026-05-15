import { cn } from '../utils/cn'
import { Loader2 } from 'lucide-react'

const variants = {
  primary:   'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm shadow-primary-500/25 hover:shadow-md hover:shadow-primary-500/30',
  secondary: 'bg-surface-200/80 dark:bg-surface-800 text-surface-800 dark:text-surface-100 hover:bg-surface-300/80 dark:hover:bg-surface-700 active:bg-surface-400/80 dark:active:bg-surface-600 border border-surface-300/90 dark:border-surface-700/50',
  outline:   'border border-surface-300/90 dark:border-surface-700/50 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800/60 hover:text-surface-900 dark:hover:text-surface-100 hover:border-surface-400 dark:hover:border-surface-600/50 bg-transparent',
  ghost:     'text-surface-600 dark:text-surface-400 hover:bg-surface-200/70 dark:hover:bg-surface-800/50 hover:text-surface-800 dark:hover:text-surface-200 bg-transparent',
  danger:    'bg-red-500/90 text-white hover:bg-red-600 active:bg-red-700 shadow-sm shadow-red-500/20',
  gradient:  'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-sm shadow-primary-500/25 hover:shadow-glow-sm',
  glass:     'glass glass-hover text-surface-200 hover:text-white',
  success:   'bg-emerald-500/90 text-white hover:bg-emerald-600 active:bg-emerald-700 shadow-sm shadow-emerald-500/20',
  subtle:    'bg-surface-100/90 dark:bg-surface-800/40 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800/60 hover:text-surface-900 dark:hover:text-surface-100 border border-surface-300/70 dark:border-surface-700/30',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs gap-1 rounded-md',
  sm: 'px-3.5 py-2 text-sm gap-1.5 rounded-xl',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-5 py-3 text-base gap-2 rounded-xl',
  xl: 'px-6 py-3 text-base gap-2.5 rounded-xl',
  icon: 'p-2.5 rounded-xl',
  'icon-sm': 'p-2 rounded-xl',
  'icon-lg': 'p-3 rounded-xl',
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  leftIcon,
  rightIcon,
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        'active:scale-[0.98]',
        'select-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
}

// Button Group component
export const ButtonGroup = ({ children, className }) => {
  return (
    <div className={cn(
      'inline-flex items-center rounded-lg overflow-hidden',
      'border border-surface-700/50',
      '[&>button]:rounded-none [&>button]:border-0 [&>button]:border-r [&>button]:border-surface-700/50 [&>button:last-child]:border-r-0',
      className
    )}>
      {children}
    </div>
  )
}
