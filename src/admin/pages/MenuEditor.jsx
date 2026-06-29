import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Upload, FileImage, FileText, X, Camera, Sparkles, Search, ChevronDown, ChevronRight, Grid3X3, List, Star, TrendingUp, Zap, ChefHat, Layers, Package, DollarSign, Flame, Leaf } from 'lucide-react'
import { Button } from '@shared/components/Button'
import { Input, TextArea } from '@shared/components/Input'
import { Card } from '@shared/components/Card'
import { Modal, ConfirmModal } from '@shared/components/Modal'
import { PageLoader } from '@shared/components/Spinner'
import { PageHeader } from '@shared/components/PageHeader'
import { EmptyState } from '@shared/components/EmptyState'
import { Badge } from '@shared/components/Badge'
import { Select } from '@shared/components/Select'
import { SearchInput } from '@shared/components/SearchInput'
import { formatCurrency } from '@shared/utils/formatters'
import { getDisplayPriceInfo } from '@shared/utils/priceEngine'
import { getComboPresentation, getComboTagList, isComboItem } from '@shared/utils/comboPricing'
import { menuAPI } from '@shared/api/endpoints'
import { AddItemModal } from '../components/menu/AddItemModal'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@shared/utils/cn'

const BADGE_META = {
  bestseller: { label: 'Bestseller', icon: Star, color: 'warning' },
  new: { label: 'New', icon: Zap, color: 'info' },
  'chef-special': { label: 'Chef Special', icon: ChefHat, color: 'violet' },
  trending: { label: 'Trending', icon: TrendingUp, color: 'success' },
}

const MiniStat = ({ icon: Icon, label, value, color = 'surface' }) => {
  const c = { surface: 'bg-surface-100 dark:bg-surface-800/40 text-surface-500', primary: 'bg-primary-500/10 text-primary-500', emerald: 'bg-emerald-500/10 text-emerald-500', amber: 'bg-amber-500/10 text-amber-500', violet: 'bg-violet-500/10 text-violet-500' }
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-surface-900/50 border border-surface-200/80 dark:border-surface-700/40">
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', c[color])}><Icon className="w-4 h-4" /></div>
      <div><p className="text-lg font-bold text-surface-900 dark:text-surface-50 leading-tight">{value}</p><p className="text-[10px] text-surface-400 font-medium">{label}</p></div>
    </div>
  )
}

