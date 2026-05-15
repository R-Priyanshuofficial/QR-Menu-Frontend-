import { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Download,
  Save,
  Sparkles,
  RotateCcw,
  Minus,
  Plus,
  Copy,
  Check,
  Layers,
  SlidersHorizontal,
  Settings2,
  ChevronRight,
  Zap,
  FileImage,
  Shield,
  Contrast,
  Maximize,
} from 'lucide-react'
import { Button } from '@shared/components/Button'
import { Card } from '@shared/components/Card'
import { PageLoader } from '@shared/components/Spinner'
import { QRForm } from '../components/qr/QRForm'
import { QRPreview } from '../components/qr/QRPreview'
import { QREditorControls } from '../components/qr/QREditorControls'
import { QRAdvancedControls } from '../components/qr/QRAdvancedControls'
import { useQRDesignConfig } from '../hooks/useQRDesignConfig'
import { sanitizeDesignConfig } from '../constants/designConfigDefaults'
import { qrAPI } from '@shared/api/endpoints'
import { exportCardAsImage } from '../utils/exportCardAsImage'
import toast from 'react-hot-toast'
import { cn } from '@shared/utils/cn'

/* ─── Collapsible Section ─── */
const DesignerSection = ({ id, icon: Icon, title, subtitle, children, defaultOpen = false, openSection, onToggle }) => {
  const isOpen = openSection === id

  return (
    <div className="border-b border-surface-200/70 dark:border-surface-700/30 last:border-b-0">
      <button
        onClick={() => onToggle(id)}
        className={cn(
          'w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors group',
          isOpen
            ? 'bg-surface-50/80 dark:bg-surface-800/20'
            : 'hover:bg-surface-50/50 dark:hover:bg-surface-800/10'
        )}
      >
        <div className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0',
          isOpen
            ? 'bg-primary-500/10 text-primary-500'
            : 'bg-surface-100 dark:bg-surface-800/50 text-surface-500 group-hover:text-surface-700 dark:group-hover:text-surface-300'
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-semibold transition-colors',
            isOpen ? 'text-surface-900 dark:text-surface-50' : 'text-surface-700 dark:text-surface-300'
          )}>{title}</p>
          {subtitle && <p className="text-[11px] text-surface-400 dark:text-surface-500 truncate">{subtitle}</p>}
        </div>
        <ChevronRight className={cn(
          'w-4 h-4 text-surface-400 transition-transform duration-200 flex-shrink-0',
          isOpen && 'rotate-90'
        )} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Main Page ─── */
