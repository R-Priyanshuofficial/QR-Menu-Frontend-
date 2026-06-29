import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Trash2, Image, Tag, DollarSign, Layers, Clock, Settings2,
  ChevronRight, Zap, Star, TrendingUp, ChefHat, Leaf
} from 'lucide-react'
import { Modal } from '@shared/components/Modal'
import { Input, TextArea } from '@shared/components/Input'
import { Button } from '@shared/components/Button'
import { Badge } from '@shared/components/Badge'
import { cn } from '@shared/utils/cn'
import { formatCurrency } from '@shared/utils/formatters'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'basic', label: 'Basic Info', icon: Tag },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'variants', label: 'Variants', icon: Layers },
  { id: 'addons', label: 'Add-ons', icon: Plus },
  { id: 'availability', label: 'Availability', icon: Clock },
  { id: 'advanced', label: 'Advanced', icon: Settings2 },
]

const TAG_OPTIONS = [
  { id: 'veg', label: 'Veg', color: 'bg-emerald-500' },
  { id: 'non-veg', label: 'Non-Veg', color: 'bg-red-500' },
  { id: 'jain', label: 'Jain', color: 'bg-amber-500' },
  { id: 'vegan', label: 'Vegan', color: 'bg-green-600' },
  { id: 'gluten-free', label: 'Gluten Free', color: 'bg-blue-500' },
]

const BADGE_OPTIONS = [
  { id: 'none', label: 'None', icon: null },
  { id: 'bestseller', label: 'Bestseller', icon: Star },
  { id: 'new', label: 'New', icon: Zap },
  { id: 'chef-special', label: 'Chef Special', icon: ChefHat },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
]

const SPICE_LEVELS = [
  { id: 'none', label: 'None', emoji: '⬜' },
  { id: 'mild', label: 'Mild', emoji: '🌶️' },
  { id: 'medium', label: 'Medium', emoji: '🌶️🌶️' },
  { id: 'hot', label: 'Hot', emoji: '🔥' },
  { id: 'very-hot', label: 'Very Hot', emoji: '🔥🔥' },
]

const DEFAULT_FORM = {
  name: '',
  description: '',
  sellingPrice: '',
  category: '',
  image: '',
  isVeg: true,
  spiceLevel: 'none',
  preparationTime: 15,
  tags: [],
  badge: 'none',
  productType: 'simple',
  originalMarketPrice: '',
  offerPrice: '',
  costPrice: '',
  useDefaultTax: true,
  customTaxRate: '',
  showAdvancedPricing: false,
  showCustomTax: false,
  variants: [],
  addons: [],
  availability: { status: 'in-stock', timeSlots: ['all-day'] },
  sku: '',
  calories: '',
  servingSize: '',
}

