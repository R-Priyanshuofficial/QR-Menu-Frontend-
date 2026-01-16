import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Store } from 'lucide-react'
import { Button } from '@shared/components/Button'
import { Input } from '@shared/components/Input'
import { useAuth } from '@shared/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

export const Login = () => {
  const navigate = useNavigate()
  const { login, register, isAuthenticated } = useAuth()
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [userType, setUserType] = useState('owner')
  
  // Check if remember me is enabled
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

  // Redirect if already authenticated
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
          // Redirect to login page after registration
          setIsLoginMode(true)
          setFormData({
            email: formData.email, // Keep email for convenience
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

    // For staff login, treat password as 6-digit PIN (numbers only, max length 6)
    if (name === 'password' && userType === 'staff') {
      if (!/^\d*$/.test(value) || value.length > 6) {
        return
      }
    }

    setFormData({ ...formData, [name]: value })
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] relative overflow-y-auto py-8 sm:py-12 perspective-1000">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary-500/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10 px-4" style={{ perspective: '1000px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={isLoginMode ? 'login' : 'register'}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Glass Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 sm:p-8">
                
                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg shadow-primary-500/30 mb-4 transform rotate-3"
                  >
                    <ChefHat className="w-6 h-6 text-white" />
                  </motion.div>
                  <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
                    {isLoginMode ? 'Welcome Back' : 'Get Started'}
                  </h1>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    {isLoginMode 
                      ? 'Enter your credentials to access your dashboard' 
                      : 'Create your account and start managing your menu'}
                  </p>
                </div>

                {/* User Type Toggle (Only in Login Mode) */}
                {isLoginMode && (
                  <div className="mb-6 overflow-hidden">
                    <div className="bg-white/5 p-1 rounded-xl flex relative">
                      {/* Sliding Background */}
                      <motion.div
                        className="absolute top-1 bottom-1 bg-primary-600 rounded-lg shadow-sm"
                        layoutId="activeTab"
                        initial={false}
                        animate={{
                          left: userType === 'owner' ? '4px' : '50%',
                          width: 'calc(50% - 4px)'
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                      
                      <button
                        type="button"
                        onClick={() => setUserType('owner')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg relative z-10 transition-colors duration-200 ${
                          userType === 'owner' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        Owner
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserType('staff')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg relative z-10 transition-colors duration-200 ${
                          userType === 'staff' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
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
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 ml-1">Full Name</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                          </div>
                          <input
                            name="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            className="block w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 ml-1">Restaurant Name</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Store className="h-4 w-4 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                          </div>
                          <input
                            name="restaurantName"
                            placeholder="My Awesome Bistro"
                            value={formData.restaurantName}
                            onChange={handleChange}
                            className="block w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 ml-1">Phone Number</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-4 w-4 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                          </div>
                          <input
                            name="phone"
                            type="tel"
                            placeholder="+1 234 567 890"
                            value={formData.phone}
                            onChange={handleChange}
                            className="block w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400 ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                      </div>
                      <input
                        name="email"
                        type="text"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400 ml-1">
                      {userType === 'staff' ? '6-Digit PIN' : 'Password'}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                      </div>
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={userType === 'staff' ? 'Enter PIN' : 'Enter password'}
                        value={formData.password}
                        onChange={handleChange}
                        inputMode={userType === 'staff' ? 'numeric' : undefined}
                        maxLength={userType === 'staff' ? 6 : undefined}
                        className="block w-full pl-9 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {isLoginMode && (
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="peer h-3.5 w-3.5 rounded border-gray-600 bg-gray-700 text-primary-500 focus:ring-primary-500/50 focus:ring-offset-0 transition-all"
                          />
                        </div>
                        <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
                      </label>
                      <a href="#" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                        Forgot password?
                      </a>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full py-2.5 text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300" 
                    loading={loading}
                  >
                    {isLoginMode ? 'Sign In' : 'Create Account'}
                    {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
                  </Button>
                </form>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-white/10 text-center">
                  <p className="text-gray-400 text-xs">
                    {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                    <button
                      onClick={() => setIsLoginMode(!isLoginMode)}
                      className="ml-2 text-primary-400 hover:text-primary-300 font-medium transition-colors focus:outline-none"
                    >
                      {isLoginMode ? 'Sign up' : 'Log in'}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Demo Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-center"
        >
          <div className="inline-block px-3 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] text-gray-500">
              <span className="text-primary-400 font-medium">Demo:</span> demo@example.com <span className="mx-1">•</span> password123
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
