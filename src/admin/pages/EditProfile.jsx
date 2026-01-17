import { useState, useEffect, useRef } from 'react'
import { Save, Camera, Mail, Phone, MapPin, Building, Image as ImageIcon, Upload, CreditCard } from 'lucide-react'
import { Button } from '@shared/components/Button'
import { Input, TextArea } from '@shared/components/Input'
import { Card } from '@shared/components/Card'
import { useAuth } from '@shared/contexts/AuthContext'
import { authAPI } from '@shared/api/endpoints'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export const EditProfile = () => {
  const { user, setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    restaurantName: user?.restaurantName || '',
    restaurantAddress: user?.restaurantAddress || '',
    restaurantDescription: user?.restaurantDescription || '',
    restaurantLogo: user?.restaurantLogo || '',
    upiId: user?.upiId || '',
  })

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        restaurantName: user.restaurantName || '',
        restaurantAddress: user.restaurantAddress || '',
        restaurantDescription: user.restaurantDescription || '',
        restaurantLogo: user.restaurantLogo || '',
        upiId: user.upiId || '',
      })
    }
  }, [user])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleLogoClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    setUploading(true)
    try {
      // Convert to base64 for preview and storage
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setFormData({ ...formData, restaurantLogo: base64String })
        toast.success('Logo uploaded! Click Save Changes to update.')
      }
      reader.onerror = () => {
        toast.error('Failed to read file')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error('Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authAPI.updateProfile(formData)
      setUser(response.data.user)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
          Edit Profile
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Update your profile and restaurant information
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Picture Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-purple-100 dark:border-purple-900/30 bg-white dark:bg-gray-900">
            <div className="p-6">
              <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                Restaurant Logo
              </h2>

              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {/* Logo Preview */}
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-1 shadow-2xl">
                    {formData.restaurantLogo ? (
                      <img
                        src={formData.restaurantLogo}
                        alt="Restaurant Logo"
                        className="w-full h-full rounded-full object-cover bg-white dark:bg-gray-900"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          const fallback = document.createElement('div')
                          fallback.className = 'w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center'
                          fallback.innerHTML = '<svg class="w-12 h-12 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>'
                          e.target.parentElement.appendChild(fallback)
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                        <Building className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Button */}
                  <button 
                    type="button"
                    onClick={handleLogoClick}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Upload logo"
                  >
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-1">
                  {uploading ? 'Uploading...' : 'Click camera to upload logo'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  JPG, PNG, GIF • Max 5MB • Square recommended
                </p>
                
                {formData.restaurantLogo && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, restaurantLogo: '' })}
                    className="mt-3 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-2"
        >
          <Card className="border-2 border-purple-100 dark:border-purple-900/30 bg-white dark:bg-gray-900">
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                    Personal Information
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      leftIcon={<Mail className="w-5 h-5" />}
                      required
                    />

                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      leftIcon={<Mail className="w-5 h-5" />}
                      required
                    />

                    <Input
                      label="Phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      leftIcon={<Phone className="w-5 h-5" />}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t-2 border-purple-200 dark:border-purple-800">
                  <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                    Restaurant Information
                  </h2>

                  <div className="space-y-4">
                    <Input
                      label="Restaurant Name"
                      name="restaurantName"
                      value={formData.restaurantName}
                      onChange={handleChange}
                      leftIcon={<Building className="w-5 h-5" />}
                      required
                      placeholder="This will appear on the Welcome page"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Restaurant Logo URL
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            name="restaurantLogo"
                            value={formData.restaurantLogo}
                            onChange={handleChange}
                            leftIcon={<ImageIcon className="w-5 h-5" />}
                            placeholder="Enter logo image URL"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        This logo will appear on the Welcome page when customers scan QR code
                      </p>
                    </div>

                    <Input
                      label="Restaurant Address"
                      name="restaurantAddress"
                      value={formData.restaurantAddress}
                      onChange={handleChange}
                      leftIcon={<MapPin className="w-5 h-5" />}
                      placeholder="Enter restaurant address"
                    />

                    <TextArea
                      label="Welcome Message / Description"
                      name="restaurantDescription"
                      value={formData.restaurantDescription}
                      onChange={handleChange}
                      placeholder="Welcome to our restaurant! Tell customers about your specialty and what makes you unique..."
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      This message will be shown to customers on the Welcome page
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-t-2 border-purple-200 dark:border-purple-800 flex justify-end gap-3">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  leftIcon={<Save className="w-5 h-5" />}
                  loading={loading}
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white font-bold shadow-lg"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>

      {/* Additional Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-2 border-purple-100 dark:border-purple-900/30 bg-white dark:bg-gray-900">
          <div className="p-6">
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Account Settings
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Change Password</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Update your password to keep your account secure
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive notifications about new orders
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div>
                  <h3 className="font-medium text-red-900 dark:text-red-400">Delete Account</h3>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="danger" size="sm">
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
