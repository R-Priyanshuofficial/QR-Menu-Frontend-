import { cn } from '../utils/cn'

const variants = {
  primary:   'bg-primary-500/10 text-primary-400 border-primary-500/20',
  secondary: 'bg-surface-800/50 text-surface-300 border-surface-700/40',
  success:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger:    'bg-red-500/10 text-red-400 border-red-500/20',
  info:      'bg-sky-500/10 text-sky-400 border-sky-500/20',
  gray:      'bg-surface-800/50 text-surface-400 border-surface-700/40',
  violet:    'bg-violet-500/10 text-violet-400 border-violet-500/20',
  outline:   'bg-transparent text-surface-300 border-surface-600/40',
}

export const Badge = ({ children, variant = 'primary', dot = false, pulse = false, size = 'md', className, ...props }) => {
  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  }

  const dotColors = {
    primary: 'bg-primary-400',
    secondary: 'bg-surface-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    info: 'bg-sky-400',
    gray: 'bg-surface-500',
    violet: 'bg-violet-400',
    outline: 'bg-surface-400',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          dotColors[variant],
          pulse && 'animate-pulse-dot',
        )} />
      )}
      {children}
    </span>
  )
}
