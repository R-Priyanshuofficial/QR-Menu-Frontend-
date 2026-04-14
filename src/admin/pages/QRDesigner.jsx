import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Save } from 'lucide-react'
import { Button } from '@shared/components/Button'
import { Card } from '@shared/components/Card'
import { PageLoader } from '@shared/components/Spinner'
import { QRForm } from '../components/qr/QRForm'
import { QRPreview } from '../components/qr/QRPreview'
import { QREditorControls } from '../components/qr/QREditorControls'
import { useQRDesignConfig } from '../hooks/useQRDesignConfig'
import { sanitizeBorderStyle, sanitizeDesignConfig } from '../constants/designConfigDefaults'
import { qrAPI } from '@shared/api/endpoints'
import toast from 'react-hot-toast'

export const QRDesigner = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qrType = searchParams.get('type') || 'global'
  const tableNumber = searchParams.get('table') || null
  const editId = searchParams.get('edit') || null

  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(!!editId)
  const [activeTab, setActiveTab] = useState('form') // 'form' | 'style'

  const qrRef = useRef(null)

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

  // Load existing QR for editing
  useEffect(() => {
    if (editId) {
      loadExistingQR()
    }
  }, [editId])

  const loadExistingQR = async () => {
    try {
      const response = await qrAPI.getOne(editId)
      const qr = response.data.qrCode || response.data.data?.qrCode
      if (qr?.designConfig) {
        loadConfig(qr.designConfig)
      }
    } catch (error) {
      console.error('Failed to load QR:', error)
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

      // Build the full design config to persist
      const designConfig = { ...safeConfig }

      const payload = {
        name: qrType === 'global'
          ? safeConfig.meta.restaurantName || 'Global Menu QR'
          : `Table ${tableNumber} QR`,
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

      // Persist designConfig locally so the dashboard can render styled QR codes
      // even if the deployed backend doesn't return designConfig in the listing API
      if (savedId) {
        try {
          const stored = JSON.parse(localStorage.getItem('qr_design_configs') || '{}')
          stored[savedId] = designConfig
          localStorage.setItem('qr_design_configs', JSON.stringify(stored))
        } catch (e) { /* ignore storage errors */ }
      }

      navigate('/owner/qr')
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error.response?.data?.message || 'Failed to save QR code')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = (format = 'png') => {
    if (qrRef.current) {
      qrRef.current.download({
        name: `qr-${config.meta.restaurantName || 'code'}`,
        extension: format,
      })
    }
  }

  if (loading) return <PageLoader message="Loading QR code..." />

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => navigate('/owner/qr')}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {editId ? 'Edit QR Code' : 'Smart QR Designer'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {qrType === 'global' ? 'Global Menu QR' : `Table ${tableNumber} QR`}
            {' — '}Design your perfect QR code
          </p>
        </div>
      </motion.div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 xl:col-span-4"
        >
          {/* Tab Switcher */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'form'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('style')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'style'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              Style
            </button>
          </div>

          <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1 scrollbar-thin">
            {activeTab === 'form' ? (
              <QRForm
                config={config}
                updateConfig={updateConfig}
                updateField={updateField}
                applyTheme={applyTheme}
                randomize={randomize}
                qrType={qrType}
                tableNumber={tableNumber}
              />
            ) : (
              <QREditorControls
                config={config}
                updateConfig={updateConfig}
                updateField={updateField}
              />
            )}
          </div>
        </motion.div>

        {/* Right Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-7 xl:col-span-8"
        >
          <Card className="sticky top-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Live Preview
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={() => handleDownload('png')}
                  >
                    PNG
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={() => handleDownload('svg')}
                  >
                    SVG
                  </Button>
                </div>
              </div>

              {/* Preview Container */}
              <div className="flex justify-center py-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl min-h-[400px] items-center">
                <QRPreview
                  config={config}
                  getQRStylingOptions={getQRStylingOptions}
                  qrType={qrType}
                  tableNumber={tableNumber}
                  qrRef={qrRef}
                />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-40"
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/owner/qr')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={resetConfig}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            loading={generating}
            disabled={!config.meta.restaurantName?.trim() || generating}
            className="px-8 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
            leftIcon={<Save className="w-5 h-5" />}
          >
            {editId ? 'Update QR Code' : 'Generate QR Code'}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
