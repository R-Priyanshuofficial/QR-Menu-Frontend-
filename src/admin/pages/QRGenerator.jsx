import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, QrCode as QrIcon } from 'lucide-react'
import { Button } from '@shared/components/Button'
import { Input } from '@shared/components/Input'
import { Modal, ConfirmModal } from '@shared/components/Modal'
import { QRDashboard } from '../components/qr/QRDashboard'
import { PageLoader } from '@shared/components/Spinner'
import { PageHeader } from '@shared/components/PageHeader'
import { EmptyState } from '@shared/components/EmptyState'
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
      <PageHeader
        title="QR Code Manager"
        subtitle="Create and manage QR codes for your restaurant"
        icon={QrIcon}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" leftIcon={<Plus className="w-4 h-4" />} onClick={() => openDesigner('table')}>
              Table QR
            </Button>
            <Button variant="gradient" leftIcon={<Plus className="w-4 h-4" />} onClick={() => openDesigner('global')}>
              Global QR
            </Button>
          </div>
        }
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {qrCodes.length > 0 ? (
          <QRDashboard qrCodes={qrCodes} onDelete={handleDelete} onRefresh={fetchQRCodes} />
        ) : (
          <EmptyState
            icon={QrIcon}
            title="No QR codes yet"
            description="Design your first QR code to get started. Table QRs are for specific tables, while Global QRs are for general use."
            actionLabel="Design QR Code"
            onAction={() => openDesigner('global')}
          />
        )}
      </motion.div>

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
            <Button variant="gradient" onClick={handleTableNumberSubmit}>
              Next
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-surface-600 dark:text-surface-400 text-sm">
            Enter the table number for this QR code. This will be displayed when the QR is scanned.
          </p>
          <Input
            label="Table Number"
            type="number"
            placeholder="e.g. 12"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            required
            autoFocus
          />
        </div>
      </Modal>

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
