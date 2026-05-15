import { useState, useEffect, useRef } from 'react'
import { Save, Camera, Mail, Phone, MapPin, Building, Image as ImageIcon, Upload, CreditCard } from 'lucide-react'
import { Button } from '@shared/components/Button'
import { Input, TextArea } from '@shared/components/Input'
import { Card } from '@shared/components/Card'
import { PageHeader } from '@shared/components/PageHeader'
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

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    setUploading(true)
    try {
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
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Edit Profile"
        subtitle="Update your profile and restaurant information"
        icon={Building}
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Picture Section */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="md:col-span-1">
          <Card>
            <div className="p-6 border-b border-surface-200 dark:border-surface-700/50">
              <h2 className="text-sm font-semibold tracking-wide text-surface-900 dark:text-surface-100 uppercase">Restaurant Logo</h2>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="relative mb-6 group cursor-pointer" onClick={handleLogoClick}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary-600 to-rose-500 shadow-elevated-sm dark:shadow-dark-elevated-sm transition-transform duration-300 group-hover:scale-105">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-surface-800 border-2 border-white dark:border-surface-800 flex items-center justify-center relative">
                    {formData.restaurantLogo ? (
                      <img src={formData.restaurantLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-10 h-10 text-surface-400 dark:text-surface-500" />
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                {uploading && (
                  <div className="absolute inset-0 bg-surface-900/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100 mb-1">
                  {uploading ? 'Uploading...' : 'Click logo to upload'}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-4">
                  JPG, PNG, GIF • Max 5MB • Square recommended
                </p>
                
                {formData.restaurantLogo && (
                  <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, restaurantLogo: '' }); }}>
                    Remove Logo
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Profile Form */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="md:col-span-2">
          <Card>
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-surface-200 dark:border-surface-700/50">
                <h2 className="text-sm font-semibold tracking-wide text-surface-900 dark:text-surface-100 uppercase mb-4">Personal Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} leftIcon={<Mail className="w-4 h-4" />} required />
                  <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} leftIcon={<Mail className="w-4 h-4" />} required />
                  <Input label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} leftIcon={<Phone className="w-4 h-4" />} placeholder="Enter phone number" />
                </div>
              </div>

              <div className="p-6 border-b border-surface-200 dark:border-surface-700/50">
                <h2 className="text-sm font-semibold tracking-wide text-surface-900 dark:text-surface-100 uppercase mb-4">Restaurant Details</h2>
                <div className="space-y-4">
                  <Input label="Restaurant Name" name="restaurantName" value={formData.restaurantName} onChange={handleChange} leftIcon={<Building className="w-4 h-4" />} required placeholder="Your official restaurant name" />

                  <div>
                    <Input label="Restaurant Logo URL" name="restaurantLogo" value={formData.restaurantLogo} onChange={handleChange} leftIcon={<ImageIcon className="w-4 h-4" />} placeholder="Enter image URL or use uploader on left" />
                    <p className="text-[11px] text-surface-500 mt-1.5 ml-1">This logo appears on customer receipts and the digital menu welcome screen.</p>
                  </div>

                  <Input label="Restaurant Address" name="restaurantAddress" value={formData.restaurantAddress} onChange={handleChange} leftIcon={<MapPin className="w-4 h-4" />} placeholder="Full address for receipts" />

                  <div>
                    <TextArea label="Welcome Message" name="restaurantDescription" value={formData.restaurantDescription} onChange={handleChange} placeholder="Welcome customers to your restaurant..." rows={3} />
                    <p className="text-[11px] text-surface-500 mt-1.5 ml-1">Shown to customers when they scan the QR code to view your menu.</p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-surface-50 dark:bg-surface-800/30 flex justify-end gap-3 rounded-b-xl">
                <Button type="button" variant="ghost">Cancel</Button>
                <Button type="submit" variant="gradient" leftIcon={<Save className="w-4 h-4" />} loading={loading} className="px-8">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>

      {/* Account Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <div className="p-6 border-b border-surface-200 dark:border-surface-700/50">
            <h2 className="text-sm font-semibold tracking-wide text-surface-900 dark:text-surface-100 uppercase">Account Security</h2>
          </div>
          <div className="p-2 space-y-1">
            <div className="flex items-center justify-between p-4 bg-transparent hover:bg-surface-50 dark:hover:bg-surface-800/50 rounded-lg transition-colors">
              <div>
                <h3 className="font-medium text-surface-900 dark:text-surface-100">Change Password</h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">Update your account password</p>
              </div>
              <Button variant="outline" size="sm">Change</Button>
            </div>
            <div className="h-px bg-surface-100 dark:bg-surface-800 mx-4"></div>
            <div className="flex items-center justify-between p-4 bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors group">
              <div>
                <h3 className="font-medium text-red-600 dark:text-red-400">Delete Account</h3>
                <p className="text-sm text-surface-500 group-hover:text-red-500/70 transition-colors">Permanently delete your account and all data</p>
              </div>
              <Button variant="danger" size="sm">Delete</Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
