import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ShoppingBag, User, Phone, Trash2, ChevronLeft, Banknote, Edit3 } from 'lucide-react'
import { useCart } from '@shared/contexts/CartContext'
import { formatCurrency } from '@shared/utils/formatters'
import { isValidName, isValidPhone } from '@shared/utils/validators'
import { ordersAPI } from '@shared/api/endpoints'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { registerPushSubscription } from '@shared/utils/pushNotifications'
import { cn } from '@shared/utils/cn'
import { ItemDetailModal } from '../components/ItemDetailModal'

export const Cart = () => {
  const { menuSlug, token } = useParams()
  const navigate = useNavigate()
  const { items, getTotalAmount, clearCart, removeItem, getItemPrice } = useCart()

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editingCartKey, setEditingCartKey] = useState(null)

  const validateForm = () => {
    const newErrors = {}
    if (!isValidName(customerName)) newErrors.name = 'Please enter a valid name (at least 2 characters)'
    if (!isValidPhone(customerPhone)) newErrors.phone = 'Please enter a valid 10-digit phone number'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePlaceOrder = async () => {
    if (!validateForm()) return
    setShowConfirmModal(true)
  }

  const confirmOrder = async () => {
    setLoading(true)
    try {
      const orderData = {
        token,
        customerName,
        customerPhone,
        items: items.map((item) => ({
          itemId: item.id,
          name: item.name,
          variant: item.selectedVariant
            ? { name: item.selectedVariant.name, price: item.selectedVariant.price ?? 0 }
            : null,
          addons: (item.selectedAddons || []).map(a => ({
            name: a.name,
            itemId: a.itemId || a.id || null,
            price: a.price ?? a.finalPrice ?? a.additionalPrice ?? a.priceAdjustment ?? a.optionPrice ?? 0,
          })),
          comboSelections: (item.comboSelections || []).map(selection => ({
            groupId: selection.groupId || '',
            groupName: selection.groupName || '',
            itemId: selection.itemId || null,
            name: selection.name || '',
            quantity: selection.quantity || 1,
            price: selection.price || 0,
          })),
          comboType: item.comboType || null,
          comboBasePrice: item.comboBasePrice ?? null,
          comboRegularTotal: item.comboRegularTotal ?? null,
          comboSavings: item.comboSavings ?? null,
          notes: item.notes || null,
          price: getItemPrice(item),
          quantity: item.quantity,
        })),
        totalAmount: getTotalAmount(),
        paymentMethod: 'cash',
      }

      const response = await ordersAPI.createOrder(orderData)
      try { await registerPushSubscription({ phone: customerPhone }) } catch {}
      clearCart()
      navigate(`/m/${menuSlug}/q/${token}/success/${response.data.orderId}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order')
    } finally {
      setLoading(false)
      setShowConfirmModal(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-24 h-24 mx-auto mb-5 rounded-2xl bg-white/5 flex items-center justify-center">
            <ShoppingBag className="w-11 h-11 text-zinc-700" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-sm text-zinc-500 mb-6">Add some delicious items to get started</p>
          <button onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold text-sm hover:scale-105 transition-all">
            Browse Menu
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white mt-3">Checkout</h1>
        <p className="text-sm text-zinc-500 mt-1">Complete your order details</p>
      </div>

      <div className="px-4 pb-8 space-y-4">
        {/* ─── Customer Details ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-[#0D1324] border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-violet-400" /> Your Details
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all',
                    errors.name ? 'border-red-500/50' : 'border-white/[0.06]'
                  )}
                />
              </div>
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>
            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="tel"
                  placeholder="10-digit phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  maxLength={10}
                  className={cn(
                    'w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all',
                    errors.phone ? 'border-red-500/50' : 'border-white/[0.06]'
                  )}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
            </div>
          </div>
        </motion.div>

        {/* ─── Order Items ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl bg-[#0D1324] border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-pink-400" /> Your Order
              <span className="text-xs font-normal text-zinc-500 ml-1">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {items.map((item) => {
              const cartKey = item._cartKey || item.id
              const itemPrice = getItemPrice(item)
              return (
                <div key={cartKey} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{item.name}</h3>
                    {item.selectedVariant && (
                      <p className="text-[11px] text-violet-400 font-medium mt-0.5">Variant: {item.selectedVariant.name}</p>
                    )}
                    {item.selectedAddons?.length > 0 && (
                      <div className="mt-0.5">
                        {item.selectedAddons.map(a => (
                          <p key={a.name} className="text-[11px] text-pink-400 font-medium">+ {a.name}</p>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-zinc-400 italic mt-1 bg-black/20 p-1.5 rounded border border-white/5 line-clamp-3">"{item.notes}"</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-medium text-zinc-500">{formatCurrency(itemPrice, item.currency)} × {item.quantity}</span>
                      <span className="text-zinc-600 text-xs">=</span>
                      <span className="text-sm font-bold text-white">{formatCurrency(itemPrice * item.quantity, item.currency)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 mt-0.5">
                    {(item.comboSelections?.length > 0 || item.selectedVariant || item.selectedAddons?.length > 0 || item.comboType) && (
                      <button
                        onClick={() => {
                          setEditingItem(item)
                          setEditingCartKey(cartKey)
                        }}
                        className="text-zinc-500 hover:text-violet-300 transition-colors"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => removeItem(cartKey)} className="text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ─── Bill Summary ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl bg-[#0D1324] border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-base font-bold text-white">Bill Summary</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Subtotal</span>
              <span className="text-zinc-300 font-medium">{formatCurrency(getTotalAmount())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Taxes & Fees</span>
              <span className="text-emerald-400 font-medium">Included</span>
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-white">Total</span>
              <span className="text-2xl font-bold text-white">{formatCurrency(getTotalAmount())}</span>
            </div>
          </div>
        </motion.div>

        {/* ─── Payment ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl bg-gradient-to-r from-violet-600/10 to-pink-600/10 border border-violet-500/15 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Cash Payment</p>
              <p className="text-xs text-zinc-400">Pay when your order is ready at the counter</p>
            </div>
          </div>
        </motion.div>

        {/* ─── Place Order Button ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className={cn(
              'w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2',
              loading
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:shadow-xl hover:shadow-violet-500/20 hover:scale-[1.01] active:scale-[0.99]'
            )}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                Place Order · {formatCurrency(getTotalAmount())}
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-zinc-600 mt-3">By placing order, you agree to our terms & conditions</p>
        </motion.div>
      </div>

      {/* ─── Confirmation Modal ─── */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#0D1324] rounded-2xl p-6 max-w-sm w-full border border-white/[0.06] shadow-2xl z-10">
              <h3 className="text-lg font-bold text-white mb-2">Confirm Order</h3>
              <p className="text-sm text-zinc-400 mb-6">
                Place order for <span className="font-bold text-white">{formatCurrency(getTotalAmount())}</span>? You'll pay in cash when it's ready.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-300 font-semibold text-sm hover:bg-white/10 transition-all">
                  Cancel
                </button>
                <button onClick={confirmOrder}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-violet-500/20 transition-all flex items-center justify-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ItemDetailModal
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => {
          setEditingItem(null)
          setEditingCartKey(null)
        }}
        initialSelection={editingItem}
        editingCartKey={editingCartKey}
      />
    </div>
  )
}
