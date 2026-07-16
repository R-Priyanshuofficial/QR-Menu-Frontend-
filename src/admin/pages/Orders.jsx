import { Component, useCallback, useEffect, useMemo, useState } from 'react'
import { ShoppingBag, RefreshCw, AlertTriangle, Search, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { OrderCard } from '../components/order-card/OrderCard'
import { OrderDetailDrawer } from '../components/OrderDetailDrawer'
import { EmptyState } from '@shared/components/EmptyState'
import { ordersAPI } from '@shared/api/endpoints'
import { useSocket } from '@shared/contexts/SocketContext'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@shared/utils/cn'

const normalizeOrders = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

/* ───────── Skeleton ───────── */

const CardSkel = () => (
  <div className="rounded-xl bg-[#1a1f2e] border border-white/[0.04] overflow-hidden animate-pulse">
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#252d42]" />
        <div className="h-4 w-20 rounded bg-[#252d42]" />
        <div className="ml-auto h-5 w-16 rounded bg-[#252d42]" />
      </div>
      <div className="h-3 w-28 rounded bg-[#1e2538]" />
      <div className="h-3 w-36 rounded bg-[#1e2538]" />
    </div>
    <div className="bg-[#141824] px-4 py-3 space-y-2">
      <div className="h-3 w-full rounded bg-[#1e2538]" />
      <div className="h-3 w-full rounded bg-[#1e2538]" />
      <div className="h-3 w-full rounded bg-[#1e2538]" />
    </div>
    <div className="p-4 flex justify-between items-center">
      <div className="h-5 w-16 rounded bg-[#1e2538]" />
      <div className="h-4 w-20 rounded bg-[#1e2538]" />
    </div>
  </div>
)

const OrdersSkeleton = () => (
  <div className="space-y-5">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <div className="space-y-1.5">
        <div className="h-7 w-32 rounded bg-[#1e2538] animate-pulse" />
        <div className="h-4 w-56 rounded bg-[#1a1f2e] animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-48 rounded-lg bg-[#1a1f2e] animate-pulse" />
        <div className="h-9 w-16 rounded-lg bg-[#1a1f2e] animate-pulse" />
      </div>
    </div>
    {/* Tabs skeleton */}
    <div className="flex gap-2">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-8 w-28 rounded-full bg-[#1a1f2e] animate-pulse" />)}
    </div>
    {/* Grid skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => <CardSkel key={i} />)}
    </div>
  </div>
)

/* ───────── Error Boundary ───────── */

class OrdersErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, info) { console.error('Orders page crashed:', error, info) }
  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    this.props.onRetry?.()
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Unable to load orders</h2>
              <p className="text-sm text-slate-400 mt-1">The Orders page ran into a rendering error.</p>
              <button
                onClick={this.handleRetry}
                className="mt-3 inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/* ───────── Status Tab Button ───────── */

const statusTabConfig = {
  all:       { label: 'All Orders' },
  pending:   { label: 'Pending' },
  ready:     { label: 'Ready' },
  completed: { label: 'Completed' },
}

/* ───────── Motion presets (module scope = stable refs, no re-renders) ───────── */

const EASE = [0.16, 1, 0.3, 1]

const StatusTab = ({ tabKey, label, count, isActive, onClick }) => (
  <button
    onClick={() => onClick(tabKey)}
    className={cn(
      'inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-[13px] font-semibold transition-all duration-200 whitespace-nowrap',
      isActive
        ? 'bg-red-500 text-white shadow-[0_2px_8px_rgba(239,68,68,0.3)]'
        : 'bg-[#1e2538] text-slate-300 hover:bg-[#252d42] hover:text-white'
    )}
    aria-pressed={isActive}
  >
    {label}
    {typeof count === 'number' && (
      <span className={cn(
        'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded text-[11px] font-bold',
        isActive
          ? 'bg-white/20 text-white'
          : 'bg-[#141824] text-slate-400'
      )}>
        {count}
      </span>
    )}
  </button>
)

/* ───────── Pagination ───────── */

const Pagination = ({ currentPage, totalPages, totalItems, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-slate-400">
        Showing {startItem} to {endItem} of {totalItems} orders
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#1e2538] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-red-500 text-white'
                : 'text-slate-400 hover:bg-[#1e2538]'
            )}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#1e2538] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/* ───────── Main Content ───────── */

const ITEMS_PER_PAGE = 8

const OrdersContent = () => {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [error, setError] = useState(null)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const { socket, connected } = useSocket()

  // Fetch all orders (we filter client-side for tab counts)
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ordersAPI.getOwnerOrders(filter === 'all' ? undefined : filter)
      setOrders(normalizeOrders(response?.data))
    } catch (fetchError) {
      console.error('Failed to load orders:', fetchError)
      setOrders([])
      setError('Unable to load orders')
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    let isActive = true
    const load = async () => { if (isActive) await fetchOrders() }
    load()
    return () => { isActive = false }
  }, [fetchOrders])

  useEffect(() => {
    if (!socket || !connected) return
    const handleNotification = (notification) => {
      if (notification?.type === 'new_order') fetchOrders()
    }
    socket.on('notification', handleNotification)
    return () => { socket.off('notification', handleNotification) }
  }, [socket, connected, fetchOrders])

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchInput), 300)
    return () => clearTimeout(handler)
  }, [searchInput])

  // Reset page on filter/search change
  useEffect(() => { setCurrentPage(1) }, [filter, debouncedQuery])

  // Actions
  const handleMarkReady = async (orderId) => {
    try {
      await ordersAPI.markOrderReady(orderId)
      toast.success('Order marked ready')
      fetchOrders()
    } catch { toast.error('Failed to update order') }
  }

  const handleMarkCompleted = async (orderId) => {
    try {
      await ordersAPI.markOrderCompleted(orderId)
      toast.success('Order completed')
      fetchOrders()
      if (selectedOrderId === orderId) setSelectedOrderId(null)
    } catch { toast.error('Failed to update order') }
  }

  const safeOrders = useMemo(() => normalizeOrders(orders), [orders])

  // Filtered + searched orders
  const filteredOrders = useMemo(() => {
    let source = Array.isArray(safeOrders) ? safeOrders : []

    // Search
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase()
      source = source.filter((order) => (
        String(order?.id || '').toLowerCase().includes(q)
        || String(order?.customerName || '').toLowerCase().includes(q)
        || String(order?.tableNumber || '').toLowerCase().includes(q)
        || String(order?.customerPhone || '').toLowerCase().includes(q)
      ))
    }

    // Sort
    if (sortBy === 'newest') {
      source = [...source].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (sortBy === 'oldest') {
      source = [...source].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    } else if (sortBy === 'highest') {
      source = [...source].sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
    }

    return source
  }, [safeOrders, debouncedQuery, sortBy])

  // Tab counts
  const tabCounts = useMemo(() => {
    const source = Array.isArray(safeOrders) ? safeOrders : []
    return {
      all: source.length,
      pending: source.filter(o => o?.status === 'pending').length,
      ready: source.filter(o => o?.status === 'ready').length,
      completed: source.filter(o => o?.status === 'completed').length,
    }
  }, [safeOrders])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE))
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredOrders, currentPage])

  const selectedOrder = useMemo(() => {
    return safeOrders.find(o => o.id === selectedOrderId) || null
  }, [safeOrders, selectedOrderId])

  // Only show the full skeleton on the very first load (no data yet).
  // On refetches (tab switch / status action / socket) keep the grid visible
  // (stale-while-revalidate) so the cards swap smoothly via popLayout.
  if (loading && orders.length === 0) return <OrdersSkeleton />

  if (error) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-sm text-slate-400 mt-1">Manage and track all customer orders</p>
        </div>
        <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Unable to load orders</h2>
              <p className="text-sm text-slate-400 mt-1">We couldn't fetch the latest orders. Please try again.</p>
              <button
                onClick={fetchOrders}
                className="mt-3 inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-5">
        {/* ─── Page Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Orders</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage and track all customer orders</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search orders..."
                className={cn(
                  'w-52 h-9 pl-9 pr-10 rounded-lg text-sm',
                  'bg-[#1a1f2e] border border-white/[0.06] text-white placeholder:text-slate-500',
                  'focus:outline-none focus:border-white/[0.12] focus:ring-1 focus:ring-white/[0.08]',
                  'transition-colors duration-200',
                )}
              />
              {searchInput && (
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 bg-[#141824] px-1.5 py-0.5 rounded border border-white/[0.06]">
                  ⌘K
                </kbd>
              )}
              {!searchInput && (
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 bg-[#141824] px-1.5 py-0.5 rounded border border-white/[0.06]">
                  ⌘K
                </kbd>
              )}
            </div>

            {/* Filter button */}
            <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#1a1f2e] border border-white/[0.06] text-sm text-slate-300 hover:bg-[#1e2538] transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filter</span>
            </button>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#1a1f2e] border border-white/[0.06] text-sm text-slate-300 hover:bg-[#1e2538] transition-colors"
              >
                <span>{sortBy === 'newest' ? 'Newest First' : sortBy === 'oldest' ? 'Oldest First' : 'Highest Amount'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showSortDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowSortDropdown(false)} />
                  <div className="absolute right-0 mt-1 z-40 w-44 rounded-lg bg-[#1a1f2e] border border-white/[0.06] shadow-xl py-1">
                    {[
                      { value: 'newest', label: 'Newest First' },
                      { value: 'oldest', label: 'Oldest First' },
                      { value: 'highest', label: 'Highest Amount' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setShowSortDropdown(false) }}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm transition-colors',
                          sortBy === opt.value ? 'text-white bg-white/[0.06]' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ─── Status Tabs ─── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 thin-scrollbar">
          {Object.entries(statusTabConfig).map(([key, cfg]) => (
            <StatusTab
              key={key}
              tabKey={key}
              label={cfg.label}
              count={tabCounts[key]}
              isActive={filter === key}
              onClick={setFilter}
            />
          ))}
        </div>

        {/* ─── Orders Grid / Empty State (crossfade between the two) ─── */}
        <AnimatePresence mode="wait">
          {paginatedOrders.length > 0 ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: loading ? 0.5 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
              className={cn(
                'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch transition-opacity duration-200',
                loading && 'pointer-events-none',
              )}
            >
              <AnimatePresence mode="popLayout">
                {paginatedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onClick={setSelectedOrderId}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: EASE }}
            >
              <EmptyState
                icon={ShoppingBag}
                title={debouncedQuery ? 'No matching orders' : filter === 'all' ? 'No orders yet' : `No ${statusTabConfig[filter]?.label ?? filter} orders`}
                description={
                  debouncedQuery
                    ? 'Try adjusting your search query'
                    : filter === 'pending'
                      ? 'New orders will appear here when customers place them'
                      : filter === 'all'
                        ? 'Orders will appear here once customers start placing them'
                        : `No orders with this status right now`
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Pagination ─── */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredOrders.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ─── Detail Drawer ─── */}
      <OrderDetailDrawer
        order={selectedOrder}
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onMarkReady={handleMarkReady}
        onMarkCompleted={handleMarkCompleted}
      />
    </>
  )
}

export const Orders = () => {
  const [resetKey, setResetKey] = useState(0)
  return (
    <OrdersErrorBoundary key={resetKey} onRetry={() => setResetKey(key => key + 1)}>
      <OrdersContent />
    </OrdersErrorBoundary>
  )
}
