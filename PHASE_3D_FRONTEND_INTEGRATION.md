# 🚀 Phase 3D - Frontend Integration Instructions

## **OVERVIEW**
Connect the existing ClubOps React frontend (perfect UI/branding) to the completed backend API for full-stack functionality.

## **CURRENT STATUS**
✅ **Frontend**: Perfect ClubOps UI working locally (dark theme, all components)
✅ **Backend**: Complete API server ready at localhost:3001 (575 lines, all endpoints)
✅ **Database**: PostgreSQL schema with sample data ready

## **INTEGRATION TASKS** (30 minutes)

### **Task 1: API Client Setup** (5 minutes)
Create API client for backend communication:

```typescript
// src/lib/api.ts
const API_BASE_URL = 'http://localhost:3001'

export class ApiClient {
  private token: string | null = null

  setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token')
    }
    return this.token
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const token = this.getToken()
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }

  // Dancer methods
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

  // DJ Queue methods
  async getQueue(stageId: string, clubId: string) {
    return this.request(`/api/queue/${stageId}`, {
      headers: { 'club-id': clubId }
    })
  }

  // VIP Room methods
  async getVipRooms(clubId: string) {
    return this.request('/api/vip-rooms', {
      headers: { 'club-id': clubId }
    })
  }

  // Financial methods
  async getFinancialDashboard(clubId: string) {
    return this.request('/api/financial/dashboard', {
      headers: { 'club-id': clubId }
    })
  }
}

export const apiClient = new ApiClient()
```

### **Task 2: Authentication Integration** (10 minutes)

Update authentication context and login flow:

```typescript
// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiClient } from '../lib/api'

interface User {
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

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  selectedClub: string | null
  setSelectedClub: (clubId: string) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [selectedClub, setSelectedClub] = useState<string | null>(null)

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password)
      apiClient.setToken(response.token)
      setUser(response.user)
      
      // Auto-select first club
      if (response.user.clubs.length > 0) {
        setSelectedClub(response.user.clubs[0].id)
      }
    } catch (error) {
      throw new Error('Login failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
    setSelectedClub(null)
  }

  const isAuthenticated = !!user

  useEffect(() => {
    // Check for existing token on app start
    const token = localStorage.getItem('auth_token')
    if (token) {
      apiClient.setToken(token)
      // Verify token with /auth/me endpoint
      apiClient.request('/auth/me')
        .then(response => {
          setUser(response.user)
          if (response.user.clubs.length > 0) {
            setSelectedClub(response.user.clubs[0].id)
          }
        })
        .catch(() => {
          localStorage.removeItem('auth_token')
        })
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated,
      selectedClub,
      setSelectedClub
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### **Task 3: WebSocket Integration** (5 minutes)

Add real-time features:

```typescript
// src/hooks/useSocket.ts
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const { selectedClub, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !selectedClub) return

    const socketInstance = io('http://localhost:3001')
    
    socketInstance.on('connect', () => {
      socketInstance.emit('join-club', selectedClub)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [isAuthenticated, selectedClub])

  return socket
}
```

### **Task 4: Component Data Integration** (10 minutes)

Update existing components to use real API data:

```typescript
// Update DancerManagement component
export function DancerManagement() {
  const { selectedClub } = useAuth()
  const [dancers, setDancers] = useState([])
  const [alerts, setAlerts] = useState([])
  const socket = useSocket()

  useEffect(() => {
    if (!selectedClub) return

    const loadData = async () => {
      try {
        const [dancersData, alertsData] = await Promise.all([
          apiClient.getDancers(selectedClub),
          apiClient.getDancerAlerts(selectedClub)
        ])
        
        setDancers(dancersData.dancers)
        setAlerts(alertsData.alerts)
      } catch (error) {
        console.error('Failed to load dancer data:', error)
      }
    }

    loadData()

    // Listen for real-time updates
    if (socket) {
      socket.on('dancer:created', (newDancer) => {
        setDancers(prev => [...prev, newDancer])
      })

      return () => {
        socket.off('dancer:created')
      }
    }
  }, [selectedClub, socket])

  // Rest of component implementation...
}
```

## **TESTING CHECKLIST**

### **Phase 3D Success Criteria**
- [ ] **Authentication**: Login/logout working with real backend
- [ ] **Data Loading**: All components show real data from API
- [ ] **Real-time Updates**: WebSocket events updating UI live
- [ ] **Multi-tenant**: Club selection working properly
- [ ] **API Integration**: All CRUD operations functional
- [ ] **Error Handling**: Proper error states and loading indicators

### **Test Scenarios**
1. **Login Flow**: Use admin@eliteclub.com / admin123
2. **Dancer Management**: View dancers, see license alerts
3. **DJ Queue**: View queue, add dancers (if implemented)
4. **VIP Rooms**: Check room availability
5. **Financial Dashboard**: View revenue metrics

## **COMPLETION TARGET**
**Time**: 30 minutes
**Result**: Fully integrated ClubOps SaaS platform with real-time features
**Next Phase**: Phase 3E - SaaS features and final testing

## **EXECUTION APPROACH**
- **Option A**: Claude Code Extension (recommended for complex integration)
- **Option B**: Desktop Commander (step-by-step implementation)

**Status**: Ready for immediate frontend integration execution
