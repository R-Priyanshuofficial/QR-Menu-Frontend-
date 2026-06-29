import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Check,
  Image,
  Loader2,
  Minus,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { Card } from '@shared/components/Card'
import { Button } from '@shared/components/Button'
import { Badge } from '@shared/components/Badge'
import { Input, TextArea } from '@shared/components/Input'
import { PageHeader } from '@shared/components/PageHeader'
import { menuAPI } from '@shared/api/endpoints'
import { cn } from '@shared/utils/cn'
import { formatCurrency } from '@shared/utils/formatters'
import { getComboPresentation, isComboItem } from '@shared/utils/comboPricing'
import { getDisplayPriceInfo } from '@shared/utils/priceEngine'
import toast from 'react-hot-toast'

const TAG_OPTIONS = [
  { id: 'veg', label: 'Veg' },
  { id: 'non-veg', label: 'Non-Veg' },
  { id: 'jain', label: 'Jain' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten Free' },
]

const BADGE_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'bestseller', label: 'Bestseller' },
  { id: 'new', label: 'New' },
  { id: 'chef-special', label: 'Chef Special' },
  { id: 'trending', label: 'Trending' },
]

const DEFAULT_FORM = {
  name: '',
  description: '',
  category: '',
  image: '',
  comboType: 'fixed',
  comboPrice: '',
  tags: [],
  badge: 'none',
}

const DEFAULT_ITEM_FORM = {
  name: '',
  price: '',
  category: '',
}

const makeId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

const toId = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  return String(value.id || value._id || '')
}

const priceOf = (item) => {
  const info = getDisplayPriceInfo(item)
  return info.hasVariants ? info.minPrice : info.display
}

const createCustomGroup = (order = 0) => ({
  id: makeId('group'),
  name: '',
  minSelections: 1,
  maxSelections: 1,
  options: [],
  selectedItemId: '',
  order,
})

const normalizeFixedItems = (entries = []) => entries
  .map(entry => ({
    itemId: toId(entry?.itemId || entry?.id || entry?.menuItemId),
    quantity: Math.max(1, parseInt(entry?.quantity, 10) || 1),
  }))
  .filter(entry => entry.itemId)

const normalizeFixedItemQuantities = (entries = []) => entries.reduce((acc, entry) => {
  const itemId = toId(entry?.itemId || entry?.id || entry?.menuItemId)
  if (!itemId) return acc
  const quantity = Math.max(1, parseInt(entry?.quantity, 10) || 1)
  acc[itemId] = (acc[itemId] || 0) + quantity
  return acc
}, {})

const normalizeCustomGroup = (group, byId, order = 0) => {
  const rawOptions = Array.isArray(group?.options) ? group.options : []
  const fallbackOptions = Array.isArray(group?.itemIds)
    ? group.itemIds.map(itemId => ({ itemId }))
    : []

  const options = [...rawOptions, ...fallbackOptions]
    .map((option) => {
      const itemId = toId(option?.itemId || option?.id)
      if (!itemId) return null
      const source = byId.get(itemId)
      return {
        itemId,
        name: source?.name || option?.name || 'Option',
        category: source?.category || option?.category || '',
        price: source ? priceOf(source) : Math.max(0, parseFloat(option?.price) || 0),
      }
    })
    .filter(Boolean)

  const selectedItemId = toId(group?.selectedItemId || group?.defaultItemId || group?.defaultItem || options[0]?.itemId)
  const minSelections = Math.max(1, parseInt(group?.minSelections ?? group?.quantity ?? 1, 10) || 1)
  const maxSelections = Math.max(minSelections, parseInt(group?.maxSelections ?? group?.quantity ?? minSelections, 10) || minSelections)

  return {
    id: group?.id || makeId('group'),
    name: group?.name || '',
    minSelections,
    maxSelections,
    quantity: minSelections,
    options,
    selectedItemId: options.some(option => option.itemId === selectedItemId) ? selectedItemId : (options[0]?.itemId || ''),
    order: parseInt(group?.order ?? order, 10) || order,
  }
}

