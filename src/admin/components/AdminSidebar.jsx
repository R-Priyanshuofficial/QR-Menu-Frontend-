import { NavLink } from 'react-router-dom'
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
} from 'lucide-react'
import { useAuth } from '@shared/contexts/AuthContext'

const navItems = [
  { to: '/owner/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard' },
  { to: '/owner/orders', icon: ShoppingBag, label: 'Orders', permission: 'orders' },
  { to: '/owner/billing', icon: Receipt, label: 'Billing', permission: 'billing' },
  { to: '/owner/menu', icon: Menu, label: 'Menu Editor', permission: 'menu' },
  { to: '/owner/qr', icon: QrCode, label: 'QR Codes', permission: 'qr' },
  { to: '/owner/analytics', icon: BarChart3, label: 'Analytics', permission: 'analytics' },
  { to: '/owner/inventory', icon: Package, label: 'Inventory', permission: 'inventory' },
  { to: '/owner/staff', icon: Users, label: 'Staff', permission: 'staff' },
]

export const AdminSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth()
  const isStaff = user?.role === 'staff'
  const visibleNavItems = isStaff
    ? navItems.filter((item) => user?.permissions?.includes(item.permission))
    : navItems

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl sm:text-2xl font-bold text-primary-600">QR Menu</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Admin Panel</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={logout}
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 w-full rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
