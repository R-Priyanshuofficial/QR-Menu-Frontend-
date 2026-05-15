import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, Printer, Calendar, User, Phone, DollarSign, Download, Clock,
  ShoppingBag, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Card } from '@shared/components/Card';
import { Button } from '@shared/components/Button';
import { PageLoader } from '@shared/components/Spinner';
import { StatCard } from '@shared/components/StatCard';
import { PageHeader } from '@shared/components/PageHeader';
import { EmptyState } from '@shared/components/EmptyState';
import { Tabs } from '@shared/components/Tabs';
import { SearchInput } from '@shared/components/SearchInput';
import { Badge } from '@shared/components/Badge';
import { formatCurrency } from '@shared/utils/formatters';
import { calculateGST } from '@shared/utils/gstHelper';
import { printBill, getPrinterSettings } from '@shared/utils/printerService';
import { ordersAPI } from '@shared/api/endpoints';
import toast from 'react-hot-toast';

export const Billing = () => {
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');

  useEffect(() => { fetchBills(); }, [dateFilter]);
  useEffect(() => { filterBills(); }, [searchTerm, bills]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getOwnerOrders('completed');
      const completedOrders = response.data;
      const filteredByDate = filterByDate(completedOrders);
      const groupedBills = groupOrdersByCustomer(filteredByDate);
      setBills(groupedBills);
      setFilteredBills(groupedBills);
    } catch (error) {
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = (orders) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (dateFilter) {
      case 'today': return orders.filter(order => new Date(order.createdAt) >= today);
      case 'week': { const d = new Date(today); d.setDate(d.getDate() - 7); return orders.filter(order => new Date(order.createdAt) >= d); }
      case 'month': { const d = new Date(today); d.setMonth(d.getMonth() - 1); return orders.filter(order => new Date(order.createdAt) >= d); }
      default: return orders;
    }
  };

  const groupOrdersByCustomer = (orders) => {
    const grouped = {};
    orders.forEach(order => {
      const key = `${order.customerName}_${order.customerPhone}`;
      if (!grouped[key]) {
        grouped[key] = { id: key, customerName: order.customerName, customerPhone: order.customerPhone, orders: [], subtotal: 0, itemCount: 0, firstOrderDate: order.createdAt, lastOrderDate: order.createdAt };
      }
      grouped[key].orders.push(order);
      grouped[key].subtotal += order.totalAmount;
      grouped[key].itemCount += order.items.reduce((sum, item) => sum + item.quantity, 0);
      if (new Date(order.createdAt) < new Date(grouped[key].firstOrderDate)) grouped[key].firstOrderDate = order.createdAt;
      if (new Date(order.createdAt) > new Date(grouped[key].lastOrderDate)) grouped[key].lastOrderDate = order.createdAt;
    });
    return Object.values(grouped).map(bill => {
      const gst = calculateGST(bill.subtotal);
      return { ...bill, gst, totalAmount: bill.subtotal + gst.total };
    }).sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate));
  };

  const filterBills = () => {
    if (!searchTerm.trim()) { setFilteredBills(bills); return; }
    setFilteredBills(bills.filter(bill =>
      bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || bill.customerPhone.includes(searchTerm)
    ));
  };

  const handlePrint = async (bill) => {
    try {
      const result = await printBill(bill);
      if (result.success) {
        const printerSettings = getPrinterSettings();
        if (printerSettings.mode === 'direct') toast.success('Bill sent to thermal printer!', { icon: '🖨️' });
      }
    } catch (error) { toast.error('Failed to print bill'); }
  };

  if (loading) return <PageLoader message="Loading billing data..." />;

  const dateTabs = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' },
  ];

  const totalRevenue = filteredBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const avgBillValue = filteredBills.length > 0 ? totalRevenue / filteredBills.length : 0;

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader title="Billing & Receipts" subtitle="Manage customer bills and generate receipts" icon={Receipt}
        actions={<Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={fetchBills}>Export All</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Bills" value={filteredBills.length} icon={Receipt} iconColor="sky" index={0} />
        <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} iconColor="emerald" index={1} trend="up" />
        <StatCard title="Customers" value={filteredBills.length} icon={User} iconColor="violet" index={2} />
        <StatCard title="Avg. Bill" value={formatCurrency(avgBillValue)} icon={ShoppingBag} iconColor="amber" index={3} />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <div className="p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClear={() => setSearchTerm('')} placeholder="Search by name or phone..." className="flex-1" />
            <Tabs tabs={dateTabs} activeTab={dateFilter} onChange={setDateFilter} variant="pills" />
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        {filteredBills.length === 0 ? (
          <EmptyState icon={Receipt} title="No Bills Found" description={searchTerm ? 'Try adjusting your search terms' : 'Bills will appear here when orders are completed'} />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredBills.map((bill, index) => (
                <BillCard key={bill.id} bill={bill} index={index} onPrint={handlePrint} onDownload={handlePrint} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const BillCard = ({ bill, index, onPrint, onDownload }) => {
  const [expanded, setExpanded] = useState(false);
  const allItems = bill.orders.flatMap(order => order.items);

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
                  <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 truncate">{bill.customerName}</h3>
                  <div className="flex items-center gap-3 text-xs text-surface-500">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{bill.customerPhone}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(bill.lastOrderDate).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="info" size="sm">{bill.orders.length} {bill.orders.length === 1 ? 'order' : 'orders'}</Badge>
                <Badge variant="gray" size="sm">{bill.itemCount} items</Badge>
              </div>
              {bill.gst.enabled && <p className="text-[10px] text-surface-500">+GST ({bill.gst.totalRate}%): {formatCurrency(bill.gst.total)}</p>}
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(bill.totalAmount)}</p>
            </div>
          </div>

          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors mb-3">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide' : 'Show'} Items ({allItems.length})
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                {bill.gst.enabled && bill.gst.showBreakdown && (
                  <div className="mb-3 p-3 rounded-lg bg-sky-500/10 border border-sky-500/15">
                    <p className="text-xs font-semibold text-surface-900 dark:text-surface-200 mb-2">GST Breakdown</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between"><span className="text-surface-500">CGST ({bill.gst.cgstRate}%):</span><span className="font-medium text-surface-900 dark:text-surface-200">{formatCurrency(bill.gst.cgst)}</span></div>
                      <div className="flex justify-between"><span className="text-surface-500">SGST ({bill.gst.sgstRate}%):</span><span className="font-medium text-surface-900 dark:text-surface-200">{formatCurrency(bill.gst.sgst)}</span></div>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5 mb-4">
                  {allItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-50/80 dark:bg-surface-800/40 text-sm border border-surface-200/70 dark:border-transparent">
                      <div className="min-w-0">
                        <p className="font-medium text-surface-900 dark:text-surface-200 truncate">{item.name}</p>
                        <p className="text-xs text-surface-500">{item.quantity} × {formatCurrency(item.price)}</p>
                      </div>
                      <p className="font-semibold text-surface-900 dark:text-surface-200 flex-shrink-0 ml-2">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <Button variant="gradient" size="sm" className="flex-1" leftIcon={<Printer className="w-4 h-4" />} onClick={() => onPrint(bill)}>Print Receipt</Button>
            <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => onDownload(bill)}>Download</Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
