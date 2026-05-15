import { useState, useRef, useEffect } from 'react'
import { cn } from '../utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export const DropdownMenu = ({
  trigger,
  children,
  align = 'right',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-flex" ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'absolute top-full mt-1.5 z-50 min-w-[180px]',
              'bg-surface-900/95 backdrop-blur-xl',
              'border border-surface-700/40',
              'rounded-xl shadow-dark-elevated-xl',
              'py-1 overflow-hidden',
              align === 'right' && 'right-0',
              align === 'left' && 'left-0',
              align === 'center' && 'left-1/2 -translate-x-1/2',
              className
            )}
            onClick={() => setIsOpen(false)}
          >
            {/* Accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const DropdownItem = ({
  children,
  icon: Icon,
  onClick,
  danger = false,
  disabled = false,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-surface-300 hover:bg-surface-800/50 hover:text-surface-100',
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0 opacity-60" />}
      {children}
    </button>
  )
}

export const DropdownDivider = () => (
  <div className="my-1 h-px bg-surface-700/40" />
)

export const DropdownLabel = ({ children }) => (
  <p className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-surface-500">
    {children}
  </p>
)
