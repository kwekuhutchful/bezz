import { useState, useEffect } from 'react'
import { User } from '../types'
import { authAPI, setAuthToken } from '../lib/api'
import toast from 'react-hot-toast'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => void
  resetPassword: (email: string) => Promise<void>
  updateProfile: (displayName: string) => Promise<void>
  refreshToken: () => Promise<void>
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('userData')
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        setState({
          user,
          loading: false,
          error: null,
        })
        setAuthToken(token)
      } catch (error) {
        console.error('Failed to parse stored user data:', error)
        localStorage.removeItem('authToken')
        localStorage.removeItem('userData')
        setState({
          user: null,
          loading: false,
          error: null,
        })
      }
    } else {
      setState({
        user: null,
        loading: false,
        error: null,
      })
    }
  }, [])

  // Auto-refresh token periodically
  useEffect(() => {
    if (state.user) {
      const interval = setInterval(async () => {
        try {
          await refreshToken()
        } catch (error) {
          console.error('Token refresh failed:', error)
        }
      }, 50 * 60 * 1000) // Refresh every 50 minutes

      return () => clearInterval(interval)
    }
  }, [state.user])

  const signIn = async (email: string, password: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await authAPI.signin({ email, password })
      
      if (response.success) {
        const { token, user } = response.data
        setAuthToken(token)
        localStorage.setItem('userData', JSON.stringify(user))
        
        setState({
          user,
          loading: false,
          error: null,
        })
        
        toast.success('Successfully signed in!')
      } else {
        throw new Error(response.error || 'Sign in failed')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Sign in failed'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
      throw new Error(errorMessage)
    }
  }

  const signUp = async (email: string, password: string, displayName: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await authAPI.signup({
        email,
        password,
        display_name: displayName,
      })
      
      if (response.success) {
        const { token, user } = response.data
        setAuthToken(token)
        localStorage.setItem('userData', JSON.stringify(user))
        
        setState({
          user,
          loading: false,
          error: null,
        })
        
        toast.success('Account created successfully!')
      } else {
        throw new Error(response.error || 'Sign up failed')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Sign up failed'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
      throw new Error(errorMessage)
    }
  }

  const signOut = (): void => {
    setAuthToken(null)
    localStorage.removeItem('userData')
    setState({
      user: null,
      loading: false,
      error: null,
    })
    toast.success('Successfully signed out!')
  }

  const resetPassword = async (email: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await authAPI.resetPassword(email)
      
      if (response.success) {
        toast.success('Password reset email sent!')
      } else {
        throw new Error(response.error || 'Password reset failed')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Password reset failed'
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }))
      throw new Error(errorMessage)
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const updateProfile = async (displayName: string): Promise<void> => {
    if (!state.user) return
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // This would typically call a backend endpoint to update the user profile
      // For now, we'll update the local state
      const updatedUser = { ...state.user, displayName }
      localStorage.setItem('userData', JSON.stringify(updatedUser))
      
      setState({
        user: updatedUser,
        loading: false,
        error: null,
      })
      
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      const errorMessage = error.message || 'Profile update failed'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
      throw new Error(errorMessage)
    }
  }

  const refreshToken = async (): Promise<void> => {
    const currentToken = localStorage.getItem('authToken')
    if (!currentToken) return
    
    try {
      const response = await authAPI.refresh(currentToken)
      
      if (response.success) {
        const { token, user } = response.data
        setAuthToken(token)
        localStorage.setItem('userData', JSON.stringify(user))
        
        setState(prev => ({
          ...prev,
          user,
          error: null,
        }))
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      signOut()
    }
  }

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshToken,
  }
} 