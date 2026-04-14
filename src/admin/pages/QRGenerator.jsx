import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, QrCode as QrIcon } from 'lucide-react'
import { Button } from '@shared/components/Button'
import { Input } from '@shared/components/Input'
import { Modal, ConfirmModal } from '@shared/components/Modal'
import { QRDashboard } from '../components/qr/QRDashboard'
import { PageLoader } from '@shared/components/Spinner'
import { qrAPI } from '@shared/api/endpoints'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export const QRGenerator = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [qrCodes, setQrCodes] = useState([])
  const [showTableNumberModal, setShowTableNumberModal] = useState(false)
  const [tableNumber, setTableNumber] = useState('')
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, qrId: null })

  useEffect(() => {
    fetchQRCodes()
  }, [])

  const fetchQRCodes = async () => {
    try {
      const response = await qrAPI.getAll()
      setQrCodes(response.data.qrCodes || [])
    } catch (error) {
      console.error('QR API error:', error)
      toast.error('Failed to load QR codes')
      setQrCodes([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (qrId) => {
    setDeleteModal({ isOpen: true, qrId })
  }

  const confirmDelete = async () => {
    try {
      await qrAPI.delete(deleteModal.qrId)
      toast.success('QR code deleted')
      fetchQRCodes()
    } catch (error) {
      console.error('Delete QR error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete QR code')
    } finally {
      setDeleteModal({ isOpen: false, qrId: null })
    }
  }

  const openDesigner = (type) => {
    if (type === 'table') {
      setShowTableNumberModal(true)
    } else {
      navigate('/owner/qr/designer?type=global')
    }
  }

  const handleTableNumberSubmit = () => {
    if (!tableNumber) {
      toast.error('Please enter a table number')
      return
    }
    setShowTableNumberModal(false)
    navigate(`/owner/qr/designer?type=table&table=${tableNumber}`)
    setTableNumber('')
  }

  if (loading) return <PageLoader message="Loading QR codes..." />

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">QR Code Manager</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Create and manage QR codes for your restaurant</p>
        </div>
      </motion.div>

      {/* Generate Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-4"
      >
        <Button
          leftIcon={<Plus className="w-5 h-5" />}
          onClick={() => openDesigner('global')}
          className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
        >
          Design Global QR
        </Button>
        <Button
          variant="outline"
          leftIcon={<Plus className="w-5 h-5" />}
          onClick={() => openDesigner('table')}
        >
          Design Table QR
        </Button>
      </motion.div>

      {/* QR Codes List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {qrCodes.length > 0 ? (
          <QRDashboard qrCodes={qrCodes} onDelete={handleDelete} onRefresh={fetchQRCodes} />
        ) : (
          <div className="text-center py-12">
            <QrIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mb-2">No QR codes yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mb-6">
              Design your first QR code to get started
            </p>
            <Button onClick={() => openDesigner('global')}>
              Design QR Code
            </Button>
          </div>
        )}
      </motion.div>

      {/* Table Number Input Modal */}
      <Modal
        isOpen={showTableNumberModal}
        onClose={() => {
          setShowTableNumberModal(false)
          setTableNumber('')
        }}
        title="Enter Table Number"
        footer={
          <>
            <Button variant="ghost" onClick={() => {
              setShowTableNumberModal(false)
              setTableNumber('')
            }}>
              Cancel
            </Button>
            <Button onClick={handleTableNumberSubmit}>
              Next
            </Button>
          </>
        }
      >
        <div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Enter the table number for this QR code. This will be displayed when the QR is scanned.
          </p>
          <Input
            label="Table Number"
            type="number"
            placeholder="Enter table number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            required
            autoFocus
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, qrId: null })}
        onConfirm={confirmDelete}
        title="Delete QR Code?"
        message="This QR code will no longer work. Customers won't be able to access your menu using this code."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
