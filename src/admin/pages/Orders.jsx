import { useState, useEffect } from 'react'
import { Bell, Wifi, WifiOff, Search, Filter } from 'lucide-react'
import { OrderCard } from '../components/OrderCard'
import { PageLoader } from '@shared/components/Spinner'
import { ConfirmModal } from '@shared/components/Modal'
import { PageHeader } from '@shared/components/PageHeader'
import { EmptyState } from '@shared/components/EmptyState'
import { Badge } from '@shared/components/Badge'
import { Tabs } from '@shared/components/Tabs'
import { SearchInput } from '@shared/components/SearchInput'
import { ordersAPI } from '@shared/api/endpoints'
import { useSocket } from '@shared/contexts/SocketContext'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { Card, CardContent } from '@shared/components/Card'

export const Orders = () => {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, orderId: null, action: null })
  const { socket, connected } = useSocket()

  useEffect(() => {
    fetchOrders()
  }, [filter])

  useEffect(() => {
    if (socket && connected) {
      const handleNotification = (notification) => {
        if (notification.type === 'new_order') {
          fetchOrders()
        }
      }

      socket.on('notification', handleNotification)

      return () => {
        socket.off('notification', handleNotification)
      }
    }
  }, [socket, connected])

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getOwnerOrders(filter)
      setOrders(response.data)
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkReady = (orderId) => {
    setConfirmModal({ isOpen: true, orderId, action: 'ready' })
  }

  const handleMarkCompleted = (orderId) => {
    setConfirmModal({ isOpen: true, orderId, action: 'completed' })
  }

  const confirmAction = async () => {
    const { orderId, action } = confirmModal
    try {
      if (action === 'ready') {
        await ordersAPI.markOrderReady(orderId)
        toast.success('Order marked as ready! Customer notified.')
      } else if (action === 'completed') {
        await ordersAPI.markOrderCompleted(orderId)
        toast.success('Order completed! Added to billing.', {
          duration: 4000,
          icon: '🧾'
        })
      }
      fetchOrders()
    } catch (error) {
      toast.error('Failed to update order')
    } finally {
      setConfirmModal({ isOpen: false, orderId: null, action: null })
    }
  }

  if (loading) return <PageLoader message="Loading orders..." />

  // Filter orders by search query
  const filteredOrders = orders.filter(order => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      order.id?.toLowerCase().includes(q) ||
      order.customerName?.toLowerCase().includes(q) ||
      order.tableNumber?.toString().includes(q)
    )
  })

  const filterTabs = [
    { value: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
    { value: 'ready', label: 'Ready', count: orders.filter(o => o.status === 'ready').length },
    { value: 'completed', label: 'Completed', count: orders.filter(o => o.status === 'completed').length },
  ]

  return (
    <div className="space-y-6 lg:space-y-7">
      {/* Header */}
      <PageHeader
        title="Orders"
        subtitle="Manage incoming orders in real-time"
        icon={ShoppingBag}
        actions={
          <Badge variant={connected ? 'success' : 'gray'} dot pulse={connected}>
            {connected ? 'Live' : 'Connecting...'}
          </Badge>
        }
      />

      {/* Filters Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Tabs
              tabs={filterTabs}
              activeTab={filter}
              onChange={setFilter}
              variant="pills"
            />
            <div className="sm:ml-auto w-full sm:w-72">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Search orders..."
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Orders Grid */}
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onMarkReady={handleMarkReady}
                onMarkCompleted={handleMarkCompleted}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title={searchQuery ? 'No matching orders' : `No ${filter} orders`}
          description={
            searchQuery
              ? 'Try adjusting your search query'
              : filter === 'pending'
                ? 'New orders will appear here when customers place them'
                : `No orders with ${filter} status`
          }
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, orderId: null, action: null })}
        onConfirm={confirmAction}
        title={confirmModal.action === 'ready' ? 'Mark Order Ready?' : 'Mark Order Completed?'}
        message={
          confirmModal.action === 'ready'
            ? 'The customer will be notified that their order is ready for pickup.'
            : 'This will move the order to completed status.'
        }
        confirmText="Confirm"
      />
    </div>
  )
}
