import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Trash2, Edit3, Copy, ChevronDown } from 'lucide-react'
import { Card } from '@shared/components/Card'
import { Button } from '@shared/components/Button'
import { Badge } from '@shared/components/Badge'
import { motion } from 'framer-motion'
import QRCodeStyling from 'qr-code-styling'
import toast from 'react-hot-toast'
import { qrAPI } from '@shared/api/endpoints'
import { buildSafeQRStylingOptions, sanitizeDesignConfig } from '../../constants/designConfigDefaults'

const QRCardPreview = ({ qrCode }) => {
  const containerRef = useRef(null)

  // Try to get designConfig from API response, then fall back to localStorage
  const resolvedDesignConfig = (() => {
    if (qrCode.designConfig) return qrCode.designConfig
    try {
      const stored = JSON.parse(localStorage.getItem('qr_design_configs') || '{}')
      return stored[qrCode.id] || null
    } catch { return null }
  })()

  const safeConfig = sanitizeDesignConfig(resolvedDesignConfig || {})

  useEffect(() => {
    if (!containerRef.current) return

    // If we have a design config, render from it; otherwise fallback to stored image
    if (resolvedDesignConfig) {
      try {
        const options = buildSafeQRStylingOptions(safeConfig, qrCode.url, safeConfig.logo || undefined, 140)
        const qr = new QRCodeStyling(options)
        containerRef.current.innerHTML = ''
        qr.append(containerRef.current)
      } catch (error) {
        console.error('QR preview render error:', error)
      }
    }
  }, [qrCode, resolvedDesignConfig])

  // Fallback for legacy QR codes without designConfig
  if (!resolvedDesignConfig && qrCode.qrCodeData) {
    return (
      <div className="flex justify-center">
        <img
          src={qrCode.qrCodeData}
          alt={`QR Code for ${qrCode.name}`}
          className="w-[140px] h-auto object-contain"
        />
      </div>
    )
  }

  // Frame styles – mirrors QRPreview logic
  const frameStyles = (() => {
    const f = safeConfig.frame || {}
    const base = {
      padding: `${Math.min(f.padding || 16, 12)}px`,
      borderRadius: '10px',
      transition: 'all 0.3s ease',
    }
    switch (f.style) {
      case 'solid':
        return { ...base, border: `2px solid ${f.color || '#2D2D2D'}`, borderRadius: '14px' }
      case 'dashed':
        return { ...base, border: `2px dashed ${f.color || '#2D2D2D'}` }
      default:
        return base
    }
  })()

  const shadowStyle = safeConfig.frame?.shadow
    ? { filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }
    : {}

  const glowStyle = safeConfig.frame?.glow
    ? { boxShadow: `0 0 16px ${safeConfig.frame.color || '#E94560'}30, 0 0 32px ${safeConfig.frame.color || '#E94560'}15` }
    : {}

  return (
    <div
      className="flex flex-col items-center"
      style={{
        ...frameStyles,
        ...shadowStyle,
        ...glowStyle,
        backgroundColor: safeConfig.backgroundOptions?.color || '#FFFFFF',
      }}
    >
      {/* Restaurant Name */}
      {safeConfig.meta?.restaurantName && (
        <div className="text-center mb-1.5">
          <h4
            className="font-bold tracking-wide"
            style={{
              fontSize: '11px',
              color: safeConfig.dotsOptions?.color || '#2D2D2D',
              letterSpacing: '1.5px',
            }}
          >
            {safeConfig.meta.restaurantName.toUpperCase()}
          </h4>
          {safeConfig.meta?.tagline && (
            <p
              className="mt-0.5 opacity-70"
              style={{ fontSize: '8px', color: safeConfig.dotsOptions?.color || '#666' }}
            >
              {safeConfig.meta.tagline}
            </p>
          )}
        </div>
      )}

      {/* QR Code */}
      <div ref={containerRef} className="flex justify-center" />

      {/* Table Number Badge */}
      {qrCode.tableNumber && (
        <div className="text-center mt-1">
          <span
            className="inline-block px-2 py-0.5 rounded-full font-bold"
            style={{
              fontSize: '8px',
              backgroundColor: `${safeConfig.frame?.color || '#2D2D2D'}15`,
              color: safeConfig.frame?.color || '#2D2D2D',
              border: `1px solid ${safeConfig.frame?.color || '#2D2D2D'}30`,
            }}
          >
            Table {qrCode.tableNumber}
          </span>
        </div>
      )}

      {/* Branding */}
      <div className="text-center mt-1 opacity-40">
        <span style={{ fontSize: '7px', letterSpacing: '0.5px' }} className="text-gray-500">
          Powered by QR Menu
        </span>
      </div>
    </div>
  )
}

export const QRDashboard = ({ qrCodes, onDelete, onRefresh }) => {
  const navigate = useNavigate()
  const [downloadMenuId, setDownloadMenuId] = useState(null)

  const handleEdit = (qr) => {
    navigate(`/owner/qr/designer?edit=${qr.id}`)
  }

  const handleDuplicate = async (qr) => {
    try {
      await qrAPI.duplicate(qr.id)
      toast.success('QR code duplicated!')
      onRefresh()
    } catch (error) {
      console.error('Duplicate error:', error)
      toast.error('Failed to duplicate QR code')
    }
  }

  const downloadQR = async (qr, format = 'png') => {
    // If we have designConfig, render a high-quality version and download
    if (qr.designConfig) {
      try {
        const safeConfig = sanitizeDesignConfig(qr.designConfig)
        const options = buildSafeQRStylingOptions(safeConfig, qr.url, safeConfig.logo || undefined, 1024)
        const qrInstance = new QRCodeStyling(options)
        qrInstance.download({ name: `qr-${qr.name || 'code'}`, extension: format })
      } catch (error) {
        console.error('QR download error:', error)
        toast.error('Failed to generate QR download')
      }
    } else if (qr.qrCodeData) {
      // Legacy fallback
      const link = document.createElement('a')
      link.download = `qr-${qr.name || qr.tableNumber || 'global'}.png`
      link.href = qr.qrCodeData
      link.click()
    }
    setDownloadMenuId(null)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now - d
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {qrCodes.map((qr, index) => (
        <motion.div
          key={qr.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-5">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {qr.name || 'QR Code'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {qr.tableNumber ? (
                      <Badge variant="info" className="text-[10px]">Table {qr.tableNumber}</Badge>
                    ) : (
                      <Badge variant="primary" className="text-[10px]">Global</Badge>
                    )}
                    {qr.designConfig?.meta?.category && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">
                        {qr.designConfig.meta.category}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDelete(qr.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* QR Preview */}
              <div className="flex justify-center mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <QRCardPreview qrCode={qr} />
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="font-bold text-base text-gray-900 dark:text-gray-100">{qr.scans || 0}</span>
                    <span className="ml-1">scans</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-400">
                    {qr.lastScannedAt ? `Last: ${formatTime(qr.lastScannedAt)}` : 'No scans yet'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Created {formatDate(qr.createdAt)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  onClick={() => handleEdit(qr)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                  onClick={() => handleDuplicate(qr)}
                >
                  Copy
                </Button>
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => setDownloadMenuId(downloadMenuId === qr.id ? null : qr.id)}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                  {downloadMenuId === qr.id && (
                    <div className="absolute right-0 bottom-full mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[100px]">
                      <button
                        onClick={() => downloadQR(qr, 'png')}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        PNG
                      </button>
                      <button
                        onClick={() => downloadQR(qr, 'svg')}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        SVG
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
