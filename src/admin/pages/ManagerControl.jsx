import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Receipt,
  ShoppingBag,
  Table2,
  TrendingUp,
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { PageHeader } from '@shared/components/PageHeader'
import { Card } from '@shared/components/Card'
import { Button } from '@shared/components/Button'
import { Badge } from '@shared/components/Badge'
import { StatCard } from '@shared/components/StatCard'
import { EmptyState } from '@shared/components/EmptyState'
import { PageLoader } from '@shared/components/Spinner'
import { dashboardAPI, ordersAPI, sessionsAPI } from '@shared/api/endpoints'
import { formatCurrency, formatDateTime, getRelativeTime } from '@shared/utils/formatters'
import { useAuth } from '@shared/contexts/AuthContext'
import toast from 'react-hot-toast'
import { cn } from '@shared/utils/cn'

const statusTone = {
  pending: 'warning',
  preparing: 'violet',
  ready: 'success',
  completed: 'info',
  cancelled: 'danger',
}

const cardShell =
  'bg-white dark:bg-surface-900/[0.86] border border-surface-200/80 dark:border-surface-700/40 shadow-elevated dark:shadow-dark-elevated'

const safeNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeTableNumber = (value) => {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

const getTodayStart = () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return start
}

const isToday = (date) => {
  const value = date ? new Date(date) : null
  if (!value || Number.isNaN(value.getTime())) return false
  return value >= getTodayStart()
}

const buildTopSellingItems = (orders = []) => {
  const buckets = new Map()

  orders
    .filter((order) => order.status === 'completed' && isToday(order.createdAt))
    .forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = (item?.name || '').trim().toLowerCase()
        if (!key) return

        const quantity = safeNumber(item.quantity)
        const subtotal = safeNumber(item.subtotal)
        const unitPrice = subtotal > 0 && quantity > 0 ? subtotal / quantity : safeNumber(item.unitPrice) || safeNumber(item.price)
        const revenue = subtotal || unitPrice * quantity

        const existing = buckets.get(key) || {
          name: item.name || 'Unnamed item',
          quantitySold: 0,
          revenueGenerated: 0,
        }

        existing.quantitySold += quantity
        existing.revenueGenerated += revenue
        buckets.set(key, existing)
      })
    })

  return [...buckets.values()]
    .sort((a, b) => b.quantitySold - a.quantitySold || b.revenueGenerated - a.revenueGenerated)
    .slice(0, 5)
}

const buildActivityFeed = (orders = [], billingSessions = []) => {
  const events = []

  orders
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .forEach((order) => {
      const tableNumber = normalizeTableNumber(order.tableNumber)
      const customerName = order.customerName || 'Guest'
      const amount = safeNumber(order.totalAmount)

      events.push({
        id: `received-${order.id}`,
        type: 'order_received',
        title: 'Order Received',
        detail: `Table ${tableNumber || 'No table'} | ${customerName}`,
        amount,
        timestamp: order.createdAt || order.updatedAt || order.completedAt,
      })

      if (order.status === 'ready' || order.status === 'completed') {
        events.push({
          id: `ready-${order.id}`,
          type: 'order_ready',
          title: 'Order Ready',
          detail: `Table ${tableNumber || 'No table'} | ${customerName}`,
          amount,
          timestamp: order.updatedAt || order.completedAt || order.createdAt,
        })
      }

      if (order.status === 'completed') {
        events.push({
          id: `completed-${order.id}`,
          type: 'order_completed',
          title: 'Order Completed',
          detail: `Table ${tableNumber || 'No table'} | ${customerName}`,
          amount,
          timestamp: order.completedAt || order.updatedAt || order.createdAt,
        })
      }
    })

  billingSessions.forEach((session) => {
    const tableNumber = normalizeTableNumber(session.tableNumber)
    const customerName = session.customerName || 'Guest'
    const currentTotal = safeNumber(session.currentTotal || session.subtotal)

    events.push({
      id: `session-opened-${session.sessionId || session.id}`,
      type: 'session_opened',
      title: 'Session Opened',
      detail: `Table ${tableNumber || 'No table'} | ${customerName}`,
      amount: currentTotal,
      timestamp: session.openedAt,
    })

    if (session.status === 'CLOSED') {
      events.push({
        id: `session-closed-${session.sessionId || session.id}`,
        type: 'session_closed',
        title: 'Session Closed',
        detail: `Table ${tableNumber || 'No table'} | ${customerName}`,
        amount: safeNumber(session.finalAmount || currentTotal),
        timestamp: session.closedAt || session.generatedAt || session.openedAt,
      })
    }

    if (session.generatedAt || session.finalBillNumber) {
      events.push({
        id: `bill-generated-${session.sessionId || session.id}`,
        type: 'bill_generated',
        title: 'Bill Generated',
        detail: `Table ${tableNumber || 'No table'} | ${customerName}`,
        amount: safeNumber(session.finalAmount || currentTotal),
        timestamp: session.generatedAt || session.closedAt || session.openedAt,
      })
    }
  })

  return events
    .filter((event) => event.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20)
}

