import { cn } from '../utils/cn'
import { motion } from 'framer-motion'

export const Toggle = ({
  checked = false,
  onChange,
  label,
  description,
  size = 'md',
  disabled = false,
  className,
}) => {
  const sizes = {
    sm: { track: 'w-8 h-4.5', thumb: 'w-3.5 h-3.5', translate: 'translate-x-3.5', label: 'text-sm' },
    md: { track: 'w-10 h-5.5', thumb: 'w-4.5 h-4.5', translate: 'translate-x-[18px]', label: 'text-sm' },
    lg: { track: 'w-12 h-6.5', thumb: 'w-5.5 h-5.5', translate: 'translate-x-[22px]', label: 'text-base' },
  }

  const s = sizes[size] || sizes.md

  return (
    <label className={cn(
      'inline-flex items-start gap-3 cursor-pointer select-none',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}>
      <button
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={cn(
          'relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950',
          s.track,
          checked
            ? 'bg-primary-500'
            : 'bg-surface-700',
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'inline-block rounded-full bg-white shadow-sm',
            'transform transition-transform duration-200',
            s.thumb,
            'mt-0.5 ml-0.5',
            checked && s.translate,
          )}
        />
      </button>
      {(label || description) && (
        <div className="min-w-0 pt-0.5">
          {label && <p className={cn('font-medium text-surface-200', s.label)}>{label}</p>}
          {description && <p className="text-xs text-surface-500 mt-0.5">{description}</p>}
        </div>
      )}
    </label>
  )
}
