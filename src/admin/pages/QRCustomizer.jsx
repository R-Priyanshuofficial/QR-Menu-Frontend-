import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Upload, X, Sparkles, Download } from 'lucide-react'
import { Button } from '@shared/components/Button'
import { Input } from '@shared/components/Input'
import { Card } from '@shared/components/Card'
import { PageLoader } from '@shared/components/Spinner'
import { HexColorPicker } from 'react-colorful'
import { useClickOutside } from '@shared/hooks/useClickOutside'
import { qrAPI, qrDesignAPI } from '@shared/api/endpoints'
import { getTemplate, getAllTemplates, DEFAULT_TEMPLATE } from '../constants/QRTemplates'
import toast from 'react-hot-toast'

export const QRCustomizer = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qrType = searchParams.get('type') || 'global'
  const tableNumber = searchParams.get('table') || null

  // State
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [loadingDesigns, setLoadingDesigns] = useState(false)

  // Template & Design
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATE)
  const [designs, setDesigns] = useState([])
  const [selectedDesign, setSelectedDesign] = useState(null)

  // Customization
  const [restaurantName, setRestaurantName] = useState('')
  const [avatarId, setAvatarId] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoDataUrl, setLogoDataUrl] = useState(null)
  const [avatars, setAvatars] = useState([])

  // Color overrides
  const [customQrColor, setCustomQrColor] = useState(null)
  const [customBgColor, setCustomBgColor] = useState(null)
  const [customBorderColor, setCustomBorderColor] = useState(null)
  const [showColorPicker, setShowColorPicker] = useState(null)

  const colorPickerRefs = {
    qr: useClickOutside(() => showColorPicker === 'qr' && setShowColorPicker(null)),
    bg: useClickOutside(() => showColorPicker === 'bg' && setShowColorPicker(null)),
    border: useClickOutside(() => showColorPicker === 'border' && setShowColorPicker(null))
  }

  const currentTemplate = getTemplate(selectedTemplateId)

  useEffect(() => {
    fetchAvatars()
  }, [])

  // Load designs when template changes
  useEffect(() => {
    if (restaurantName.trim()) {
      loadDesignPreviews()
    }
  }, [selectedTemplateId])

  const fetchAvatars = async () => {
    try {
      const response = await qrAPI.getAvatars()
      setAvatars(response.data.avatars || [])
    } catch (error) {
      console.error('Failed to fetch avatars:', error)
    }
  }

  const loadDesignPreviews = async () => {
    if (!restaurantName.trim()) {
      toast.error('Please enter a restaurant name first')
      return
    }

    setLoadingDesigns(true)
    try {
      const frontendBase = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin
      const menuUrl = qrType === 'table'
        ? `${frontendBase}/menu?table=${tableNumber}`
        : `${frontendBase}/menu`

      const response = await qrDesignAPI.generateDesigns({
        restaurantName: restaurantName.trim(),
        template: currentTemplate,
        qrType,
        tableNumber,
        logoUrl: logoDataUrl,
        avatarId,
        url: menuUrl
      })

      if (response.data.designs && response.data.designs.length > 0) {
        setDesigns(response.data.designs)
        // Auto-select first design
        if (!selectedDesign) {
          setSelectedDesign(response.data.designs[0])
        }
        toast.success(`${response.data.designs.length} designs loaded!`)
      }
    } catch (error) {
      console.error('Failed to load designs:', error)
      toast.error('Failed to generate designs. Please try again.')
    } finally {
      setLoadingDesigns(false)
    }
  }

  const handleTemplateChange = (templateId) => {
    setSelectedTemplateId(templateId)
    setSelectedDesign(null)
    setDesigns([])
    // Reset color overrides when template changes
    setCustomQrColor(null)
    setCustomBgColor(null)
    setCustomBorderColor(null)
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
        setLogoDataUrl(reader.result)
        setAvatarId(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarSelect = (id) => {
    setAvatarId(id)
    setLogoFile(null)
    setLogoPreview(null)
    setLogoDataUrl(null)
  }

  const handleGenerate = async () => {
    if (!selectedDesign) {
      toast.error('Please select a design first')
      return
    }
    if (!restaurantName.trim()) {
      toast.error('Please enter a restaurant name')
      return
    }

    setGenerating(true)
    try {
      const template = currentTemplate
      const { preview, ...cleanDesignSpec } = selectedDesign

      const payload = {
        name: qrType === 'global' ? 'Global Menu QR' : `Table ${tableNumber} QR`,
        type: qrType,
        tableNumber: qrType === 'table' ? tableNumber : undefined,
        customization: {
          qrColor: customQrColor || template.qrColor,
          backgroundColor: customBgColor || template.backgroundColor,
          borderColor: customBorderColor || template.borderColor,
          borderStyle: 'none',
          logoUrl: logoDataUrl,
          avatarId,
          showTableNumber: qrType === 'table'
        },
        designSpec: cleanDesignSpec,
        restaurantName: restaurantName.trim(),
        templateId: selectedTemplateId
      }

      await qrAPI.generate(payload)
      toast.success('QR code generated successfully! 🎉')
      navigate('/owner/qr')
    } catch (error) {
      console.error('Generate error:', error)
      toast.error(error.response?.data?.message || 'Failed to generate QR code')
    } finally {
      setGenerating(false)
    }
  }

  const templates = getAllTemplates()

  return (
    <div className="space-y-6 pb-8">
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
            Customize QR Code
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {qrType === 'global' ? 'Global Menu QR' : `Table ${tableNumber} QR`} — Pick a design and personalize it
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ─── LEFT: Customization Controls ─── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-1 space-y-5"
        >
          {/* Restaurant Name */}
          <Card>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider">
                Restaurant Name
              </h3>
              <Input
                type="text"
                placeholder="Enter your restaurant name..."
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Appears at the top of your QR design
              </p>
            </div>
          </Card>

          {/* Template Selection */}
          <Card>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider">
                Color Theme
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {templates.filter(t => t.id !== 'custom').map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateChange(template.id)}
                    className={`relative p-3 border-2 rounded-lg transition-all text-center ${
                      selectedTemplateId === template.id
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="text-xl mb-1">{template.icon}</div>
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{template.name}</div>
                    <div className="flex justify-center gap-0.5 mt-1.5">
                      <div className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: template.qrColor }} />
                      <div className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: template.borderColor }} />
                    </div>
                    {selectedTemplateId === template.id && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Avatar / Logo */}
          <Card>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider">
                Logo / Avatar
              </h3>

              {/* Upload Logo */}
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Upload className="w-4 h-4" />}
                    onClick={() => document.getElementById('logo-upload-customizer').click()}
                  >
                    {logoFile ? 'Change' : 'Upload Logo'}
                  </Button>
                  <input
                    id="logo-upload-customizer"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  {logoPreview && (
                    <div className="flex items-center gap-2">
                      <img src={logoPreview} alt="Logo" className="w-10 h-10 object-contain border border-gray-300 dark:border-gray-600 rounded" />
                      <button
                        onClick={() => {
                          setLogoFile(null)
                          setLogoPreview(null)
                          setLogoDataUrl(null)
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Avatar Grid */}
              <div className="grid grid-cols-4 gap-2">
                {avatars.map(avatar => (
                  <button
                    key={avatar.id}
                    onClick={() => handleAvatarSelect(avatar.id)}
                    className={`p-2 border-2 rounded-lg transition-all ${
                      avatarId === avatar.id
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://qr-menu-backend-lwba.onrender.com'}${avatar.url}`}
                      alt={avatar.name}
                      className="w-full h-10 object-contain"
                    />
                    <p className="text-[10px] text-center mt-1 text-gray-600 dark:text-gray-400 truncate">{avatar.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Color Fine-Tuning */}
          <Card>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider">
                Fine-Tune Colors
              </h3>
              <div className="space-y-3">
                {/* QR Color */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">QR Color</span>
                  <div className="relative">
                    <button
                      className="w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer shadow-sm"
                      style={{ backgroundColor: customQrColor || currentTemplate.qrColor }}
                      onClick={() => setShowColorPicker(showColorPicker === 'qr' ? null : 'qr')}
                    />
                    {showColorPicker === 'qr' && (
                      <div ref={colorPickerRefs.qr} className="absolute right-0 z-20 mt-2">
                        <HexColorPicker
                          color={customQrColor || currentTemplate.qrColor}
                          onChange={setCustomQrColor}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {/* Background */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Background</span>
                  <div className="relative">
                    <button
                      className="w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer shadow-sm"
                      style={{ backgroundColor: customBgColor || currentTemplate.backgroundColor }}
                      onClick={() => setShowColorPicker(showColorPicker === 'bg' ? null : 'bg')}
                    />
                    {showColorPicker === 'bg' && (
                      <div ref={colorPickerRefs.bg} className="absolute right-0 z-20 mt-2">
                        <HexColorPicker
                          color={customBgColor || currentTemplate.backgroundColor}
                          onChange={setCustomBgColor}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {/* Border */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Border</span>
                  <div className="relative">
                    <button
                      className="w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer shadow-sm"
                      style={{ backgroundColor: customBorderColor || currentTemplate.borderColor }}
                      onClick={() => setShowColorPicker(showColorPicker === 'border' ? null : 'border')}
                    />
                    {showColorPicker === 'border' && (
                      <div ref={colorPickerRefs.border} className="absolute right-0 z-20 mt-2">
                        <HexColorPicker
                          color={customBorderColor || currentTemplate.borderColor}
                          onChange={setCustomBorderColor}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Generate Designs Button */}
          <Button
            onClick={loadDesignPreviews}
            loading={loadingDesigns}
            disabled={loadingDesigns || !restaurantName.trim()}
            className="w-full"
            leftIcon={<Sparkles className="w-5 h-5" />}
          >
            {loadingDesigns ? 'Generating Designs...' : 'Generate Design Previews'}
          </Button>
        </motion.div>

        {/* ─── RIGHT: Design Gallery + Preview ─── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2 space-y-5"
        >
          {/* Design Gallery */}
          {designs.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider">
                Choose a Design
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {designs.map((design) => (
                  <motion.div
                    key={design.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-200 overflow-hidden ${
                        selectedDesign?.id === design.id
                          ? 'ring-2 ring-red-500 shadow-lg shadow-red-500/20'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedDesign(design)}
                    >
                      <div className="relative">
                        {/* Design Preview Image */}
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-3">
                          <img
                            src={design.preview}
                            alt={design.name}
                            className="w-full h-auto rounded shadow-sm"
                          />
                        </div>

                        {/* Design Info */}
                        <div className="p-3">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {design.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {design.description}
                          </p>
                        </div>

                        {/* Selected badge */}
                        {selectedDesign?.id === design.id && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty state */
            <Card>
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Ready to Design Your QR Code
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                  Enter your restaurant name, pick a color theme, then click
                  <strong className="text-red-500"> "Generate Design Previews" </strong>
                  to see beautiful QR designs
                </p>
              </div>
            </Card>
          )}

          {/* Selected Design Preview (Large) */}
          {selectedDesign && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                      Preview — {selectedDesign.name}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                      Selected ✓
                    </span>
                  </div>
                  <div className="flex justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6">
                    <img
                      src={selectedDesign.preview}
                      alt={selectedDesign.name}
                      className="max-w-xs w-full h-auto rounded-lg shadow-2xl"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                    This is exactly how your QR code will look when generated
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ─── Bottom Action Bar ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="sticky bottom-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 -mx-6 px-6 py-4 mt-8 flex items-center justify-between rounded-t-xl"
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/owner/qr')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to QR Codes
        </Button>
        <Button
          onClick={handleGenerate}
          loading={generating}
          disabled={!selectedDesign || !restaurantName.trim() || generating}
          className="px-8 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
          leftIcon={<Download className="w-5 h-5" />}
        >
          Generate QR Code
        </Button>
      </motion.div>
    </div>
  )
}
