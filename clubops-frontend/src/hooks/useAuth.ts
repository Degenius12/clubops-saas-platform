import { useState, useEffect } from 'react'
import { apiClient, User } from '../lib/api'

interface AuthState {
  user: User | null
  isLoading: boolean
  selectedClub: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    selectedClub: null
  })

  useEffect(() => {
    // Check for existing token on app start
    const token = apiClient.getToken()
    if (token) {
      // Verify token with /auth/me endpoint
      apiClient.getMe()
        .then(response => {
          setAuthState(prev => ({
            ...prev,
            user: response.user,
            isLoading: false,
            selectedClub: response.user.clubs.length > 0 ? response.user.clubs[0].id : null
          }))
        })
        .catch(() => {
          // Token is invalid, clear it
          apiClient.clearToken()
          setAuthState(prev => ({
            ...prev,
            user: null,
            isLoading: false,
            selectedClub: null
          }))
        })
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password)
      apiClient.setToken(response.token)
      
      const selectedClub = response.user.clubs.length > 0 ? response.user.clubs[0].id : null
      
      setAuthState({
        user: response.user,
        isLoading: false,
        selectedClub
      })
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }
    }
  }

  const logout = () => {
    apiClient.clearToken()
    setAuthState({
      user: null,
      isLoading: false,
      selectedClub: null
    })
  }

  const setSelectedClub = (clubId: string) => {
    setAuthState(prev => ({ ...prev, selectedClub: clubId }))
  }

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    selectedClub: authState.selectedClub,
    isAuthenticated: !!authState.user,
    login,
    logout,
    setSelectedClub,
    setUser: (user: User | null) => setAuthState(prev => ({ ...prev, user }))
  }
}
