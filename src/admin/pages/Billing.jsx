import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt, Printer, User, Phone, DollarSign, Download, Clock,
  ShoppingBag, ChevronDown, ChevronUp, Layers, FileText, CheckCircle2
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Card } from '@shared/components/Card'
import { Button } from '@shared/components/Button'
import { PageLoader } from '@shared/components/Spinner'
import { StatCard } from '@shared/components/StatCard'
import { PageHeader } from '@shared/components/PageHeader'
import { EmptyState } from '@shared/components/EmptyState'
import { Tabs } from '@shared/components/Tabs'
import { SearchInput } from '@shared/components/SearchInput'
import { Badge } from '@shared/components/Badge'
import { formatCurrency } from '@shared/utils/formatters'
import { calculateGST, getRestaurantInfo } from '@shared/utils/gstHelper'
import { printBill } from '@shared/utils/printerService'
import { sessionsAPI } from '@shared/api/endpoints'
import toast from 'react-hot-toast'

const DATE_TABS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
]

const currencyFromTotal = (value) => formatCurrency(Number(value) || 0)

const buildPrintableSessionBill = (bill) => {
  const restaurantInfo = getRestaurantInfo()
  const gst = calculateGST(bill.subtotal || 0)
  const grandTotal = bill.status === 'CLOSED'
    ? (bill.finalAmount || bill.subtotal + gst.total)
    : (bill.subtotal || 0) + gst.total

  return {
    id: bill.sessionId || bill.id,
    sessionId: bill.sessionId || bill.id,
    sessionCode: bill.sessionCode,
    customerName: bill.customerName,
    customerPhone: bill.customerPhone,
    tableNumber: bill.tableNumber,
    orders: bill.orders,
    subtotal: bill.subtotal || 0,
    gst,
    totalAmount: grandTotal,
    currentTotal: bill.currentTotal || bill.subtotal || 0,
    finalAmount: bill.finalAmount || grandTotal,
    finalBillNumber: bill.finalBillNumber,
    generatedAt: bill.generatedAt || bill.closedAt,
    lastOrderDate: bill.lastOrderDate || bill.openedAt,
    itemCount: bill.totalItems || 0,
    restaurantName: restaurantInfo.name,
    restaurantInfo,
  }
}

const exportBillPDF = (bill) => {
  const doc = new jsPDF()
  const restaurantInfo = getRestaurantInfo()
  const gst = calculateGST(bill.subtotal || 0)
  const grandTotal = bill.status === 'CLOSED'
    ? (bill.finalAmount || bill.subtotal + gst.total)
    : (bill.subtotal || 0) + gst.total

  doc.setFillColor(79, 70, 229)
  doc.rect(0, 0, 210, 38, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(restaurantInfo.name || 'QR Menu Restaurant', 15, 18)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Session Bill', 15, 28)
  doc.setFontSize(10)
  doc.text(`Session: ${bill.sessionCode}`, 150, 18)
  doc.text(`Status: ${bill.status}`, 150, 28)

  doc.setTextColor(0, 0, 0)
  let y = 50
  doc.setFontSize(11)
  doc.text(`Customer: ${bill.customerName || 'Guest'}`, 15, y)
  doc.text(`Phone: ${bill.customerPhone || 'N/A'}`, 110, y)
  y += 7
  doc.text(`Session Start: ${new Date(bill.openedAt || new Date()).toLocaleString()}`, 15, y)
  doc.text(`Generated: ${bill.generatedAt ? new Date(bill.generatedAt).toLocaleString() : 'Pending'}`, 110, y)
  y += 7
  doc.text(`Orders: ${bill.totalOrders || 0}`, 15, y)
  doc.text(`Items: ${bill.totalItems || 0}`, 110, y)
  y += 10

  const rows = []
  ;(bill.orders || []).forEach((order, orderIndex) => {
    rows.push([`Order #${orderIndex + 1}`, '', '', ''])
    ;(order.items || []).forEach(item => {
      rows.push([
        `  ${item.name}${item.variant?.name ? ` (${item.variant.name})` : ''}`,
        `${item.quantity}`,
        formatCurrency(item.price || 0),
        formatCurrency((item.price || 0) * (item.quantity || 0))
      ])
    })
  })

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Qty', 'Rate', 'Amount']],
    body: rows.length > 0 ? rows : [['No completed orders yet', '', '', '']],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
    margin: { left: 15, right: 15 }
  })

  const finalY = doc.lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.text(`Subtotal: ${formatCurrency(bill.subtotal || 0)}`, 135, finalY)
  doc.text(`GST: ${formatCurrency(gst.total)}`, 135, finalY + 7)
  doc.setFont('helvetica', 'bold')
  doc.text(`Grand Total: ${formatCurrency(grandTotal)}`, 135, finalY + 15)
  doc.setFont('helvetica', 'normal')

  doc.save(`Session_Bill_${bill.sessionCode}_${Date.now()}.pdf`)
}

