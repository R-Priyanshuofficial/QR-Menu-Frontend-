import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, X, ArrowRight, Hash } from 'lucide-react'
import {
  LayoutDashboard, ShoppingBag, QrCode, Menu, BarChart3,
  Receipt, Users, Package, Settings, User, Palette,
} from 'lucide-react'
import { cn } from '../utils/cn'
import { motion, AnimatePresence } from 'framer-motion'

const allCommands = [
  { id: 'dashboard',  label: 'Dashboard',     icon: LayoutDashboard, path: '/owner/dashboard',  section: 'Pages' },
  { id: 'orders',     label: 'Orders',         icon: ShoppingBag,    path: '/owner/orders',     section: 'Pages' },
  { id: 'analytics',  label: 'Analytics',      icon: BarChart3,      path: '/owner/analytics',  section: 'Pages' },
  { id: 'menu',       label: 'Menu Editor',    icon: Menu,           path: '/owner/menu',       section: 'Pages' },
  { id: 'qr',         label: 'QR Codes',       icon: QrCode,         path: '/owner/qr',         section: 'Pages' },
  { id: 'qr-designer',label: 'QR Designer',    icon: Palette,        path: '/owner/qr/designer',section: 'Pages' },
  { id: 'billing',    label: 'Billing',        icon: Receipt,        path: '/owner/billing',    section: 'Pages' },
  { id: 'inventory',  label: 'Inventory',      icon: Package,        path: '/owner/inventory',  section: 'Pages' },
  { id: 'staff',      label: 'Staff',          icon: Users,          path: '/owner/staff',      section: 'Pages' },
  { id: 'settings',   label: 'Settings',       icon: Settings,       path: '/owner/settings',   section: 'Pages' },
  { id: 'profile',    label: 'Edit Profile',   icon: User,           path: '/owner/profile',    section: 'Pages' },
]

export const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else onClose('toggle')
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const filtered = useMemo(() => {
    if (!query.trim()) return allCommands
    const q = query.toLowerCase()
    return allCommands.filter(cmd =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.section.toLowerCase().includes(q)
    )
  }, [query])

  const grouped = useMemo(() => {
    const groups = {}
    filtered.forEach(cmd => {
      if (!groups[cmd.section]) groups[cmd.section] = []
      groups[cmd.section].push(cmd)
    })
    return groups
  }, [filtered])

  const handleSelect = (cmd) => {
    navigate(cmd.path)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filtered.length > 0) {
      handleSelect(filtered[0])
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-80 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                'relative w-full max-w-lg rounded-xl overflow-hidden',
                'bg-surface-900/95 backdrop-blur-xl',
                'border border-surface-700/50',
                'shadow-dark-elevated-xl',
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Accent line */}
              <div className="h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

              {/* Search input */}
              <div className="flex items-center px-4 border-b border-surface-700/40">
                <Search className="w-4.5 h-4.5 text-surface-500 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, actions..."
                  className="w-full px-3 py-3.5 bg-transparent text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-surface-500 bg-surface-800 rounded border border-surface-700/50">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-72 overflow-y-auto py-2 thin-scrollbar">
                {Object.keys(grouped).length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-surface-500">No results found</p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([section, commands]) => (
                    <div key={section}>
                      <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-surface-500">
                        {section}
                      </p>
                      {commands.map((cmd) => {
                        const isActive = location.pathname === cmd.path
                        return (
                          <button
                            key={cmd.id}
                            onClick={() => handleSelect(cmd)}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                              'hover:bg-surface-800/60',
                              isActive && 'bg-primary-500/10'
                            )}
                          >
                            <cmd.icon className={cn(
                              'w-4 h-4 flex-shrink-0',
                              isActive ? 'text-primary-400' : 'text-surface-500'
                            )} />
                            <span className={cn(
                              'text-sm font-medium flex-1',
                              isActive ? 'text-primary-400' : 'text-surface-300'
                            )}>
                              {cmd.label}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-surface-600" />
                          </button>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-surface-700/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] text-surface-500">
                    <kbd className="px-1 py-0.5 bg-surface-800 rounded border border-surface-700/50 text-[10px]">↵</kbd>
                    select
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-surface-500">
                    <kbd className="px-1 py-0.5 bg-surface-800 rounded border border-surface-700/50 text-[10px]">esc</kbd>
                    close
                  </span>
                </div>
                <span className="text-[10px] text-surface-600">QR Menu</span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
