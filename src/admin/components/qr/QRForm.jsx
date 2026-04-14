import { useState, useEffect } from 'react'
import { Upload, X, Sparkles, Copy, Check } from 'lucide-react'
import { Button } from '@shared/components/Button'
import { Input } from '@shared/components/Input'
import { Card } from '@shared/components/Card'
import { CATEGORIES } from '../../constants/designConfigDefaults'
import { qrAPI } from '@shared/api/endpoints'
import { useAuth } from '@shared/contexts/AuthContext'
import toast from 'react-hot-toast'

export const QRForm = ({ config, updateConfig, updateField, applyTheme, randomize, qrType, tableNumber }) => {
  const { user } = useAuth()
  const [avatars, setAvatars] = useState([])
  const [logoPreview, setLogoPreview] = useState(null)
  const [copied, setCopied] = useState(false)

  // Auto-prefill restaurant name from user profile
  useEffect(() => {
    if (user?.restaurantName && !config.meta.restaurantName) {
      updateField('meta', 'restaurantName', user.restaurantName)
    }
  }, [user])

  useEffect(() => {
    fetchAvatars()
  }, [])

  const fetchAvatars = async () => {
    try {
      const response = await qrAPI.getAvatars()
      setAvatars(response.data.avatars || [])
    } catch (error) {
      console.error('Failed to fetch avatars:', error)
    }
  }

  const menuUrl = (() => {
    const frontendBase = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin
    return qrType === 'table'
      ? `${frontendBase}/menu?table=${tableNumber}`
      : `${frontendBase}/menu`
  })()

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result)
      updateConfig('logo', reader.result)
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogoPreview(null)
    updateConfig('logo', null)
  }

  const handleAvatarSelect = (avatarId) => {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://qr-menu-backend-lwba.onrender.com'
    const avatar = avatars.find(a => a.id === avatarId)
    if (avatar) {
      setLogoPreview(`${baseUrl}${avatar.url}`)
      updateConfig('logo', `${baseUrl}${avatar.url}`)
      updateConfig('avatarId', avatarId)
    }
  }

  const handleCategoryChange = (category) => {
    updateField('meta', 'category', category)
    applyTheme(category)
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(menuUrl)
    setCopied(true)
    toast.success('URL copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Restaurant Name */}
      <Card>
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Restaurant Details
          </h3>
          <div className="space-y-3">
            <Input
              label="Restaurant Name"
              placeholder="Enter restaurant name..."
              value={config.meta.restaurantName}
              onChange={(e) => updateField('meta', 'restaurantName', e.target.value)}
              required
            />
            <Input
              label="Tagline (optional)"
              placeholder="e.g. Authentic Italian Cuisine"
              value={config.meta.tagline}
              onChange={(e) => updateField('meta', 'tagline', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Category */}
      <Card>
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Category
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`p-2 border-2 rounded-lg transition-all text-center text-xs ${
                  config.meta.category === cat.value
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-lg block">{cat.icon}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Menu URL */}
      <Card>
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Menu URL
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300 truncate border border-gray-200 dark:border-gray-700">
              {menuUrl}
            </div>
            <button
              onClick={copyUrl}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Copy URL"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
            </button>
          </div>
        </div>
      </Card>

      {/* Logo / Avatar */}
      <Card>
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Logo / Icon
          </h3>

          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => document.getElementById('qr-logo-upload').click()}
            >
              {logoPreview ? 'Change' : 'Upload Logo'}
            </Button>
            <input
              id="qr-logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            {logoPreview && (
              <div className="flex items-center gap-2">
                <img src={logoPreview} alt="Logo" className="w-10 h-10 object-contain border border-gray-300 dark:border-gray-600 rounded" />
                <button onClick={removeLogo} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {avatars.length > 0 && (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Or choose an icon:</p>
              <div className="grid grid-cols-4 gap-2">
                {avatars.map(avatar => {
                  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://qr-menu-backend-lwba.onrender.com'
                  return (
                    <button
                      key={avatar.id}
                      onClick={() => handleAvatarSelect(avatar.id)}
                      className={`p-2 border-2 rounded-lg transition-all ${
                        config.avatarId === avatar.id
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={`${baseUrl}${avatar.url}`}
                        alt={avatar.name}
                        className="w-full h-8 object-contain"
                      />
                      <p className="text-[9px] text-center mt-1 text-gray-500 truncate">{avatar.name}</p>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Smart Generate */}
      <Button
        onClick={() => randomize()}
        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white"
        leftIcon={<Sparkles className="w-5 h-5" />}
      >
        ✨ Smart Generate
      </Button>
    </div>
  )
}
