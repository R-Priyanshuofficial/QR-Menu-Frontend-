import { useState, useEffect } from 'react'
import { Upload, X, Sparkles, Copy, Check } from 'lucide-react'
import { Button } from '@shared/components/Button'
import { Input } from '@shared/components/Input'
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
    <div className="space-y-6">
      {/* ── Basic Info ── */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-[0.12em]">
          Restaurant Details
        </h4>
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

      {/* ── Category ── */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-[0.12em]">
          Category
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`p-2.5 border rounded-xl transition-all text-center text-xs group ${
                config.meta.category === cat.value
                  ? 'border-primary-500/60 bg-primary-500/10 shadow-sm ring-1 ring-primary-500/20'
                  : 'border-surface-200/80 dark:border-surface-700/60 hover:border-surface-300 dark:hover:border-surface-600 hover:bg-surface-50/60 dark:hover:bg-surface-800/40'
              }`}
            >
              <span className="text-lg block">{cat.icon}</span>
              <span className="font-medium text-surface-800 dark:text-surface-200 text-[11px]">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Menu URL ── */}
      <div className="space-y-2.5">
        <h4 className="text-[11px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-[0.12em]">
          Menu URL
        </h4>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface-50 dark:bg-surface-950/30 rounded-xl px-3 py-2.5 text-xs text-surface-600 dark:text-surface-300 truncate border border-surface-200/80 dark:border-surface-700/50 font-mono">
            {menuUrl}
          </div>
          <button
            onClick={copyUrl}
            className="p-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all border border-surface-200/80 dark:border-surface-700/50 hover:scale-105 active:scale-95"
            title="Copy URL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-surface-500" />}
          </button>
        </div>
      </div>

      {/* ── Logo / Avatar ── */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-[0.12em]">
          Logo / Icon
        </h4>

        <div className="flex items-center gap-3">
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
              <img src={logoPreview} alt="Logo" className="w-10 h-10 object-contain border border-surface-200 dark:border-surface-700 rounded-xl bg-white" />
              <button onClick={removeLogo} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {avatars.length > 0 && (
          <>
            <p className="text-xs text-surface-500 dark:text-surface-400">Or choose an icon:</p>
            <div className="grid grid-cols-4 gap-2">
              {avatars.map(avatar => {
                const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://qr-menu-backend-lwba.onrender.com'
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleAvatarSelect(avatar.id)}
                    className={`p-2 border rounded-xl transition-all ${
                      config.avatarId === avatar.id
                        ? 'border-primary-500/60 bg-primary-500/10 ring-1 ring-primary-500/20'
                        : 'border-surface-200/80 dark:border-surface-700/60 hover:border-surface-300 dark:hover:border-surface-600 hover:bg-surface-50/60 dark:hover:bg-surface-800/40'
                    }`}
                  >
                    <img
                      src={`${baseUrl}${avatar.url}`}
                      alt={avatar.name}
                      className="w-full h-8 object-contain"
                    />
                    <p className="text-[9px] text-center mt-1 text-surface-500 truncate">{avatar.name}</p>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Smart Generate ── */}
      <Button
        onClick={() => randomize()}
        variant="gradient"
        className="w-full"
        leftIcon={<Sparkles className="w-5 h-5" />}
      >
        ✨ Smart Generate
      </Button>
    </div>
  )
}
