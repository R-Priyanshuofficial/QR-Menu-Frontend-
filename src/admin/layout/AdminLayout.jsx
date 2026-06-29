import { useState, useRef, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Menu, Bell, Moon, Sun, User, Settings, LogOut, Clock, Search, Plus, ChevronRight } from 'lucide-react'
import { AdminSidebar } from '../components/AdminSidebar'
import { useAuth } from '@shared/contexts/AuthContext'
import { useTheme } from '@shared/contexts/ThemeContext'
import { useSocket } from '@shared/contexts/SocketContext'
import { cn } from '@shared/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { CommandPalette } from '@shared/components/CommandPalette'

// Breadcrumb mapping
const breadcrumbLabels = {
  'owner': null,
  'dashboard': 'Dashboard',
  'orders': 'Orders',
  'analytics': 'Analytics',
  'menu': 'Menu Editor',
  'qr': 'QR Codes',
  'designer': 'Designer',
  'customize': 'Customize',
  'billing': 'Billing',
  'inventory': 'Inventory',
  'staff': 'Staff',
  'manager-control': 'Manager Control',
  'settings': 'Settings',
  'profile': 'Profile',
}

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { notifications, unreadCount, markNotificationsRead, clearNotifications } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef(null)
  const notificationRef = useRef(null)

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return ''
    const now = Date.now()
    const time = new Date(timestamp).getTime()
    const diffMinutes = Math.floor((now - time) / (1000 * 60))
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  // Build breadcrumbs
  const breadcrumbs = location.pathname.split('/').filter(Boolean).reduce((acc, segment) => {
    const label = breadcrumbLabels[segment]
    if (label) {
      const path = acc.length > 0 ? `${acc[acc.length - 1].path}/${segment}` : `/${segment}`
      acc.push({ label, path: path.startsWith('/owner') ? path : `/owner/${segment}` })
    }
    return acc
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCommandPaletteClose = (action) => {
    if (action === 'toggle') {
      setCommandPaletteOpen(true)
    } else {
      setCommandPaletteOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex text-surface-900 dark:text-surface-100">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Bar */}
        <header className={cn(
          'sticky top-0 z-30',
          'bg-white/90 dark:bg-surface-950/80',
          'backdrop-blur-premium',
          'border-b border-surface-200/80 dark:border-surface-800/40',
        )}>
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            {/* Left side */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 hover:bg-surface-200/80 dark:hover:bg-surface-800/50 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Breadcrumbs (desktop) */}
              <div className="hidden md:flex items-center gap-1 text-sm min-w-0">
                {breadcrumbs.map((crumb, idx) => (
                  <div key={crumb.path} className="flex items-center gap-1 min-w-0">
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-surface-600 flex-shrink-0" />}
                    {idx === breadcrumbs.length - 1 ? (
                      <span className="font-semibold text-surface-900 dark:text-surface-100 truncate">{crumb.label}</span>
                    ) : (
                      <button
                        onClick={() => navigate(crumb.path)}
                        className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors truncate"
                      >
                        {crumb.label}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Command Palette Trigger */}
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className={cn(
                  'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg',
                  'bg-surface-100 dark:bg-surface-800/40 hover:bg-surface-200 dark:hover:bg-surface-800/60',
                  'border border-surface-300/80 dark:border-surface-700/30 hover:border-surface-400/80 dark:hover:border-surface-700/50',
                  'text-surface-500 hover:text-surface-300',
                  'transition-all duration-200 text-sm',
                )}
              >
                <Search className="w-3.5 h-3.5" />
                <span className="text-xs">Search...</span>
                <kbd className="ml-4 hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-surface-500 bg-surface-800 rounded border border-surface-700/40">
                  ⌘K
                </kbd>
              </button>

              {/* Mobile search */}
              <button
                onClick={() => setCommandPaletteOpen(true)}
                  className="sm:hidden p-2 rounded-lg text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 hover:bg-surface-200/80 dark:hover:bg-surface-800/50 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Quick Create */}
              <button
                onClick={() => navigate('/owner/qr/designer?type=global')}
                className="p-2 rounded-lg text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 hover:bg-surface-200/80 dark:hover:bg-surface-800/50 transition-colors"
                title="Quick Create QR"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 hover:bg-surface-200/80 dark:hover:bg-surface-800/50 transition-colors"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => {
                    const next = !notificationDropdownOpen
                    setNotificationDropdownOpen(next)
                    if (next) markNotificationsRead()
                  }}
                  className="relative p-2 rounded-lg text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 hover:bg-surface-200/80 dark:hover:bg-surface-800/50 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-surface-950 animate-pulse" />
                  )}
                </button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {notificationDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white/95 dark:bg-surface-900/95 backdrop-blur-xl rounded-2xl shadow-elevated-xl dark:shadow-dark-elevated-xl border border-surface-300/80 dark:border-surface-700/40 overflow-hidden z-50"
                    >
                      <div className="h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

                      <div className="px-4 py-3 border-b border-surface-200/80 dark:border-surface-800/40 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">Notifications</p>
                          <p className="text-[11px] text-surface-500">Live order updates</p>
                        </div>
                        <button
                          className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
                          onClick={() => {
                            clearNotifications()
                            setNotificationDropdownOpen(false)
                          }}
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto thin-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <div className="w-10 h-10 rounded-xl bg-surface-800/50 flex items-center justify-center mx-auto mb-2.5">
                              <Clock className="w-5 h-5 text-surface-600" />
                            </div>
                            <p className="text-sm text-surface-500 font-medium">No notifications yet</p>
                            <p className="text-xs text-surface-600 mt-0.5">New orders will appear here</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className="px-4 py-3 border-b border-surface-800/30 last:border-b-0 hover:bg-surface-800/30 transition-colors"
                            >
                              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                                {notification.title || 'Order Update'}
                              </p>
                              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="inline-flex items-center gap-1 rounded-md bg-surface-800 px-1.5 py-0.5 text-[10px] font-medium text-surface-500 uppercase tracking-wide">
                                  {notification.type?.replace('_', ' ') || 'update'}
                                </span>
                                <span className="text-[10px] text-surface-500">{formatTimeAgo(notification.timestamp)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Separator */}
              <div className="w-px h-6 bg-surface-800/60 mx-0.5 hidden sm:block" />

              {/* Profile */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-surface-200/80 dark:hover:bg-surface-800/50 transition-colors"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 leading-tight">
                      {user?.name || 'Admin'}
                    </p>
                    <p className="text-[10px] text-surface-500 leading-tight">{user?.role === 'staff' ? 'Staff' : 'Owner'}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-primary-500/20">
                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                </button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-surface-900/95 backdrop-blur-xl rounded-2xl shadow-elevated-xl dark:shadow-dark-elevated-xl border border-surface-300/80 dark:border-surface-700/40 overflow-hidden z-50"
                    >
                      <div className="h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

                      <div className="px-4 py-3 border-b border-surface-200/80 dark:border-surface-800/40">
                        <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                          {user?.name || 'Admin'}
                        </p>
                        <p className="text-xs text-surface-500 truncate">
                          {user?.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            navigate('/owner/profile')
                            setProfileDropdownOpen(false)
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-surface-300 hover:bg-surface-800/50 flex items-center gap-2.5 transition-colors"
                        >
                          <User className="w-4 h-4 text-surface-500" />
                          Edit Profile
                        </button>

                        <button
                          onClick={() => {
                            navigate('/owner/settings')
                            setProfileDropdownOpen(false)
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-surface-300 hover:bg-surface-800/50 flex items-center gap-2.5 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-surface-500" />
                          Settings
                        </button>
                      </div>

                      <div className="border-t border-surface-800/40 py-1">
                        <button
                          onClick={() => {
                            logout()
                            setProfileDropdownOpen(false)
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={handleCommandPaletteClose}
      />
    </div>
  )
}
