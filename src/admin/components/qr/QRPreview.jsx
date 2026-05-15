import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { motion } from 'framer-motion'
import { sanitizeDesignConfig } from '../../constants/designConfigDefaults'

export const QRPreview = forwardRef(({ config, getQRStylingOptions, qrType, tableNumber, qrRef: externalRef }, ref) => {
  const containerRef = useRef(null)
  const cardRef = useRef(null)
  const qrInstanceRef = useRef(null)
  const [ready, setReady] = useState(false)
  const safeConfig = sanitizeDesignConfig(config)

  const menuUrl = (() => {
    const frontendBase = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin
    return qrType === 'table'
      ? `${frontendBase}/menu?table=${tableNumber}`
      : `${frontendBase}/menu`
  })()

  // Expose the card ref and qr instance to the parent
  useImperativeHandle(ref, () => ({
    getCardElement: () => cardRef.current,
    getQRInstance: () => qrInstanceRef.current,
  }))

  // Initialize QR instance
  useEffect(() => {
    try {
      const options = getQRStylingOptions(menuUrl, safeConfig.logo || undefined)
      const qr = new QRCodeStyling(options)
      qrInstanceRef.current = qr

      if (externalRef) {
        externalRef.current = qr
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = ''
        qr.append(containerRef.current)
      }

      setReady(true)
    } catch (error) {
      console.error('QR Generation Error:', error)
      setReady(false)
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [])

  // Update QR on config changes
  useEffect(() => {
    if (!qrInstanceRef.current || !ready) return
    try {
      const options = getQRStylingOptions(menuUrl, safeConfig.logo || undefined)
      qrInstanceRef.current.update(options)
    } catch (error) {
      console.error('QR Generation Error:', error)
    }
  }, [config, menuUrl, ready])

  // Frame styles
  const frameStyles = (() => {
    const f = safeConfig.frame || {}
    const base = {
      padding: `${f.padding || 16}px`,
      borderRadius: '12px',
      transition: 'all 0.3s ease',
    }

    switch (f.style) {
      case 'solid':
        return {
          ...base,
          border: `3px solid ${f.color || '#2D2D2D'}`,
          borderRadius: '18px',
        }
      case 'dashed':
        return {
          ...base,
          border: `3px dashed ${f.color || '#2D2D2D'}`,
        }
      default:
        return base
    }
  })()

  const shadowStyle = safeConfig.frame?.shadow
    ? { filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.15))' }
    : {}

  const glowStyle = safeConfig.frame?.glow
    ? { boxShadow: `${frameStyles.boxShadow || ''}, 0 0 30px ${safeConfig.frame.color || '#E94560'}40, 0 0 60px ${safeConfig.frame.color || '#E94560'}20`.replace(/^, /, '') }
    : {}

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center"
    >
      {/* Preview Frame — this is the element we export */}
      <div
        ref={cardRef}
        className="relative"
        style={{
          ...frameStyles,
          ...shadowStyle,
          ...glowStyle,
          backgroundColor: safeConfig.backgroundOptions?.color || '#FFFFFF',
        }}
      >
        {/* Restaurant Name */}
        {safeConfig.meta?.restaurantName && (
          <div className="text-center mb-3">
            <h3
              className="font-bold tracking-wide"
              style={{
                fontSize: '16px',
                color: safeConfig.dotsOptions?.color || '#2D2D2D',
                letterSpacing: '2px',
              }}
            >
              {safeConfig.meta.restaurantName.toUpperCase()}
            </h3>
            {safeConfig.meta?.tagline && (
              <p
                className="text-xs mt-0.5 opacity-70"
                style={{ color: safeConfig.dotsOptions?.color || '#666' }}
              >
                {safeConfig.meta.tagline}
              </p>
            )}
          </div>
        )}

        {/* QR Code Container */}
        <div ref={containerRef} className="flex justify-center" />

        {/* Table Number Badge */}
        {qrType === 'table' && tableNumber && (
          <div className="text-center mt-2">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: `${safeConfig.frame?.color || '#2D2D2D'}15`,
                color: safeConfig.frame?.color || '#2D2D2D',
                border: `1px solid ${safeConfig.frame?.color || '#2D2D2D'}30`,
              }}
            >
              Table {tableNumber}
            </span>
          </div>
        )}

        {/* Branding — Premium Signature */}
        <div className="text-center mt-3 flex justify-center">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full"
            style={{
              fontSize: '8px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: safeConfig.dotsOptions?.color || '#2D2D2D',
              opacity: 0.3,
              border: `1px solid ${safeConfig.dotsOptions?.color || '#2D2D2D'}18`,
              background: `${safeConfig.dotsOptions?.color || '#2D2D2D'}06`,
            }}
          >
            <svg width="8" height="8" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.7 }}>
              <path d="M8 0l1.796 5.528h5.813l-4.703 3.416 1.796 5.528L8 11.056l-4.702 3.416 1.796-5.528L.391 5.528h5.813z" />
            </svg>
            POWERED BY QRMENU
          </span>
        </div>
      </div>

      {/* Label */}
      <p className="text-xs text-surface-500 dark:text-surface-500 mt-4 text-center" data-export-ignore="true">
        This is exactly how your QR code will look
      </p>
    </motion.div>
  )
})

QRPreview.displayName = 'QRPreview'