export const ComboBuilderPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const editingCombo = location.state?.combo || null

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(DEFAULT_FORM)
  const [fixedItemQuantities, setFixedItemQuantities] = useState({})
  const [groups, setGroups] = useState([createCustomGroup(0)])
  const [activeGroupId, setActiveGroupId] = useState('')
  const [search, setSearch] = useState('')
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [itemForm, setItemForm] = useState(DEFAULT_ITEM_FORM)
  const [creatingItem, setCreatingItem] = useState(false)

  useEffect(() => {
    fetchMenu()
  }, [])

  useEffect(() => {
    if (loading) return

    if (!editingCombo) {
      const freshGroup = createCustomGroup(0)
      setForm({ ...DEFAULT_FORM, category: '' })
      setFixedItemQuantities({})
      setGroups([freshGroup])
      setActiveGroupId(freshGroup.id)
      setItemForm({ ...DEFAULT_ITEM_FORM, category: '' })
      return
    }

    const byId = new Map(items.map(item => [toId(item), item]))
    const normalizedFixedItems = normalizeFixedItems(editingCombo.comboItems || [])
    const normalizedGroups = (editingCombo.comboRules?.groups || [])
      .map((group, index) => normalizeCustomGroup(group, byId, index))
      .sort((a, b) => a.order - b.order)

    const nextGroupList = normalizedGroups.length > 0 ? normalizedGroups : [createCustomGroup(0)]
    setForm({
      name: editingCombo.name || '',
      description: editingCombo.description || '',
      category: editingCombo.category || '',
      image: editingCombo.image || '',
      comboType: editingCombo.comboType || 'fixed',
      comboPrice: String(editingCombo.sellingPrice ?? editingCombo.price ?? ''),
      tags: Array.isArray(editingCombo.tags) ? editingCombo.tags : [],
      badge: editingCombo.badge || 'none',
    })
    setFixedItemQuantities(normalizeFixedItemQuantities(normalizedFixedItems))
    setGroups(nextGroupList)
    setActiveGroupId(nextGroupList[0]?.id || '')
    setItemForm({ ...DEFAULT_ITEM_FORM, category: editingCombo.category || categories[0] || '' })
  }, [editingCombo, loading, categories, items])

  const fetchMenu = async () => {
    try {
      const response = await menuAPI.getOwnerMenu()
      const nextItems = response.data.items || []
      setItems(nextItems)
      setCategories([...new Set(nextItems.map(item => item.category).filter(Boolean))].sort())
    } catch {
      toast.error('Failed to load menu items')
      setItems([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const updateItemForm = (field, value) => setItemForm(prev => ({ ...prev, [field]: value }))

  const toggleTag = (tagId) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId) ? prev.tags.filter(tag => tag !== tagId) : [...prev.tags, tagId],
    }))
  }

  const byId = useMemo(() => new Map(items.map(item => [toId(item), item])), [items])

  const availableItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items
      .filter(item => item && !isComboItem(item))
      .filter(item => item.isActive !== false)
      .filter(item => getDisplayPriceInfo(item).isValid)
      .filter(item => {
        if (!query) return true
        return [item.name, item.description, item.category].some(field => String(field || '').toLowerCase().includes(query))
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [items, search])

  const previewGroups = useMemo(
    () => groups.map((group, index) => normalizeCustomGroup(group, byId, index)),
    [groups, byId]
  )

  const fixedItems = useMemo(() => Object.entries(fixedItemQuantities).map(([itemId, quantity]) => ({
    itemId,
    quantity: Math.max(1, parseInt(quantity, 10) || 1),
  })).filter(entry => entry.itemId), [fixedItemQuantities])

  const previewFixedItems = useMemo(() => fixedItems.map((entry) => {
    const item = byId.get(entry.itemId)
    if (!item) return null
    return {
      id: toId(item),
      name: item.name,
      category: item.category,
      quantity: entry.quantity,
      price: priceOf(item),
      currency: item.currency,
    }
  }).filter(Boolean), [fixedItems, byId])

  const previewItem = useMemo(() => ({
    name: form.name,
    description: form.description,
    image: form.image,
    category: form.category,
    badge: form.badge,
    tags: form.tags,
    itemType: 'COMBO',
    comboType: form.comboType,
    sellingPrice: parseFloat(form.comboPrice) || 0,
    price: parseFloat(form.comboPrice) || 0,
    comboItems: previewFixedItems.map(item => ({
      itemId: item.id,
      quantity: item.quantity,
      name: item.name,
      category: item.category,
      price: item.price,
    })),
    comboRules: { groups: previewGroups },
  }), [form, previewFixedItems, previewGroups])

  const preview = useMemo(() => getComboPresentation(previewItem), [previewItem])

  const fixedRegularTotal = previewFixedItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
  const customRegularTotal = preview.regularTotal
  const regularTotal = form.comboType === 'fixed' ? fixedRegularTotal : customRegularTotal
  const comboPrice = parseFloat(form.comboPrice) || 0
  const savings = Math.max(0, regularTotal - comboPrice)
  const discountPercent = regularTotal > 0 ? Math.round((savings / regularTotal) * 100) : 0
  const comboPriceInvalid = comboPrice > 0 && regularTotal > 0 && comboPrice > regularTotal

  const addFixedItem = (item) => {
    const itemId = toId(item)
    if (!itemId) return

    setFixedItemQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 0) + 1),
    }))
  }

  const updateFixedQuantity = (itemId, delta) => {
    setFixedItemQuantities(prev => {
      const current = Math.max(1, parseInt(prev[itemId], 10) || 1)
      const next = current + delta
      if (next <= 0) {
        const { [itemId]: _removed, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [itemId]: next,
      }
    })
  }

  const removeFixedItem = (itemId) => {
    setFixedItemQuantities(prev => {
      const { [itemId]: _removed, ...rest } = prev
      return rest
    })
  }

  const addCustomItem = (item, targetGroupId = activeGroupId) => {
    const itemId = toId(item)
    if (!itemId) return

    setGroups(prev => prev.map(group => {
      if (group.id !== targetGroupId) return group
      if (group.options.some(option => option.itemId === itemId)) return group

      return {
        ...group,
        options: [
          ...group.options,
          {
            itemId,
            name: item.name || '',
            category: item.category || '',
            price: priceOf(item),
          },
        ],
        selectedItemId: group.selectedItemId || itemId,
      }
    }))
  }

  const updateGroup = (groupId, field, value) => {
    setGroups(prev => prev.map(group => {
      if (group.id !== groupId) return group

      if (field === 'minSelections') {
        const nextMin = Math.max(1, parseInt(value, 10) || 1)
        return {
          ...group,
          minSelections: nextMin,
          maxSelections: Math.max(nextMin, group.maxSelections || nextMin),
          quantity: nextMin,
        }
      }

      if (field === 'maxSelections') {
        const nextMax = Math.max(1, parseInt(value, 10) || 1)
        return {
          ...group,
          maxSelections: Math.max(nextMax, group.minSelections || 1),
        }
      }

      return { ...group, [field]: value }
    }))
  }

  const moveGroup = (groupId, direction) => {
    setGroups(prev => {
      const index = prev.findIndex(group => group.id === groupId)
      if (index < 0) return prev
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(nextIndex, 0, moved)
      return next.map((group, order) => ({ ...group, order }))
    })
  }

  const removeGroup = (groupId) => {
    setGroups(prev => {
      const next = prev.filter(group => group.id !== groupId)
      if (next.length === 0) {
        const fresh = createCustomGroup(0)
        setActiveGroupId(fresh.id)
        return [fresh]
      }
      if (activeGroupId === groupId) {
        setActiveGroupId(next[0].id)
      }
      return next.map((group, order) => ({ ...group, order }))
    })
  }

  const normalizeForSave = () => {
    return previewGroups
      .filter(group => group.name.trim() && group.options.length > 0)
      .map(group => ({
        id: group.id,
        name: group.name.trim(),
        order: group.order,
        quantity: group.minSelections,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        selectedItemId: group.selectedItemId || group.options[0]?.itemId || '',
        defaultItemId: group.selectedItemId || group.options[0]?.itemId || '',
        options: group.options.map(option => ({
          itemId: option.itemId,
          name: option.name,
          category: option.category,
          price: option.price,
        })),
      }))
      .sort((a, b) => a.order - b.order)
  }

  const createMenuItem = async () => {
    const name = itemForm.name.trim()
    const category = itemForm.category.trim() || form.category.trim()
    const price = parseFloat(itemForm.price) || 0

    if (!name || !(price > 0) || !category) {
      toast.error('Please enter name, price, and category.')
      return
    }

    setCreatingItem(true)
    try {
      const payload = {
        name,
        description: '',
        sellingPrice: price,
        price,
        category,
        image: '',
        isVeg: true,
        spiceLevel: 'none',
        preparationTime: 15,
        tags: [],
        badge: 'none',
        productType: 'simple',
        itemType: 'NORMAL',
        originalMarketPrice: 0,
        offerPrice: 0,
        costPrice: 0,
        useDefaultTax: true,
        customTaxRate: null,
        taxPercent: 0,
        variants: [],
        addons: [],
        availability: { status: 'in-stock', timeSlots: ['all-day'] },
        sku: '',
        calories: 0,
        servingSize: '',
        sortOrder: 0,
      }

      const response = await menuAPI.addItem(payload)
      const createdItem = response.data?.data?.item
      if (!createdItem) throw new Error('Failed to create item')

      setItems(prev => [createdItem, ...prev])
      setCategories(prev => [...new Set([...prev, category])].sort())

      if (form.comboType === 'custom') {
        const targetGroupId = activeGroupId || groups[0]?.id
        if (targetGroupId) addCustomItem(createdItem, targetGroupId)
      } else {
        addFixedItem(createdItem)
      }

      setItemForm({ ...DEFAULT_ITEM_FORM, category })
      setShowCreateDrawer(false)
      toast.success('New item added to menu and combo')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create item')
    } finally {
      setCreatingItem(false)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Combo name is required')
    if (!form.category.trim()) return toast.error('Category is required')
    if (form.comboType === 'fixed') {
      if (!(comboPrice > 0)) return toast.error('Base combo price must be greater than 0')
      if (comboPriceInvalid) return toast.error('Base combo price cannot exceed the regular total')
    }

    if (form.comboType === 'fixed') {
      if (fixedItems.length === 0) return toast.error('Please select at least one menu item')
    } else {
      const validGroups = normalizeForSave()
      if (validGroups.length === 0) return toast.error('Add at least one option group with items')
      if (validGroups.some(group => group.options.length < group.minSelections)) {
        return toast.error('Each group needs enough options for its minimum selection count')
      }
    }

    setSaving(true)
    try {
      const comboRules = form.comboType === 'custom' ? { groups: normalizeForSave() } : null
      const payload = {
        id: editingCombo?.id,
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
        category: form.category.trim(),
        tags: form.tags,
        badge: form.badge,
        itemType: 'COMBO',
        comboType: form.comboType,
        productType: 'simple',
        sellingPrice: form.comboType === 'custom' ? 0 : comboPrice,
        price: form.comboType === 'custom' ? 0 : comboPrice,
        offerPrice: 0,
        originalMarketPrice: 0,
        comparePrice: 0,
        costPrice: 0,
        useDefaultTax: true,
        customTaxRate: null,
        taxPercent: 0,
        variants: [],
        addons: [],
        comboItems: form.comboType === 'fixed' ? fixedItems : [],
        comboRegularTotal: regularTotal,
        comboSavings: savings,
        comboRules,
        availability: { status: 'in-stock', timeSlots: ['all-day'] },
        sku: '',
        calories: 0,
        servingSize: '',
        sortOrder: 0,
      }

      if (editingCombo?.id) {
        await menuAPI.updateItem(editingCombo.id, payload)
        toast.success('Combo updated!')
      } else {
        await menuAPI.addItem(payload)
        toast.success('Combo created!')
      }

      navigate('/owner/menu', { replace: true })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save combo')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1500px] mx-auto px-4 lg:px-0 py-8">
        <div className="rounded-3xl border border-surface-200 dark:border-surface-700/40 bg-white dark:bg-surface-900/70 p-8 text-center text-surface-500">
          Loading combo builder...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1500px] mx-auto px-4 lg:px-0 py-6 lg:py-8">
      <PageHeader
        title={editingCombo ? 'Edit Combo' : 'Create Combo'}
        subtitle="Build restaurant-grade fixed and custom combos with a clean step flow."
        actions={
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/owner/menu')}>
            Back to Menu
          </Button>
        }
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(340px,3fr)] gap-6 items-start">
        <div className="space-y-6">
          <Card className="p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">Step 1</p>
                <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">Basic Information</h2>
              </div>
              <Badge variant="gray" size="sm">Required</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Combo Name" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="e.g. Family Feast" required />
              <Input label="Combo Image" value={form.image} onChange={(e) => updateForm('image', e.target.value)} placeholder="https://..." leftIcon={<Image className="w-4 h-4" />} />
              <div className="md:col-span-2">
                <TextArea label="Combo Description" value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Describe what's included and why it's special..." rows={3} />
              </div>
              <Input label="Category" value={form.category} onChange={(e) => updateForm('category', e.target.value)} placeholder="e.g. Meal Combos, Lunch Specials..." required />
              <p className="text-[11px] text-surface-400 -mt-2 md:col-span-2">Category is required. Combos will appear in their own dedicated section on the menu.</p>
              {form.comboType === 'fixed' && (
                <div>
                  <Input
                    label="Base Combo Price"
                    type="number"
                    value={form.comboPrice}
                    onChange={(e) => updateForm('comboPrice', e.target.value)}
                    placeholder="149"
                  />
                  <p className={cn('mt-2 text-xs', comboPriceInvalid ? 'text-red-500' : 'text-surface-500')}>
                    {comboPriceInvalid
                      ? 'Base combo price cannot exceed the regular total.'
                      : 'This is the actual customer-facing combo price before any premium option upcharges.'}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">Step 2</p>
                <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">Combo Type</h2>
              </div>
              <Badge variant="primary" size="sm">{form.comboType === 'fixed' ? 'Fixed' : 'Custom'}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'fixed', title: 'Fixed Combo', text: 'Customer gets predefined items. No selection required.' },
                { id: 'custom', title: 'Custom Combo', text: 'Customer chooses from grouped options with min/max rules.' },
              ].map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => updateForm('comboType', option.id)}
                  className={cn(
                    'rounded-3xl border p-4 text-left transition-all min-h-28',
                    form.comboType === option.id
                      ? 'border-emerald-500/30 bg-emerald-500/10 shadow-sm'
                      : 'border-surface-200 dark:border-surface-700/40 bg-white dark:bg-surface-900/30 hover:border-emerald-500/20'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">{option.title}</span>
                    <span className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center', form.comboType === option.id ? 'border-emerald-500' : 'border-surface-400')}>
                      {form.comboType === option.id && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 leading-relaxed">{option.text}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">Step 3</p>
                <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                  {form.comboType === 'fixed' ? 'Step 3A: Fixed Combo Builder' : 'Step 3B: Custom Combo Builder'}
                </h2>
              </div>
              <Badge variant="gray" size="sm">
                {form.comboType === 'fixed'
                  ? `${fixedItems.length} selected`
                  : `${previewGroups.filter(group => group.name.trim()).length} groups`}
              </Badge>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-4">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu items..."
                leftIcon={<Search className="w-4 h-4" />}
                containerClassName="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowCreateDrawer(true)}
              >
                Create New Item
              </Button>
            </div>

            {form.comboType === 'fixed' ? (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {availableItems.map(item => {
                    const selected = fixedItems.some(entry => entry.itemId === toId(item))
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addFixedItem(item)}
                        className={cn(
                          'rounded-2xl border p-4 text-left transition-all min-h-36',
                          selected
                            ? 'border-emerald-500/30 bg-emerald-500/10'
                            : 'border-surface-200 dark:border-surface-700/40 bg-white dark:bg-surface-900/30 hover:border-emerald-500/20'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-surface-900 dark:text-surface-100 truncate">{item.name}</p>
                            <p className="text-xs text-surface-500 capitalize">{item.category}</p>
                          </div>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(priceOf(item), item.currency)}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className={cn('text-[11px] font-semibold', selected ? 'text-emerald-600' : 'text-surface-500')}>
                            {selected ? 'Selected' : 'Add to combo'}
                          </span>
                          <span className={cn('w-6 h-6 rounded-md border flex items-center justify-center', selected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-surface-300 dark:border-surface-600 text-transparent')}>
                            {selected && <Check className="w-3.5 h-3.5" />}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {previewFixedItems.length > 0 ? (
                  <div className="grid gap-3 pt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">Selected Items Summary</p>
                      <Badge variant="gray" size="sm">{previewFixedItems.length} cards</Badge>
                    </div>
                    {previewFixedItems.map(item => (
                      <div key={item.id} className="rounded-2xl border border-surface-200 dark:border-surface-700/40 bg-surface-50 dark:bg-surface-900/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{item.name}</p>
                            <p className="text-xs text-surface-500 capitalize">{item.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{formatCurrency(item.price, item.currency)}</p>
                            <p className="text-[11px] text-surface-500">Regular item price</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => updateFixedQuantity(item.id, -1)} className="w-8 h-8 rounded-lg border border-surface-300 dark:border-surface-700 flex items-center justify-center text-surface-600 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-800/60">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="min-w-8 text-center text-sm font-bold text-surface-900 dark:text-surface-100">{item.quantity}</span>
                            <button type="button" onClick={() => updateFixedQuantity(item.id, 1)} className="w-8 h-8 rounded-lg border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button type="button" onClick={() => removeFixedItem(item.id)} className="w-8 h-8 rounded-lg border border-transparent flex items-center justify-center text-surface-400 hover:text-red-500 hover:bg-red-500/10">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 p-6 text-center text-sm text-surface-500">
                    Select items to build the fixed combo.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-surface-500">Create groups like Burger, Drink, Dessert. Reorder them with the arrow buttons.</p>
                  <Button size="sm" variant="outline" leftIcon={<Plus className="w-4 h-4" />} onClick={() => {
                    const nextGroup = createCustomGroup(previewGroups.length)
                    setGroups(prev => [...prev, nextGroup])
                    setActiveGroupId(nextGroup.id)
                  }}>
                    Add Group
                  </Button>
                </div>

                <div className="grid gap-4">
                  {previewGroups.map(group => {
                    const selectedOption = group.options.find(option => option.itemId === group.selectedItemId) || group.options[0] || null
                    const isActive = activeGroupId === group.id
                    const availableGroupItems = availableItems.filter(item => !group.options.some(option => option.itemId === toId(item))).slice(0, 10)

                    return (
                      <div
                        key={group.id}
                        className={cn(
                          'rounded-3xl border p-4 transition-all',
                          isActive
                            ? 'border-emerald-500/30 bg-emerald-500/10'
                            : 'border-surface-200 dark:border-surface-700/40 bg-white dark:bg-surface-900/30'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <button type="button" onClick={() => setActiveGroupId(group.id)} className="text-left">
                            <p className="text-xs uppercase tracking-wide text-surface-500">Option Group</p>
                            <p className="text-base font-bold text-surface-900 dark:text-surface-100">{group.name || 'Untitled Group'}</p>
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveGroup(group.id, -1)}
                              className="w-8 h-8 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-white/70 dark:hover:bg-surface-800/60"
                              aria-label="Move group up"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveGroup(group.id, 1)}
                              className="w-8 h-8 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-white/70 dark:hover:bg-surface-800/60"
                              aria-label="Move group down"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => removeGroup(group.id)} className="w-8 h-8 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center text-surface-500 hover:text-red-500 hover:bg-red-500/10">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                          <Input label="Group Name" value={group.name} onChange={(e) => updateGroup(group.id, 'name', e.target.value)} placeholder="Drink" />
                          <Input label="Min Selections" type="number" value={group.minSelections} onChange={(e) => updateGroup(group.id, 'minSelections', e.target.value)} placeholder="1" />
                          <Input label="Max Selections" type="number" value={group.maxSelections} onChange={(e) => updateGroup(group.id, 'maxSelections', e.target.value)} placeholder="1" />
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Selected Options</p>
                            <Badge variant="gray" size="sm">{group.options.length} options</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {group.options.length > 0 ? group.options.map(option => {
                              const selected = group.selectedItemId === option.itemId
                              return (
                                <div
                                  key={option.itemId}
                                  className={cn(
                                    'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold',
                                    selected
                                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                      : 'bg-white dark:bg-surface-900/30 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-700/40'
                                  )}
                                >
                                  <button type="button" onClick={() => updateGroup(group.id, 'selectedItemId', option.itemId)} className="flex items-center gap-2">
                                    {selected && <Check className="w-3 h-3" />}
                                    <span>{option.name}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setGroups(prev => prev.map(g => {
                                      if (g.id !== group.id) return g
                                      const options = g.options.filter(item => item.itemId !== option.itemId)
                                      const selectedItemId = g.selectedItemId === option.itemId ? (options[0]?.itemId || '') : g.selectedItemId
                                      return { ...g, options, selectedItemId }
                                    }))}
                                    className="text-surface-400 hover:text-red-500 transition-colors"
                                    aria-label={`Remove ${option.name}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )
                            }) : (
                              <p className="text-sm text-surface-500">No items in this group yet.</p>
                            )}
                          </div>
                          {selectedOption && (
                            <p className="mt-2 text-xs text-surface-500">
                              Default selection: <span className="font-semibold text-surface-700 dark:text-surface-300">{selectedOption.name}</span>
                            </p>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Add From Search Results</p>
                            <span className="text-[11px] text-surface-500">Adds to this group</span>
                          </div>
                          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
                            {availableGroupItems.map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => addCustomItem(item, group.id)}
                                className="rounded-xl border border-surface-200 dark:border-surface-700/40 bg-white dark:bg-surface-950/30 px-3 py-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300 hover:border-emerald-500/20 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate">{item.name}</span>
                                  <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                                </div>
                                <p className="mt-1 text-[11px] text-surface-500 capitalize">{item.category}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">Advanced Settings</p>
                <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">Tags and Badge</h2>
              </div>
              <Badge variant="gray" size="sm">Optional</Badge>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        'px-3 py-2 rounded-xl border text-xs font-semibold transition-all',
                        form.tags.includes(tag.id)
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                          : 'bg-white dark:bg-surface-900/30 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-700/40'
                      )}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Badge</p>
                <div className="flex flex-wrap gap-2">
                  {BADGE_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => updateForm('badge', option.id)}
                      className={cn(
                        'px-3 py-2 rounded-xl border text-xs font-semibold transition-all',
                        form.badge === option.id
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                          : 'bg-white dark:bg-surface-900/30 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-700/40'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 order-last lg:order-none">
          <Card className="p-5 lg:p-6 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-white to-amber-500/10 dark:from-emerald-500/10 dark:via-surface-900/40 dark:to-amber-500/10">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Live Preview</p>
                <h3 className="text-xl font-bold text-surface-900 dark:text-surface-50">{form.name || 'Combo Preview'}</h3>
              </div>
              <Badge variant="success" size="sm">COMBO</Badge>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl overflow-hidden bg-surface-100 dark:bg-surface-900/60 border border-surface-200 dark:border-surface-700/40 h-44 flex items-center justify-center">
                {form.image ? (
                  <img src={form.image} alt={form.name || 'Combo'} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-surface-400">
                    <Image className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Combo image preview</p>
                  </div>
                )}
              </div>

              {form.comboType === 'custom' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Starting From</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(preview.startingFrom)}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">Maximum Price</p>
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatCurrency(preview.highestPossible)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 dark:bg-surface-950/35 border border-surface-200 dark:border-surface-700/40 p-4">
                    <p className="text-[11px] text-surface-500">Required Groups</p>
                    <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{previewGroups.filter(g => g.name.trim()).length}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 dark:bg-surface-950/35 border border-surface-200 dark:border-surface-700/40 p-4">
                    <p className="text-[11px] text-surface-500">Total Options</p>
                    <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{preview.availableChoiceCount}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/80 dark:bg-surface-950/35 border border-surface-200 dark:border-surface-700/40 p-4">
                    <p className="text-[11px] text-surface-500">Regular Total</p>
                    <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{formatCurrency(regularTotal)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 dark:bg-surface-950/35 border border-surface-200 dark:border-surface-700/40 p-4">
                    <p className="text-[11px] text-surface-500">Combo Price</p>
                    <p className={cn('text-lg font-bold', comboPriceInvalid ? 'text-red-500' : 'text-surface-900 dark:text-surface-100')}>
                      {formatCurrency(comboPrice)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 dark:bg-surface-950/35 border border-surface-200 dark:border-surface-700/40 p-4">
                    <p className="text-[11px] text-surface-500">Customer Saves</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(savings)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 dark:bg-surface-950/35 border border-surface-200 dark:border-surface-700/40 p-4">
                    <p className="text-[11px] text-surface-500">Discount %</p>
                    <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{discountPercent}%</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">Selected Items</p>
                  <Badge variant="gray" size="sm">{form.comboType === 'fixed' ? fixedItems.length : preview.selectedItems.length}</Badge>
                </div>

                {form.comboType === 'fixed' ? (
                  previewFixedItems.length > 0 ? previewFixedItems.map(item => (
                    <div key={item.id} className="rounded-2xl bg-white/80 dark:bg-surface-950/35 border border-surface-200 dark:border-surface-700/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{item.name}</p>
                          <p className="text-xs text-surface-500">{item.quantity} x {formatCurrency(item.price, item.currency)}</p>
                        </div>
                        <span className="text-xs font-semibold text-surface-900 dark:text-surface-100">{formatCurrency(item.price * item.quantity, item.currency)}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 p-4 text-sm text-surface-500 text-center">
                      Select items to build the combo.
                    </div>
                  )
                ) : (
                  previewGroups.filter(group => group.name.trim()).length > 0 ? previewGroups.map(group => (
                    <div key={group.id} className="rounded-2xl bg-white/80 dark:bg-surface-950/35 border border-surface-200 dark:border-surface-700/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{group.name}</p>
                          <p className="text-xs text-surface-500">
                            Choose {group.minSelections}{group.maxSelections > group.minSelections ? `-${group.maxSelections}` : ''} item{group.maxSelections > 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-surface-900 dark:text-surface-100">
                          {formatCurrency((group.options.find(option => option.itemId === group.selectedItemId)?.price || 0) * group.minSelections)}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 p-4 text-sm text-surface-500 text-center">
                      Add option groups to build the combo.
                    </div>
                  )
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => navigate('/owner/menu')}>Cancel</Button>
                <Button variant="gradient" className="flex-1" loading={saving} disabled={saving} onClick={handleSave}>
                  {editingCombo ? 'Update Combo' : 'Create Combo'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowCreateDrawer(true)}
        className="fixed bottom-5 right-5 z-20 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 text-white font-semibold shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] transition-all"
      >
        <Plus className="w-4 h-4" />
        Create New Item
      </button>

      {showCreateDrawer && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreateDrawer(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#0A0F1E] border-l border-white/[0.08] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <div>
                <h3 className="text-lg font-bold text-white">Create New Item</h3>
                <p className="text-xs text-zinc-500">Adds to the menu and the active combo section automatically.</p>
              </div>
              <button
                onClick={() => setShowCreateDrawer(false)}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <Input label="Name" value={itemForm.name} onChange={(e) => updateItemForm('name', e.target.value)} placeholder="Extra Fries" />
              <Input label="Price" type="number" value={itemForm.price} onChange={(e) => updateItemForm('price', e.target.value)} placeholder="49" />
              <Input label="Category" value={itemForm.category} onChange={(e) => updateItemForm('category', e.target.value)} placeholder="Sides" />
              <div className="rounded-2xl border border-dashed border-white/[0.12] p-4 text-xs text-zinc-400">
                The item will be saved to the menu and added to the active combo section automatically.
              </div>
            </div>

            <div className="mt-auto p-5 border-t border-white/[0.08] flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowCreateDrawer(false)}>Cancel</Button>
              <Button variant="gradient" className="flex-1" onClick={createMenuItem} loading={creatingItem}>
                Save Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