export const MenuEditor = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemId: null })
  const [deleteAllModal, setDeleteAllModal] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [extractedItems, setExtractedItems] = useState([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [savingItems, setSavingItems] = useState(false)
  const [savingItem, setSavingItem] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [comboFilter, setComboFilter] = useState('all')
  const [sortBy, setSortBy] = useState('category')
  const [viewMode, setViewMode] = useState('grid')
  const [collapsedCats, setCollapsedCats] = useState({})
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  useEffect(() => { fetchMenu() }, [])

  const fetchMenu = async () => {
    try { const r = await menuAPI.getOwnerMenu(); setItems(r.data.items || []) }
    catch { toast.error('Failed to load menu'); setItems([]) }
    finally { setLoading(false) }
  }

  const categories = useMemo(() => [...new Set(items.filter(item => !isComboItem(item)).map(i => i.category))].sort(), [items])

  const filteredItems = useMemo(() => {
    let f = items.filter(item => !isComboItem(item))
    if (search.trim()) { const q = search.toLowerCase(); f = f.filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q)) }
    if (categoryFilter !== 'all') f = f.filter(i => i.category === categoryFilter)
    if (sortBy === 'name') f = [...f].sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'price') f = [...f].sort((a, b) => a.price - b.price)
    else if (sortBy === 'recent') f = [...f].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return f
  }, [items, search, categoryFilter, sortBy])

  const filteredCombos = useMemo(() => {
    let f = items.filter(item => isComboItem(item))
    if (search.trim()) { const q = search.toLowerCase(); f = f.filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)) }
    if (comboFilter === 'fixed') f = f.filter(i => i.comboType !== 'custom')
    if (comboFilter === 'custom') f = f.filter(i => i.comboType === 'custom')
    return f
  }, [items, search, comboFilter])

  const groupedItems = useMemo(() => {
    const map = {}
    filteredItems.forEach(i => { if (!map[i.category]) map[i.category] = []; map[i.category].push(i) })
    return map
  }, [filteredItems])

  const stats = useMemo(() => ({
    total: items.filter(item => !isComboItem(item)).length,
    combos: items.filter(item => isComboItem(item)).length,
    cats: categories.length,
    bestsellers: items.filter(i => i.badge === 'bestseller').length,
    outOfStock: items.filter(i => i.availability?.status === 'out-of-stock' || !i.isAvailable).length,
    avgPrice: items.length ? Math.round(items.filter(item => !isComboItem(item)).reduce((s, i) => s + i.price, 0) / Math.max(1, items.filter(item => !isComboItem(item)).length)) : 0,
  }), [items, categories])

  const toggleCat = (cat) => setCollapsedCats(p => ({ ...p, [cat]: !p[cat] }))

  const handleSaveItem = async (formData) => {
    setSavingItem(true)
    try {
      if (formData.id) { await menuAPI.updateItem(formData.id, formData); toast.success('Item updated!') }
      else { await menuAPI.addItem(formData); toast.success('Item added!') }
      fetchMenu(); closeModal()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save') }
    finally { setSavingItem(false) }
  }

  const closeModal = () => { setShowModal(false); setEditingItem(null) }

  const openComboBuilder = (combo = null) => {
    navigate('/owner/menu/combo-builder', combo ? { state: { combo } } : undefined)
  }

  const openEditItem = (item) => {
    if (isComboItem(item)) {
      openComboBuilder(item)
      return
    }
    setEditingItem(item)
    setShowModal(true)
  }

  const confirmDelete = async () => {
    try { await menuAPI.deleteItem(deleteModal.itemId); toast.success('Deleted'); fetchMenu() }
    catch { toast.error('Failed to delete') }
    finally { setDeleteModal({ isOpen: false, itemId: null }) }
  }

  const confirmDeleteAll = async () => {
    setDeletingAll(true)
    try { const r = await menuAPI.deleteAllItems(); toast.success(`Deleted ${r.data?.deletedCount || 0} items`); setItems([]) }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setDeletingAll(false); setDeleteAllModal(false) }
  }

  const handleFileSelect = (e) => { if (e.target.files[0]) setUploadedFile(e.target.files[0]) }

  const handleUpload = async () => {
    if (!uploadedFile) { toast.error('Select a file'); return }
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('menuFile', uploadedFile)
      const r = await menuAPI.uploadMenu(fd)
      const ex = r.data?.items || []
      if (ex.length > 0) { setExtractedItems(ex); setShowUploadModal(false); setShowReviewModal(true); toast.success(`Extracted ${ex.length} items`) }
      else toast.error('No items found')
      setUploadedFile(null)
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setUploading(false) }
  }

  const handleSaveExtractedItems = async () => {
    setSavingItems(true)
    try { for (const item of extractedItems) await menuAPI.addItem(item); toast.success(`Saved ${extractedItems.length} items`); setShowReviewModal(false); setExtractedItems([]); fetchMenu() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setSavingItems(false) }
  }

  const handleUpdateExtractedItem = (i, f, v) => { const u = [...extractedItems]; u[i] = { ...u[i], [f]: v }; setExtractedItems(u) }
  const handleRemoveExtractedItem = (i) => setExtractedItems(extractedItems.filter((_, idx) => idx !== i))

  if (loading) return <PageLoader message="Loading menu..." />

  const ItemCard = ({ item, idx }) => {
    const isOOS = item.availability?.status === 'out-of-stock' || !item.isAvailable
    const priceInfo = getDisplayPriceInfo(item)
    const displayPrice = priceInfo.hasVariants ? priceInfo.minPrice : priceInfo.display
    const isCombo = isComboItem(item)
    const comboInfo = isCombo ? getComboPresentation(item) : null
    const comboTags = isCombo ? getComboTagList(item) : []

    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }}>
        <Card
          hover
          className={cn(
            'h-full flex flex-col group overflow-hidden transition-all',
            isCombo
              ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/8 via-white to-amber-500/8 dark:from-emerald-500/10 dark:via-surface-900/40 dark:to-amber-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]'
              : 'bg-white dark:bg-surface-900/50',
            isOOS && 'opacity-60'
          )}
        >
          <div className="relative h-36 overflow-hidden">
            {item.image ? (
              <><img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" /><div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" /></>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-surface-100 via-surface-50 to-surface-200 dark:from-surface-900 dark:via-surface-900/60 dark:to-surface-800"><div className="absolute inset-0 bg-dot-pattern opacity-30" /></div>
            )}
            {isCombo && <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-400 via-lime-400 to-amber-400" />}
            {isOOS && <div className="absolute top-2 right-2 z-10"><Badge variant="danger" size="sm">Out of Stock</Badge></div>}
            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button onClick={() => { setEditingItem(item); setShowModal(true) }} className="p-1.5 rounded-lg bg-white/90 dark:bg-surface-950/70 backdrop-blur border border-surface-200/80 dark:border-surface-700/50 text-surface-600 dark:text-surface-300 hover:text-primary-500 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
              <button onClick={() => setDeleteModal({ isOpen: true, itemId: item.id })} className="p-1.5 rounded-lg bg-white/90 dark:bg-surface-950/70 backdrop-blur border border-surface-200/80 dark:border-surface-700/50 text-surface-600 dark:text-surface-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="p-3.5 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {isCombo && <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Combo</span>}
                  {comboTags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[10px] font-semibold text-surface-500 dark:text-surface-400">{tag}</span>
                  ))}
                </div>
                <h3 className="font-semibold text-sm text-surface-900 dark:text-surface-100 leading-tight line-clamp-1">{item.name}</h3>
                {isCombo && comboInfo?.summaryText && <p className="text-[11px] text-surface-500 line-clamp-1 mt-0.5">{comboInfo.summaryText}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                {isCombo && comboInfo?.comboType !== 'custom' && comboInfo?.regularTotal > comboInfo?.comboPrice ? (
                  <p className="text-[10px] text-surface-400 line-through">{formatCurrency(comboInfo.regularTotal, item.currency)}</p>
                ) : !isCombo && item.comparePrice > 0 && <p className="text-[10px] text-surface-400 line-through">{formatCurrency(item.comparePrice, item.currency)}</p>}
                <p className="font-bold text-primary-600 dark:text-primary-400 text-sm">
                  {isCombo && comboInfo?.comboType === 'custom'
                    ? `From ${formatCurrency(comboInfo?.startingFrom || 0, item.currency)}`
                    : isCombo ? formatCurrency(comboInfo?.comboPrice ?? displayPrice, item.currency) : (priceInfo.hasVariants ? `Starts at ${formatCurrency(displayPrice, item.currency)}` : formatCurrency(displayPrice, item.currency))}
                </p>
                {isCombo && comboInfo?.comboType !== 'custom' && comboInfo?.savings > 0 && <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Save {formatCurrency(comboInfo.savings, item.currency)}</p>}
              </div>
            </div>
            {item.description && <p className="text-xs text-surface-500 line-clamp-2 mb-2">{item.description}</p>}
            <div className="mt-auto flex items-center gap-1.5 flex-wrap">
              {item.isVeg !== undefined && <span className={cn('w-4 h-4 rounded border-2 flex items-center justify-center', item.isVeg ? 'border-emerald-500' : 'border-red-500')}><span className={cn('w-1.5 h-1.5 rounded-full', item.isVeg ? 'bg-emerald-500' : 'bg-red-500')} /></span>}
              {isCombo && comboInfo?.summaryText && <span className="text-[11px] font-semibold text-surface-500 dark:text-surface-400">{comboInfo.summaryText}</span>}
            </div>
            <div className="flex gap-1.5 mt-2.5 lg:hidden">
              <Button
                size="xs"
                variant="ghost"
                className="flex-1 border border-surface-200 dark:border-surface-700"
                onClick={() => openEditItem(item)}
              >
                Edit
              </Button>
              <Button size="xs" variant="ghost" className="flex-1 border border-surface-200 dark:border-surface-700 text-red-500" onClick={() => setDeleteModal({ isOpen: true, itemId: item.id })}>Delete</Button>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-7 max-w-[1500px] mx-auto">
      <PageHeader title="Menu Editor" subtitle="Manage your menu items, categories, and prices" actions={
        <div className="flex flex-wrap gap-2">
          {items.length > 0 && <Button variant="danger" size="sm" onClick={() => setDeleteAllModal(true)} leftIcon={<Trash2 className="w-4 h-4" />}>Delete All</Button>}
          <Button variant="outline" size="sm" leftIcon={<Sparkles className="w-4 h-4" />} onClick={() => setShowUploadModal(true)}>Upload Menu</Button>
          <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => openComboBuilder(null)}>Create Combo</Button>
          <Button variant="gradient" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setEditingItem(null); setShowModal(true) }}>Add Item</Button>
        </div>
      } />

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MiniStat icon={Package} label="Menu Items" value={stats.total} color="primary" />
        <MiniStat icon={Sparkles} label="Combos" value={stats.combos} color="emerald" />
        <MiniStat icon={Grid3X3} label="Categories" value={stats.cats} color="violet" />
        <MiniStat icon={Star} label="Bestsellers" value={stats.bestsellers} color="amber" />
        <MiniStat icon={X} label="Out of Stock" value={stats.outOfStock} color="surface" />
      </motion.div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} placeholder="Search items..." className="sm:col-span-5" />
          <Select label="" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} containerClassName="sm:col-span-3">
            <option value="all">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select label="" value={sortBy} onChange={(e) => setSortBy(e.target.value)} containerClassName="sm:col-span-2">
            <option value="category">By Category</option>
            <option value="name">By Name</option>
            <option value="price">By Price</option>
            <option value="recent">Recent</option>
          </Select>
          <div className="sm:col-span-2 flex gap-1.5 justify-end">
            <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-primary-500/10 text-primary-400' : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800')}><Grid3X3 className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-lg transition-colors', viewMode === 'list' ? 'bg-primary-500/10 text-primary-400' : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800')}><List className="w-4 h-4" /></button>
          </div>
        </div>
      </Card>

      {/* Combos Section */}
      {filteredCombos.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h2 className="text-base font-bold text-surface-900 dark:text-surface-100">Combos</h2>
            <Badge variant="success" size="sm">{filteredCombos.length}</Badge>
            <div className="h-px flex-1 bg-surface-200/80 dark:bg-surface-700/50" />
            <Button size="xs" variant="outline" onClick={() => openComboBuilder(null)} leftIcon={<Plus className="w-3 h-3" />}>New Combo</Button>
          </div>
          {/* Sub-filters */}
          <div className="flex items-center gap-2 mb-4">
            {['all', 'fixed', 'custom'].map(f => (
              <button key={f} onClick={() => setComboFilter(f)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                  comboFilter === f
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'text-surface-500 border-surface-200 dark:border-surface-700 hover:border-surface-300'
                )}>
                {f === 'all' ? 'All Combos' : f === 'fixed' ? 'Fixed' : 'Custom'}
              </button>
            ))}
          </div>
          <div className={cn(viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2')}>
            {filteredCombos.map((item, idx) => viewMode === 'grid' ? (
              <ItemCard key={item.id} item={item} idx={idx} />
            ) : (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                className="group flex items-center gap-3 p-3 rounded-xl border border-emerald-200/50 dark:border-emerald-700/30 bg-emerald-50/50 dark:bg-emerald-500/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all">
                {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-surface-900 dark:text-surface-100 truncate">{item.name}</p>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{item.comboType === 'custom' ? 'Custom' : 'Fixed'}</span>
                  </div>
                  <p className="text-xs text-surface-500 truncate">{item.description || '—'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{item.comboType === 'custom' ? `From ${formatCurrency(0)}` : formatCurrency(item.sellingPrice || item.price)}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditItem(item)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-primary-500 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteModal({ isOpen: true, itemId: item.id })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-surface-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Regular Menu Categories */}
      {filteredItems.length === 0 && filteredCombos.length === 0 ? (
        <EmptyState title={items.length === 0 ? 'No menu items yet' : 'No items match'} description={items.length === 0 ? 'Upload a photo or add items manually.' : 'Try different search or filters.'} actionLabel="Add First Item" onAction={() => { setEditingItem(null); setShowModal(true) }} />
      ) : filteredItems.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([cat, catItems], ci) => (
            <motion.div key={cat} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.05 }}>
              <button onClick={() => toggleCat(cat)} className="flex items-center gap-3 mb-3 w-full text-left group">
                <ChevronDown className={cn('w-4 h-4 text-surface-400 transition-transform', collapsedCats[cat] && '-rotate-90')} />
                <h2 className="text-base font-bold text-surface-900 dark:text-surface-100 capitalize font-display">{cat}</h2>
                <Badge variant="gray" size="sm">{catItems.length}</Badge>
                <div className="h-px flex-1 bg-surface-200/80 dark:bg-surface-700/50" />
                <Button size="xs" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setEditingItem(null); setShowModal(true) }} leftIcon={<Plus className="w-3 h-3" />}>Add</Button>
              </button>
              <AnimatePresence>
                {!collapsedCats[cat] && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <div className={cn(viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2')}>
                      {catItems.map((item, idx) => viewMode === 'grid' ? (
                        <ItemCard key={item.id} item={item} idx={idx} />
                      ) : (
                        <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                          className="group flex items-center gap-3 p-3 rounded-xl border border-surface-200/80 dark:border-surface-700/40 bg-white/70 dark:bg-surface-900/30 hover:bg-surface-50 dark:hover:bg-surface-800/30 hover:-translate-y-0.5 hover:shadow-sm transition-all">
                          {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-surface-900 dark:text-surface-100 truncate">{item.name}</p>
                            <p className="text-xs text-surface-500 truncate">{item.description || '—'}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <p className="font-bold text-sm text-primary-600 dark:text-primary-400">{formatCurrency(item.offerPrice > 0 ? item.offerPrice : item.price, item.currency)}</p>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditItem(item)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-primary-500 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setDeleteModal({ isOpen: true, itemId: item.id })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-surface-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      ) : null}

      {/* Add/Edit Item Modal */}
      <AddItemModal isOpen={showModal} onClose={closeModal} onSave={handleSaveItem} editingItem={editingItem} categories={categories} loading={savingItem} />

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => { setShowUploadModal(false); setUploadedFile(null) }} title="Upload Menu (AI Vision)" size="md" footer={<><Button variant="ghost" onClick={() => { setShowUploadModal(false); setUploadedFile(null) }}>Cancel</Button><Button variant="gradient" onClick={handleUpload} loading={uploading} disabled={!uploadedFile}>{uploading ? 'Processing...' : 'Upload & Extract'}</Button></>}>
        <div className="space-y-4">
          <div className="bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 rounded-xl p-4"><p className="text-sm text-sky-800 dark:text-sky-300">🤖 <strong>AI-Powered:</strong> Upload a menu photo and our AI extracts items automatically.</p></div>
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileSelect} className="hidden" />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
          {uploadedFile ? (
            <div className="border border-dashed border-primary-500/30 bg-primary-50 dark:bg-primary-500/5 rounded-xl p-6 text-center">
              <div className="flex flex-col items-center gap-3">
                {uploadedFile.type.includes('pdf') ? <FileText className="w-12 h-12 text-primary-500" /> : <FileImage className="w-12 h-12 text-primary-500" />}
                <div><p className="text-sm font-medium text-surface-900 dark:text-surface-100">{uploadedFile.name}</p><p className="text-xs text-surface-500">{(uploadedFile.size / 1024).toFixed(2)} KB</p></div>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setUploadedFile(null)}>Remove</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => fileInputRef.current?.click()} className="border border-surface-200 dark:border-surface-700 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500 transition-all group"><Upload className="w-8 h-8 text-surface-400 group-hover:text-primary-500 mx-auto mb-2" /><p className="text-sm font-semibold text-surface-900 dark:text-surface-100">Gallery</p></div>
              <div onClick={() => cameraInputRef.current?.click()} className="border border-surface-200 dark:border-surface-700 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500 transition-all group"><Camera className="w-8 h-8 text-surface-400 group-hover:text-primary-500 mx-auto mb-2" /><p className="text-sm font-semibold text-surface-900 dark:text-surface-100">Camera</p></div>
            </div>
          )}
        </div>
      </Modal>

      {/* Review Extracted */}
      <Modal isOpen={showReviewModal} onClose={() => { setShowReviewModal(false); setExtractedItems([]) }} title={`Review Items (${extractedItems.length})`} size="xl" footer={<><Button variant="ghost" onClick={() => { setShowReviewModal(false); setExtractedItems([]) }}>Cancel</Button><Button variant="gradient" onClick={handleSaveExtractedItems} loading={savingItems}>Save All</Button></>}>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
          {extractedItems.map((item, i) => (
            <Card key={i} className="p-4 border border-surface-200 dark:border-surface-700/50">
              <div className="flex justify-between items-center mb-3"><Badge variant="primary" size="sm">Item {i + 1}</Badge><button onClick={() => handleRemoveExtractedItem(i)} className="text-surface-400 hover:text-red-500 p-1"><X className="w-4 h-4" /></button></div>
              <div className="grid grid-cols-2 gap-3 mb-3"><Input label="Name" value={item.name} onChange={(e) => handleUpdateExtractedItem(i, 'name', e.target.value)} /><Input label="Category" value={item.category} onChange={(e) => handleUpdateExtractedItem(i, 'category', e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-3"><Input label="Price" type="number" value={item.price} onChange={(e) => handleUpdateExtractedItem(i, 'price', parseFloat(e.target.value) || 0)} /><div className="col-span-2"><TextArea label="Description" value={item.description || ''} onChange={(e) => handleUpdateExtractedItem(i, 'description', e.target.value)} rows={1} /></div></div>
            </Card>
          ))}
        </div>
      </Modal>

      <ConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, itemId: null })} onConfirm={confirmDelete} title="Delete Item?" message="This item will be permanently removed." confirmText="Delete" variant="danger" />
      <ConfirmModal isOpen={deleteAllModal} onClose={() => setDeleteAllModal(false)} onConfirm={confirmDeleteAll} title="Delete All?" message="This will permanently delete all menu items." confirmText={deletingAll ? "Deleting..." : "Delete All"} variant="danger" loading={deletingAll} />
    </div>
  )
}
