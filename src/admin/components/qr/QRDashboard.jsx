import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Trash2, Edit3, Copy, ChevronDown, Clock } from 'lucide-react'
import { Card } from '@shared/components/Card'
import { Button } from '@shared/components/Button'
import { Badge } from '@shared/components/Badge'
import { motion, AnimatePresence } from 'framer-motion'
import QRCodeStyling from 'qr-code-styling'
import toast from 'react-hot-toast'
import { qrAPI } from '@shared/api/endpoints'
import { buildSafeQRStylingOptions, sanitizeDesignConfig } from '../../constants/designConfigDefaults'
import { exportDashboardCard } from '../../utils/exportCardAsImage'

const QRCardPreview = ({ qrCode }) => {
  const containerRef = useRef(null)

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

  if (!resolvedDesignConfig && qrCode.qrCodeData) {
    return (
      <div className="flex justify-center">
        <img src={qrCode.qrCodeData} alt={`QR Code for ${qrCode.name}`} className="w-[140px] h-auto object-contain" />
      </div>
    )
  }

  const frameStyles = (() => {
    const f = safeConfig.frame || {}
    const base = { padding: `${Math.min(f.padding || 16, 12)}px`, borderRadius: '10px', transition: 'all 0.3s ease' }
    switch (f.style) {
      case 'solid': return { ...base, border: `2px solid ${f.color || '#2D2D2D'}`, borderRadius: '14px' }
      case 'dashed': return { ...base, border: `2px dashed ${f.color || '#2D2D2D'}` }
      default: return base
    }
  })()

  const shadowStyle = safeConfig.frame?.shadow ? { filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' } : {}
  const glowStyle = safeConfig.frame?.glow ? { boxShadow: `0 0 16px ${safeConfig.frame.color || '#E94560'}30, 0 0 32px ${safeConfig.frame.color || '#E94560'}15` } : {}

  return (
    <div className="flex flex-col items-center" style={{ ...frameStyles, ...shadowStyle, ...glowStyle, backgroundColor: safeConfig.backgroundOptions?.color || '#FFFFFF' }}>
      {safeConfig.meta?.restaurantName && (
        <div className="text-center mb-1.5">
          <h4 className="font-bold tracking-wide" style={{ fontSize: '11px', color: safeConfig.dotsOptions?.color || '#2D2D2D', letterSpacing: '1.5px' }}>
            {safeConfig.meta.restaurantName.toUpperCase()}
          </h4>
          {safeConfig.meta?.tagline && (
            <p className="mt-0.5 opacity-70" style={{ fontSize: '8px', color: safeConfig.dotsOptions?.color || '#666' }}>
              {safeConfig.meta.tagline}
            </p>
          )}
        </div>
      )}
      <div ref={containerRef} className="flex justify-center" />
      {qrCode.tableNumber && (
        <div className="text-center mt-1">
          <span className="inline-block px-2 py-0.5 rounded-full font-bold" style={{ fontSize: '8px', backgroundColor: `${safeConfig.frame?.color || '#2D2D2D'}15`, color: safeConfig.frame?.color || '#2D2D2D', border: `1px solid ${safeConfig.frame?.color || '#2D2D2D'}30` }}>
            Table {qrCode.tableNumber}
          </span>
        </div>
      )}
    </div>
  )
}

export const QRDashboard = ({ qrCodes, onDelete, onRefresh }) => {
  const navigate = useNavigate()
  const [downloadMenuId, setDownloadMenuId] = useState(null)

  const downloadQR = async (qr, format = 'png') => {
    const resolvedDesignConfig = (() => {
      if (qr.designConfig) return qr.designConfig
      try { return JSON.parse(localStorage.getItem('qr_design_configs') || '{}')[qr.id] || null } catch { return null }
    })()

    if (resolvedDesignConfig) {
      try {
        const safeConfig = sanitizeDesignConfig(resolvedDesignConfig)
        await exportDashboardCard({ safeConfig, url: qr.url, buildOptions: buildSafeQRStylingOptions, format, filename: `qr-${qr.name || 'code'}`, tableNumber: qr.tableNumber || null, QRCodeStyling })
      } catch (error) { toast.error('Failed to generate QR download') }
    } else if (qr.qrCodeData) {
      const link = document.createElement('a')
      link.download = `qr-${qr.name || qr.tableNumber || 'global'}.png`
      link.href = qr.qrCodeData
      link.click()
    }
    setDownloadMenuId(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {qrCodes.map((qr, index) => (
        <motion.div key={qr.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
          <Card hover>
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-sm text-surface-900 dark:text-surface-100">{qr.name || 'QR Code'}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    {qr.tableNumber ? <Badge variant="info">Table {qr.tableNumber}</Badge> : <Badge variant="primary" dot>Global</Badge>}
                    {qr.designConfig?.meta?.category && <span className="text-[10px] text-surface-400 capitalize bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded-full">{qr.designConfig.meta.category}</span>}
                  </div>
                </div>
                <button onClick={() => onDelete(qr.id)} className="text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors p-1.5 rounded-lg" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-center mb-5 py-4 bg-surface-50 dark:bg-surface-950/30 rounded-xl border border-surface-100 dark:border-surface-800/50">
                <QRCardPreview qrCode={qr} />
              </div>

              <div className="flex items-center justify-between text-xs text-surface-500 dark:text-surface-400 mb-4 bg-surface-50 dark:bg-surface-800/30 rounded-lg p-2.5 px-3">
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-surface-900 dark:text-surface-50 leading-tight">{qr.scans || 0}</span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold">Total Scans</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 mb-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{qr.lastScannedAt ? new Date(qr.lastScannedAt).toLocaleDateString() : 'No scans yet'}</span>
                  </div>
                  <div className="opacity-70 text-[10px]">Created {new Date(qr.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" leftIcon={<Edit3 className="w-3.5 h-3.5" />} onClick={() => navigate(`/owner/qr/designer?edit=${qr.id}`)}>Edit</Button>
                <div className="relative flex-1">
                  <Button size="sm" variant="primary" className="w-full" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={() => setDownloadMenuId(downloadMenuId === qr.id ? null : qr.id)}>
                    Export <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                  <AnimatePresence>
                    {downloadMenuId === qr.id && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute right-0 bottom-full mb-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700/50 rounded-lg shadow-elevated-md dark:shadow-dark-elevated-md py-1 z-10 min-w-[120px] overflow-hidden">
                        <button onClick={() => downloadQR(qr, 'png')} className="w-full text-left px-4 py-2 text-xs font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors">Download PNG</button>
                        <button onClick={() => downloadQR(qr, 'svg')} className="w-full text-left px-4 py-2 text-xs font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors">Download SVG</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
