import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, AlertTriangle, Package, RefreshCw, Trash2, Edit2, X,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { inventoryAPI } from '@shared/api/endpoints'
import toast from 'react-hot-toast'
import { Button } from '@shared/components/Button'
import { Badge } from '@shared/components/Badge'
import { PageHeader } from '@shared/components/PageHeader'
import { EmptyState } from '@shared/components/EmptyState'
import { SearchInput } from '@shared/components/SearchInput'
import { Card } from '@shared/components/Card'
import { Modal } from '@shared/components/Modal'
import { Toggle } from '@shared/components/Toggle'
import { cn } from '@shared/utils/cn'

export const Inventory = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [autoUpdate, setAutoUpdate] = useState(false)

  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: 'pcs', minLevel: '10', costPerUnit: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState(null)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateItem, setDuplicateItem] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

  useEffect(() => { fetchInventory() }, [])

  const fetchInventory = async () => {
    try {
      const response = await inventoryAPI.list()
      if (response.success && Array.isArray(response.data)) {
        setItems(response.data)
      } else {
        setItems([])
      }
    } catch (error) {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setNewItem({ name: '', quantity: '', unit: 'pcs', minLevel: '10', costPerUnit: '' })
    setIsEditing(false); setEditId(null); setShowAddModal(false)
    setShowDuplicateModal(false); setDuplicateItem(null); setShowDeleteModal(false); setItemToDelete(null)
  }

  const handleEditClick = (item) => {
    setNewItem({ name: item.name, quantity: item.quantity, unit: item.unit, minLevel: item.minLevel, costPerUnit: item.costPerUnit })
    setEditId(item._id); setIsEditing(true); setShowAddModal(true); setShowDuplicateModal(false)
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    try {
      if (isEditing) {
        const response = await inventoryAPI.update(editId, newItem)
        if (response.success) { setItems(items.map(item => item._id === editId ? response.data : item)); toast.success('Item updated'); resetForm() }
      } else {
        const response = await inventoryAPI.add(newItem)
        if (response.success) { setItems(prev => [...(Array.isArray(prev) ? prev : []), response.data]); toast.success('Item added'); resetForm() }
      }
    } catch (error) {
      if (error.response?.status === 409 && error.response?.data?.existingItem) {
        setDuplicateItem(error.response.data.existingItem); setShowAddModal(false); setShowDuplicateModal(true)
      } else {
        toast.error(error.response?.data?.message || 'Operation failed')
      }
    }
  }

  const handleUpdateStock = async (id, newQuantity) => {
    try {
      const response = await inventoryAPI.update(id, { quantity: newQuantity })
      if (response.success) { setItems(items.map(item => item._id === id ? response.data : item)); toast.success('Stock updated') }
    } catch (error) { toast.error('Failed to update stock') }
  }

  const handleDeleteClick = (item) => { setItemToDelete(item); setShowDeleteModal(true) }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    try {
      await inventoryAPI.delete(itemToDelete._id); setItems(items.filter(item => item._id !== itemToDelete._id)); toast.success('Item deleted'); setShowDeleteModal(false); setItemToDelete(null)
    } catch (error) { toast.error('Failed to delete item') }
  }

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  const lowStockCount = items.filter(i => i.quantity <= i.minLevel).length

  const inputClass = cn(
    'w-full bg-surface-800/50 border border-surface-700/50 rounded-lg px-3.5 py-2.5 text-sm text-white',
    'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/60',
    'placeholder:text-surface-500 transition-all duration-200'
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels and manage supplies"
        icon={Package}
        actions={
          <div className="flex items-center gap-2">
            <Toggle label="Auto Update" checked={autoUpdate} onChange={setAutoUpdate} size="sm" />
            <Button size="sm" variant="outline" onClick={fetchInventory} leftIcon={<RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />}>Refresh</Button>
            <Button size="sm" variant="gradient" onClick={() => { resetForm(); setShowAddModal(true) }} leftIcon={<Plus className="w-4 h-4" />}>Add Item</Button>
          </div>
        }
      />

      {/* Stats row */}
      {items.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <Badge variant="gray" size="lg">{items.length} Total Items</Badge>
          {lowStockCount > 0 && <Badge variant="danger" dot size="lg">{lowStockCount} Low Stock</Badge>}
        </div>
      )}

      {/* Search */}
      <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClear={() => setSearchTerm('')} placeholder="Search inventory..." className="max-w-md" />

      {/* Inventory Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-700/40 bg-surface-950/30">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Item Name</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Stock Level</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Unit</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Cost / Unit</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/40">
              {loading ? (
                <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-surface-500">Loading inventory...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-4"><EmptyState icon={Package} title="No items found" description="Add items to track your inventory" compact /></td></tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-surface-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-surface-100">{item.name}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleUpdateStock(item._id, Math.max(0, item.quantity - 1))} className="p-1 rounded hover:bg-surface-700 transition-colors text-surface-500 hover:text-surface-300">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <span className={cn('font-mono font-medium w-10 text-center text-sm', item.quantity <= item.minLevel ? 'text-red-400' : 'text-surface-100')}>
                          {item.quantity}
                        </span>
                        <button onClick={() => handleUpdateStock(item._id, item.quantity + 1)} className="p-1 rounded hover:bg-surface-700 transition-colors text-surface-500 hover:text-surface-300">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-surface-400">{item.unit}</td>
                    <td className="px-5 py-3.5 text-surface-400">₹{item.costPerUnit}</td>
                    <td className="px-5 py-3.5">
                      {item.quantity <= item.minLevel ? (
                        <Badge variant="danger" dot size="sm">Low Stock</Badge>
                      ) : (
                        <Badge variant="success" dot size="sm">In Stock</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEditClick(item)} className="p-2 rounded-lg text-surface-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteClick(item)} className="p-2 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={isEditing ? 'Edit Item' : 'Add New Item'} size="md">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Item Name</label>
            <input type="text" required value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} className={inputClass} placeholder="e.g. Tomatoes" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Quantity</label>
              <input type="number" required min="0" value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Unit</label>
              <select value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})} className={cn(inputClass, 'appearance-none')}>
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="l">Liter (l)</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="box">Box</option>
                <option value="can">Can</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Min Level (Alert)</label>
              <input type="number" required min="0" value={newItem.minLevel} onChange={(e) => setNewItem({...newItem, minLevel: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Cost per Unit</label>
              <input type="number" min="0" step="0.01" value={newItem.costPerUnit} onChange={(e) => setNewItem({...newItem, costPerUnit: e.target.value})} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" variant="gradient" className="flex-1">{isEditing ? 'Update Item' : 'Add Item'}</Button>
          </div>
        </form>
      </Modal>

      {/* Duplicate Modal */}
      <Modal isOpen={showDuplicateModal} onClose={() => setShowDuplicateModal(false)} title="Item Already Exists" size="sm">
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-sm text-surface-400 mb-6">
            "{duplicateItem?.name}" is already in your inventory. Would you like to edit it instead?
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowDuplicateModal(false)}>Cancel</Button>
            <Button variant="gradient" className="flex-1" onClick={() => duplicateItem && handleEditClick(duplicateItem)}>Edit Item</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Item" size="sm">
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-sm text-surface-400 mb-6">
            Are you sure you want to delete <span className="font-medium text-surface-100">"{itemToDelete?.name}"</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={confirmDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