export const QRDesigner = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qrType = searchParams.get('type') || 'global'
  const tableNumber = searchParams.get('table') || null
  const editId = searchParams.get('edit') || null

  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(!!editId)
  const [openSection, setOpenSection] = useState('content')
  const [zoom, setZoom] = useState(1)
  const [canvasBg, setCanvasBg] = useState('grid')
  const [copied, setCopied] = useState(false)

  const qrRef = useRef(null)
  const previewRef = useRef(null)

  const {
    config,
    updateConfig,
    updateField,
    resetConfig,
    applyTheme,
    randomize,
    loadConfig,
    getQRStylingOptions,
  } = useQRDesignConfig()

  useEffect(() => {
    if (editId) loadExistingQR()
  }, [editId])

  const loadExistingQR = async () => {
    try {
      const response = await qrAPI.getOne(editId)
      const qr = response.data.qrCode || response.data.data?.qrCode
      if (qr?.designConfig) loadConfig(qr.designConfig)
    } catch (error) {
      toast.error('Failed to load QR code for editing')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config.meta.restaurantName?.trim()) {
      toast.error('Please enter a restaurant name')
      return
    }
    setGenerating(true)
    try {
      const safeConfig = sanitizeDesignConfig(config)
      const designConfig = { ...safeConfig }
      const payload = {
        name: qrType === 'global' ? safeConfig.meta.restaurantName || 'Global Menu QR' : `Table ${tableNumber} QR`,
        type: qrType,
        tableNumber: qrType === 'table' ? tableNumber : undefined,
        restaurantName: safeConfig.meta.restaurantName.trim(),
        tagline: safeConfig.meta.tagline || '',
        category: safeConfig.meta.category || 'restaurant',
        designConfig,
        customization: {
          qrColor: safeConfig.dotsOptions.color,
          backgroundColor: safeConfig.backgroundOptions.color,
          borderColor: safeConfig.frame?.color || '#000000',
          borderStyle: 'none',
          logoUrl: safeConfig.logo || null,
          avatarId: safeConfig.avatarId || null,
          showTableNumber: qrType === 'table',
        },
      }
      let savedId = editId
      if (editId) {
        await qrAPI.update(editId, payload)
        toast.success('QR code updated! ✨')
      } else {
        const res = await qrAPI.generate(payload)
        savedId = res?.data?.qrCode?.id || res?.qrCode?.id
        toast.success('QR code generated! 🎉')
      }
      if (savedId) {
        try {
          const stored = JSON.parse(localStorage.getItem('qr_design_configs') || '{}')
          stored[savedId] = designConfig
          localStorage.setItem('qr_design_configs', JSON.stringify(stored))
        } catch (e) {}
      }
      pushRecent(designConfig)
      navigate('/owner/qr')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save QR code')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async (format = 'png') => {
    const cardEl = previewRef.current?.getCardElement?.()
    if (cardEl) {
      await exportCardAsImage(cardEl, format, `qr-${config.meta.restaurantName || 'code'}`, {
        pixelRatio: 4,
        backgroundColor: config.backgroundOptions?.color || '#ffffff',
      })
    } else if (qrRef.current) {
      qrRef.current.download({ name: `qr-${config.meta.restaurantName || 'code'}`, extension: format })
    }
  }

  const menuUrl = useMemo(() => {
    const frontendBase = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin
    return qrType === 'table' ? `${frontendBase}/menu?table=${tableNumber}` : `${frontendBase}/menu`
  }, [qrType, tableNumber])

  const pushRecent = (designConfig) => {
    try {
      const item = {
        id: String(Date.now()),
        name: config.meta.restaurantName || 'Untitled',
        category: config.meta.category,
        createdAt: Date.now(),
        designConfig,
      }
      const prev = JSON.parse(localStorage.getItem('qr_designer_recent_templates_v2') || '[]')
      const merged = [item, ...(Array.isArray(prev) ? prev : [])].slice(0, 6)
      localStorage.setItem('qr_designer_recent_templates_v2', JSON.stringify(merged))
    } catch {}
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast.success('Menu URL copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  useEffect(() => {
    if (editId) return
    try {
      const raw = sessionStorage.getItem('qr_designer_draft_copy')
      if (!raw) return
      loadConfig(JSON.parse(raw))
      sessionStorage.removeItem('qr_designer_draft_copy')
    } catch {}
  }, [editId, loadConfig])

  const handleSmart = () => {
    randomize()
    toast.success('Smart style applied ✨')
  }

  const toggleSection = (id) => {
    setOpenSection(prev => prev === id ? null : id)
  }

  // Contrast quality indicator
  const contrastQuality = useMemo(() => {
    const dotColor = config.dotsOptions.color
    const bgColor = config.backgroundOptions.color
    const hexToLum = (hex) => {
      const c = hex.replace('#', '')
      const r = parseInt(c.substring(0, 2), 16) / 255
      const g = parseInt(c.substring(2, 4), 16) / 255
      const b = parseInt(c.substring(4, 6), 16) / 255
      const toL = (v) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      return 0.2126 * toL(r) + 0.7152 * toL(g) + 0.0722 * toL(b)
    }
    try {
      const l1 = hexToLum(dotColor)
      const l2 = hexToLum(bgColor)
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
      if (ratio >= 7) return { label: 'Excellent', color: 'text-emerald-500', dot: 'bg-emerald-500' }
      if (ratio >= 4.5) return { label: 'Good', color: 'text-amber-500', dot: 'bg-amber-500' }
      return { label: 'Low', color: 'text-red-400', dot: 'bg-red-400' }
    } catch {
      return { label: 'Unknown', color: 'text-surface-400', dot: 'bg-surface-400' }
    }
  }, [config.dotsOptions.color, config.backgroundOptions.color])

  if (loading) return <PageLoader message="Loading QR code..." />

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* ═══════════ STICKY HEADER BAR ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6 backdrop-blur-xl bg-white/80 dark:bg-surface-950/80 border-b border-surface-200/60 dark:border-surface-700/30"
      >
        <div className="flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
          {/* Left — Nav + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/owner/qr')}
              className="p-2 rounded-xl transition-all bg-surface-100 dark:bg-surface-800/60 hover:bg-surface-200 dark:hover:bg-surface-700/70 border border-surface-200/80 dark:border-surface-700/50 hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-surface-600 dark:text-surface-400" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-surface-400">
              <span className="hover:text-surface-600 dark:hover:text-surface-300 cursor-pointer transition-colors" onClick={() => navigate('/owner/qr')}>QR Codes</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-surface-700 dark:text-surface-200 font-medium">Designer</span>
            </div>
            <div className="sm:ml-2 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-surface-50 tracking-tight font-display truncate">
                {editId ? 'Edit QR Code' : 'QR Designer'}
              </h1>
              <p className="text-[11px] text-surface-400 dark:text-surface-500 truncate hidden sm:block">
                {qrType === 'global' ? 'Global Menu QR' : `Table ${tableNumber} QR`} · Customize your QR experience
              </p>
            </div>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" leftIcon={<RotateCcw className="w-3.5 h-3.5" />} onClick={resetConfig} className="hidden sm:inline-flex">
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              loading={generating}
              disabled={!config.meta.restaurantName?.trim() || generating}
              variant="gradient"
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              {editId ? 'Update QR' : 'Generate QR'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ═══════════ 2-COLUMN BODY ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(340px,2fr)_3fr] gap-6 xl:gap-8 items-start lg:items-stretch pb-10">

        {/* ── LEFT: Controls Panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="min-h-0"
        >
          <Card className="overflow-hidden h-full flex flex-col">
            {/* Panel Header */}
            <div className="px-5 py-4 border-b border-surface-200/70 dark:border-surface-700/30 bg-surface-50/50 dark:bg-surface-800/10 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 font-display">Design Controls</h2>
                  <p className="text-[11px] text-surface-400 dark:text-surface-500 mt-0.5">Configure your QR code</p>
                </div>
                <button
                  onClick={handleSmart}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-violet-500/10 to-primary-500/10 text-violet-600 dark:text-violet-400 hover:from-violet-500/20 hover:to-primary-500/20 transition-all border border-violet-500/20 dark:border-violet-500/15"
                >
                  <Sparkles className="w-3 h-3" />
                  Smart
                </button>
              </div>
            </div>

            {/* Sections — scrollable area */}
            <div className="flex-1 overflow-y-auto qr-controls-panel min-h-0">
            <DesignerSection
              id="content"
              icon={Layers}
              title="Content & Info"
              subtitle="Name, category, URL, logo"
              openSection={openSection}
              onToggle={toggleSection}
            >
              <QRForm
                config={config}
                updateConfig={updateConfig}
                updateField={updateField}
                applyTheme={applyTheme}
                randomize={randomize}
                qrType={qrType}
                tableNumber={tableNumber}
              />
            </DesignerSection>

            <DesignerSection
              id="style"
              icon={SlidersHorizontal}
              title="Style & Colors"
              subtitle="Colors, dots, corners, frame"
              openSection={openSection}
              onToggle={toggleSection}
            >
              <QREditorControls config={config} updateConfig={updateConfig} updateField={updateField} />
            </DesignerSection>

            <DesignerSection
              id="advanced"
              icon={Settings2}
              title="Advanced"
              subtitle="Quality, logo size & margin"
              openSection={openSection}
              onToggle={toggleSection}
            >
              <QRAdvancedControls config={config} updateField={updateField} />
            </DesignerSection>

            <DesignerSection
              id="export"
              icon={FileImage}
              title="Export"
              subtitle="Download PNG or SVG"
              openSection={openSection}
              onToggle={toggleSection}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={() => handleDownload('png')} className="w-full">
                    PNG
                  </Button>
                  <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={() => handleDownload('svg')} className="w-full">
                    SVG
                  </Button>
                </div>
                <p className="text-[11px] text-surface-400 dark:text-surface-500">
                  High-resolution export at 4x pixel ratio for print-ready quality.
                </p>
              </div>
            </DesignerSection>
            </div>

            {/* Bottom Quick Actions */}
            <div className="px-5 py-4 border-t border-surface-200/70 dark:border-surface-700/30 bg-surface-50/30 dark:bg-surface-800/10 flex-shrink-0 mt-auto">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyUrl}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-surface-100 dark:bg-surface-800/50 hover:bg-surface-200 dark:hover:bg-surface-700/50 text-surface-600 dark:text-surface-400 transition-all border border-surface-200/80 dark:border-surface-700/40"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy URL'}
                </button>
                <button
                  onClick={resetConfig}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-surface-100 dark:bg-surface-800/50 hover:bg-surface-200 dark:hover:bg-surface-700/50 text-surface-600 dark:text-surface-400 transition-all border border-surface-200/80 dark:border-surface-700/40 lg:hidden"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── RIGHT: Large Live Preview ── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="min-h-0"
        >
          <Card className="overflow-hidden h-full flex flex-col">
            {/* Preview Header */}
            <div className="px-5 py-3.5 border-b border-surface-200/70 dark:border-surface-700/30 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                <span className="text-sm font-semibold text-surface-900 dark:text-surface-50">Live Preview</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-0.5 rounded-xl bg-surface-100 dark:bg-surface-800/40 border border-surface-200/80 dark:border-surface-700/50 p-0.5">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
                    className="h-7 w-7 rounded-lg grid place-items-center text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 hover:bg-white/80 dark:hover:bg-surface-700/60 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <div className="px-2 text-[11px] font-bold text-surface-600 dark:text-surface-300 tabular-nums min-w-[40px] text-center">
                    {Math.round(zoom * 100)}%
                  </div>
                  <button
                    onClick={() => setZoom((z) => Math.min(1.5, Math.round((z + 0.1) * 10) / 10))}
                    className="h-7 w-7 rounded-lg grid place-items-center text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 hover:bg-white/80 dark:hover:bg-surface-700/60 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Canvas Background Toggle */}
                <div className="flex items-center gap-0.5 rounded-xl bg-surface-100 dark:bg-surface-800/40 border border-surface-200/80 dark:border-surface-700/50 p-0.5">
                  {[
                    { id: 'grid', label: 'Grid' },
                    { id: 'clean', label: 'Clean' },
                    { id: 'dark', label: 'Dark' },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setCanvasBg(bg.id)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                        canvasBg === bg.id
                          ? 'bg-white dark:bg-surface-700/80 text-surface-900 dark:text-surface-50 shadow-sm border border-surface-200/80 dark:border-surface-600/40'
                          : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
                      )}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview Canvas */}
            <div
              className={cn(
                'relative overflow-hidden flex-1 flex flex-col',
                canvasBg === 'dark'
                  ? 'bg-surface-950'
                  : canvasBg === 'grid'
                    ? 'qr-preview-canvas bg-gradient-to-br from-surface-50 via-white to-surface-100 dark:from-surface-950/60 dark:via-surface-900/40 dark:to-surface-900/70'
                    : 'bg-gradient-to-br from-surface-50 via-white to-surface-100 dark:from-surface-950/40 dark:via-surface-900/30 dark:to-surface-900/60',
              )}
            >
              {/* Ambient blurs */}
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-500/[0.06] rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-violet-500/[0.04] rounded-full blur-[100px] pointer-events-none" />

              {/* QR Preview — centered, auto-scaled */}
              <div className="relative flex justify-center items-center py-12 px-8 flex-1" style={{ minHeight: '420px' }}>
                <motion.div
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                  layout
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <QRPreview
                    ref={previewRef}
                    config={config}
                    getQRStylingOptions={getQRStylingOptions}
                    qrType={qrType}
                    tableNumber={tableNumber}
                    qrRef={qrRef}
                  />
                </motion.div>
              </div>
            </div>

            {/* Preview Footer — Quality indicators */}
            <div className="px-5 py-3 border-t border-surface-200/70 dark:border-surface-700/30 flex flex-wrap items-center justify-between gap-3 bg-surface-50/40 dark:bg-surface-900/20 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-surface-400" />
                  <span className="text-[11px] text-surface-500">Error Correction:</span>
                  <span className="text-[11px] font-bold text-surface-700 dark:text-surface-300">{config.qrOptions.errorCorrectionLevel}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Contrast className="w-3.5 h-3.5 text-surface-400" />
                  <span className="text-[11px] text-surface-500">Contrast:</span>
                  <span className={cn('text-[11px] font-bold flex items-center gap-1', contrastQuality.color)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', contrastQuality.dot)} />
                    {contrastQuality.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Maximize className="w-3.5 h-3.5 text-surface-400" />
                <span className="text-[11px] text-surface-500">Export: 280×280 @4x</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
