import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Package, 
  RefreshCw, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { inventoryAPI } from '@shared/api/endpoints'
import toast from 'react-hot-toast'
import { Button } from '@shared/components/Button'

export const Inventory = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [autoUpdate, setAutoUpdate] = useState(false)

  // Form State
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    unit: 'pcs',
    minLevel: '10',
    costPerUnit: ''
  })

  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState(null)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateItem, setDuplicateItem] = useState(null)

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const response = await inventoryAPI.list()
      console.log('Inventory list response:', response)
      if (response.success && Array.isArray(response.data)) {
        setItems(response.data)
      } else {
        console.warn('Invalid inventory data format:', response)
        setItems([])
      }
    } catch (error) {
      console.error('Fetch inventory error:', error)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setNewItem({ name: '', quantity: '', unit: 'pcs', minLevel: '10', costPerUnit: '' })
    setIsEditing(false)
    setEditId(null)
    setShowAddModal(false)
    setShowDuplicateModal(false)
    setDuplicateItem(null)
    setShowDeleteModal(false)
    setItemToDelete(null)
  }

  const handleEditClick = (item) => {
    setNewItem({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      minLevel: item.minLevel,
      costPerUnit: item.costPerUnit
    })
    setEditId(item._id)
    setIsEditing(true)
    setShowAddModal(true)
    setShowDuplicateModal(false)
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    try {
      if (isEditing) {
        const response = await inventoryAPI.update(editId, newItem)
        if (response.success) {
          setItems(items.map(item => item._id === editId ? response.data : item))
          toast.success('Item updated successfully')
          resetForm()
        }
      } else {
        const response = await inventoryAPI.add(newItem)
        if (response.success) {
          setItems(prev => [...(Array.isArray(prev) ? prev : []), response.data])
          toast.success('Item added successfully')
          resetForm()
        }
      }
    } catch (error) {
      console.error('Form submit error:', error)
      if (error.response?.status === 409 && error.response?.data?.existingItem) {
        setDuplicateItem(error.response.data.existingItem)
        setShowAddModal(false)
        setShowDuplicateModal(true)
      } else {
        toast.error(error.response?.data?.message || 'Operation failed')
      }
    }
  }

  const handleUpdateStock = async (id, newQuantity) => {
    try {
      const response = await inventoryAPI.update(id, { quantity: newQuantity })
      if (response.success) {
        setItems(items.map(item => item._id === id ? response.data : item))
        toast.success('Stock updated')
      }
    } catch (error) {
      toast.error('Failed to update stock')
    }
  }

  const handleDeleteClick = (item) => {
    setItemToDelete(item)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    try {
      await inventoryAPI.delete(itemToDelete._id)
      setItems(items.filter(item => item._id !== itemToDelete._id))
      toast.success('Item deleted')
      setShowDeleteModal(false)
      setItemToDelete(null)
    } catch (error) {
      toast.error('Failed to delete item')
    }
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
          <p className="text-gray-400 text-sm">Track stock levels and manage supplies</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto Update Toggle (Visual Only) */}
          <div className="flex items-center bg-white/5 px-3 py-2 rounded-lg border border-white/10">
            <span className="text-xs text-gray-400 mr-2">Auto Update</span>
            <button
              onClick={() => setAutoUpdate(!autoUpdate)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                autoUpdate ? 'bg-primary-500' : 'bg-gray-700'
              }`}
            >
              <span
                className={`${
                  autoUpdate ? 'translate-x-5' : 'translate-x-1'
                } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>
          
          <Button onClick={() => { resetForm(); setShowAddModal(true); }} icon={Plus}>
            Add Item
          </Button>
          <button
            onClick={fetchInventory}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all"
          />
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-xs uppercase font-medium text-gray-300">
              <tr>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Cost / Unit</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">Loading inventory...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">No items found</td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleUpdateStock(item._id, Math.max(0, item.quantity - 1))}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <span className={`font-mono font-medium w-12 text-center ${
                          item.quantity <= item.minLevel ? 'text-red-400' : 'text-white'
                        }`}>
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => handleUpdateStock(item._id, item.quantity + 1)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">{item.unit}</td>
                    <td className="px-6 py-4">₹{item.costPerUnit}</td>
                    <td className="px-6 py-4">
                      {item.quantity <= item.minLevel ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                          <Package className="w-3 h-3" />
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="p-2 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(item)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#1e293b] border border-white/10 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  {isEditing ? 'Edit Item' : 'Add New Item'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddItem} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                    placeholder="e.g. Tomatoes"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Unit</label>
                    <select
                      value={newItem.unit}
                      onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="pcs" className="bg-[#1e293b]">Pieces (pcs)</option>
                      <option value="kg" className="bg-[#1e293b]">Kilogram (kg)</option>
                      <option value="g" className="bg-[#1e293b]">Gram (g)</option>
                      <option value="l" className="bg-[#1e293b]">Liter (l)</option>
                      <option value="ml" className="bg-[#1e293b]">Milliliter (ml)</option>
                      <option value="box" className="bg-[#1e293b]">Box</option>
                      <option value="can" className="bg-[#1e293b]">Can</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Min Level (Alert)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newItem.minLevel}
                      onChange={(e) => setNewItem({...newItem, minLevel: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Cost per Unit</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.costPerUnit}
                      onChange={(e) => setNewItem({...newItem, costPerUnit: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {isEditing ? 'Update Item' : 'Add Item'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Duplicate Item Modal */}
      <AnimatePresence>
        {showDuplicateModal && duplicateItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#1e293b] border border-white/10 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Item Already Exists</h3>
                <p className="text-gray-400 text-sm mb-6">
                  "{duplicateItem.name}" is already in your inventory. Would you like to edit it instead?
                </p>
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="flex-1" 
                    onClick={() => setShowDuplicateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    className="flex-1"
                    onClick={() => handleEditClick(duplicateItem)}
                  >
                    Edit Item
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#1e293b] border border-white/10 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Delete Item</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Are you sure you want to delete <span className="text-white font-medium">"{itemToDelete.name}"</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="flex-1" 
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white border-none"
                    onClick={confirmDelete}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
