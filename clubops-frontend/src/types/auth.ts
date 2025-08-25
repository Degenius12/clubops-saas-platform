// Core entity types for ClubOps
export interface User {
  id: string
  email: string
  name: string
  role: 'owner' | 'manager' | 'dj' | 'staff'
  clubId: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface Club {
  id: string
  name: string
  address: string
  phone: string
  email: string
  subscriptionTier: 'free' | 'basic' | 'pro' | 'enterprise'
  subscriptionStatus: 'active' | 'cancelled' | 'past_due'
  settings: ClubSettings
  createdAt: string
  updatedAt: string
}

export interface ClubSettings {
  timezone: string
  currency: string
  theme: 'dark' | 'light'
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
  }
  compliance: {
    licenseExpiryWarningDays: number
    requireIdScan: boolean
    autoBlockExpiredLicenses: boolean
  }
}