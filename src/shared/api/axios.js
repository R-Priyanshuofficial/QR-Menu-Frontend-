import axios from 'axios'

// Build adaptive base URL so mobile devices use the same LAN host
const buildBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  const { protocol, hostname } = window.location
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1'

  // When running the app locally, always prefer the local backend so dev changes stay in sync.
  if (isLocalHost) {
    const hostBase = `${protocol}//${hostname}:5000`
    return `${hostBase}/api`
  }

  // If env is missing or points to localhost while app is opened from a LAN IP, use current host
  if (!envUrl || (!isLocalHost && envUrl.includes('localhost'))) {
    const hostBase = `${protocol}//${hostname}:5000`
    return `${hostBase}/api`
  }

  return envUrl
}

// Create axios instance with default config
const api = axios.create({
  baseURL: buildBaseUrl(),
  timeout: 60000, // 60 seconds - allows time for AI Vision processing
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle common errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized
          // For normal API calls when user was logged in, clear token and redirect.
          // For login failures (no token yet, /auth/login), just pass error through.
          try {
            const token = localStorage.getItem('auth_token')
            const url = error.config?.url || ''
            const isLoginRequest = url.includes('/auth/login')

            if (token && !isLoginRequest) {
              localStorage.removeItem('auth_token')
              window.location.href = '/owner/login'
            }
          } catch {
            // Fallback: do nothing special, let caller handle
          }
          break
        case 403:
          // Forbidden
          console.error('Access forbidden')
          break
        case 404:
          // Not found
          console.error('Resource not found')
          break
        case 500:
          // Server error
          console.error('Server error occurred')
          break
        default:
          break
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - please check your connection')
    }

    return Promise.reject(error)
  }
)

export default api
