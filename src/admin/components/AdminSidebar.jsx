import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBag,
  QrCode,
  Menu,
  BarChart3,
  Receipt,
  LogOut,
  Users,
  Package,
  ChevronLeft,
  ChevronRight,
  AlignJustify,
  X,
  Settings,
  HelpCircle,
  Zap,
} from 'lucide-react'
import { useAuth } from '@shared/contexts/AuthContext'
import { cn } from '@shared/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { Tooltip } from '@shared/components/Tooltip'

const navSections = [
  {
    title: 'Overview',
    items: [
      { to: '/owner/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard' },
      { to: '/owner/orders', icon: ShoppingBag, label: 'Orders', permission: 'orders' },
      { to: '/owner/analytics', icon: BarChart3, label: 'Analytics', permission: 'analytics' },
    ],
  },
  {
    title: 'Management',
    items: [
      { to: '/owner/menu', icon: Menu, label: 'Menu Editor', permission: 'menu' },
      { to: '/owner/qr', icon: QrCode, label: 'QR Codes', permission: 'qr' },
      { to: '/owner/billing', icon: Receipt, label: 'Billing', permission: 'billing' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/owner/inventory', icon: Package, label: 'Inventory', permission: 'inventory' },
      { to: '/owner/staff', icon: Users, label: 'Staff', permission: 'staff' },
      { to: '/owner/settings', icon: Settings, label: 'Settings', permission: 'settings' },
    ],
  },
]

export const AdminSidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isStaff = user?.role === 'staff'

  const getVisibleSections = () => {
    if (!isStaff) return navSections
    return navSections.map(section => ({
      ...section,
      items: section.items.filter(item => user?.permissions?.includes(item.permission)),
    })).filter(section => section.items.length > 0)
  }

  const visibleSections = getVisibleSections()

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm lg:hidden z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50',
          'flex flex-col',
          'bg-white dark:bg-surface-950 lg:bg-white/95 dark:lg:bg-surface-950/95',
          'border-r border-surface-200/80 dark:border-surface-800/40',
          'shadow-elevated-lg dark:shadow-dark-elevated-xl lg:shadow-none',
          'transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          // Width
          collapsed ? 'lg:w-[78px]' : 'w-[284px]',
          // Mobile slide
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo Area */}
        <div className={cn(
          'flex items-center h-16 border-b border-surface-200/80 dark:border-surface-800/40 flex-shrink-0',
          collapsed ? 'justify-center px-2' : 'px-5'
        )}>
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/25">
                  <Zap className="w-4.5 h-4.5 text-white" />
                </div>
                {/* Active status dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-surface-950" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-surface-900 dark:text-white truncate tracking-tight">QR Menu</h1>
                <p className="text-[10px] text-surface-500 truncate font-medium">Restaurant Platform</p>
              </div>
            </div>
          )}
          {collapsed && (
            <Tooltip content="QR Menu" position="right">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                  <Zap className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-surface-950" />
              </div>
            </Tooltip>
          )}

          {/* Desktop collapse toggle (top) */}
          <div className="hidden lg:flex items-center">
            <button
              onClick={onToggleCollapse}
              className={cn(
                'group relative ml-2',
                'h-10 w-10 rounded-2xl grid place-items-center',
                'bg-surface-100/90 dark:bg-surface-900/40',
                'border border-surface-200/90 dark:border-surface-700/40',
                'text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200',
                'hover:bg-surface-200/80 dark:hover:bg-surface-800/50',
                'transition-all duration-200',
                'shadow-elevated dark:shadow-dark-elevated',
              )}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span className="absolute -inset-1 rounded-[1.25rem] bg-primary-500/0 group-hover:bg-primary-500/5 transition-colors" />
              <AlignJustify className="w-4.5 h-4.5 relative z-10" />
            </button>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3.5 space-y-7 thin-scrollbar">
          {visibleSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-surface-500/90">
                  {section.title}
                </p>
              )}
              {collapsed && (
                <div className="w-6 h-px bg-surface-800/60 mx-auto mb-3" />
              )}
              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                  
                  const linkContent = (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl transition-all duration-250',
                        collapsed ? 'justify-center p-2.5 mx-auto w-11' : 'px-3.5 py-2.5',
                        isActive
                          ? 'bg-gradient-to-r from-primary-500/15 to-violet-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/20 shadow-sm shadow-primary-500/10'
                          : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-200/70 dark:hover:bg-surface-800/55 border border-transparent',
                      )}
                    >
                      {/* Active indicator pill */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-pill"
                          className="absolute inset-0 rounded-xl border border-primary-500/25 bg-gradient-to-r from-primary-500/[0.08] via-primary-500/[0.02] to-violet-500/[0.08]"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <item.icon className={cn(
                        'relative z-10 flex-shrink-0 transition-colors duration-200',
                        collapsed ? 'w-[18px] h-[18px]' : 'w-[17px] h-[17px]',
                        isActive ? 'text-primary-500 dark:text-primary-400' : 'text-surface-500 group-hover:text-surface-700 dark:group-hover:text-surface-300'
                      )} />
                      {!collapsed && (
                        <span className="relative z-10 text-[13px] font-medium truncate">{item.label}</span>
                      )}
                      {/* Active dot for collapsed mode */}
                      {isActive && collapsed && (
                        <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary-400" />
                      )}
                    </NavLink>
                  )

                  if (collapsed) {
                    return (
                      <Tooltip key={item.to} content={item.label} position="right">
                        {linkContent}
                      </Tooltip>
                    )
                  }
                  return <div key={item.to}>{linkContent}</div>
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User & Footer */}
        <div className={cn(
          'border-t border-surface-200/80 dark:border-surface-800/40',
          collapsed ? 'p-2' : 'p-3'
        )}>
          <div className={cn('h-px w-full mb-3', collapsed ? 'bg-surface-200/60 dark:bg-surface-800/60' : 'bg-surface-200/80 dark:bg-surface-800/60')} />

          {/* Help link */}
          {!collapsed && (
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 mb-1.5 rounded-xl text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-200/70 dark:hover:bg-surface-800/50 transition-colors"
            >
              <HelpCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-[13px] font-medium">Help & Support</span>
            </button>
          )}
          {collapsed && (
            <Tooltip content="Help & Support" position="right">
              <button className="flex justify-center w-full p-2.5 rounded-lg text-surface-500 hover:text-surface-300 hover:bg-surface-800/50 transition-colors mb-1.5">
                <HelpCircle className="w-[18px] h-[18px]" />
              </button>
            </Tooltip>
          )}

          {/* User card */}
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl bg-surface-100/90 dark:bg-surface-800/35 border border-surface-200/90 dark:border-surface-800/40 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-surface-800 dark:text-surface-200 truncate">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-surface-500 truncate">{user?.email}</p>
              </div>
            </div>
          )}

          {/* Logout */}
          {collapsed ? (
            <Tooltip content="Logout" position="right">
              <button
                onClick={logout}
                className="flex justify-center w-full p-2.5 rounded-xl text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <LogOut className="w-[18px] h-[18px]" />
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="text-[13px] font-medium">Logout</span>
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
