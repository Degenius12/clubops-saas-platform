import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, Calendar, TrendingUp, Sparkles, Music, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useRealtimeUpdates } from '../hooks/useSocket'
import { apiClient } from '../lib/api'

interface DashboardStats {
  activeDancers: number
  dailyRevenue: number
  vipBookings: number
  queueLength: number
  dancerChange: string
  revenueChange: string
  vipChange: string
  queueChange: string
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
}

export default function Dashboard() {
  const { user, selectedClub } = useAuth()
  const { updates, isConnected } = useRealtimeUpdates()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedClub) return

    const loadDashboardData = async () => {
      try {
        setIsLoading(true)
        setError('')
        
        // Load financial dashboard data
        const dashboardData = await apiClient.getFinancialDashboard(selectedClub)
        
        // Load other data in parallel
        const [dancersData, vipData] = await Promise.all([
          apiClient.getDancers(selectedClub),
          apiClient.getVipRooms(selectedClub)
        ])

        // Calculate stats
        const activeDancers = dancersData.dancers?.filter((d: any) => d.isActive)?.length || 0
        const vipBookings = vipData.rooms?.filter((r: any) => r.status === 'occupied')?.length || 0
        
        setStats({
          activeDancers,
          dailyRevenue: dashboardData.dailyRevenue || 0,
          vipBookings,
          queueLength: 6, // This would come from queue API
          dancerChange: '+4',
          revenueChange: '+12%',
          vipChange: '+8',
          queueChange: '-2'
        })

        // Set mock recent activity (replace with real API call)
        setRecentActivity([
          {
            id: '1',
            type: 'dancer_checkin',
            description: 'Dancer check-in: Madison',
            timestamp: '2 minutes ago'
          },
          {
            id: '2',
            type: 'vip_booking',
            description: 'VIP booking: Room 3',
            timestamp: '15 minutes ago'
          },
          {
            id: '3',
            type: 'dj_queue',
            description: 'DJ queue update: Stage 1',
            timestamp: '23 minutes ago'
          }
        ])

      } catch (err) {
        console.error('Dashboard data load error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
        
        // Set fallback mock data
        setStats({
          activeDancers: 24,
          dailyRevenue: 12847,
          vipBookings: 18,
          queueLength: 6,
          dancerChange: '+4',
          revenueChange: '+12%',
          vipChange: '+8',
          queueChange: '-2'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [selectedClub])

  // Update stats based on real-time updates
  useEffect(() => {
    if (updates.length > 0) {
      const latestUpdate = updates[updates.length - 1]
      
      // Add real-time update to recent activity
      setRecentActivity(prev => [
        {
          id: Date.now().toString(),
          type: latestUpdate.type,
          description: `${latestUpdate.type}: ${latestUpdate.data.name || 'Update'}`,
          timestamp: 'Just now'
        },
        ...prev.slice(0, 4) // Keep only 5 most recent
      ])

      // Update stats based on the type of update
      if (latestUpdate.type === 'financial' && stats) {
        setStats(prev => prev ? {
          ...prev,
          dailyRevenue: latestUpdate.data.newTotal || prev.dailyRevenue
        } : null)
      }
    }
  }, [updates, stats])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  const statsData = [
    { 
      name: 'Active Dancers', 
      value: stats?.activeDancers?.toString() || '0', 
      change: stats?.dancerChange || '+0', 
      icon: Users, 
      color: 'bg-blue-500' 
    },
    { 
      name: 'Daily Revenue', 
      value: `$${stats?.dailyRevenue?.toLocaleString() || '0'}`, 
      change: stats?.revenueChange || '+0%', 
      icon: DollarSign, 
      color: 'bg-green-500' 
    },
    { 
      name: 'VIP Bookings', 
      value: stats?.vipBookings?.toString() || '0', 
      change: stats?.vipChange || '+0', 
      icon: Sparkles, 
      color: 'bg-purple-500' 
    },
    { 
      name: 'Queue Length', 
      value: stats?.queueLength?.toString() || '0', 
      change: stats?.queueChange || '0', 
      icon: Music, 
      color: 'bg-indigo-500' 
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Good Evening, {user?.firstName || 'Manager'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Here's what's happening at your club today
            </p>
          </div>
          <div className="flex items-center">
            {isConnected ? (
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live
              </div>
            ) : (
              <div className="flex items-center text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                Offline
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-center"
          >
            <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-700">
              Using demo data - Backend connection: {error}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <span className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 
                  stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {stat.change}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Check In Dancer</p>
          </button>
          <button className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
            <Music className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Manage Queue</p>
          </button>
          <button className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
            <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
            <p className="text-sm font-medium text-green-900 dark:text-green-100">VIP Booking</p>
          </button>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
          {isConnected && (
            <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Live Updates
            </span>
          )}
        </h3>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <motion.div 
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activity.timestamp}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
