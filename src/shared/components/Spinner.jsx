import { Loader2 } from 'lucide-react'
import { cn } from '../utils/cn'

export const Spinner = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  }

  return (
    <div className={cn('relative', sizes[size], className)}>
      <div className={cn(
        'absolute inset-0 rounded-full border-2 border-surface-800',
      )} />
      <div className={cn(
        'absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500 animate-spin',
      )} />
    </div>
  )
}

export const PageLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
      <div className="relative">
        <Spinner size="xl" />
        <div className="absolute inset-0 rounded-full bg-primary-500/10 animate-ping" style={{ animationDuration: '2s' }} />
      </div>
      <div className="text-center">
        <p className="text-surface-400 text-sm font-medium">{message}</p>
      </div>
    </div>
  )
}

export const Skeleton = ({ className, variant = 'default' }) => {
  const variants = {
    default: 'rounded-lg',
    text: 'rounded h-4',
    circle: 'rounded-full',
    card: 'rounded-xl h-32',
  }

  return (
    <div
      className={cn(
        'skeleton',
        'bg-surface-800/50',
        variants[variant],
        className
      )}
    />
  )
}

export const CardSkeleton = () => (
  <div className="rounded-xl border border-surface-700/40 bg-surface-900/80 p-5 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-8 w-20" />
    <Skeleton className="h-3 w-32" />
  </div>
)

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-3">
    <div className="flex gap-4 px-4 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 px-4 py-3 border-t border-surface-800/40">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
)
