const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://clubops-backend-vercel-kmhv.vercel.app' 
  : 'http://localhost:3001'

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
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  getToken() {
    return this.token
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('auth_token')
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
      if (response.status === 401) {
        this.clearToken()
        window.location.href = '/login'
        return
      }
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  // Auth methods
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }

  async getMe(): Promise<{ user: User }> {
    return this.request('/api/auth/me')
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

  async createDancer(clubId: string, dancerData: any) {
    return this.request('/api/dancers', {
      method: 'POST',
      headers: { 'club-id': clubId },
      body: JSON.stringify(dancerData)
    })
  }

  // DJ Queue methods
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

  // VIP Room methods
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

  // Financial methods
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

  // Health check
  async healthCheck() {
    return this.request('/health')
  }
}

export const apiClient = new ApiClient()