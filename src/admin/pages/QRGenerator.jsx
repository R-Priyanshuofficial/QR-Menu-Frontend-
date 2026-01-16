import { useState, useEffect } from 'react'
import { Plus, QrCode as QrIcon } from 'lucide-react'
import { Button } from '@shared/components/Button'
import { Input } from '@shared/components/Input'
import { Modal, ConfirmModal } from '@shared/components/Modal'
import { QRCustomizationModal } from '../components/QRCustomizationModal'
import { QRTableList } from '../components/QRTableList'
import { PageLoader } from '@shared/components/Spinner'
import { qrAPI } from '@shared/api/endpoints'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export const QRGenerator = () => {
  const [loading, setLoading] = useState(true)
  const [qrCodes, setQrCodes] = useState([])
  const [showCustomizationModal, setShowCustomizationModal] = useState(false)
  const [showTableNumberModal, setShowTableNumberModal] = useState(false)
  const [modalType, setModalType] = useState('global')
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

  const handleGenerateQR = async (qrData) => {
    try {
      await qrAPI.generate(qrData)
      fetchQRCodes()
    } catch (error) {
      throw error
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

  const openCustomizationModal = (type) => {
    setModalType(type)
    if (type === 'table') {
      // First ask for table number
      setShowTableNumberModal(true)
    } else {
      // For global, open customization directly
      setShowCustomizationModal(true)
    }
  }

  const handleTableNumberSubmit = () => {
    if (!tableNumber) {
      toast.error('Please enter a table number')
      return
    }
    setShowTableNumberModal(false)
    setShowCustomizationModal(true)
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">QR Code Generator</h1>
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
          onClick={() => openCustomizationModal('global')}
        >
          Generate Global QR
        </Button>
        <Button
          variant="outline"
          leftIcon={<Plus className="w-5 h-5" />}
          onClick={() => openCustomizationModal('table')}
        >
          Generate Table QR
        </Button>
      </motion.div>

      {/* QR Codes List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {qrCodes.length > 0 ? (
          <QRTableList qrCodes={qrCodes} onDelete={handleDelete} />
        ) : (
          <div className="text-center py-12">
            <QrIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mb-2">No QR codes yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mb-6">
              Generate your first QR code to get started
            </p>
            <Button onClick={() => openCustomizationModal('global')}>
              Generate QR Code
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

      {/* QR Customization Modal */}
      <QRCustomizationModal
        isOpen={showCustomizationModal}
        onClose={() => {
          setShowCustomizationModal(false)
          if (modalType === 'table') {
            setTableNumber('')
          }
        }}
        qrType={modalType}
        tableNumber={modalType === 'table' ? tableNumber : null}
        onGenerate={handleGenerateQR}
      />

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

