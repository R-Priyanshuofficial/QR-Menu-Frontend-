import { useState, useEffect } from 'react'
import { X, Upload, Palette, Frame, Hash } from 'lucide-react'
import { Button } from '@shared/components/Button'
import { Input } from '@shared/components/Input'
import { HexColorPicker } from 'react-colorful'
import { qrAPI, qrDesignAPI } from '@shared/api/endpoints'
import { useClickOutside } from '@shared/hooks/useClickOutside'
import { PresetTemplateSelector } from './PresetTemplateSelector'
import { DesignPreviewSlider } from './DesignPreviewSlider'
import { DEFAULT_TEMPLATE, getTemplate } from '../constants/QRTemplates'
import toast from 'react-hot-toast'

export const QRCustomizationModal = ({ isOpen, onClose, qrType, tableNumber, onGenerate }) => {
  const [step, setStep] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [avatars, setAvatars] = useState([])
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATE)
  const [restaurantName, setRestaurantName] = useState('')
  const [generatedDesigns, setGeneratedDesigns] = useState([])
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [loadingDesigns, setLoadingDesigns] = useState(false)
  
  const [customization, setCustomization] = useState({
    logoUrl: null,
    avatarId: null,
    qrColor: '#000000',
    backgroundColor: '#FFFFFF',
    borderStyle: 'none',
    borderColor: '#000000',
    showTableNumber: false
  })

  const [showColorPicker, setShowColorPicker] = useState(null)

  // Click-outside detection for color pickers
  const colorPickerRefs = {
    qr: useClickOutside(() => showColorPicker === 'qr' && setShowColorPicker(null)),
    bg: useClickOutside(() => showColorPicker === 'bg' && setShowColorPicker(null)),
    border: useClickOutside(() => showColorPicker === 'border' && setShowColorPicker(null))
  }

  useEffect(() => {
    if (isOpen) {
      fetchAvatars()
      // Reset state when modal opens
      setStep(1)
      setLogoFile(null)
      setLogoPreview(null)
      setCustomization({
        logoUrl: null,
        avatarId: null,
        qrColor: '#000000',
        backgroundColor: '#FFFFFF',
        borderStyle: 'none',
        borderColor: '#000000',
        showTableNumber: false
      })
    }
  }, [isOpen])

  const fetchAvatars = async () => {
    try {
      const response = await qrAPI.getAvatars()
      setAvatars(response.data.avatars || [])
    } catch (error) {
      console.error('Failed to fetch avatars:', error)
    }
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
        setCustomization(prev => ({ ...prev, logoUrl: reader.result, avatarId: null }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarSelect = (avatarId) => {
    setCustomization(prev => ({ ...prev, avatarId, logoUrl: null }))
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleColorChange = (color, field) => {
    setCustomization(prev => ({ ...prev, [field]: color }))
  }

  const handleBorderStyleChange = (style) => {
    setCustomization(prev => ({ ...prev, borderStyle: style }))
  }

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id)
    // Apply template colors unless it's custom
    if (template.id !== 'custom') {
      setCustomization(prev => ({
        ...prev,
        qrColor: template.qrColor,
        backgroundColor: template.backgroundColor,
        borderColor: template.borderColor,
        borderStyle: template.borderStyle
      }))
    }
  }

  const triggerAIDesignGeneration = async () => {
    // Validate restaurant name
    if (!restaurantName || restaurantName.trim() === '') {
      toast.error('Please enter your restaurant name in Step 1')
      return false
    }

    setLoadingDesigns(true)
    try {
      // Construct QR URL
      const frontendBase = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin
      const menuUrl = qrType === 'table' 
        ? `${frontendBase}/menu?table=${tableNumber}`
        : `${frontendBase}/menu`

      console.log('🎨 Requesting AI design generation...')

      // Call AI design generation API
      const response = await qrDesignAPI.generateDesigns({
        restaurantName: restaurantName.trim(),
        template: getTemplate(selectedTemplate),
        qrType,
        tableNumber,
        logoUrl: customization.logoUrl,
        avatarId: customization.avatarId,
        url: menuUrl
      })

      if (response.data.designs && response.data.designs.length > 0) {
        console.log(`✅ Received ${response.data.designs.length} designs`)
        setGeneratedDesigns(response.data.designs)
        setLoadingDesigns(false)
        toast.success('Designs generated successfully! ✨')
        return true
      } else {
        console.warn('⚠️ No designs returned from API')
        toast.error('No designs were generated. Please try again.')
        setLoadingDesigns(false)
        return false
      }
    } catch (error) {
      console.error('❌ AI design generation error:', error)
      
      // Show specific error message based on error type
      let errorMessage = 'Failed to generate designs. Please try again.'
      
      if (error.response) {
        // Server responded with error
        const serverMessage = error.response.data?.message
        if (serverMessage) {
          errorMessage = serverMessage
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Using default designs as fallback.'
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid request. Please check your inputs.'
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Cannot connect to server. Please check your connection.'
      }
      
      toast.error(errorMessage)
      setLoadingDesigns(false)
      return false
    }
  }


  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const payload = {
        name: qrType === 'global' ? 'Global Menu QR' : `Table ${tableNumber} QR`,
        type: qrType,
        tableNumber: qrType === 'table' ? tableNumber : undefined,
        customization
      }
      
      await onGenerate(payload)
      onClose()
      toast.success('Customized QR code generated!')
    } catch (error) {
      console.error('Generate error:', error)
      toast.error(error.response?.data?.message || 'Failed to generate QR code')
    } finally {
      setGenerating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Customize QR Code
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {qrType === 'global' ? 'Global Menu QR' : `Table ${tableNumber} QR`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center max-w-3xl mx-auto">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    step >= s ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}>
                    {s}
                  </div>
                  <div className={`text-xs mt-2 whitespace-nowrap ${step >= s ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-500'}`}>
                    {s === 1 ? 'Template' : s === 2 ? 'Logo/Avatar' : s === 3 ? 'Colors & Border' : 'Design Selection'}
                  </div>
                </div>
                {s <  4 && <div className={`h-1 w-20 mx-4 ${step > s ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Template Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <PresetTemplateSelector
                selectedTemplateId={selectedTemplate}
                onSelectTemplate={handleTemplateSelect}
              />
              
              {/* Restaurant Name Input */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Restaurant Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Enter your restaurant name..."
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will appear at the top of your QR code
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Logo/Avatar */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Choose Logo or Avatar
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Upload your restaurant logo or choose from preset avatars
                </p>

                {/* Logo Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      leftIcon={<Upload className="w-5 h-5" />}
                      onClick={() => document.getElementById('logo-upload').click()}
                    >
                      {logoFile ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    {logoPreview && (
                      <div className="flex items-center gap-2">
                        <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain border border-gray-300 dark:border-gray-600 rounded" />
                        <button
                          onClick={() => {
                            setLogoFile(null)
                            setLogoPreview(null)
                            setCustomization(prev => ({ ...prev, logoUrl: null }))
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Or Choose an Avatar
                  </label>
                  <div className="grid grid-cols-4 gap-4">
                    {avatars.map(avatar => (
                      <button
                        key={avatar.id}
                        onClick={() => handleAvatarSelect(avatar.id)}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          customization.avatarId === avatar.id
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <img src={`http://localhost:5000${avatar.url}`} alt={avatar.name} className="w-full h-20 object-contain" />
                        <p className="text-xs text-center mt-2 text-gray-700 dark:text-gray-300">{avatar.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Colors & Border */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Customize Colors & Border
              </h3>

              {/* Colors */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    QR Color
                  </label>
                  <div
                    className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                    style={{ backgroundColor: customization.qrColor }}
                    onClick={() => setShowColorPicker(showColorPicker === 'qr' ? null : 'qr')}
                  />
                  {showColorPicker === 'qr' && (
                    <div ref={colorPickerRefs.qr} className="absolute z-10 mt-2">
                      <HexColorPicker color={customization.qrColor} onChange={(color) => handleColorChange(color, 'qrColor')} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Background
                  </label>
                  <div
                    className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                    style={{ backgroundColor: customization.backgroundColor }}
                    onClick={() => setShowColorPicker(showColorPicker === 'bg' ? null : 'bg')}
                  />
                  {showColorPicker === 'bg' && (
                    <div ref={colorPickerRefs.bg} className="absolute z-10 mt-2">
                      <HexColorPicker color={customization.backgroundColor} onChange={(color) => handleColorChange(color, 'backgroundColor')} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Border Color
                  </label>
                  <div
                    className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                    style={{ backgroundColor: customization.borderColor }}
                    onClick={() => setShowColorPicker(showColorPicker === 'border' ? null : 'border')}
                  />
                  {showColorPicker === 'border' && (
                    <div ref={colorPickerRefs.border} className="absolute z-10 mt-2">
                      <HexColorPicker color={customization.borderColor} onChange={(color) => handleColorChange(color, 'borderColor')} />
                    </div>
                  )}
                </div>
              </div>

              {/* Border Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Border Style
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {['none', 'square', 'rounded', 'circular'].map(style => (
                    <button
                      key={style}
                      onClick={() => handleBorderStyleChange(style)}
                      className={`p-4 border-2 rounded-lg text-sm font-medium capitalize transition-all ${
                        customization.borderStyle === style
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Number Toggle */}
              {qrType === 'table' && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="show-table-number"
                    checked={customization.showTableNumber}
                    onChange={(e) => setCustomization(prev => ({ ...prev, showTableNumber: e.target.checked }))}
                    className="w-5 h-5 text-red-500 rounded"
                  />
                  <label htmlFor="show-table-number" className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Show table number on QR code
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Select AI-Generated Design */}
          {step === 4 && (
            <DesignPreviewSlider
              designs={generatedDesigns}
              selectedDesignId={selectedDesign?.id}
              onSelectDesign={setSelectedDesign}
              loading={loadingDesigns}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            {step < 4 ? (
              <Button 
                onClick={async () => {
                  if (step === 3) {
                    // Trigger AI generation before moving to step 4
                    const success = await triggerAIDesignGeneration()
                    if (success) {
                      setStep(4)
                    }
                  } else {
                    setStep(step + 1)
                  }
                }}
                loading={loadingDesigns}
                disabled={loadingDesigns || (step === 1 && !restaurantName.trim())}
              >
                {loadingDesigns ? '🎨 Designs are on the way...' : (step === 3 ? 'Generate Designs with AI ✨' : 'Next')}
              </Button>
            ) : (
              <Button 
                onClick={handleGenerate} 
                loading={generating}
                disabled={!selectedDesign}
              >
                Generate QR Code
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
