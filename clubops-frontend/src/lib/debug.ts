import { apiClient } from './api'

export interface SystemHealthCheck {
  frontend: {
    status: 'ok' | 'error'
    version: string
    environment: string
    apiBaseUrl: string
  }
  backend: {
    status: 'ok' | 'error'
    reachable: boolean
    responseTime?: number
    version?: string
    environment?: string
  }
  authentication: {
    hasStoredToken: boolean
    tokenValid?: boolean
  }
  localStorage: {
    available: boolean
    tokenPresent: boolean
  }
}

export class DebugHelper {
  static async performHealthCheck(): Promise<SystemHealthCheck> {
    const result: SystemHealthCheck = {
      frontend: {
        status: 'ok',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        apiBaseUrl: process.env.NODE_ENV === 'production' 
          ? 'https://clubops-backend-vercel-kmhv.vercel.app' 
          : 'http://localhost:3001'
      },
      backend: {
        status: 'error',
        reachable: false
      },
      authentication: {
        hasStoredToken: false
      },
      localStorage: {
        available: false,
        tokenPresent: false
      }
    }

    // Check localStorage availability
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      result.localStorage.available = true
      
      const token = localStorage.getItem('auth_token')
      result.localStorage.tokenPresent = !!token
      result.authentication.hasStoredToken = !!token
    } catch (error) {
      console.error('localStorage not available:', error)
    }

    // Check backend connectivity
    try {
      const startTime = Date.now()
      const response = await apiClient.healthCheck()
      const responseTime = Date.now() - startTime
      
      result.backend = {
        status: 'ok',
        reachable: true,
        responseTime,
        version: response.version,
        environment: response.environment
      }
      
      // Test authentication if token exists
      if (result.authentication.hasStoredToken) {
        try {
          await apiClient.getMe()
          result.authentication.tokenValid = true
        } catch (error) {
          result.authentication.tokenValid = false
          console.warn('Stored token is invalid:', error)
        }
      }
      
    } catch (error) {
      console.error('Backend health check failed:', error)
      result.backend.status = 'error'
    }

    return result
  }

  static async debugLogin(email: string, password: string) {
    console.group('🔍 LOGIN DEBUG SESSION')
    
    try {
      // Step 1: Health Check
      console.log('📊 Performing system health check...')
      const healthCheck = await this.performHealthCheck()
      console.log('Health Check Results:', healthCheck)
      
      if (!healthCheck.backend.reachable) {
        console.error('❌ Backend is not reachable! Cannot proceed with login.')
        console.groupEnd()
        return {
          success: false,
          error: 'Backend server is not reachable',
          debug: { healthCheck }
        }
      }
      
      // Step 2: Clear any existing token
      console.log('🧹 Clearing any existing authentication...')
      apiClient.clearToken()
      
      // Step 3: Attempt Login
      console.log('🔐 Attempting login...')
      console.log('Email:', email)
      console.log('Password length:', password.length)
      
      const loginResult = await apiClient.login(email, password)
      console.log('✅ Login successful!')
      console.log('Response structure:', {
        hasToken: !!loginResult.token,
        tokenLength: loginResult.token?.length,
        hasUser: !!loginResult.user,
        userEmail: loginResult.user?.email,
        userClubsCount: loginResult.user?.clubs?.length,
        userClubs: loginResult.user?.clubs
      })
      
      // Step 4: Verify Token Storage
      console.log('💾 Verifying token storage...')
      const storedToken = apiClient.getToken()
      console.log('Token stored successfully:', !!storedToken)
      
      // Step 5: Test /auth/me endpoint
      console.log('👤 Testing user profile endpoint...')
      const meResult = await apiClient.getMe()
      console.log('Profile fetch successful:', {
        hasUser: !!meResult.user,
        userEmail: meResult.user?.email,
        userClubsCount: meResult.user?.clubs?.length
      })
      
      console.log('🎉 All tests passed! Login should work normally.')
      console.groupEnd()
      
      return {
        success: true,
        user: loginResult.user,
        debug: {
          healthCheck,
          loginResponse: loginResult,
          profileResponse: meResult
        }
      }
      
    } catch (error) {
      console.error('❌ Login debug failed:', error)
      console.groupEnd()
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          error: error,
          errorType: error?.constructor?.name,
          errorMessage: error?.message,
          errorStack: error?.stack
        }
      }
    }
  }

  static logSystemInfo() {
    console.group('🖥️ SYSTEM INFORMATION')
    
    console.log('Browser:', navigator.userAgent)
    console.log('URL:', window.location.href)
    console.log('Protocol:', window.location.protocol)
    console.log('Host:', window.location.host)
    console.log('Environment:', process.env.NODE_ENV || 'development')
    
    // Check for common browser security restrictions
    console.log('Cookies enabled:', navigator.cookieEnabled)
    console.log('Local storage available:', typeof Storage !== 'undefined')
    console.log('Fetch API available:', typeof fetch !== 'undefined')
    
    // Check for CORS/security headers
    console.log('Origin:', window.location.origin)
    
    console.groupEnd()
  }

  static async testCORS() {
    console.group('🌐 CORS TEST')
    
    const testUrls = [
      'https://clubops-backend-vercel-kmhv.vercel.app/health',
      'https://clubops-backend-vercel-kmhv.vercel.app/auth/login'
    ]
    
    for (const url of testUrls) {
      try {
        console.log(`Testing: ${url}`)
        const response = await fetch(url, {
          method: 'OPTIONS',
          headers: {
            'Origin': window.location.origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type, Authorization'
          }
        })
        
        console.log(`✅ ${url} - Status: ${response.status}`)
        console.log('CORS Headers:', {
          'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
          'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        })
        
      } catch (error) {
        console.error(`❌ ${url} - Error:`, error)
      }
    }
    
    console.groupEnd()
  }

  static exportDebugInfo() {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      environment: process.env.NODE_ENV || 'development',
      localStorage: {
        available: typeof Storage !== 'undefined',
        tokenPresent: !!localStorage.getItem('auth_token')
      },
      console: {
        errors: [], // This would need to be populated by a custom console override
        warnings: []
      }
    }
    
    const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clubops-debug-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    console.log('📄 Debug info exported to file')
  }
}

// Make debug helper available globally in development
if (process.env.NODE_ENV === 'development') {
  (window as any).debugHelper = DebugHelper
  console.log('🛠️ Debug helper available as window.debugHelper')
  console.log('Available methods:', Object.getOwnPropertyNames(DebugHelper))
}