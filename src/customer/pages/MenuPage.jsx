import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, ChevronLeft, X, Leaf, Moon, Sun, Clock, Flame, UtensilsCrossed } from 'lucide-react'
import { ItemCard } from '../components/ItemCard'
import { ItemDetailModal } from '../components/ItemDetailModal'
import { CartDrawer } from '../components/CartDrawer'
import { PageLoader } from '@shared/components/Spinner'
import { useCart } from '@shared/contexts/CartContext'
import { useTheme } from '@shared/contexts/ThemeContext'
import { menuAPI } from '@shared/api/endpoints'
import { formatCurrency } from '@shared/utils/formatters'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@shared/utils/cn'

export const MenuPage = () => {
  const { menuSlug, token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [menu, setMenu] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [vegOnly, setVegOnly] = useState(false)
  const [detailItem, setDetailItem] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const categoryRefs = useRef({})
  const categoryScrollRef = useRef(null)
  const { getTotalItems, getTotalAmount, openCart } = useCart()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => { fetchMenu() }, [])

  const fetchMenu = async () => {
    try {
      const r = await menuAPI.getPublicMenu(menuSlug, token)
      setMenu(r.data)
    } catch { toast.error('Failed to load menu') }
    finally { setLoading(false) }
  }

  const allItems = menu?.items || []
  const categories = [...new Set(allItems.map(i => i.category))]

  const filteredItems = allItems.filter(i => {
    const hidden = i.availability?.status === 'hidden'
    if (hidden) return false
    const matchSearch = !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = selectedCategory === 'all' || i.category === selectedCategory
    const matchVeg = !vegOnly || i.isVeg
    return matchSearch && matchCat && matchVeg
  })

  const groupedItems = {}
  filteredItems.forEach(i => { if (!groupedItems[i.category]) groupedItems[i.category] = []; groupedItems[i.category].push(i) })

  const itemCount = allItems.length
  const categoryCount = categories.length

  const scrollToCategory = (cat) => {
    setSelectedCategory(cat)
    if (cat !== 'all' && categoryRefs.current[cat]) {
      categoryRefs.current[cat].scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading) return <PageLoader message="Loading menu..." />

  const totalCartItems = getTotalItems()

  return (
    <div className="min-h-screen bg-[#050816]">

      {/* ═══════════ HERO HEADER ═══════════ */}
      <div className="relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-10 right-0 w-[300px] h-[200px] bg-pink-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {totalCartItems > 0 && (
              <button onClick={openCart} className="relative w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 hover:bg-violet-600/30 transition-all">
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">{totalCartItems}</span>
              </button>
            )}
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="relative z-10 px-5 pt-2 pb-6">
          <div className="flex items-center gap-4 mb-4">
            {menu?.restaurant?.restaurantLogo ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-violet-500/30 flex-shrink-0">
                <img src={menu.restaurant.restaurantLogo} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                <UtensilsCrossed className="w-7 h-7 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white truncate">{menu?.restaurant?.name || 'Restaurant'}</h1>
              <p className="text-sm text-zinc-400 mt-0.5 line-clamp-1">{menu?.restaurant?.description || 'Delicious food awaits'}</p>
            </div>
          </div>

          {/* Meta pills */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {menu?.tableNumber && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/20 text-violet-300 text-xs font-semibold">
                Table {menu.tableNumber}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Open Now
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-xs font-medium">
              {itemCount} Items • {categoryCount} Categories
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#0D1324] border border-white/8 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ STICKY CATEGORY TABS ═══════════ */}
      <div className="sticky top-0 z-20 bg-[#050816]/95 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-3" ref={categoryScrollRef}>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {/* Veg toggle */}
            <button onClick={() => setVegOnly(!vegOnly)}
              className={cn('flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border',
                vegOnly
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-transparent text-zinc-500 border-white/8 hover:border-white/15 hover:text-zinc-300'
              )}>
              <Leaf className="w-3.5 h-3.5" /> Veg
            </button>

            {/* All chip */}
            <button onClick={() => scrollToCategory('all')}
              className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white border-transparent shadow-lg shadow-violet-500/20'
                  : 'bg-transparent text-zinc-500 border-white/8 hover:border-white/15 hover:text-zinc-300'
              )}>All</button>

            {categories.map(cat => (
              <button key={cat} onClick={() => scrollToCategory(cat)}
                className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all capitalize border',
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white border-transparent shadow-lg shadow-violet-500/20'
                    : 'bg-transparent text-zinc-500 border-white/8 hover:border-white/15 hover:text-zinc-300'
                )}>{cat}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ MENU ITEMS ═══════════ */}
      <div className="px-4 pt-4 pb-32">
        {filteredItems.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([cat, catItems], ci) => (
              <div key={cat} ref={el => categoryRefs.current[cat] = el} className="scroll-mt-20">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: ci * 0.04 }}
                  className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-white capitalize">{cat}</h2>
                  <span className="text-[10px] font-semibold text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md">{catItems.length}</span>
                  <div className="h-px flex-1 bg-white/5" />
                </motion.div>
                <div className="space-y-3">
                  {catItems.map((item, i) => (
                    <ItemCard key={item.id} item={item} onOpenDetail={setDetailItem} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <Search className="w-7 h-7 text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-base font-medium">No items found</p>
            <p className="text-zinc-600 text-sm mt-1">Try a different search or filter</p>
          </div>
        )}
      </div>

      {/* ═══════════ FLOATING CART BUTTON ═══════════ */}
      <AnimatePresence>
        {totalCartItems > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-5 left-4 right-4 z-30 max-w-lg mx-auto">
            <button onClick={openCart}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold flex items-center justify-between shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all active:scale-[0.98]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-sm">{totalCartItems} {totalCartItems === 1 ? 'item' : 'items'}</span>
              </div>
              <span className="text-lg font-bold">{formatCurrency(getTotalAmount())}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ MODALS ═══════════ */}
      <ItemDetailModal item={detailItem} isOpen={!!detailItem} onClose={() => setDetailItem(null)} />
    </div>
  )
}