export const Billing = () => {
  const [loading, setLoading] = useState(true)
  const [bills, setBills] = useState([])
  const [filteredBills, setFilteredBills] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('today')
  const [closingSessionId, setClosingSessionId] = useState(null)

  useEffect(() => {
    fetchBills()
  }, [dateFilter])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBills(bills)
      return
    }
    const q = searchTerm.toLowerCase()
    setFilteredBills(
      bills.filter(bill =>
        bill.customerName?.toLowerCase().includes(q) ||
        bill.customerPhone?.includes(searchTerm) ||
        bill.sessionCode?.toLowerCase().includes(q)
      )
    )
  }, [searchTerm, bills])

  const fetchBills = async () => {
    try {
      setLoading(true)
      const response = await sessionsAPI.getBillingSessions({ period: dateFilter, status: 'all' })
      const sessionBills = response?.data?.bills || response?.data?.data?.bills || []
      setBills(sessionBills)
      setFilteredBills(sessionBills)
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again to load billing data.')
      } else {
        toast.error(error.response?.data?.message || 'Failed to load billing data')
      }
      setBills([])
      setFilteredBills([])
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async (bill) => {
    try {
      await printBill(buildPrintableSessionBill(bill))
      toast.success('Receipt sent to printer')
    } catch (error) {
      toast.error('Failed to print bill')
    }
  }

  const handleDownload = (bill) => {
    try {
      exportBillPDF(bill)
      toast.success('PDF downloaded')
    } catch (error) {
      toast.error('Failed to download PDF')
    }
  }

  const handleGenerateFinalBill = async (bill) => {
    try {
      const sessionKey = bill.sessionId || bill.id
      setClosingSessionId(sessionKey)
      const gst = calculateGST(bill.subtotal || 0)
      const finalAmount = bill.subtotal + gst.total
      const response = await sessionsAPI.finalizeSession(sessionKey, bill.sessionId
        ? {
            finalAmount,
            finalBillNumber: `BILL-${(bill.sessionCode || 'SESSION').replace(/[^A-Z0-9-]/g, '')}`,
          }
        : {
            finalAmount,
            finalBillNumber: `BILL-${(bill.sessionCode || 'LEGACY').replace(/[^A-Z0-9-]/g, '')}`,
            legacyBill: {
              id: bill.id,
              sessionCode: bill.sessionCode,
              customerId: bill.customerId,
              customerName: bill.customerName,
              customerPhone: bill.customerPhone,
              qrToken: bill.qrToken,
              tableNumber: bill.tableNumber,
              openedAt: bill.openedAt,
              orders: bill.orders || [],
            },
          })
      const updated = response.data?.data?.session
      toast.success('Final bill generated')
      setBills(prev => prev.map(existing => {
        const key = existing.sessionId || existing.id
        if (key !== sessionKey) return existing
        return updated || {
          ...existing,
          status: 'CLOSED',
          closedAt: new Date().toISOString(),
          generatedAt: new Date().toISOString(),
          finalAmount,
          currentTotal: finalAmount,
          finalOrderCount: existing.totalOrders,
          finalItemCount: existing.totalItems,
        }
      }))
      setFilteredBills(prev => prev.map(existing => {
        const key = existing.sessionId || existing.id
        if (key !== sessionKey) return existing
        return updated || {
          ...existing,
          status: 'CLOSED',
          closedAt: new Date().toISOString(),
          generatedAt: new Date().toISOString(),
          finalAmount,
          currentTotal: finalAmount,
          finalOrderCount: existing.totalOrders,
          finalItemCount: existing.totalItems,
        }
      }))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate final bill')
    } finally {
      setClosingSessionId(null)
    }
  }

  const totalRevenue = useMemo(() => {
    return filteredBills.reduce((sum, bill) => {
      const gst = calculateGST(bill.subtotal || 0)
      return sum + (bill.status === 'CLOSED' ? (bill.finalAmount || bill.subtotal + gst.total) : (bill.subtotal + gst.total))
    }, 0)
  }, [filteredBills])

  const avgBillValue = filteredBills.length > 0 ? totalRevenue / filteredBills.length : 0
  const closedCount = filteredBills.filter(bill => bill.status === 'CLOSED').length
  const openCount = filteredBills.filter(bill => bill.status === 'OPEN').length

  if (loading) return <PageLoader message="Loading billing data..." />

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Billing & Sessions"
        subtitle="Manage one bill per customer session and close bills when ready"
        icon={Receipt}
        actions={<Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={fetchBills}>Refresh</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Sessions" value={filteredBills.length} icon={Receipt} iconColor="sky" index={0} />
        <StatCard title="Total Revenue" value={currencyFromTotal(totalRevenue)} icon={DollarSign} iconColor="emerald" index={1} trend="up" />
        <StatCard title="Open Sessions" value={openCount} icon={ShoppingBag} iconColor="violet" index={2} />
        <StatCard title="Closed Bills" value={closedCount} icon={CheckCircle2} iconColor="amber" index={3} />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <div className="p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClear={() => setSearchTerm('')} placeholder="Search by name, phone, or session..." className="flex-1" />
            <Tabs tabs={DATE_TABS} activeTab={dateFilter} onChange={setDateFilter} variant="pills" />
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        {filteredBills.length === 0 ? (
          <EmptyState icon={Receipt} title="No Bills Found" description={searchTerm ? 'Try adjusting your search terms' : 'Bills will appear when sessions have completed orders'} />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredBills.map((bill, index) => (
                <SessionBillCard
                  key={bill.sessionId || bill.id}
                  bill={bill}
                  index={index}
                  onPrint={handlePrint}
                  onDownload={handleDownload}
                  onGenerate={handleGenerateFinalBill}
                  closingSessionId={closingSessionId}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}

const SessionBillCard = ({ bill, index, onPrint, onDownload, onGenerate, closingSessionId }) => {
  const [expanded, setExpanded] = useState(false)
  const gst = calculateGST(bill.subtotal || 0)
  const grandTotal = bill.status === 'CLOSED'
    ? (bill.finalAmount || bill.subtotal + gst.total)
    : (bill.subtotal || 0) + gst.total
  const isClosing = closingSessionId === (bill.sessionId || bill.id)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.03 }}>
      <Card className="overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-sky-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 truncate">{bill.customerName || 'Guest'}</h3>
                    <Badge variant={bill.status === 'CLOSED' ? 'success' : 'warning'} size="sm">{bill.status === 'CLOSED' ? 'Closed' : 'Open'}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-surface-500 flex-wrap">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{bill.customerPhone || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" />Session {bill.sessionCode}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(bill.openedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap justify-end">
                <Badge variant="info" size="sm">{bill.totalOrders} {bill.totalOrders === 1 ? 'order' : 'orders'}</Badge>
                <Badge variant="gray" size="sm">{bill.totalItems} items</Badge>
              </div>
              {bill.status === 'CLOSED' && bill.generatedAt && (
                <p className="text-[10px] text-surface-500">Generated: {new Date(bill.generatedAt).toLocaleString()}</p>
              )}
              {bill.status === 'CLOSED' && (
                <p className="text-[10px] text-surface-500">Final Amount</p>
              )}
              <p className="text-xl font-bold text-emerald-400">{currencyFromTotal(grandTotal)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {bill.status === 'OPEN' && (
              <Button
                variant="gradient"
                size="sm"
                className="flex-1 min-w-[160px]"
                loading={isClosing}
                leftIcon={<FileText className="w-4 h-4" />}
                onClick={() => onGenerate(bill)}
              >
                Generate Final Bill
              </Button>
            )}
            <Button variant="outline" size="sm" className="flex-1 min-w-[140px]" leftIcon={<Printer className="w-4 h-4" />} onClick={() => onPrint(bill)}>Print Receipt</Button>
            <Button variant="outline" size="sm" className="flex-1 min-w-[140px]" leftIcon={<Download className="w-4 h-4" />} onClick={() => onDownload(bill)}>Download PDF</Button>
          </div>

          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors mb-3">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide' : 'View'} Orders ({bill.orders?.length || 0})
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="space-y-3 mb-4">
                  {(bill.orders || []).map((order, idx) => (
                    <div key={order.id || idx} className="rounded-xl border border-surface-200/70 dark:border-surface-700/40 bg-surface-50/70 dark:bg-surface-800/30 p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-sm text-surface-900 dark:text-surface-100">Order #{(order.id || '').toString().slice(-6).toUpperCase()}</p>
                          <p className="text-xs text-surface-500">{new Date(order.completedAt || order.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-surface-900 dark:text-surface-100">{currencyFromTotal(order.totalAmount)}</p>
                          <p className="text-[10px] uppercase tracking-wide text-surface-500">Order total</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {(order.items || []).map((item, itemIdx) => (
                          <div key={`${order.id || idx}-${itemIdx}`} className="flex items-center justify-between text-sm">
                            <div className="min-w-0">
                              <p className="font-medium text-surface-900 dark:text-surface-200 truncate">{item.name}</p>
                              <p className="text-xs text-surface-500">
                                {item.quantity} × {currencyFromTotal(item.price)}
                                {item.variant?.name ? ` • ${item.variant.name}` : ''}
                              </p>
                            </div>
                            <p className="font-semibold text-surface-900 dark:text-surface-200">{currencyFromTotal((item.price || 0) * (item.quantity || 0))}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-3 p-4 rounded-2xl bg-gradient-to-br from-sky-500/10 via-cyan-500/10 to-emerald-500/10 border border-sky-500/15">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">Bill Summary</p>
                      <p className="text-xs text-surface-500">Live session calculation with GST included</p>
                    </div>
                    <Badge variant={bill.status === 'CLOSED' ? 'success' : 'warning'} size="sm">
                      {bill.status === 'CLOSED' ? 'Closed' : 'Open'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-surface-0/70 dark:bg-surface-900/30 px-3 py-2 border border-surface-200/60 dark:border-surface-700/40">
                      <p className="text-[10px] uppercase tracking-wide text-surface-500 mb-1">Subtotal</p>
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{currencyFromTotal(bill.subtotal || 0)}</p>
                    </div>
                    <div className="rounded-xl bg-surface-0/70 dark:bg-surface-900/30 px-3 py-2 border border-surface-200/60 dark:border-surface-700/40">
                      <p className="text-[10px] uppercase tracking-wide text-surface-500 mb-1">GST</p>
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{currencyFromTotal(gst.total)}</p>
                    </div>
                    <div className="rounded-xl bg-surface-900 text-white px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-white/70 mb-1">Grand Total</p>
                      <p className="text-sm font-semibold">{currencyFromTotal(grandTotal)}</p>
                    </div>
                  </div>
                </div>

                {bill.status === 'CLOSED' && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    This session is locked and will not accept more orders.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  )
}
