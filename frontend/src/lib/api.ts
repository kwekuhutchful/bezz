import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token management
let authToken: string | null = localStorage.getItem('authToken')

export const setAuthToken = (token: string | null) => {
  authToken = token
  if (token) {
    localStorage.setItem('authToken', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    localStorage.removeItem('authToken')
    delete api.defaults.headers.common['Authorization']
  }
}

// Initialize token if exists
if (authToken) {
  setAuthToken(authToken)
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response && error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again.')
    } else if (!error.response) {
      console.error('Network error:', error)
      toast.error('Network error. Please check your connection.')
    } else if (error.response?.status === 401) {
      // Token expired or invalid
      setAuthToken(null)
      toast.error('Session expired. Please log in again.')
      window.location.href = '/login'
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else if (error.response?.data?.error) {
      toast.error(error.response.data.error)
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const endpoints = {
  // Authentication
  auth: {
    signup: '/api/auth/signup',
    signin: '/api/auth/signin',
    refresh: '/api/auth/refresh',
    resetPassword: '/api/auth/reset-password',
  },
  // User
  user: {
    profile: '/api/user/profile',
  },
  // Brand briefs
  briefs: {
    create: '/api/briefs',
    list: '/api/briefs',
    get: (id: string) => `/api/briefs/${id}`,
    refreshUrls: (id: string) => `/api/briefs/${id}/refresh-urls`,
    delete: (id: string) => `/api/briefs/${id}`,
  },
  // Payments
  payments: {
    createCheckout: '/api/payments/checkout',
    subscription: '/api/payments/subscription',
    webhook: '/api/payments/webhook',
  },
  // Admin
  admin: {
    metrics: '/api/admin/metrics',
    users: '/api/admin/users',
  },
}

// Auth API functions
export const authAPI = {
  signup: async (data: { email: string; password: string; display_name: string }) => {
    const response = await api.post(endpoints.auth.signup, data)
    return response.data
  },

  signin: async (data: { email: string; password: string }) => {
    const response = await api.post(endpoints.auth.signin, data)
    return response.data
  },

  refresh: async (token: string) => {
    const response = await api.post(endpoints.auth.refresh, { token })
    return response.data
  },

  resetPassword: async (email: string) => {
    const response = await api.post(endpoints.auth.resetPassword, { email })
    return response.data
  },
}

// Brief API functions
export const briefAPI = {
  refreshImageURLs: async (briefId: string) => {
    const response = await api.post(endpoints.briefs.refreshUrls(briefId))
    return response.data
  },
}

export default api 