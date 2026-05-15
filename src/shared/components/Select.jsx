import { forwardRef } from 'react'
import { cn } from '../utils/cn'
import { ChevronDown } from 'lucide-react'

export const Select = forwardRef(
  ({ label, error, helperText, leftIcon, className, containerClassName, children, ...props }, ref) => {
    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            {label}
            {props.required && <span className="text-primary-400 ml-1">*</span>}
          </label>
        )}

        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 group-focus-within:text-primary-400 transition-colors pointer-events-none">
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            className={cn(
              'w-full px-3.5 py-2.5 rounded-xl text-sm appearance-none cursor-pointer',
              'bg-white dark:bg-surface-800/55',
              'text-surface-900 dark:text-surface-100',
              'border border-surface-300/80 dark:border-surface-700/50',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/60',
              'transition-all duration-200',
              'disabled:bg-surface-100 dark:disabled:bg-surface-800/30 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500/60 focus:ring-red-500/30 focus:border-red-500/60',
              leftIcon && 'pl-10',
              'pr-10',
              className
            )}
            {...props}
          >
            {children}
          </select>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {error && <p className="mt-1.5 text-xs text-red-400 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-surface-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
