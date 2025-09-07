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
          console.log('Auth verification response:', response)
          if (response?.user?.clubs) {
            setAuthState(prev => ({
              ...prev,
              user: response.user,
              isLoading: false,
              selectedClub: response.user.clubs.length > 0 ? response.user.clubs[0].id : null
            }))
          } else {
            console.error('Invalid response structure from /auth/me:', response)
            apiClient.clearToken()
            setAuthState(prev => ({
              ...prev,
              user: null,
              isLoading: false,
              selectedClub: null
            }))
          }
        })
        .catch((error) => {
          console.error('Token verification failed:', error)
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
      console.log('Attempting login for:', email)
      const response = await apiClient.login(email, password)
      console.log('Login response:', response)
      
      // Validate response structure with detailed error messages
      if (!response) {
        console.error('No response received from login endpoint')
        return { 
          success: false, 
          error: 'No response from server. Please check your internet connection and try again.' 
        }
      }
      
      if (!response.token) {
        console.error('No token in response:', response)
        return { 
          success: false, 
          error: 'Authentication failed - no access token received. Please try again.' 
        }
      }
      
      if (!response.user) {
        console.error('No user data in response:', response)
        return { 
          success: false, 
          error: 'Authentication failed - no user data received. Please try again.' 
        }
      }
      
      if (!response.user.clubs || !Array.isArray(response.user.clubs)) {
        console.error('Invalid clubs data in response:', response.user)
        return { 
          success: false, 
          error: 'Invalid user permissions data. Please contact support.' 
        }
      }
      
      // Set token first
      apiClient.setToken(response.token)
      
      // Safely determine selected club
      const selectedClub = response.user.clubs.length > 0 ? response.user.clubs[0].id : null
      
      // Update auth state
      setAuthState({
        user: response.user,
        isLoading: false,
        selectedClub
      })
      
      console.log('Login successful, user:', response.user)
      return { success: true }
      
    } catch (error) {
      console.error('Login error:', error)
      
      // Provide more specific error messages based on error type
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to server. Please check if the backend is running and your internet connection is stable.' 
        }
      }
      
      if (error instanceof Error) {
        // Check for CORS or network errors
        if (error.message.includes('CORS') || error.message.includes('blocked')) {
          return { 
            success: false, 
            error: 'Connection blocked by browser security. Please ensure the backend server is configured correctly.' 
          }
        }
        
        // Check for 401/403 authentication errors
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          return { 
            success: false, 
            error: 'Invalid email or password. Please check your credentials and try again.' 
          }
        }
        
        return { 
          success: false, 
          error: error.message 
        }
      }
      
      return { 
        success: false, 
        error: 'An unexpected error occurred during login. Please try again.' 
      }
    }
  }

  const logout = () => {
    console.log('Logging out user')
    apiClient.clearToken()
    setAuthState({
      user: null,
      isLoading: false,
      selectedClub: null
    })
  }

  const setSelectedClub = (clubId: string) => {
    console.log('Setting selected club to:', clubId)
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