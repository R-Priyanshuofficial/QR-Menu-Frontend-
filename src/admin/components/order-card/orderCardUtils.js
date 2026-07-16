import {
  CheckCircle,
  ChefHat,
  Clock,
  UtensilsCrossed,
  Package,
  Puzzle,
  Plus,
  StickyNote,
} from 'lucide-react'

export const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    accentBorder: 'border-l-amber-400',
    accentRing: 'hover:shadow-[0_12px_32px_rgba(245,158,11,0.12)]',
    iconWrap: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
    badge: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
    dot: 'bg-amber-300',
    primary: 'bg-amber-400 text-slate-950 hover:bg-amber-300 focus-visible:ring-amber-300',
  },
  ready: {
    label: 'Ready',
    icon: ChefHat,
    accentBorder: 'border-l-sky-400',
    accentRing: 'hover:shadow-[0_12px_32px_rgba(14,165,233,0.12)]',
    iconWrap: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
    badge: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
    dot: 'bg-sky-300',
    primary: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 focus-visible:ring-emerald-300',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    accentBorder: 'border-l-emerald-400',
    accentRing: 'hover:shadow-[0_12px_32px_rgba(34,197,94,0.12)]',
    iconWrap: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
    badge: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
    dot: 'bg-emerald-300',
    primary: '',
  },
}

export const summaryConfig = {
  items: { label: 'Items', icon: UtensilsCrossed, section: 'items' },
  readyCombos: { label: 'Ready Combos', icon: Package, section: 'readyCombos' },
  customCombos: { label: 'Custom Combos', icon: Puzzle, section: 'customCombos' },
  addons: { label: 'Add-ons', icon: Plus, section: 'addons' },
  notes: { label: 'Notes', icon: StickyNote, section: 'notes' },
}

export const getQuantity = (item) => Math.max(1, Number(item?.quantity) || 1)

export const getUnitPrice = (item) => Number(item?.unitPrice ?? item?.price ?? 0) || 0

export const getSubtotal = (item) => {
  const explicit = Number(item?.subtotal)
  if (Number.isFinite(explicit) && explicit >= 0) return explicit
  return getUnitPrice(item) * getQuantity(item)
}

export const getAddonPrice = (addon) => {
  const price = Number(
    addon?.price
    ?? addon?.selectedAddon?.price
    ?? addon?.option?.price
    ?? addon?.finalPrice
    ?? addon?.additionalPrice
    ?? addon?.priceAdjustment
    ?? addon?.optionPrice
    ?? addon?.amount
  )

  return Number.isFinite(price) ? price : 0
}

export const getSelectionPrice = (selection) => {
  const price = Number(
    selection?.price
    ?? selection?.finalPrice
    ?? selection?.additionalPrice
    ?? selection?.priceAdjustment
    ?? selection?.optionPrice
  )

  return Number.isFinite(price) ? price : 0
}

export const getOrderNumber = (order) => String(order?.id || '').slice(-6).toUpperCase() || 'ORDER'

export const getItems = (order) => (Array.isArray(order?.items) ? order.items : [])

export const getComboSelections = (item) => (
  Array.isArray(item?.comboSelections) ? item.comboSelections : []
)

export const getAddons = (item) => (Array.isArray(item?.addons) ? item.addons : [])

export const hasComboSelections = (item) => getComboSelections(item).length > 0

export const isCustomCombo = (item) => {
  if (item?.comboType === 'custom') return true
  return getComboSelections(item).some((selection) => {
    const groupName = String(selection?.groupName || '').toLowerCase()
    return groupName && !groupName.includes('included')
  })
}

export const isReadyCombo = (item) => hasComboSelections(item) && !isCustomCombo(item)

export const getNoteCount = (order) => {
  const orderNote = order?.notes || order?.specialInstructions || order?.instructions
  const itemNotes = getItems(order).filter((item) => item?.notes || item?.instructions).length
  return (orderNote ? 1 : 0) + itemNotes
}

export const getSummary = (order) => {
  const items = getItems(order)

  return {
    items: items.reduce((total, item) => total + getQuantity(item), 0),
    readyCombos: items.filter(isReadyCombo).length,
    customCombos: items.filter(isCustomCombo).length,
    addons: items.reduce((total, item) => total + getAddons(item).length, 0),
    notes: getNoteCount(order),
  }
}

export const timeAgo = (createdAt) => {
  if (!createdAt) return ''
  const time = new Date(createdAt).getTime()
  if (!Number.isFinite(time)) return ''

  const diffMinutes = Math.floor((Date.now() - time) / (1000 * 60))
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}