const buildTableSnapshots = (tableQrCodes = [], orders = [], billingSessions = []) => {
  const openSessions = billingSessions
    .filter((session) => session.status === 'OPEN')
    .sort((a, b) => new Date(b.openedAt || 0) - new Date(a.openedAt || 0))

  const openSessionByTable = new Map()
  openSessions.forEach((session) => {
    const tableNumber = normalizeTableNumber(session.tableNumber)
    if (tableNumber && !openSessionByTable.has(tableNumber)) {
      openSessionByTable.set(tableNumber, session)
    }
  })

  const snapshots = tableQrCodes
    .map((qr) => {
      const tableNumber = normalizeTableNumber(qr.tableNumber)
      const session = openSessionByTable.get(tableNumber) || null
      const sessionOrders = Array.isArray(session?.orders) ? session.orders : []
      const activeOrders = session
        ? orders.filter((order) => {
            const orderTable = normalizeTableNumber(order.tableNumber)
            const orderDate = new Date(order.createdAt || 0)
            const sessionStart = new Date(session.openedAt || 0)
            return (
              orderTable === tableNumber &&
              orderDate >= sessionStart &&
              ['pending', 'preparing', 'ready'].includes(order.status)
            )
          })
        : []

      const completedOrdersCount = sessionOrders.length
      const orderCount = completedOrdersCount + activeOrders.length
      const currentTotal = session
        ? safeNumber(session.currentTotal || session.subtotal || session.finalAmount || 0)
        : 0

      let status = 'Free'
      if (session) {
        status = activeOrders.length > 0 || completedOrdersCount === 0 ? 'Occupied' : 'Waiting Bill'
      }

      return {
        tableNumber,
        status,
        currentTotal,
        orderCount,
        completedOrdersCount,
        activeOrdersCount: activeOrders.length,
        session,
      }
    })
    .sort((a, b) => Number(a.tableNumber) - Number(b.tableNumber))

  return {
    snapshots,
    occupiedCount: snapshots.filter((table) => table.status === 'Occupied').length,
    waitingCount: snapshots.filter((table) => table.status === 'Waiting Bill').length,
    freeCount: snapshots.filter((table) => table.status === 'Free').length,
    totalCount: snapshots.length,
  }
}

const getActivityMeta = (type) => {
  switch (type) {
    case 'order_ready':
      return { icon: CheckCircle2, tone: 'success' }
    case 'order_completed':
      return { icon: CircleDollarSign, tone: 'info' }
    case 'session_opened':
      return { icon: Activity, tone: 'violet' }
    case 'session_closed':
      return { icon: Table2, tone: 'gray' }
    case 'bill_generated':
      return { icon: Receipt, tone: 'warning' }
    case 'order_received':
    default:
      return { icon: ShoppingBag, tone: 'primary' }
  }
}

