import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  Calendar,
  CreditCard,
  Award,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  ChevronDown,
  Target,
  Zap,
  Activity,
  Timer,
  CheckCircle,
  Package
} from 'lucide-react';
import { Card, CardContent } from '@shared/components/Card';
import { Button } from '@shared/components/Button';
import { PageLoader } from '@shared/components/Spinner';
import { formatCurrency } from '@shared/utils/formatters';
import { analyticsAPI } from '@shared/api/endpoints';
import toast from 'react-hot-toast';
import {
  exportRevenueReport,
  exportOrdersReport,
  exportMenuReport,
  exportCompleteReport
} from '../utils/pdfExports';
import { testPDFGeneration } from '../utils/testPDF';

// Helper function to convert 24-hour to 12-hour format
const formatTime12Hour = (hour) => {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
};

// Chart Colors
const CHART_COLORS = {
  primary: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  blue: '#3B82F6'
};

const PIE_COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444'];

export const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [customDateRange, setCustomDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [period, startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      console.log('📊 Fetching analytics for period:', period);
      
      // Build query params
      const params = customDateRange && startDate && endDate 
        ? { period: 'custom', startDate, endDate }
        : { period };
      
      console.log('📅 Query params:', params);
      const response = await analyticsAPI.getStats(params.period, params.startDate, params.endDate);
      console.log('✅ Analytics response received:', response);
      console.log('📦 Response data structure:', {
        hasData: !!response.data,
        orderCount: response.data?.orders?.total,
        fullResponseKeys: Object.keys(response),
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      
      // The axios interceptor already extracts response.data, so response.data contains our stats
      const statsData = response.data;
      
      if (statsData && statsData.orders) {
        console.log('✅ Setting stats with', statsData.orders.total, 'orders');
        setStats(statsData);
      } else {
        console.warn('⚠️ Invalid response format, setting empty stats');
        console.log('Full response:', JSON.stringify(response, null, 2));
        console.log('Response.data:', JSON.stringify(response.data, null, 2));
        // Set empty stats if no data - IMPORTANT: Don't set to null, use empty object
        setStats({
          revenue: { total: 0, pending: 0, average: 0, daily: 0, today: 0, growth: 0 },
          orders: { total: 0, completed: 0, pending: 0, preparing: 0, ready: 0, cancelled: 0, today: 0, growth: 0, statusDistribution: {} },
          customers: { unique: 0, repeat: 0, repeatRate: 0 },
          popularItems: [],
          paymentMethods: {},
          peakHour: 0,
          hourlyDistribution: [],
          dayOfWeekData: [],
          topTables: [],
          revenueTrend: [],
          qrStats: { totalCodes: 0, totalScans: 0, averageScans: 0 }
        });
      }
    } catch (error) {
      console.error('❌ Analytics API error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.response?.data);
      
      toast.error(error.response?.data?.message || 'Failed to load analytics data');
      // Set empty stats on error - Don't leave stats as null
      setStats({
        revenue: { total: 0, pending: 0, average: 0, daily: 0, today: 0, growth: 0 },
        orders: { total: 0, completed: 0, pending: 0, preparing: 0, ready: 0, cancelled: 0, today: 0, growth: 0, statusDistribution: {} },
        customers: { unique: 0, repeat: 0, repeatRate: 0 },
        popularItems: [],
        paymentMethods: {},
        peakHour: 0,
        hourlyDistribution: [],
        dayOfWeekData: [],
        topTables: [],
        revenueTrend: [],
        qrStats: { totalCodes: 0, totalScans: 0, averageScans: 0 }
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Test PDF generation
  const handleTestPDF = () => {
    console.log('Testing basic PDF generation...');
    const result = testPDFGeneration();
    if (result) {
      toast.success('Test PDF generated!');
    } else {
      toast.error('PDF test failed - check console');
    }
  };

  // PDF Export handlers
  const handleExportRevenue = () => {
    try {
      console.log('Exporting revenue report...', stats);
      exportRevenueReport(stats, period, 'QR Menu Restaurant');
      toast.success('Revenue report downloaded!');
      setShowExportMenu(false);
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };

  const handleExportOrders = () => {
    try {
      console.log('Exporting orders report...');
      exportOrdersReport(stats, period, 'QR Menu Restaurant');
      toast.success('Orders report downloaded!');
      setShowExportMenu(false);
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };

  const handleExportMenu = () => {
    try {
      console.log('Exporting menu report...');
      exportMenuReport(stats, period, 'QR Menu Restaurant');
      toast.success('Menu report downloaded!');
      setShowExportMenu(false);
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };

  const handleExportComplete = () => {
    try {
      console.log('Exporting complete report...', stats);
      exportCompleteReport(stats, period, 'QR Menu Restaurant');
      toast.success('Complete report downloaded!');
      setShowExportMenu(false);
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };

  if (loading) return <PageLoader message="Loading analytics..." />;

  const periodOptions = [
    { value: 'all', label: 'Lifetime' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handlePeriodChange = (value) => {
    setPeriod(value);
    if (value === 'custom') {
      setCustomDateRange(true);
      // Set default dates to last 30 days
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      setEndDate(end.toISOString().split('T')[0]);
      setStartDate(start.toISOString().split('T')[0]);
    } else {
      setCustomDateRange(false);
      setStartDate('');
      setEndDate('');
    }
  };

  // Period Selector Component (used in both empty and normal states)
  const PeriodSelector = () => (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-end gap-3">
        <div className="flex items-center gap-2 flex-wrap justify-end w-full">
          {/* Export PDF Menu - Only show when stats available */}
          {stats && stats.orders.total > 0 && (
            <div className="relative">
              <Button
                onClick={() => setShowExportMenu(!showExportMenu)}
                size="sm"
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Download className="w-4 h-4" />
                Export PDF
                <ChevronDown className="w-4 h-4" />
              </Button>
              
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                >
                  <button
                    onClick={handleTestPDF}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700"
                  >
                    <Zap className="w-4 h-4 text-yellow-600" />
                    Test PDF (Simple)
                  </button>
                  <button
                    onClick={handleExportComplete}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4 text-purple-600" />
                    Complete Report
                  </button>
                  <button
                    onClick={handleExportRevenue}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Revenue Report
                  </button>
                  <button
                    onClick={handleExportOrders}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    Orders Report
                  </button>
                  <button
                    onClick={handleExportMenu}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Award className="w-4 h-4 text-pink-600" />
                    Menu Performance
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* Refresh Button */}
          <Button
            onClick={() => fetchAnalytics()}
            size="sm"
            variant="outline"
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePeriodChange(option.value)}
                disabled={refreshing}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  period === option.value
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                } disabled:opacity-50`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {customDateRange && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-4 flex flex-col xl:flex-row gap-4 items-start xl:items-end">
              <div className="w-full xl:flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  <Calendar className="w-4 h-4 inline mr-1 text-primary-500" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="w-full xl:flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  <Calendar className="w-4 h-4 inline mr-1 text-primary-500" />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="flex gap-2 w-full xl:w-auto">
                <Button
                  onClick={fetchAnalytics}
                  disabled={!startDate || !endDate || refreshing}
                  className="gap-2 flex-1 xl:flex-none"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Apply
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 xl:flex-none"
                  onClick={() => handlePeriodChange('all')}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );

  // Show empty state if no orders
  if (!stats || stats.orders.total === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Comprehensive insights into your restaurant's performance
            </p>
          </div>
          {/* Period Selector in Header for Empty State */}
          <PeriodSelector />
        </div>

        {/* Empty State */}
        <Card>
          <div className="p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Analytics Data Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {period === 'all' 
                  ? 'Start receiving orders to see comprehensive analytics and insights about your restaurant\'s performance.'
                  : `No orders found for the selected period. Try selecting "Lifetime" or a different date range.`
                }
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Analytics will automatically populate as customers place orders through your QR menu system.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card hover className="h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {value}
              </p>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
              {trend && (
                <div className={`flex items-center mt-2 text-xs font-medium ${
                  trendValue >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trendValue >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {Math.abs(trendValue)}% from last period
                </div>
              )}
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Comprehensive insights into your restaurant's performance
          </p>
        </div>
        {/* Period Selector Moved to Right Side */}
        <PeriodSelector />
      </motion.div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.revenue.total)}
          subtitle={`${formatCurrency(stats.revenue.average)} avg per order`}
          icon={DollarSign}
          trend={true}
          trendValue={stats.revenue.growth}
          color="bg-green-500"
        />
        <StatCard
          title="Pending Revenue"
          value={formatCurrency(stats.revenue.pending)}
          subtitle="Orders in progress"
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats.revenue.today)}
          subtitle={`${stats.orders.today} orders today`}
          icon={Calendar}
          color="bg-blue-500"
        />
        <StatCard
          title="Daily Average"
          value={formatCurrency(stats.revenue.daily)}
          subtitle="Average per day"
          icon={TrendingUp}
          color="bg-purple-500"
        />
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value={stats.orders.total}
          subtitle={`${stats.orders.completed} completed`}
          icon={ShoppingBag}
          trend={true}
          trendValue={stats.orders.growth}
          color="bg-indigo-500"
        />
        <StatCard
          title="Pending Orders"
          value={stats.orders.pending}
          subtitle={`${stats.orders.preparing} preparing, ${stats.orders.ready} ready`}
          icon={Clock}
          color="bg-orange-500"
        />
        <StatCard
          title="Unique Customers"
          value={stats.customers.unique}
          subtitle={`${stats.customers.repeat} repeat customers`}
          icon={Users}
          color="bg-pink-500"
        />
        <StatCard
          title="Repeat Rate"
          value={`${stats.customers.repeatRate}%`}
          subtitle="Customer loyalty"
          icon={Award}
          color="bg-teal-500"
        />
      </div>

      {/* Key Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Key Performance Insights
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {stats.orders.total > 0 ? ((stats.orders.completed / stats.orders.total) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Orders successfully completed</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-red-600" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancellation Rate</p>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {stats.orders.total > 0 ? ((stats.orders.cancelled / stats.orders.total) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Orders cancelled</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue/Customer</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.customers.unique > 0 ? stats.revenue.total / stats.customers.unique : 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Average spend per customer</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  {stats.revenue.growth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Growth Trend</p>
                </div>
                <p className={`text-2xl font-bold ${stats.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.revenue.growth >= 0 ? '+' : ''}{stats.revenue.growth}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Compared to previous period</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Revenue Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Revenue Trend (Last 7 Days)
            </h2>
            <div className="space-y-3">
              {stats.revenueTrend.map((day, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex-1">
                    <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-end pr-3"
                        style={{
                          width: `${Math.max(5, (day.revenue / Math.max(...stats.revenueTrend.map(d => d.revenue))) * 100)}%`
                        }}
                      >
                        <span className="text-xs font-medium text-white">
                          {formatCurrency(day.revenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-gray-600 dark:text-gray-400">
                    {day.orders} orders
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Popular Items & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Items */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="h-full"
        >
          <Card className="h-full">
            <div className="p-6 h-full flex flex-col">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Top Selling Items
              </h2>
              <div className="space-y-3 flex-1">
                {stats.popularItems.length > 0 ? (
                  stats.popularItems.slice(0, 8).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {item.quantity} sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary-600 dark:text-primary-400">
                          {formatCurrency(item.revenue)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items sold yet</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Payment Methods & Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="h-full"
        >
          <Card className="h-full">
            <div className="p-6 h-full flex flex-col">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Payment Methods
              </h2>
              <div className="space-y-4">
                {Object.keys(stats.paymentMethods).length > 0 ? (
                  Object.entries(stats.paymentMethods).map(([method, count]) => {
                    const total = Object.values(stats.paymentMethods).reduce((a, b) => a + b, 0);
                    const percentage = Math.round((count / total) * 100);
                    
                    return (
                      <div key={method}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                              {method}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {count} orders ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No payment data yet</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Peak Hour</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatTime12Hour(stats.peakHour)} - {formatTime12Hour(stats.peakHour + 1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total QR Scans</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {stats.qrStats.totalScans}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active QR Codes</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {stats.qrStats.totalCodes}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code Engagement Metrics */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-600" />
                  QR Engagement
                </h3>
                <div className="space-y-3">
                  {/* Conversion Rate */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Scan to Order Conversion
                      </span>
                      <Zap className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-green-600">
                        {stats.qrStats.totalScans > 0 
                          ? ((stats.orders.total / stats.qrStats.totalScans) * 100).toFixed(1)
                          : 0}%
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {stats.orders.total}/{stats.qrStats.totalScans} orders
                      </span>
                    </div>
                  </div>

                  {/* Average Scans per Code */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Avg. Scans per Code
                      </span>
                      <Activity className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {stats.qrStats.totalCodes > 0 
                          ? (stats.qrStats.totalScans / stats.qrStats.totalCodes).toFixed(1)
                          : 0}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        scans/code
                      </span>
                    </div>
                  </div>

                  {/* Revenue per Scan */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Revenue per Scan
                      </span>
                      <DollarSign className="w-3 h-3 text-purple-600" />
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-xl font-bold text-purple-600">
                        {formatCurrency(stats.qrStats.totalScans > 0 
                          ? stats.revenue.total / stats.qrStats.totalScans
                          : 0)}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        avg value
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

      </div>

      {/* Order Status Distribution - Pie Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Order Status Distribution
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.orders.statusDistribution).map(([status, count]) => ({
                        name: status.charAt(0).toUpperCase() + status.slice(1),
                        value: count
                      })).filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(stats.orders.statusDistribution).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#F3F4F6'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with Details */}
              <div className="flex flex-col justify-center space-y-3">
                {Object.entries(stats.orders.statusDistribution).map(([status, count], index) => {
                  const colors = {
                    pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-400', dot: 'bg-yellow-500' },
                    preparing: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-400', dot: 'bg-purple-500' },
                    ready: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', dot: 'bg-green-500' },
                    completed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400', dot: 'bg-blue-500' },
                    cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', dot: 'bg-red-500' }
                  };
                  const statusColor = colors[status] || colors.completed;
                  const percentage = stats.orders.total > 0 ? ((count / stats.orders.total) * 100).toFixed(1) : 0;

                  return (
                    <div
                      key={status}
                      className={`flex items-center justify-between p-3 rounded-lg ${statusColor.bg}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${statusColor.dot}`}></div>
                        <div>
                          <p className={`font-semibold capitalize ${statusColor.text}`}>{status}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{percentage}% of total</p>
                        </div>
                      </div>
                      <p className={`text-2xl font-bold ${statusColor.text}`}>{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Hourly Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Hourly Order Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="hour" 
                  stroke="#6B7280"
                  tickFormatter={(hour) => formatTime12Hour(hour).split(' ')[0]}
                />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  labelFormatter={(hour) => formatTime12Hour(hour)}
                  formatter={(value, name) => [
                    name === 'orders' ? `${value} orders` : formatCurrency(value),
                    name === 'orders' ? 'Orders' : 'Revenue'
                  ]}
                />
                <Legend />
                <Bar dataKey="orders" fill="#3B82F6" name="Orders" radius={[8, 8, 0, 0]} />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Day of Week Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Performance by Day of Week
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="day" stroke="#6B7280" />
                <YAxis yAxisId="left" stroke="#6B7280" />
                <YAxis yAxisId="right" orientation="right" stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  formatter={(value, name) => [
                    name === 'orders' ? `${value} orders` : formatCurrency(value),
                    name === 'orders' ? 'Orders' : 'Revenue'
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="orders" fill="#8B5CF6" name="Orders" radius={[8, 8, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" fill="#F59E0B" name="Revenue" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Revenue Trend Area Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Revenue Trend Analysis (Last 7 Days)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value) : `${value} orders`,
                    name === 'revenue' ? 'Revenue' : 'Orders'
                  ]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  name="Revenue"
                />
                <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} name="Orders" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Order Fulfillment Metrics & Time-Based Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Fulfillment Metrics */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Timer className="w-5 h-5 text-blue-600" />
                Order Fulfillment Metrics
              </h2>
              
              <div className="space-y-6">
                {/* Average Preparation Time */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Avg. Preparation Time</span>
                    </div>
                    <span className="text-3xl font-bold text-blue-600">
                      {stats.orders.total > 0 ? Math.round((stats.orders.completed + stats.orders.preparing) / 2) : 0} min
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Time from order placed to ready for pickup
                  </p>
                </div>

                {/* Fulfillment Rate */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Fulfillment Rate</span>
                    </div>
                    <span className="text-3xl font-bold text-green-600">
                      {stats.orders.total > 0 
                        ? ((stats.orders.completed / stats.orders.total) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{stats.orders.completed} completed</span>
                    <span>{stats.orders.cancelled} cancelled</span>
                  </div>
                </div>

                {/* Active Orders */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Active Orders</span>
                    </div>
                    <span className="text-3xl font-bold text-orange-600">
                      {stats.orders.pending + stats.orders.preparing + stats.orders.ready}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <p className="text-yellow-600 dark:text-yellow-400 font-bold">{stats.orders.pending}</p>
                      <p className="text-gray-600 dark:text-gray-400">Pending</p>
                    </div>
                    <div className="text-center">
                      <p className="text-purple-600 dark:text-purple-400 font-bold">{stats.orders.preparing}</p>
                      <p className="text-gray-600 dark:text-gray-400">Preparing</p>
                    </div>
                    <div className="text-center">
                      <p className="text-green-600 dark:text-green-400 font-bold">{stats.orders.ready}</p>
                      <p className="text-gray-600 dark:text-gray-400">Ready</p>
                    </div>
                  </div>
                </div>

                {/* Efficiency Score */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Efficiency Score</span>
                    </div>
                    <span className="text-3xl font-bold text-purple-600">
                      {stats.orders.total > 0 
                        ? Math.min(100, Math.round((stats.orders.completed / stats.orders.total) * 100 + 
                          (stats.orders.cancelled === 0 ? 10 : 0)))
                        : 0}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Based on completion rate and cancellations
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Time-Based Revenue Heatmap */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-600" />
                Hourly Activity Heatmap
              </h2>
              
              <div className="space-y-2">
                {stats.hourlyDistribution && stats.hourlyDistribution
                  .filter(hour => hour.orders > 0)
                  .sort((a, b) => b.orders - a.orders)
                  .slice(0, 12)
                  .map((hour, index) => {
                    const maxOrders = Math.max(...stats.hourlyDistribution.map(h => h.orders));
                    const intensity = (hour.orders / maxOrders) * 100;
                    
                    // Color intensity based on activity
                    let bgColor = 'bg-green-100 dark:bg-green-900/20';
                    let textColor = 'text-green-700 dark:text-green-400';
                    let barColor = 'bg-green-500';
                    
                    if (intensity > 80) {
                      bgColor = 'bg-red-100 dark:bg-red-900/30';
                      textColor = 'text-red-700 dark:text-red-400';
                      barColor = 'bg-red-500';
                    } else if (intensity > 60) {
                      bgColor = 'bg-orange-100 dark:bg-orange-900/30';
                      textColor = 'text-orange-700 dark:text-orange-400';
                      barColor = 'bg-orange-500';
                    } else if (intensity > 40) {
                      bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
                      textColor = 'text-yellow-700 dark:text-yellow-400';
                      barColor = 'bg-yellow-500';
                    }
                    
                    return (
                      <div key={hour.hour} className={`${bgColor} rounded-lg p-3 transition-all hover:scale-[1.02]`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`font-bold ${textColor} text-sm w-20`}>
                              {formatTime12Hour(hour.hour)}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {hour.orders} orders
                            </span>
                          </div>
                          <span className={`text-sm font-semibold ${textColor}`}>
                            {formatCurrency(hour.revenue)}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} transition-all duration-300`}
                            style={{ width: `${intensity}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Peak Hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span>Moderate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Low Activity</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
