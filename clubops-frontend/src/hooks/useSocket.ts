import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './useAuth'

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.herokuapp.com' 
  : 'http://localhost:3001'

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { selectedClub, isAuthenticated, user } = useAuth()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !selectedClub || !user) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Create socket connection
    const socketInstance = io(API_BASE_URL, {
      auth: {
        token: localStorage.getItem('auth_token'),
        clubId: selectedClub
      }
    })

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id)
      setIsConnected(true)
      
      // Join club room for multi-tenant real-time updates
      socketInstance.emit('join-club', selectedClub)
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    socketRef.current = socketInstance
    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
    }
  }, [isAuthenticated, selectedClub, user])

  const emit = (event: string, data?: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data)
    }
  }

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback)
    }
  }

  return {
    socket,
    isConnected,
    emit,
    on,
    off
  }
}

// Hook for specific real-time features
export function useRealtimeUpdates() {
  const { on, off, isConnected } = useSocket()
  const [updates, setUpdates] = useState<any[]>([])

  useEffect(() => {
    if (!isConnected) return

    const handleDancerUpdate = (data: any) => {
      setUpdates(prev => [...prev.slice(-9), { type: 'dancer', data, timestamp: Date.now() }])
    }

    const handleQueueUpdate = (data: any) => {
      setUpdates(prev => [...prev.slice(-9), { type: 'queue', data, timestamp: Date.now() }])
    }

    const handleVipUpdate = (data: any) => {
      setUpdates(prev => [...prev.slice(-9), { type: 'vip', data, timestamp: Date.now() }])
    }

    const handleFinancialUpdate = (data: any) => {
      setUpdates(prev => [...prev.slice(-9), { type: 'financial', data, timestamp: Date.now() }])
    }

    // Subscribe to real-time events
    on('dancer:created', handleDancerUpdate)
    on('dancer:updated', handleDancerUpdate)
    on('queue:updated', handleQueueUpdate)
    on('vip:booked', handleVipUpdate)
    on('vip:checkout', handleVipUpdate)
    on('financial:transaction', handleFinancialUpdate)

    return () => {
      off('dancer:created', handleDancerUpdate)
      off('dancer:updated', handleDancerUpdate)
      off('queue:updated', handleQueueUpdate)
      off('vip:booked', handleVipUpdate)
      off('vip:checkout', handleVipUpdate)
      off('financial:transaction', handleFinancialUpdate)
    }
  }, [isConnected, on, off])

  return {
    updates,
    isConnected
  }
}
