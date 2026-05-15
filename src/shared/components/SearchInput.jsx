import { forwardRef } from 'react'
import { cn } from '../utils/cn'
import { Search, X, Loader2 } from 'lucide-react'

export const SearchInput = forwardRef(
  ({ value, onChange, onClear, placeholder = 'Search...', loading = false, className, shortcut, ...props }, ref) => {
    return (
      <div className={cn('relative group', className)}>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 group-focus-within:text-primary-400 transition-colors pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-10 py-2.5 rounded-xl text-sm',
            'bg-white dark:bg-surface-800/45',
            'text-surface-900 dark:text-surface-100',
            'border border-surface-300/80 dark:border-surface-700/35',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500/50 focus:bg-white dark:focus:bg-surface-800/65',
            'transition-all duration-200',
            'placeholder:text-surface-500',
          )}
          {...props}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value ? (
            <button
              onClick={onClear}
              className="p-0.5 text-surface-500 hover:text-surface-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : shortcut ? (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-surface-500 bg-surface-800 rounded border border-surface-700/40">
              {shortcut}
            </kbd>
          ) : null}
        </div>
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
