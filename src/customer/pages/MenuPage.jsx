import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, ChevronLeft, X, Leaf, Moon, Sun, UtensilsCrossed, Sparkles } from 'lucide-react'
import { ItemCard } from '../components/ItemCard'
import { ComboCard } from '../components/ComboCard'
import { ItemDetailModal } from '../components/ItemDetailModal'
import { PageLoader } from '@shared/components/Spinner'
import { useCart } from '@shared/contexts/CartContext'
import { useTheme } from '@shared/contexts/ThemeContext'
import { menuAPI } from '@shared/api/endpoints'
import { formatCurrency } from '@shared/utils/formatters'
import { getDisplayPriceInfo } from '@shared/utils/priceEngine'
import { isComboItem } from '@shared/utils/comboPricing'
import { mockMenuItems, mockRestaurant } from '@shared/utils/mockData'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@shared/utils/cn'

const TAB_CONFIG = [
  { id: 'menu', label: 'Menu' },
  { id: 'combos', label: 'Combos' },
]

const COMBO_TABS = [
  { id: 'ready', label: 'Ready Combos' },
  { id: 'custom', label: 'Build Your Own' },
]

const buildDemoMenu = () => ({
  restaurant: {
    ...mockRestaurant,
    restaurantLogo: null,
  },
  tableNumber: 1,
  items: [
    ...mockMenuItems.map((item, index) => ({
      ...item,
      id: item.id,
      isAvailable: true,
      availability: { status: 'available' },
      badge: index === 1 ? 'popular' : index === 3 ? 'chef-special' : index === 5 ? 'new' : item.badge?.variant || item.badge || null,
      preparationTime: 12 + (index % 4) * 3,
      isVeg: item.tags?.includes('vegetarian') || index % 2 === 0,
      variants: index === 0
        ? [
            { name: 'Regular', price: item.price, isDefault: true, isAvailable: true },
            { name: 'Large', price: item.price + 80, isAvailable: true },
          ]
        : [],
    })),
    {
      id: 'demo-combo-1',
      name: 'Happy Meal',
      description: 'The best and good meal',
      itemType: 'COMBO',
      comboType: 'fixed',
      comboItems: [
        { itemId: { id: '1', name: 'Margherita Pizza', image: mockMenuItems[0].image, category: 'main course' }, quantity: 1, price: 299, name: 'Margherita Pizza' },
        { itemId: { id: '6', name: 'Fresh Lemonade', image: mockMenuItems[5].image, category: 'beverages' }, quantity: 1, price: 79, name: 'Fresh Lemonade' },
      ],
      price: 150,
      sellingPrice: 150,
      currency: 'INR',
      image: mockMenuItems[4].image,
      isVeg: true,
      badge: 'trending',
      tags: ['trending', 'popular'],
      preparationTime: 15,
      availability: { status: 'available' },
    },
    {
      id: 'demo-combo-2',
      name: 'Best Combo',
      description: 'Customize your own meal from premium choices.',
      itemType: 'COMBO',
      comboType: 'custom',
      comboRules: {
        groups: [
          {
            id: 'pizza',
            name: 'Pizza',
            minSelections: 1,
            maxSelections: 1,
            options: [
              { itemId: { id: '1', name: 'Margherita Pizza', category: 'main course' }, name: 'Margherita', price: 299 },
              { itemId: { id: '4', name: 'Butter Chicken', category: 'main course' }, name: 'Farmhouse', price: 349 },
            ],
          },
          {
            id: 'drink',
            name: 'Drink',
            minSelections: 1,
            maxSelections: 1,
            options: [
              { itemId: { id: '6', name: 'Fresh Lemonade', category: 'beverages' }, name: 'Lemonade', price: 79 },
              { itemId: { id: '5', name: 'Chocolate Lava Cake', category: 'desserts' }, name: 'Soda', price: 49 },
            ],
          },
        ],
      },
      price: 124,
      sellingPrice: 0,
      currency: 'INR',
      image: mockMenuItems[0].image,
      isVeg: true,
      badge: 'popular',
      tags: ['popular', 'customizable'],
      preparationTime: 15,
      availability: { status: 'available' },
    },
  ],
})