export const ManagerControl = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [billingSessions, setBillingSessions] = useState([])
  const [qrCodes, setQrCodes] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])

  const canAccess = user?.role !== 'staff' || user?.permissions?.includes('manager-control')

  const loadData = async (silent = false) => {
    try {
      if (silent) setRefreshing(true)
      else setLoading(true)

      const [statsRes, ordersRes, sessionsRes, controlRes, qrSummaryRes] = await Promise.all([
        dashboardAPI.getStats(),
        ordersAPI.getOwnerOrders('all'),
        sessionsAPI.getBillingSessions({ period: 'all', status: 'all' }),
        dashboardAPI.getManagerControlOverview(),
        dashboardAPI.getQRSummary(),
      ])

      setStats(statsRes?.data?.stats || {})
      setOrders(ordersRes?.data || [])
      setBillingSessions(sessionsRes?.data?.bills || [])
      setLowStockItems(controlRes?.data?.lowStockItems || [])
      setQrCodes(qrSummaryRes?.data?.qrCodes || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load Manager Control')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!authLoading && canAccess) {
      loadData()
    } else if (!authLoading) {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, canAccess])

  useEffect(() => {
    if (!canAccess) return
    const id = setInterval(() => {
      loadData(true)
    }, 30000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess])

  const todayStart = useMemo(() => getTodayStart(), [])

  const todaysOrders = stats?.todayOrders ?? orders.filter((order) => new Date(order.createdAt || 0) >= todayStart).length
  const pendingOrders = stats?.pendingOrders ?? orders.filter((order) => order.status === 'pending').length
  const readyOrders = orders.filter((order) => order.status === 'ready').length
  const openBillingSessions = billingSessions.filter((bill) => bill.status === 'OPEN').length
  const todayRevenue = stats?.todayRevenue ?? 0
  const activeStaff = stats?.activeStaff ?? 0

  const liveOrders = useMemo(
    () => [...orders]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 8),
    [orders]
  )

  const openSessions = useMemo(
    () => [...billingSessions]
      .filter((bill) => bill.status === 'OPEN')
      .sort((a, b) => new Date(b.lastOrderDate || b.openedAt || 0) - new Date(a.lastOrderDate || a.openedAt || 0))
      .slice(0, 6),
    [billingSessions]
  )

  const tableQrCodes = useMemo(
    () => [...qrCodes]
      .filter((qr) => qr?.type === 'table' && normalizeTableNumber(qr.tableNumber))
      .reduce((acc, qr) => {
        const tableNumber = normalizeTableNumber(qr.tableNumber)
        if (!acc.some((entry) => entry.tableNumber === tableNumber)) {
          acc.push({ ...qr, tableNumber })
        }
        return acc
      }, []),
    [qrCodes]
  )

  const tableStatus = useMemo(
    () => buildTableSnapshots(tableQrCodes, orders, billingSessions),
    [tableQrCodes, orders, billingSessions]
  )

  const activityFeed = useMemo(
    () => buildActivityFeed(orders, billingSessions),
    [orders, billingSessions]
  )

  const topSellingItemsToday = useMemo(
    () => buildTopSellingItems(orders),
    [orders]
  )

  const lowStockAlerts = useMemo(
    () => lowStockItems.filter((item) => safeNumber(item.quantity) > 0 && safeNumber(item.quantity) <= safeNumber(item.minLevel)),
    [lowStockItems]
  )

  const outOfStockAlerts = useMemo(
    () => lowStockItems.filter((item) => safeNumber(item.quantity) <= 0),
    [lowStockItems]
  )

  const totalInventoryAlerts = lowStockAlerts.length + outOfStockAlerts.length
  const showTableSection = tableStatus.totalCount > 0

  if (authLoading || (loading && !stats)) {
    return <PageLoader message="Loading Manager Control..." />
  }

  if (!canAccess) {
    return <Navigate to="/owner/dashboard" replace />
  }

  return (
    <div className="space-y-6 lg:space-y-7 max-w-[1600px] mx-auto">
      <div className="relative overflow-hidden rounded-[28px] border border-surface-200/80 dark:border-surface-700/40 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-800 shadow-elevated dark:shadow-dark-elevated-xl">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.28),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_25%),linear-gradient(to_bottom_right,rgba(255,255,255,0.04),transparent)]" />
        <div className="relative p-6 sm:p-7 lg:p-8">
          <PageHeader
            title="Manager Control"
            subtitle="Operational overview for owners and authorized managers. Monitor the floor, track sessions, and jump into live workflows."
            icon={Activity}
            actions={
              <Button
                variant="outline"
                size="sm"
                loading={refreshing}
                leftIcon={<TrendingUp className="w-4 h-4" />}
                onClick={() => loadData(true)}
              >
                Refresh
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard title="Today's Orders" value={todaysOrders} icon={ShoppingBag} iconColor="sky" index={0} />
        <StatCard title="Pending Orders" value={pendingOrders} icon={Clock3} iconColor="amber" index={1} />
        <StatCard title="Ready Orders" value={readyOrders} icon={Receipt} iconColor="emerald" index={2} />
        <StatCard title="Open Billing Sessions" value={openBillingSessions} icon={Activity} iconColor="violet" index={3} />
        <StatCard title="Today's Revenue" value={formatCurrency(todayRevenue)} icon={TrendingUp} iconColor="primary" index={4} />
        <StatCard title="Active Staff" value={activeStaff} icon={Users} iconColor="orange" index={5} />
      </div>

      {showTableSection && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <Card className={cn('overflow-hidden', cardShell)}>
            <div className="px-5 sm:px-6 py-4 border-b border-surface-200/80 dark:border-surface-700/40 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 font-display">Live Table Status</h2>
                <p className="text-[11px] text-surface-500 mt-0.5">Table QR sessions only. Global QR ordering stays untouched.</p>
              </div>
              <Badge variant="info" size="sm">{tableStatus.totalCount} tables tracked</Badge>
            </div>

            <div className="p-4 sm:p-5 space-y-5">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-surface-200/80 dark:border-surface-700/40 bg-surface-50/80 dark:bg-surface-900/40 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-surface-500">Total Tables</p>
                  <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-surface-100">{tableStatus.totalCount}</p>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-emerald-300/80">Occupied Tables</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-200">{tableStatus.occupiedCount}</p>
                </div>
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-sky-300/80">Free Tables</p>
                  <p className="mt-2 text-2xl font-bold text-sky-200">{tableStatus.freeCount}</p>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-amber-300/80">Tables Waiting For Bill</p>
                  <p className="mt-2 text-2xl font-bold text-amber-200">{tableStatus.waitingCount}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {tableStatus.snapshots.map((table) => {
                  const isOccupied = table.status === 'Occupied'
                  const isWaiting = table.status === 'Waiting Bill'
                  const statusClass = isOccupied
                    ? 'border-emerald-500/20 bg-emerald-500/10'
                    : isWaiting
                      ? 'border-amber-500/20 bg-amber-500/10'
                      : 'border-surface-200/80 bg-surface-50/80 dark:border-surface-700/40 dark:bg-surface-900/40'

                  return (
                    <div key={table.tableNumber} className={cn('rounded-2xl px-4 py-3.5 border transition-colors', statusClass)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">Table {table.tableNumber}</p>
                          <p className="text-xs text-surface-500 mt-0.5">
                            {table.status}
                            {isOccupied || isWaiting ? ` | ${formatCurrency(table.currentTotal)} | ${table.orderCount} Orders` : ''}
                          </p>
                        </div>
                        <Badge
                          variant={isOccupied ? 'success' : isWaiting ? 'warning' : 'gray'}
                          size="sm"
                        >
                          {table.status}
                        </Badge>
                      </div>

                      {(isOccupied || isWaiting) && (
                        <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-surface-500">
                          <span>{table.session?.customerName || 'Guest'}</span>
                          <span>{formatDateTime(table.session?.openedAt || Date.now())}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 lg:gap-7 items-start">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <Card className={cn('overflow-hidden', cardShell)}>
            <div className="px-5 sm:px-6 py-4 border-b border-surface-200/80 dark:border-surface-700/40 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 font-display">Recent Activity Feed</h2>
                <p className="text-[11px] text-surface-500 mt-0.5">Latest operational events from orders and sessions</p>
              </div>
              <Badge variant="gray" size="sm">{activityFeed.length} latest</Badge>
            </div>

            <div className="p-4 sm:p-5 space-y-2 max-h-[640px] overflow-y-auto">
              {activityFeed.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No recent activity"
                  description="Order, session, and billing events will appear here automatically."
                  compact
                />
              ) : (
                activityFeed.map((event) => {
                  const meta = getActivityMeta(event.type)
                  const Icon = meta.icon

                  return (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-surface-200/80 dark:border-surface-700/40 bg-surface-50/80 dark:bg-surface-900/40 px-4 py-3.5 flex items-start gap-3"
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          meta.tone === 'primary' && 'bg-primary-500/10 text-primary-400',
                          meta.tone === 'success' && 'bg-emerald-500/10 text-emerald-400',
                          meta.tone === 'violet' && 'bg-violet-500/10 text-violet-400',
                          meta.tone === 'gray' && 'bg-surface-500/10 text-surface-400',
                          meta.tone === 'warning' && 'bg-amber-500/10 text-amber-400',
                          meta.tone === 'info' && 'bg-sky-500/10 text-sky-400'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{event.title}</p>
                            <p className="text-xs text-surface-500 mt-0.5 truncate">{event.detail}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{formatCurrency(event.amount || 0)}</p>
                            <p className="text-[10px] text-surface-500">{getRelativeTime(event.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card className={cn('overflow-hidden', cardShell)}>
            <div className="px-5 sm:px-6 py-4 border-b border-surface-200/80 dark:border-surface-700/40 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 font-display">Top Selling Items Today</h2>
                <p className="text-[11px] text-surface-500 mt-0.5">Top 5 completed items by quantity and revenue</p>
              </div>
              <Badge variant="success" size="sm">Today</Badge>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              {topSellingItemsToday.length === 0 ? (
                <EmptyState
                  icon={CircleDollarSign}
                  title="No sales data yet"
                  description="Completed orders from today will populate this list."
                  compact
                />
              ) : (
                topSellingItemsToday.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="rounded-2xl border border-surface-200/80 dark:border-surface-700/40 bg-surface-50/80 dark:bg-surface-900/40 px-4 py-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{item.name}</p>
                        <p className="text-xs text-surface-500 mt-0.5">Quantity sold</p>
                      </div>
                      <Badge variant="violet" size="sm">#{index + 1}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-surface-100/80 dark:bg-surface-800/40 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-surface-500">Qty Sold</p>
                        <p className="mt-1 text-sm font-semibold text-surface-900 dark:text-surface-100">{item.quantitySold}</p>
                      </div>
                      <div className="rounded-xl bg-surface-100/80 dark:bg-surface-800/40 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-surface-500">Revenue</p>
                        <p className="mt-1 text-sm font-semibold text-surface-900 dark:text-surface-100">{formatCurrency(item.revenueGenerated)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.95fr] gap-6 lg:gap-7 items-start">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className={cn('overflow-hidden', cardShell)}>
            <div className="px-5 sm:px-6 py-4 border-b border-surface-200/80 dark:border-surface-700/40 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 font-display">Live Orders Overview</h2>
                <p className="text-[11px] text-surface-500 mt-0.5">Read-only view of the floor, driven by the existing Orders workflow</p>
              </div>
              <Badge variant="gray" size="sm">{liveOrders.length} live</Badge>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              {liveOrders.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="No active orders right now"
                  description="Orders will appear here automatically as customers place them."
                  compact
                />
              ) : (
                liveOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-surface-200/80 dark:border-surface-700/40 bg-surface-50/80 dark:bg-surface-900/40 px-4 py-3.5 hover:border-surface-300 dark:hover:border-surface-600/50 transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-sm text-surface-900 dark:text-surface-100 truncate">{order.customerName || 'Guest'}</p>
                          <Badge variant={statusTone[order.status] || 'gray'} size="sm">{order.status}</Badge>
                        </div>
                        <p className="text-xs text-surface-500 flex items-center gap-2 flex-wrap">
                          <span>Order #{(order.id || '').toString().slice(-6).toUpperCase()}</span>
                          <span>|</span>
                          <span>{order.tableNumber || 'No table'}</span>
                          <span>|</span>
                          <span>{formatDateTime(order.createdAt || Date.now())}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-surface-900 dark:text-surface-100">{formatCurrency(order.totalAmount || 0)}</p>
                        <p className="text-[10px] uppercase tracking-wide text-surface-500">Total</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(order.items || []).slice(0, 4).map((item, idx) => (
                        <Badge key={`${order.id}-${idx}`} variant="gray" size="sm">
                          {item.quantity}x {item.name}
                        </Badge>
                      ))}
                      {(order.items || []).length > 4 && (
                        <Badge variant="gray" size="sm">+{order.items.length - 4} more</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Card className={cn('overflow-hidden', cardShell)}>
              <div className="px-5 sm:px-6 py-4 border-b border-surface-200/80 dark:border-surface-700/40 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 font-display">Open Customer Sessions</h2>
                  <p className="text-[11px] text-surface-500 mt-0.5">Sessions currently open in Billing</p>
                </div>
                <Badge variant="warning" size="sm">{openSessions.length} open</Badge>
              </div>

              <div className="p-4 sm:p-5 space-y-3">
                {openSessions.length === 0 ? (
                  <EmptyState
                    icon={Activity}
                    title="No open sessions"
                    description="Open sessions will appear here as soon as a table starts ordering."
                    compact
                  />
                ) : (
                  openSessions.map((session) => (
                    <div
                      key={session.sessionId || session.id}
                      className="rounded-2xl border border-surface-200/80 dark:border-surface-700/40 bg-surface-50/80 dark:bg-surface-900/40 px-4 py-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-sm text-surface-900 dark:text-surface-100 truncate">{session.customerName || 'Guest'}</p>
                            <Badge variant="warning" size="sm">OPEN</Badge>
                          </div>
                          <p className="text-xs text-surface-500 flex items-center gap-2 flex-wrap">
                            <span>Table {session.tableNumber || 'N/A'}</span>
                            <span>|</span>
                            <span>Session {session.sessionCode}</span>
                            <span>|</span>
                            <span>{session.totalOrders || 0} orders</span>
                            <span>|</span>
                            <span>Started {formatDateTime(session.openedAt || Date.now())}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-surface-900 dark:text-surface-100">{formatCurrency(session.currentTotal || session.subtotal || 0)}</p>
                          <p className="text-[10px] uppercase tracking-wide text-surface-500">Running total</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] text-surface-500">
                          Total orders in session: <span className="font-semibold text-surface-900 dark:text-surface-100">{session.totalOrders || 0}</span>
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/owner/billing')}
                          leftIcon={<Receipt className="w-4 h-4" />}
                        >
                          Open Billing
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <Card className={cn('overflow-hidden', cardShell)}>
              <div className="px-5 sm:px-6 py-4 border-b border-surface-200/80 dark:border-surface-700/40 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 font-display">Inventory Alerts</h2>
                  <p className="text-[11px] text-surface-500 mt-0.5">Low-stock and out-of-stock items that need attention</p>
                </div>
                <Badge variant={totalInventoryAlerts > 0 ? 'warning' : 'success'} size="sm">
                  {totalInventoryAlerts > 0 ? `${totalInventoryAlerts} alerts` : 'Clear'}
                </Badge>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-wide text-amber-300/80">Low Stock</p>
                    <p className="mt-1 text-xl font-bold text-amber-200">{lowStockAlerts.length}</p>
                  </div>
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-wide text-red-300/80">Out Of Stock</p>
                    <p className="mt-1 text-xl font-bold text-red-200">{outOfStockAlerts.length}</p>
                  </div>
                  <div className="rounded-2xl border border-surface-200/80 bg-surface-50/80 dark:border-surface-700/40 dark:bg-surface-900/40 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-wide text-surface-500">Total Alerts</p>
                    <p className="mt-1 text-xl font-bold text-surface-900 dark:text-surface-100">{totalInventoryAlerts}</p>
                  </div>
                </div>

                {totalInventoryAlerts === 0 ? (
                  <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-300">
                    No inventory alerts right now.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {outOfStockAlerts.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-300">Out Of Stock Items</p>
                        {outOfStockAlerts.map((item) => (
                          <div
                            key={item._id || item.id}
                            className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 flex items-start justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-surface-100 truncate">{item.name}</p>
                              <p className="text-xs text-surface-400">0 {item.unit || 'units'} left</p>
                            </div>
                            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          </div>
                        ))}
                      </div>
                    )}

                    {lowStockAlerts.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Low Stock Items</p>
                        {lowStockAlerts.map((item) => (
                          <div
                            key={item._id || item.id}
                            className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3.5 flex items-start justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-surface-100 truncate">{item.name}</p>
                              <p className="text-xs text-surface-400">
                                {item.quantity} {item.unit || 'units'} left, min level {item.minLevel}
                              </p>
                            </div>
                            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className={cn('overflow-hidden', cardShell)}>
              <div className="px-5 sm:px-6 py-4 border-b border-surface-200/80 dark:border-surface-700/40">
                <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 font-display">Quick Actions</h2>
                <p className="text-[11px] text-surface-500 mt-0.5">Jump to the source pages that own the workflow</p>
              </div>

              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <QuickAction label="View Orders" description="Go to live order management" onClick={() => navigate('/owner/orders')} />
                <QuickAction label="Open Billing" description="Review and finalize sessions" onClick={() => navigate('/owner/billing')} />
                <QuickAction
                  label="View Inventory"
                  description="Check current stock levels"
                  onClick={() => {
                    if (user?.role !== 'staff' || user?.permissions?.includes('inventory')) {
                      navigate('/owner/inventory')
                      return
                    }
                    toast.success(`Low-stock alerts: ${totalInventoryAlerts}`)
                  }}
                />
                <QuickAction
                  label="Staff Status"
                  description="See active team members"
                  onClick={() => {
                    if (user?.role !== 'staff' || user?.permissions?.includes('staff')) {
                      navigate('/owner/staff')
                      return
                    }
                    toast.success(`Active staff: ${activeStaff}`)
                  }}
                />
                <QuickAction
                  label="View Tables"
                  description="Jump to the QR table view"
                  onClick={() => navigate('/owner/qr')}
                />
                <QuickAction
                  label="Open Sessions"
                  description="Review live customer sessions"
                  onClick={() => navigate('/owner/billing')}
                />
                <QuickAction
                  label="Revenue Summary"
                  description="Open the analytics overview"
                  onClick={() => navigate('/owner/analytics')}
                />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

const QuickAction = ({ label, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group rounded-2xl border border-surface-200/80 dark:border-surface-700/40 bg-surface-50/80 dark:bg-surface-900/40 px-4 py-3 text-left hover:border-primary-500/25 hover:bg-primary-500/5 transition-all"
  >
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{label}</p>
        <p className="text-xs text-surface-500 mt-0.5">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-surface-500 group-hover:text-primary-400 transition-colors flex-shrink-0" />
    </div>
  </button>
)

export default ManagerControl