export const AddItemModal = ({ isOpen, onClose, onSave, editingItem, categories = [], loading = false }) => {
  const [activeTab, setActiveTab] = useState('basic')
  const [form, setForm] = useState({ ...DEFAULT_FORM })

  useEffect(() => {
    if (editingItem) {
      const hasVariants = (editingItem.variants || []).length > 0
      const hasCustomTax = editingItem.useDefaultTax === false && editingItem.customTaxRate != null
      setForm({
        ...DEFAULT_FORM,
        ...editingItem,
        sellingPrice: (editingItem.sellingPrice || editingItem.price)?.toString() || '',
        originalMarketPrice: (editingItem.originalMarketPrice || editingItem.comparePrice)?.toString() || '',
        offerPrice: editingItem.offerPrice?.toString() || '',
        costPrice: editingItem.costPrice?.toString() || '',
        useDefaultTax: editingItem.useDefaultTax !== false,
        customTaxRate: editingItem.customTaxRate?.toString() || '',
        showCustomTax: hasCustomTax,
        showAdvancedPricing: !!(editingItem.originalMarketPrice || editingItem.comparePrice || editingItem.costPrice),
        calories: editingItem.calories?.toString() || '',
        preparationTime: editingItem.preparationTime || 15,
        tags: editingItem.tags || [],
        badge: editingItem.badge || 'none',
        productType: editingItem.productType || (hasVariants ? 'variable' : 'simple'),
        variants: editingItem.variants || [],
        addons: editingItem.addons || [],
        availability: editingItem.availability || { status: 'in-stock', timeSlots: ['all-day'] },
      })
    } else {
      setForm({ ...DEFAULT_FORM })
    }
    setActiveTab('basic')
  }, [editingItem, isOpen])

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleTag = (tagId) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId) ? prev.tags.filter(t => t !== tagId) : [...prev.tags, tagId]
    }))
  }

  const toggleTimeSlot = (slot) => {
    setForm(prev => {
      const current = prev.availability.timeSlots || []
      const next = current.includes(slot) ? current.filter(s => s !== slot) : [...current, slot]
      return { ...prev, availability: { ...prev.availability, timeSlots: next.length ? next : ['all-day'] } }
    })
  }

  const addVariant = () => setForm(prev => ({
    ...prev,
    variants: [...prev.variants, { name: '', price: '', offerPrice: '', isDefault: prev.variants.length === 0, isAvailable: true }]
  }))
  const updateVariant = (idx, field, value) => setForm(prev => {
    const v = [...prev.variants]
    v[idx] = { ...v[idx], [field]: value }
    return { ...prev, variants: v }
  })
  const removeVariant = (idx) => setForm(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }))

  const addAddon = () => setForm(prev => ({
    ...prev,
    addons: [...prev.addons, { name: '', price: '', isRequired: false, maxQuantity: 1 }]
  }))
  const updateAddon = (idx, field, value) => setForm(prev => {
    const a = [...prev.addons]
    a[idx] = { ...a[idx], [field]: value }
    return { ...prev, addons: a }
  })
  const removeAddon = (idx) => setForm(prev => ({ ...prev, addons: prev.addons.filter((_, i) => i !== idx) }))

  const profitPreview = useMemo(() => {
    const price = parseFloat(form.offerPrice || form.sellingPrice) || 0
    const cost = parseFloat(form.costPrice) || 0
    const tax = form.useDefaultTax ? 5 : (parseFloat(form.customTaxRate) || 0)
    const taxAmount = price * (tax / 100)
    const profit = price - cost - taxAmount
    return { price, cost, taxAmount, profit }
  }, [form.sellingPrice, form.offerPrice, form.costPrice, form.customTaxRate, form.useDefaultTax])

  const handleSave = () => {
    const normalizedVariants = form.variants
      .filter(v => v.name && v.name.trim())
      .map(v => ({
        ...v,
        name: v.name.trim(),
        price: parseFloat(v.price) || 0,
        offerPrice: parseFloat(v.offerPrice) || 0,
      }))

    const normalizedAddons = form.addons
      .filter(a => a.name && a.name.trim())
      .map(a => ({
        ...a,
        name: a.name.trim(),
        price: parseFloat(a.price) || 0,
      }))

    const isVariable = form.productType === 'variable'
    const sellingPrice = parseFloat(form.sellingPrice) || 0
    const offerPrice = parseFloat(form.offerPrice) || 0
    const originalMarketPrice = parseFloat(form.originalMarketPrice) || 0
    const costPrice = parseFloat(form.costPrice) || 0
    const customTaxRate = form.useDefaultTax ? null : (parseFloat(form.customTaxRate) || null)
    const taxPercent = form.useDefaultTax ? 0 : (parseFloat(form.customTaxRate) || 0)

    if (isVariable) {
      if (normalizedVariants.length === 0) {
        toast.error('Variant products must have at least one variant.')
        return
      }
      const invalidVariant = normalizedVariants.find(v => !(v.price > 0))
      if (invalidVariant) {
        toast.error(`Variant "${invalidVariant.name}" must have a price greater than 0.`)
        return
      }
      const badOffer = normalizedVariants.find(v => v.offerPrice > 0 && v.offerPrice >= v.price)
      if (badOffer) {
        toast.error(`Variant "${badOffer.name}" offer price must be less than its price.`)
        return
      }
    } else {
      if (!(sellingPrice > 0)) {
        toast.error('Selling price must be greater than 0.')
        return
      }
      if (offerPrice > 0 && offerPrice >= sellingPrice) {
        toast.error('Offer price must be less than selling price.')
        return
      }
    }

    const payload = {
      ...form,
      productType: isVariable ? 'variable' : 'simple',
      sellingPrice: isVariable ? 0 : sellingPrice,
      price: isVariable ? 0 : sellingPrice,
      originalMarketPrice: isVariable ? 0 : originalMarketPrice,
      comparePrice: isVariable ? 0 : originalMarketPrice,
      offerPrice: isVariable ? 0 : offerPrice,
      costPrice,
      useDefaultTax: isVariable ? true : form.useDefaultTax,
      customTaxRate: isVariable ? null : customTaxRate,
      taxPercent: isVariable ? 0 : taxPercent,
      calories: parseInt(form.calories) || 0,
      preparationTime: parseInt(form.preparationTime) || 15,
      variants: isVariable ? normalizedVariants : [],
      addons: normalizedAddons,
      availability: form.availability,
    }

    delete payload.showAdvancedPricing
    delete payload.showCustomTax

    if (editingItem?.id) payload.id = editingItem.id
    onSave(payload)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Item' : 'Add New Item'}
      subtitle="Configure all details for this menu item"
      size="xl"
      footer={(
        <div className="flex items-center gap-3 w-full justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="gradient" onClick={handleSave} loading={loading}>
            {editingItem ? 'Update Item' : 'Save Item'}
          </Button>
        </div>
      )}
    >
      <div className="flex flex-col -mx-6 -mt-6">
        <div className="flex gap-1 overflow-x-auto px-6 py-3 border-b border-surface-700/30 bg-surface-950/30">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                activeTab === tab.id
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/25'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/40'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === 'variants' && form.variants.length > 0 && <Badge variant="primary" size="sm">{form.variants.length}</Badge>}
              {tab.id === 'addons' && form.addons.length > 0 && <Badge variant="violet" size="sm">{form.addons.length}</Badge>}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 max-h-[55vh] overflow-y-auto scrollbar-thin">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <Input label="Item Name" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="e.g. Margherita Pizza" required />
              <TextArea label="Description" value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Describe this item..." rows={3} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-surface-400 mb-1.5 block">Category</label>
                  <input
                    list="category-list"
                    value={form.category}
                    onChange={(e) => updateForm('category', e.target.value)}
                    placeholder="Select or type category"
                    className="w-full rounded-xl bg-surface-900/40 border border-surface-700/50 px-3.5 py-2.5 text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-all"
                  />
                  <datalist id="category-list">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <Input label="Image URL" value={form.image} onChange={(e) => updateForm('image', e.target.value)} placeholder="https://..." leftIcon={<Image className="w-4 h-4" />} />
              </div>
              <div>
                <label className="text-xs font-semibold text-surface-400 mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all',
                        form.tags.includes(tag.id)
                          ? 'bg-primary-500/10 text-primary-300 border-primary-500/30 ring-1 ring-primary-500/10'
                          : 'bg-surface-900/30 text-surface-400 border-surface-700/50 hover:bg-surface-800/40'
                      )}
                    >
                      <span className={cn('w-2.5 h-2.5 rounded-full', tag.color)} />
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-surface-400 mb-2 block">Badge</label>
                <div className="flex flex-wrap gap-2">
                  {BADGE_OPTIONS.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => updateForm('badge', b.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all',
                        form.badge === b.id
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-surface-900/30 text-surface-400 border-surface-700/50 hover:bg-surface-800/40'
                      )}
                    >
                      {b.icon && <b.icon className="w-3.5 h-3.5" />}
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-surface-400 mb-2 block">Product Type</label>
                <div className="flex gap-2">
                  {[
                    { id: 'simple', label: 'Simple Product' },
                    { id: 'variable', label: 'Product With Variants' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => updateForm('productType', t.id)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all',
                        form.productType === t.id
                          ? 'bg-primary-500/10 text-primary-300 border-primary-500/30 ring-1 ring-primary-500/10'
                          : 'bg-surface-900/30 text-surface-400 border-surface-700/50 hover:bg-surface-800/40'
                      )}
                    >
                      <span className={cn('w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center',
                        form.productType === t.id ? 'border-primary-400' : 'border-surface-600'
                      )}>
                        {form.productType === t.id && <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />}
                      </span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-4">
              {form.productType === 'simple' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Selling Price *"
                      type="number"
                      value={form.sellingPrice}
                      onChange={(e) => updateForm('sellingPrice', e.target.value)}
                      placeholder="0.00"
                      leftIcon={<DollarSign className="w-4 h-4" />}
                      required
                      helperText="Final amount the customer pays for this item."
                    />
                    <Input
                      label="Offer Price (Optional)"
                      type="number"
                      value={form.offerPrice}
                      onChange={(e) => updateForm('offerPrice', e.target.value)}
                      placeholder="0.00"
                      helperText="Use this only when you want to show a discounted customer-facing price."
                    />
                  </div>

                  <div className="rounded-xl bg-surface-800/30 border border-surface-700/40 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-surface-300">Using Restaurant Default Tax</p>
                        <p className="text-[10px] text-surface-500 mt-0.5">Current Tax: 5% - Configured in Settings</p>
                        <p className="text-[10px] text-surface-500 mt-1">Keep this on to use the restaurant's saved tax rate.</p>
                      </div>
                      {!form.showCustomTax && (
                        <button
                          type="button"
                          onClick={() => {
                            updateForm('showCustomTax', true)
                            updateForm('useDefaultTax', false)
                          }}
                          className="text-[10px] font-semibold text-primary-400 hover:text-primary-300 px-2.5 py-1 rounded-lg bg-primary-500/10 border border-primary-500/20"
                        >
                          Customize Tax
                        </button>
                      )}
                    </div>
                    {form.showCustomTax && (
                      <div className="mt-3 pt-3 border-t border-surface-700/30">
                        <Input
                          label="Custom Tax %"
                          type="number"
                          value={form.customTaxRate}
                          onChange={(e) => updateForm('customTaxRate', e.target.value)}
                          placeholder="0"
                          helperText="Only use this when the item needs a different tax rate."
                        />
                        <p className="text-[10px] text-surface-500 mt-1">Restaurant Default = 5%. Bottled Drinks = 18%.</p>
                        <button
                          type="button"
                          onClick={() => {
                            updateForm('showCustomTax', false)
                            updateForm('useDefaultTax', true)
                            updateForm('customTaxRate', '')
                          }}
                          className="text-[10px] text-surface-500 hover:text-surface-300 mt-1.5"
                        >
                          &larr; Use restaurant default
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => updateForm('showAdvancedPricing', !form.showAdvancedPricing)}
                      className="flex items-center gap-2 text-xs font-semibold text-surface-400 hover:text-surface-300 transition-colors"
                    >
                      <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', form.showAdvancedPricing && 'rotate-90')} />
                      Advanced Pricing
                    </button>
                    {form.showAdvancedPricing && (
                      <div className="mt-3 space-y-3 pl-5 border-l border-surface-700/30">
                        <Input
                          label="Original Market Price"
                          type="number"
                          value={form.originalMarketPrice}
                          onChange={(e) => updateForm('originalMarketPrice', e.target.value)}
                          placeholder="0.00"
                          helperText="Optional compare-at price shown with a strike-through."
                        />
                        <Input
                          label="Cost Price (internal)"
                          type="number"
                          value={form.costPrice}
                          onChange={(e) => updateForm('costPrice', e.target.value)}
                          placeholder="0.00"
                          helperText="Internal-only cost for margin tracking."
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl bg-surface-800/30 border border-surface-700/40 p-4">
                    <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Profit Preview</p>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div><p className="text-lg font-bold text-surface-100">{formatCurrency(profitPreview.price)}</p><p className="text-[10px] text-surface-500">Sell Price</p></div>
                      <div><p className="text-lg font-bold text-surface-400">{formatCurrency(profitPreview.cost)}</p><p className="text-[10px] text-surface-500">Cost</p></div>
                      <div><p className="text-lg font-bold text-amber-400">{formatCurrency(profitPreview.taxAmount)}</p><p className="text-[10px] text-surface-500">Tax</p></div>
                      <div><p className={cn('text-lg font-bold', profitPreview.profit >= 0 ? 'text-emerald-400' : 'text-red-400')}>{formatCurrency(profitPreview.profit)}</p><p className="text-[10px] text-surface-500">Profit</p></div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl bg-primary-500/5 border border-primary-500/20 p-4">
                  <div className="flex items-start gap-3">
                    <Layers className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-primary-300 mb-1">Pricing is managed through Variants</p>
                      <p className="text-xs text-surface-400">Configure prices in the Variants tab.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'variants' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-primary-500/5 border border-primary-500/20 p-4 mb-4">
                <p className="text-sm font-semibold text-primary-300 mb-1">Product Variants</p>
                <p className="text-xs text-surface-400">Add different sizes, flavors, or portions with their own prices. e.g. Butterscotch Gola - Stick Rs 70, Mava Malai Rs 128. Customers choose one variant before adding to cart.</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-surface-200">Variants ({form.variants.length})</p>
                </div>
                <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={addVariant}>Add Variant</Button>
              </div>
              {form.variants.length === 0 ? (
                <div className="text-center py-8 text-surface-500 text-xs">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No variants yet. Click "Add Variant" to create one.
                </div>
              ) : (
                <div className="space-y-3">
                  {form.variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl bg-surface-900/30 border border-surface-700/40">
                      <div className="col-span-4">
                        <Input label={i === 0 ? 'Name' : ''} value={v.name} onChange={(e) => updateVariant(i, 'name', e.target.value)} placeholder="e.g. Large" />
                      </div>
                      <div className="col-span-3">
                        <Input label={i === 0 ? 'Price *' : ''} type="number" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} placeholder="0.00" />
                      </div>
                      <div className="col-span-3">
                        <Input label={i === 0 ? 'Offer Price' : ''} type="number" value={v.offerPrice} onChange={(e) => updateVariant(i, 'offerPrice', e.target.value)} placeholder="0.00" />
                      </div>
                      <div className="col-span-1 flex items-center justify-center pb-2">
                        <label className="flex items-center gap-1 text-[10px] text-surface-400 cursor-pointer" title="Default variant selected automatically">
                          <input type="checkbox" checked={v.isDefault} onChange={(e) => updateVariant(i, 'isDefault', e.target.checked)} className="w-3.5 h-3.5 rounded text-primary-500" />
                          Def.
                        </label>
                      </div>
                      <div className="col-span-1 flex justify-end pb-1">
                        <button onClick={() => removeVariant(i)} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'addons' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-violet-500/5 border border-violet-500/20 p-4 mb-4">
                <p className="text-sm font-semibold text-violet-300 mb-1">Add-ons & Extras</p>
                <p className="text-xs text-surface-400">Optional extras customers can add to this item. e.g. Extra Cheese +Rs 25, Extra Malai +Rs 30, Extra Dry Fruit +Rs 50. Customers can choose multiple add-ons.</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-surface-200">Extras ({form.addons.length})</p>
                </div>
                <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={addAddon}>Add Extra</Button>
              </div>
              {form.addons.length === 0 ? (
                <div className="text-center py-8 text-surface-500 text-xs">
                  <Plus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No add-ons yet. Click "Add Extra" to create one.
                </div>
              ) : (
                <div className="space-y-3">
                  {form.addons.map((a, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl bg-surface-900/30 border border-surface-700/40">
                      <div className="col-span-5">
                        <Input label={i === 0 ? 'Name' : ''} value={a.name} onChange={(e) => updateAddon(i, 'name', e.target.value)} placeholder="e.g. Extra Cheese" />
                      </div>
                      <div className="col-span-3">
                        <Input label={i === 0 ? 'Price' : ''} type="number" value={a.price} onChange={(e) => updateAddon(i, 'price', e.target.value)} placeholder="+0.00" />
                      </div>
                      <div className="col-span-2 flex items-center justify-center gap-1 pb-1">
                        <label className="flex items-center gap-1 text-[10px] text-surface-400 cursor-pointer">
                          <input type="checkbox" checked={a.isRequired} onChange={(e) => updateAddon(i, 'isRequired', e.target.checked)} className="w-3.5 h-3.5 rounded text-violet-500" />
                          Required
                        </label>
                      </div>
                      <div className="col-span-2 flex justify-end pb-1">
                        <button onClick={() => removeAddon(i)} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-surface-400 mb-2 block">Stock Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'in-stock', label: 'In Stock', color: 'emerald' },
                    { id: 'out-of-stock', label: 'Out of Stock', color: 'red' },
                    { id: 'hidden', label: 'Hidden', color: 'surface' },
                    { id: 'seasonal', label: 'Seasonal', color: 'amber' },
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => updateForm('availability', { ...form.availability, status: s.id })}
                      className={cn(
                        'px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all',
                        form.availability.status === s.id
                          ? `bg-${s.color}-500/10 text-${s.color}-400 border-${s.color}-500/30`
                          : 'bg-surface-900/30 text-surface-400 border-surface-700/50 hover:bg-surface-800/40'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-surface-400 mb-2 block">Available Time Slots</label>
                <div className="flex flex-wrap gap-2">
                  {['breakfast', 'lunch', 'dinner', 'all-day'].map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleTimeSlot(slot)}
                      className={cn(
                        'px-3 py-2 rounded-xl border text-xs font-semibold transition-all capitalize',
                        (form.availability.timeSlots || []).includes(slot)
                          ? 'bg-primary-500/10 text-primary-300 border-primary-500/30'
                          : 'bg-surface-900/30 text-surface-400 border-surface-700/50 hover:bg-surface-800/40'
                      )}
                    >
                      {slot.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="SKU / Internal Code" value={form.sku} onChange={(e) => updateForm('sku', e.target.value)} placeholder="e.g. PIZ-001" />
                <Input label="Prep Time (mins)" type="number" value={form.preparationTime} onChange={(e) => updateForm('preparationTime', e.target.value)} placeholder="15" leftIcon={<Clock className="w-4 h-4" />} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Calories" type="number" value={form.calories} onChange={(e) => updateForm('calories', e.target.value)} placeholder="0" />
                <Input label="Serving Size" value={form.servingSize} onChange={(e) => updateForm('servingSize', e.target.value)} placeholder="e.g. 1 plate, 250ml" />
              </div>
              <div>
                <label className="text-xs font-semibold text-surface-400 mb-2 block">Spice Level</label>
                <div className="flex flex-wrap gap-2">
                  {SPICE_LEVELS.map(sp => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => updateForm('spiceLevel', sp.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all',
                        form.spiceLevel === sp.id
                          ? 'bg-red-500/10 text-red-300 border-red-500/30'
                          : 'bg-surface-900/30 text-surface-400 border-surface-700/50 hover:bg-surface-800/40'
                      )}
                    >
                      <span>{sp.emoji}</span> {sp.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-900/30 border border-surface-700/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isVeg}
                  onChange={(e) => updateForm('isVeg', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500/20"
                />
                <div>
                  <p className="text-sm font-medium text-surface-200 flex items-center gap-2"><Leaf className="w-4 h-4 text-emerald-500" /> Vegetarian</p>
                  <p className="text-[11px] text-surface-500">Mark this item as vegetarian</p>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