export const MenuPage = () => {
  const { menuSlug, token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [menu, setMenu] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [vegOnly, setVegOnly] = useState(false)
  const [detailItem, setDetailItem] = useState(null)
  const [primaryTab, setPrimaryTab] = useState('menu')
  const [comboTab, setComboTab] = useState('ready')
  const categoryRefs = useRef({})
  const { getTotalItems, getTotalAmount, openCart } = useCart()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await menuAPI.getPublicMenu(menuSlug, token)
        setMenu(response.data)
      } catch {
        toast.error('Loaded demo menu preview')
        setMenu(buildDemoMenu())
      } finally {
        setLoading(false)
      }
    }

    fetchMenu()
  }, [menuSlug, token])

  const allItems = useMemo(
    () => (menu?.items || []).filter(item => getDisplayPriceInfo(item).isValid),
    [menu]
  )

  const allCombos = useMemo(
    () => allItems.filter(item => isComboItem(item) && item.availability?.status !== 'hidden'),
    [allItems]
  )

  const readyCombos = useMemo(
    () => allCombos.filter(item => item.comboType !== 'custom'),
    [allCombos]
  )

  const customCombos = useMemo(
    () => allCombos.filter(item => item.comboType === 'custom'),
    [allCombos]
  )

  const regularItems = useMemo(
    () => allItems.filter(item => !isComboItem(item) && item.availability?.status !== 'hidden'),
    [allItems]
  )

  const categories = useMemo(
    () => [...new Set(regularItems.map(item => item.category).filter(Boolean))],
    [regularItems]
  )

  const filteredMenuItems = useMemo(() => {
    return regularItems.filter((item) => {
      const matchSearch = !searchQuery
        || item.name.toLowerCase().includes(searchQuery.toLowerCase())
        || item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory
      const matchVeg = !vegOnly || item.isVeg
      return matchSearch && matchCategory && matchVeg
    })
  }, [regularItems, searchQuery, selectedCategory, vegOnly])

  const groupedMenuItems = useMemo(() => {
    return filteredMenuItems.reduce((groups, item) => {
      const key = item.category || 'uncategorized'
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
      return groups
    }, {})
  }, [filteredMenuItems])

  const filteredReadyCombos = useMemo(() => {
    return readyCombos.filter((item) => {
      const matchSearch = !searchQuery
        || item.name.toLowerCase().includes(searchQuery.toLowerCase())
        || item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchVeg = !vegOnly || item.isVeg
      return matchSearch && matchVeg
    })
  }, [readyCombos, searchQuery, vegOnly])

  const filteredCustomCombos = useMemo(() => {
    return customCombos.filter((item) => {
      const matchSearch = !searchQuery
        || item.name.toLowerCase().includes(searchQuery.toLowerCase())
        || item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchVeg = !vegOnly || item.isVeg
      return matchSearch && matchVeg
    })
  }, [customCombos, searchQuery, vegOnly])

  const currentComboItems = comboTab === 'ready' ? filteredReadyCombos : filteredCustomCombos
  const totalCartItems = getTotalItems()
  const comboCount = allCombos.length
  const readyComboCount = readyCombos.length
  const customComboCount = customCombos.length

  const scrollToCategory = (category) => {
    setSelectedCategory(category)
    if (category === 'all') return
    const node = categoryRefs.current[category]
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) return <PageLoader message="Loading menu..." />

  return (
    <div className="min-h-screen bg-[#050816]">
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-10 right-0 w-[300px] h-[200px] bg-pink-600/10 rounded-full blur-[100px] pointer-events-none" />

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
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                  {totalCartItems}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="relative z-10 px-5 pt-2 pb-4">
          <div className="flex items-center gap-4 mb-4">
            {menu?.restaurant?.restaurantLogo ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-violet-500/30 flex-shrink-0">
                <img src={menu.restaurant.restaurantLogo} alt="" className="w-full h-full object-cover" loading="eager" decoding="async" />
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
              {allItems.length} Items · {categories.length + (comboCount > 0 ? 1 : 0)} Categories
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-xs font-medium">
              {comboCount} Combos
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder={primaryTab === 'combos' ? 'Search combos...' : 'Search dishes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#0D1324] border border-white/8 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300" aria-label="Clear search">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-20 bg-[#050816]/95 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPrimaryTab(tab.id)}
                className={cn(
                  'rounded-xl px-4 py-3 text-sm font-semibold transition-all border',
                  primaryTab === tab.id
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white border-transparent shadow-lg shadow-violet-500/20'
                    : 'bg-transparent text-zinc-500 border-white/8 hover:border-white/15 hover:text-zinc-300'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setVegOnly((prev) => !prev)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border',
                vegOnly
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-transparent text-zinc-500 border-white/8 hover:border-white/15 hover:text-zinc-300'
              )}
            >
              <Leaf className="w-3.5 h-3.5" /> Veg only
            </button>

            {primaryTab === 'menu' ? (
              <>
                <button
                  onClick={() => scrollToCategory('all')}
                  className={cn(
                    'flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white border-transparent shadow-lg shadow-violet-500/20'
                      : 'bg-transparent text-zinc-500 border-white/8 hover:border-white/15 hover:text-zinc-300'
                  )}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => scrollToCategory(category)}
                    className={cn(
                      'flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all capitalize border',
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white border-transparent shadow-lg shadow-violet-500/20'
                        : 'bg-transparent text-zinc-500 border-white/8 hover:border-white/15 hover:text-zinc-300'
                    )}
                  >
                    {category}
                  </button>
                ))}
              </>
            ) : (
              <>
                {COMBO_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setComboTab(tab.id)}
                    className={cn(
                      'flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
                      comboTab === tab.id
                        ? 'bg-gradient-to-r from-emerald-500 to-amber-500 text-white border-transparent shadow-lg shadow-emerald-500/20'
                        : 'bg-transparent text-zinc-500 border-white/8 hover:border-white/15 hover:text-zinc-300'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-32">
        {primaryTab === 'menu' ? (
          filteredMenuItems.length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedMenuItems).map(([category, items], index) => (
                <div key={category} ref={el => { categoryRefs.current[category] = el }} className="scroll-mt-28">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex items-center gap-3 mb-4"
                  >
                    <h2 className="text-lg font-bold text-white capitalize">{category}</h2>
                    <span className="text-[10px] font-semibold text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md">{items.length}</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </motion.div>
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <ItemCard key={item.id} item={item} onOpenDetail={setDetailItem} index={index} />
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
          )
        ) : currentComboItems.length > 0 ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Combo Studio</p>
                <h2 className="text-2xl font-bold text-white leading-tight">
                  {comboTab === 'ready' ? 'Premium ready-to-order combos' : 'Interactive build-your-own combos'}
                </h2>
                <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
                  {comboTab === 'ready'
                    ? 'These combos are bundled and priced for convenience. Open any card for a polished bottom sheet with pricing, included items, and a sticky add-to-cart action.'
                    : 'These combos let customers build a meal step by step with live pricing, required groups, and validation before checkout.'}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.03] p-4">
                  <p className="text-[10px] text-zinc-500">Ready Combos</p>
                  <p className="mt-2 text-2xl font-black text-emerald-300">{readyComboCount}</p>
                </div>
                <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.03] p-4">
                  <p className="text-[10px] text-zinc-500">Build Your Own</p>
                  <p className="mt-2 text-2xl font-black text-violet-300">{customComboCount}</p>
                </div>
                <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.03] p-4">
                  <p className="text-[10px] text-zinc-500">Active Filter</p>
                  <p className="mt-2 text-lg font-bold text-white">{vegOnly ? 'Veg only' : 'All items'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {currentComboItems.map((item, index) => (
                <ComboCard key={item.id} item={item} onOpenDetail={setDetailItem} index={index} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-base font-medium">No combos found</p>
            <p className="text-zinc-600 text-sm mt-1">Try a different search or turn off Veg only</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {totalCartItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-5 left-4 right-4 z-30 max-w-lg mx-auto"
          >
            <button
              onClick={openCart}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold flex items-center justify-between shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all active:scale-[0.98]"
            >
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

      <ItemDetailModal item={detailItem} isOpen={!!detailItem} onClose={() => setDetailItem(null)} />
    </div>
  )
}
