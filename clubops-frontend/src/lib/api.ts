const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://clubops-backend-vercel-kmhv.vercel.app' 
  : process.env.VITE_API_BASE_URL || 'http://localhost:3001'

console.log('API Base URL:', API_BASE_URL)
console.log('Environment:', process.env.NODE_ENV)

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  clubs: Array<{
    id: string
    name: string
    role: string
  }>
}

export interface LoginResponse {
  token: string
  user: User
}

export class ApiClient {
  private token: string | null = null

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token')
    console.log('ApiClient initialized')
    console.log('- API Base URL:', API_BASE_URL)
    console.log('- Environment:', process.env.NODE_ENV)
    console.log('- Token found:', !!this.token)
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
    console.log('Token set successfully')
  }

  getToken() {
    return this.token
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('auth_token')
    console.log('Token cleared')
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const token = this.getToken()
    
    console.log(`🌐 Making request to: ${url}`)
    console.log('🔧 Request options:', { 
      method: options.method || 'GET',
      hasAuth: !!token,
      headers: Object.keys(options.headers || {})
    })
    
    try {
      // Test basic connectivity first
      if (!API_BASE_URL.startsWith('http')) {
        throw new Error(`Invalid API base URL: ${API_BASE_URL}`)
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers
        }
      })

      console.log(`📡 Response status: ${response.status} ${response.statusText}`)
      console.log(`✅ Response ok: ${response.ok}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API Error Response: ${errorText}`)
        
        if (response.status === 401) {
          this.clearToken()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          throw new Error('Authentication required. Please log in again.')
        }
        
        // Try to parse error response
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || errorData.message || `API Error: ${response.statusText}`)
        } catch (parseError) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`)
        }
      }

      const responseText = await response.text()
      console.log('📄 Raw response length:', responseText.length)
      
      if (!responseText) {
        throw new Error('Empty response from server')
      }
      
      try {
        const jsonResponse = JSON.parse(responseText)
        console.log('✅ JSON parsed successfully')
        return jsonResponse
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError)
        console.error('Raw response:', responseText.substring(0, 200) + '...')
        throw new Error('Invalid JSON response from server')
      }
      
    } catch (error) {
      console.error('💥 Request failed:', error)
      
      // Network or fetch errors
      if (error instanceof TypeError) {
        if (error.message.includes('fetch')) {
          console.error('🌐 Network Error Details:', {
            url,
            apiBaseUrl: API_BASE_URL,
            endpoint,
            userAgent: navigator.userAgent,
            online: navigator.onLine
          })
          throw new Error('Network error: Cannot connect to server. Please check your internet connection and verify the backend URL is correct.')
        }
        
        if (error.message.includes('CORS')) {
          throw new Error('CORS error: Server configuration issue. Please contact support.')
        }
      }
      
      // Re-throw other errors as-is
      throw error
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<LoginResponse> {
    console.log('🔐 Attempting login with email:', email)
    
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      
      console.log('✅ Login response received:', {
        hasToken: !!response?.token,
        hasUser: !!response?.user,
        userEmail: response?.user?.email
      })
      
      // Validate response structure
      if (!response) {
        throw new Error('No response received from login endpoint')
      }
      
      if (typeof response !== 'object') {
        throw new Error('Invalid response format from login endpoint')
      }
      
      if (!response.token || typeof response.token !== 'string') {
        throw new Error('Invalid or missing authentication token in response')
      }
      
      if (!response.user || typeof response.user !== 'object') {
        throw new Error('Invalid or missing user data in response')
      }
      
      if (!response.user.clubs || !Array.isArray(response.user.clubs)) {
        throw new Error('Invalid or missing clubs data in user response')
      }
      
      return response as LoginResponse
      
    } catch (error) {
      console.error('❌ Login request failed:', error)
      throw error
    }
  }

  async getMe(): Promise<{ user: User }> {
    console.log('👤 Fetching user profile')
    
    try {
      const response = await this.request('/auth/me')
      
      console.log('✅ /auth/me response received:', {
        hasUser: !!response?.user
      })
      
      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from user profile endpoint')
      }
      
      if (!response.user || typeof response.user !== 'object') {
        throw new Error('Invalid user data in profile response')
      }
      
      if (!response.user.clubs || !Array.isArray(response.user.clubs)) {
        throw new Error('Invalid clubs data in user profile')
      }
      
      return response as { user: User }
      
    } catch (error) {
      console.error('❌ Get user profile failed:', error)
      throw error
    }
  }

  // Health check with detailed diagnostics
  async healthCheck() {
    console.log('🏥 Performing health check')
    try {
      const startTime = Date.now()
      const response = await this.request('/health')
      const endTime = Date.now()
      
      console.log('✅ Health check successful:', {
        responseTime: `${endTime - startTime}ms`,
        status: response.status,
        version: response.version,
        environment: response.environment
      })
      
      return response
    } catch (error) {
      console.error('❌ Health check failed:', error)
      console.error('🔍 Health check diagnostics:', {
        apiBaseUrl: API_BASE_URL,
        endpoint: '/health',
        fullUrl: `${API_BASE_URL}/health`,
        online: navigator.onLine,
        userAgent: navigator.userAgent.substring(0, 50)
      })
      throw error
    }
  }

  // Other methods remain the same...
  async getDancers(clubId: string) {
    return this.request('/api/dancers', {
      headers: { 'club-id': clubId }
    })
  }

  async getDancerAlerts(clubId: string) {
    return this.request('/api/dancers/alerts', {
      headers: { 'club-id': clubId }
    })
  }

  async createDancer(clubId: string, dancerData: any) {
    return this.request('/api/dancers', {
      method: 'POST',
      headers: { 'club-id': clubId },
      body: JSON.stringify(dancerData)
    })
  }

  async getQueue(stageId: string, clubId: string) {
    return this.request(`/api/queue/${stageId}`, {
      headers: { 'club-id': clubId }
    })
  }

  async addToQueue(stageId: string, clubId: string, dancerId: string) {
    return this.request(`/api/queue/${stageId}/add`, {
      method: 'POST',
      headers: { 'club-id': clubId },
      body: JSON.stringify({ dancerId })
    })
  }

  async reorderQueue(stageId: string, clubId: string, queueOrder: string[]) {
    return this.request(`/api/queue/${stageId}/reorder`, {
      method: 'PUT',
      headers: { 'club-id': clubId },
      body: JSON.stringify({ queueOrder })
    })
  }

  async getVipRooms(clubId: string) {
    return this.request('/api/vip-rooms', {
      headers: { 'club-id': clubId }
    })
  }

  async bookVipRoom(clubId: string, roomId: string, bookingData: any) {
    return this.request(`/api/vip-rooms/${roomId}/book`, {
      method: 'POST',
      headers: { 'club-id': clubId },
      body: JSON.stringify(bookingData)
    })
  }

  async checkoutVipRoom(clubId: string, roomId: string) {
    return this.request(`/api/vip-rooms/${roomId}/checkout`, {
      method: 'PUT',
      headers: { 'club-id': clubId }
    })
  }

  async getFinancialDashboard(clubId: string, period: string = 'today') {
    return this.request(`/api/financial/dashboard?period=${period}`, {
      headers: { 'club-id': clubId }
    })
  }

  async collectBarFee(clubId: string, feeData: any) {
    return this.request('/api/financial/bar-fee', {
      method: 'POST',
      headers: { 'club-id': clubId },
      body: JSON.stringify(feeData)
    })
  }
}

export const apiClient = new ApiClient()