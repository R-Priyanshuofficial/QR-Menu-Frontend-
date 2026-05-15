import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Store, Zap, QrCode, BarChart3, ShoppingBag, Shield, Sparkles } from 'lucide-react'
import { Button } from '@shared/components/Button'
import { useAuth } from '@shared/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@shared/utils/cn'

const features = [
  { icon: QrCode, title: 'Smart QR Menus', description: 'Beautiful, scannable menus that update instantly' },
  { icon: ShoppingBag, title: 'Real-Time Orders', description: 'Receive and manage orders as they come in' },
  { icon: BarChart3, title: 'Analytics & Insights', description: 'Track revenue, trends, and customer behavior' },
  { icon: Shield, title: 'Secure & Reliable', description: 'Enterprise-grade security for your business' },
]

export const Login = () => {
  const navigate = useNavigate()
  const { login, register, isAuthenticated } = useAuth()
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [userType, setUserType] = useState('owner')
  
  const savedEmail = localStorage.getItem('user_email')
  const savedPassword = localStorage.getItem('user_password')
  const savedRememberMe = localStorage.getItem('remember_me') === 'true'
  
  const [rememberMe, setRememberMe] = useState(savedRememberMe)
  const [formData, setFormData] = useState({
    email: savedEmail || '',
    password: savedPassword || '',
    name: '',
    restaurantName: '',
    phone: '',
  })

  if (isAuthenticated) {
    navigate('/owner/dashboard')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLoginMode) {
        const result = await login({ 
          email: formData.email, 
          password: formData.password,
          rememberMe,
          role: userType,
        })
        if (result.success) {
          navigate('/owner/dashboard')
        }
      } else {
        const result = await register(formData)
        if (result.success) {
          setIsLoginMode(true)
          setFormData({
            email: formData.email,
            password: '',
            name: '',
            restaurantName: '',
            phone: '',
          })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'password' && userType === 'staff') {
      if (!/^\d*$/.test(value) || value.length > 6) {
        return
      }
    }

    setFormData({ ...formData, [name]: value })
  }

  const inputClass = cn(
    'block w-full pl-10 pr-4 py-3 rounded-xl text-sm',
    'bg-surface-800/40 border border-surface-700/40',
    'text-white placeholder-surface-500',
    'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50',
    'transition-all duration-200',
  )

  return (
    <div className="min-h-screen w-full flex bg-surface-950">
      {/* ─── Left Panel — Branding ─── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[48%] relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-900 via-surface-950 to-surface-900" />
        
        {/* Animated shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary-500/[0.06] blur-[80px]"
          />
          <motion.div
            animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-32 right-16 w-96 h-96 rounded-full bg-violet-500/[0.05] blur-[100px]"
          />
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-sky-500/[0.04] blur-[60px]"
          />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-14">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight font-display">QR Menu</h2>
              <p className="text-[10px] text-surface-500 font-medium uppercase tracking-wider">Restaurant Platform</p>
            </div>
          </motion.div>

          {/* Hero */}
          <div className="space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.1] tracking-tight font-display mb-4">
                Your Restaurant,{' '}
                <span className="text-gradient-premium">Reimagined</span>
              </h1>
              <p className="text-surface-400 text-lg leading-relaxed max-w-md">
                The all-in-one platform to manage orders, QR menus, billing, and analytics — beautifully.
              </p>
            </motion.div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="group p-4 rounded-xl bg-surface-800/20 border border-surface-700/20 hover:bg-surface-800/30 hover:border-surface-700/30 transition-all duration-300"
                >
                  <div className="p-2 w-fit rounded-lg bg-primary-500/10 mb-3">
                    <feature.icon className="w-4 h-4 text-primary-400" />
                  </div>
                  <p className="text-sm font-semibold text-surface-200 mb-1">{feature.title}</p>
                  <p className="text-xs text-surface-500 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-4"
          >
            <div className="flex -space-x-2">
              {['#ef4444', '#8b5cf6', '#0ea5e9', '#10b981'].map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-surface-950 flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm text-surface-300 font-medium">Trusted by restaurants</p>
              <p className="text-xs text-surface-500">Join growing businesses worldwide</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Right Panel — Auth Form ─── */}
      <div className="flex-1 flex items-center justify-center relative overflow-y-auto py-8 sm:py-12 px-4">
        {/* Mobile background effects */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-primary-500/[0.06] blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-violet-500/[0.04] blur-[80px]" />
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        </div>

        <div className="w-full max-w-[420px] relative z-10">
          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden flex items-center justify-center gap-3 mb-8"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight font-display">QR Menu</h2>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isLoginMode ? 'login' : 'register'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {/* Auth Card */}
              <div className="bg-surface-900/60 backdrop-blur-2xl border border-surface-700/30 rounded-2xl shadow-2xl overflow-hidden">
                <div className="h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

                <div className="p-6 sm:p-8">
                  {/* Header */}
                  <div className="mb-7">
                    <h1 className="text-2xl font-bold text-white tracking-tight font-display">
                      {isLoginMode ? 'Welcome back' : 'Create account'}
                    </h1>
                    <p className="text-surface-500 text-sm mt-1.5">
                      {isLoginMode 
                        ? 'Sign in to your restaurant dashboard' 
                        : 'Start managing your restaurant today'}
                    </p>
                  </div>

                  {/* User Type Toggle */}
                  {isLoginMode && (
                    <div className="mb-6">
                      <div className="bg-surface-800/40 p-1 rounded-xl flex relative border border-surface-700/30">
                        <motion.div
                          className="absolute top-1 bottom-1 bg-surface-700/60 rounded-lg border border-surface-600/30"
                          initial={false}
                          animate={{
                            left: userType === 'owner' ? '4px' : '50%',
                            width: 'calc(50% - 4px)'
                          }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                        
                        <button
                          type="button"
                          onClick={() => setUserType('owner')}
                          className={`flex-1 py-2 text-sm font-medium rounded-lg relative z-10 transition-colors duration-200 ${
                            userType === 'owner' ? 'text-white' : 'text-surface-500 hover:text-surface-400'
                          }`}
                        >
                          Owner
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserType('staff')}
                          className={`flex-1 py-2 text-sm font-medium rounded-lg relative z-10 transition-colors duration-200 ${
                            userType === 'staff' ? 'text-white' : 'text-surface-500 hover:text-surface-400'
                          }`}
                        >
                          Staff
                        </button>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLoginMode && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-surface-400 ml-0.5">Full Name</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <User className="h-4 w-4 text-surface-500 group-focus-within:text-primary-400 transition-colors" />
                            </div>
                            <input name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} className={inputClass} required />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-surface-400 ml-0.5">Restaurant Name</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <Store className="h-4 w-4 text-surface-500 group-focus-within:text-primary-400 transition-colors" />
                            </div>
                            <input name="restaurantName" placeholder="My Awesome Bistro" value={formData.restaurantName} onChange={handleChange} className={inputClass} required />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-surface-400 ml-0.5">Phone Number</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <Phone className="h-4 w-4 text-surface-500 group-focus-within:text-primary-400 transition-colors" />
                            </div>
                            <input name="phone" type="tel" placeholder="+1 234 567 890" value={formData.phone} onChange={handleChange} className={inputClass} required />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-surface-400 ml-0.5">Email Address</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-surface-500 group-focus-within:text-primary-400 transition-colors" />
                        </div>
                        <input name="email" type="text" placeholder="name@example.com" value={formData.email} onChange={handleChange} className={inputClass} required />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-surface-400 ml-0.5">
                        {userType === 'staff' ? '6-Digit PIN' : 'Password'}
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-surface-500 group-focus-within:text-primary-400 transition-colors" />
                        </div>
                        <input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder={userType === 'staff' ? 'Enter PIN' : '••••••••'}
                          value={formData.password}
                          onChange={handleChange}
                          inputMode={userType === 'staff' ? 'numeric' : undefined}
                          maxLength={userType === 'staff' ? 6 : undefined}
                          className={cn(inputClass, 'pr-10')}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-surface-500 hover:text-surface-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {isLoginMode && (
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500/50 focus:ring-offset-0 transition-all cursor-pointer"
                          />
                          <span className="text-xs text-surface-500 group-hover:text-surface-400 transition-colors">Remember me</span>
                        </label>
                        <a href="#" className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium">
                          Forgot password?
                        </a>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      variant="gradient"
                      className="w-full py-3 text-sm font-semibold mt-2" 
                      loading={loading}
                    >
                      {isLoginMode ? 'Sign In' : 'Create Account'}
                      {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
                    </Button>
                  </form>

                  {/* Footer */}
                  <div className="mt-6 pt-5 border-t border-surface-700/30 text-center">
                    <p className="text-surface-500 text-xs">
                      {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                      <button
                        onClick={() => setIsLoginMode(!isLoginMode)}
                        className="ml-2 text-primary-400 hover:text-primary-300 font-semibold transition-colors focus:outline-none"
                      >
                        {isLoginMode ? 'Sign up' : 'Log in'}
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Demo credentials */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-5 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-800/30 border border-surface-700/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] text-surface-500">
                <span className="text-surface-400 font-medium">Demo:</span> demo@example.com
                <span className="mx-1.5 text-surface-700">•</span>
                password123
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
