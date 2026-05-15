import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  TrendingUp,
  QrCode,
  DollarSign,
  ArrowRight,
  Clock,
  Zap,
  BarChart3,
  Menu as MenuIcon,
  Package,
  ArrowUpRight,
  Users,
  Activity,
} from 'lucide-react'
import { Card, CardContent } from '@shared/components/Card'
import { Button } from '@shared/components/Button'
import { PageLoader } from '@shared/components/Spinner'
import { StatCard } from '@shared/components/StatCard'
import { EmptyState } from '@shared/components/EmptyState'
import { Badge } from '@shared/components/Badge'
import { formatCurrency } from '@shared/utils/formatters'
import { dashboardAPI, ordersAPI } from '@shared/api/endpoints'
import { NotificationPermission } from '../components/NotificationPermission'
import { useAuth } from '@shared/contexts/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const statsRes = await dashboardAPI.getStats()
      setStats(statsRes.data.stats)
      
      try {
        const ordersRes = await ordersAPI.getOwnerOrders('pending')
        setRecentOrders(ordersRes.data.slice(0, 5))
      } catch (ordersError) {
        console.error('Failed to fetch orders:', ordersError)
        setRecentOrders([])
      }
    } catch (error) {
      console.error('Dashboard API error:', error)
      
      setStats({
        totalQRCodes: 0,
        activeQRCodes: 0,
        totalScans: 0,
        recentScans: 0,
        scanGrowth: '0%',
        totalOrders: 0,
        todayOrders: 0,
        pendingOrders: 0,
        todayRevenue: 0,
        totalRevenue: 0,
      })
      toast.error('Backend not connected. Showing placeholder data.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PageLoader message="Loading dashboard..." />

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const statCards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(stats?.todayRevenue || 0),
      icon: DollarSign,
      iconColor: 'emerald',
      change: stats?.totalRevenue ? formatCurrency(stats.totalRevenue) + ' total' : undefined,
      trend: 'up',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      iconColor: 'sky',
      change: `${stats?.todayOrders || 0} today`,
      changeLabel: `${stats?.pendingOrders || 0} pending`,
    },
    {
      title: 'Total Scans',
      value: stats?.totalScans || 0,
      icon: TrendingUp,
      iconColor: 'violet',
      change: stats?.scanGrowth || '0%',
      trend: 'up',
    },
    {
      title: 'QR Codes',
      value: stats?.totalQRCodes || 0,
      icon: QrCode,
      iconColor: 'amber',
      change: `${stats?.activeQRCodes || 0} active`,
    },
  ]

  const quickActions = [
    { label: 'Edit Menu', description: 'Update items & prices', icon: MenuIcon, to: '/owner/menu', color: 'primary' },
    { label: 'Generate QR', description: 'Create new QR codes', icon: QrCode, to: '/owner/qr', color: 'violet' },
    { label: 'View Analytics', description: 'Check performance', icon: BarChart3, to: '/owner/analytics', color: 'sky' },
    { label: 'Manage Inventory', description: 'Stock levels', icon: Package, to: '/owner/inventory', color: 'emerald' },
  ]

  const iconColors = {
    primary: 'bg-primary-500/10 text-primary-400',
    violet:  'bg-violet-500/10 text-violet-400',
    sky:     'bg-sky-500/10 text-sky-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
  }

  return (
    <div className="space-y-6 lg:space-y-8 page-content">
      {/* ─── Welcome Hero ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-surface-300/80 dark:border-surface-700/30 shadow-elevated-lg dark:shadow-dark-elevated-lg"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-surface-100 to-surface-200 dark:from-surface-800/60 dark:via-surface-900/80 dark:to-surface-800/60" />
        <div className="absolute inset-0 bg-grid-pattern opacity-40 dark:opacity-30" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/[0.06] rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/[0.04] rounded-full blur-[60px]" />
        
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="success" dot pulse size="sm">
                  <Clock className="w-3 h-3 mr-0.5" />
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight font-display">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
              </h1>
              <p className="text-surface-600 dark:text-surface-400 text-sm sm:text-base max-w-lg">
                Here's what's happening with your restaurant today. Stay on top of orders, revenue, and performance.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<BarChart3 className="w-4 h-4" />}
                onClick={() => navigate('/owner/analytics')}
              >
                View Reports
              </Button>
              <Button
                variant="gradient"
                size="sm"
                leftIcon={<Zap className="w-4 h-4" />}
                onClick={() => navigate('/owner/qr/designer?type=global')}
              >
                Create QR
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notification Permission Banner */}
      <NotificationPermission />

      {/* ─── Stats Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={stat.title} {...stat} index={index} />
        ))}
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-7">
        {/* Pending Orders — 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2"
        >
          <Card accent="gradient">
            <div className="px-6 py-4 border-b border-surface-200/80 dark:border-surface-700/40 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100 font-display">Pending Orders</h2>
                <p className="text-xs text-surface-500 mt-0.5">Orders awaiting preparation</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => navigate('/owner/orders')}
              >
                View All
              </Button>
            </div>

            <div className="p-4 sm:p-5">
              {recentOrders.length > 0 ? (
                <div className="space-y-2">
                  {recentOrders.map((order, idx) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * idx }}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-surface-100/85 dark:bg-surface-800/30 hover:bg-surface-200/80 dark:hover:bg-surface-800/50 border border-surface-200/90 dark:border-surface-700/20 hover:border-surface-300 dark:hover:border-surface-700/40 transition-all cursor-pointer group"
                      onClick={() => navigate('/owner/orders')}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                            Order #{order.id.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-xs text-surface-500 truncate">{order.customerName}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4 flex items-center gap-3">
                        <div>
                            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                            {formatCurrency(order.totalAmount)}
                          </p>
                          <p className="text-xs text-surface-500">{order.items.length} items</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-surface-600 group-hover:text-primary-400 transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ShoppingBag}
                  title="No pending orders"
                  description="New orders will appear here in real-time"
                  compact
                />
              )}
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions — 1 column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card accent="primary">
            <div className="px-6 py-4 border-b border-surface-200/80 dark:border-surface-700/40">
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100 font-display">Quick Actions</h2>
              <p className="text-xs text-surface-500 mt-0.5">Jump to common tasks</p>
            </div>
            <div className="p-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-200/80 dark:hover:bg-surface-800/40 transition-all duration-200 text-left group"
                >
                  <div className={`p-2.5 rounded-lg ${iconColors[action.color]} flex-shrink-0`}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-surface-800 dark:text-surface-200 group-hover:text-surface-900 dark:group-hover:text-white transition-colors">
                      {action.label}
                    </p>
                    <p className="text-xs text-surface-500">{action.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-600 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ─── Insights Row ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Revenue Insight */}
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-900/80 border border-surface-200/80 dark:border-surface-700/40 shadow-elevated dark:shadow-dark-elevated">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Revenue Status</p>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50 font-display mb-1">
            {formatCurrency(stats?.totalRevenue || 0)}
          </p>
          <p className="text-xs text-surface-500">Lifetime earnings</p>
        </div>

        {/* Active QR Insight */}
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-900/80 border border-surface-200/80 dark:border-surface-700/40 shadow-elevated dark:shadow-dark-elevated">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <QrCode className="w-4 h-4 text-violet-400" />
            </div>
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Active QR Codes</p>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50 font-display mb-1">
            {stats?.activeQRCodes || 0}
          </p>
          <p className="text-xs text-surface-500">
            {stats?.totalScans || 0} total scans
          </p>
        </div>

        {/* Orders Today Insight */}
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-900/80 border border-surface-200/80 dark:border-surface-700/40 shadow-elevated dark:shadow-dark-elevated">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-sky-500/10">
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Today's Activity</p>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50 font-display mb-1">
            {stats?.todayOrders || 0}
          </p>
          <p className="text-xs text-surface-500">
            {stats?.pendingOrders || 0} orders pending
          </p>
        </div>
      </motion.div>
    </div>
  )
}
