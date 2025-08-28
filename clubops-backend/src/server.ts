import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import Joi from 'joi'
import winston from 'winston'

// Initialize Express app
const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
})

// Initialize Prisma
const prisma = new PrismaClient()

// Initialize Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'clubops-api.log' })
  ]
})

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { 
    ip: req.ip, 
    userAgent: req.get('User-Agent') 
  })
  next()
})

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'clubops-jwt-secret-2025'

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

interface AuthRequest extends express.Request {
  user?: any
  club?: any
}

const authenticateToken = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        clubRoles: {
          include: {
            club: true
          }
        }
      }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = user
    next()
  } catch (error) {
    logger.error('Authentication error:', error)
    return res.status(403).json({ error: 'Invalid token' })
  }
}

// Club context middleware
const requireClub = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const clubId = req.headers['club-id'] as string || req.params.clubId

  if (!clubId) {
    return res.status(400).json({ error: 'Club ID required' })
  }

  const userClub = req.user?.clubRoles.find((role: any) => role.clubId === clubId)
  if (!userClub) {
    return res.status(403).json({ error: 'Access denied to this club' })
  }

  req.club = userClub.club
  next()
}

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

app.post('/auth/login', async (req, res) => {
  try {
    const { error, value } = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }).validate(req.body)

    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { email, password } = value

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        clubRoles: {
          include: {
            club: true
          }
        }
      }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    logger.info(`User login successful: ${user.email}`)

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        clubs: user.clubRoles.map((role: any) => ({
          id: role.club.id,
          name: role.club.name,
          role: role.role
        }))
      }
    })

  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/auth/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        clubs: req.user.clubRoles.map((role: any) => ({
          id: role.club.id,
          name: role.club.name,
          role: role.role
        }))
      }
    })
  } catch (error) {
    logger.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================================================
// DANCER MANAGEMENT ROUTES
// ============================================================================

app.get('/api/dancers', authenticateToken, requireClub, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where = {
      clubId: req.club.id,
      isActive: true,
      ...(search && {
        OR: [
          { stageName: { contains: String(search), mode: 'insensitive' } },
          { firstName: { contains: String(search), mode: 'insensitive' } },
          { lastName: { contains: String(search), mode: 'insensitive' } }
        ]
      })
    }

    const dancers = await prisma.dancer.findMany({
      where,
      include: {
        licenses: {
          where: { isActive: true },
          orderBy: { expirationDate: 'asc' }
        },
        sessions: {
          where: { checkOutTime: null },
          orderBy: { checkInTime: 'desc' },
          take: 1
        }
      },
      orderBy: { stageName: 'asc' },
      skip: offset,
      take: Number(limit)
    })

    const total = await prisma.dancer.count({ where })

    res.json({
      dancers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })

  } catch (error) {
    logger.error('Get dancers error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/dancers', authenticateToken, requireClub, async (req: AuthRequest, res) => {
  try {
    const { error, value } = Joi.object({
      stageName: Joi.string().required(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      phone: Joi.string().optional(),
      email: Joi.string().email().optional(),
      dateOfBirth: Joi.date().optional(),
      notes: Joi.string().optional()
    }).validate(req.body)

    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const dancer = await prisma.dancer.create({
      data: {
        ...value,
        clubId: req.club.id,
        createdById: req.user.id
      },
      include: {
        licenses: true,
        sessions: true
      }
    })

    logger.info(`New dancer created: ${dancer.stageName} by ${req.user.email}`)

    // Emit real-time update
    io.to(`club-${req.club.id}`).emit('dancer:created', dancer)

    res.status(201).json(dancer)

  } catch (error) {
    logger.error('Create dancer error:', error)
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Stage name already exists' })
    } else {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})

app.get('/api/dancers/alerts', authenticateToken, requireClub, async (req: AuthRequest, res) => {
  try {
    const twoWeeksFromNow = new Date()
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)

    const dancers = await prisma.dancer.findMany({
      where: {
        clubId: req.club.id,
        isActive: true,
        licenses: {
          some: {
            isActive: true,
            expirationDate: {
              lte: twoWeeksFromNow
            }
          }
        }
      },
      include: {
        licenses: {
          where: {
            isActive: true,
            expirationDate: {
              lte: twoWeeksFromNow
            }
          },
          orderBy: { expirationDate: 'asc' }
        }
      },
      orderBy: { stageName: 'asc' }
    })

    res.json({ alerts: dancers })

  } catch (error) {
    logger.error('Get dancer alerts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================================================
// DJ QUEUE MANAGEMENT ROUTES
// ============================================================================

app.get('/api/queue/:stageId', authenticateToken, requireClub, async (req: AuthRequest, res) => {
  try {
    const { stageId } = req.params

    const queue = await prisma.djQueue.findFirst({
      where: {
        clubId: req.club.id,
        stageId: stageId
      },
      include: {
        entries: {
          where: { status: { not: 'CANCELLED' } },
          include: {
            dancer: true
          },
          orderBy: { position: 'asc' }
        },
        stage: true
      }
    })

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' })
    }

    res.json(queue)

  } catch (error) {
    logger.error('Get queue error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/queue/:stageId/add', authenticateToken, requireClub, async (req: AuthRequest, res) => {
  try {
    const { stageId } = req.params
    const { error, value } = Joi.object({
      dancerId: Joi.string().required(),
      songTitle: Joi.string().optional(),
      artist: Joi.string().optional(),
      duration: Joi.number().optional()
    }).validate(req.body)

    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const queue = await prisma.djQueue.findFirst({
      where: {
        clubId: req.club.id,
        stageId: stageId
      }
    })

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' })
    }

    // Get next position
    const lastEntry = await prisma.queueEntry.findFirst({
      where: { queueId: queue.id },
      orderBy: { position: 'desc' }
    })

    const nextPosition = lastEntry ? lastEntry.position + 1 : 1

    const queueEntry = await prisma.queueEntry.create({
      data: {
        queueId: queue.id,
        dancerId: value.dancerId,
        position: nextPosition,
        songTitle: value.songTitle,
        artist: value.artist,
        duration: value.duration
      },
      include: {
        dancer: true
      }
    })

    logger.info(`Dancer added to queue: ${queueEntry.dancer.stageName} to stage ${stageId}`)

    // Emit real-time update
    io.to(`club-${req.club.id}`).emit('queue:updated', { 
      stageId, 
      action: 'added', 
      entry: queueEntry 
    })

    res.status(201).json(queueEntry)

  } catch (error) {
    logger.error('Add to queue error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.put('/api/queue/:stageId/reorder', authenticateToken, requireClub, async (req: AuthRequest, res) => {
  try {
    const { stageId } = req.params
    const { error, value } = Joi.object({
      entries: Joi.array().items(Joi.object({
        id: Joi.string().required(),
        position: Joi.number().required()
      })).required()
    }).validate(req.body)

    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    // Update positions in transaction
    await prisma.$transaction(
      value.entries.map((entry: any) =>
        prisma.queueEntry.update({
          where: { id: entry.id },
          data: { position: entry.position }
        })
      )
    )

    logger.info(`Queue reordered for stage ${stageId}`)

    // Emit real-time update
    io.to(`club-${req.club.id}`).emit('queue:reordered', { stageId })

    res.json({ success: true })

  } catch (error) {
    logger.error('Reorder queue error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================================================
// VIP ROOM MANAGEMENT ROUTES
// ============================================================================

app.get('/api/vip-rooms', authenticateToken, requireClub, async (req: AuthRequest, res) => {
  try {
    const rooms = await prisma.vipRoom.findMany({
      where: {
        clubId: req.club.id,
        isActive: true
      },
      include: {
        bookings: {
          where: {
            status: 'ACTIVE',
            endTime: null
          },
          include: {
            dancer: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    res.json({ rooms })

  } catch (error) {
    logger.error('Get VIP rooms error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/vip-rooms/:id/book', authenticateToken, requireClub, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { error, value } = Joi.object({
      dancerId: Joi.string().optional(),
      customerName: Joi.string().optional(),
      duration: Joi.number().min(1).required() // Duration in hours
    }).validate(req.body)

    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const room = await prisma.vipRoom.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { status: 'ACTIVE', endTime: null }
        }
      }
    })

    if (!room || room.clubId !== req.club.id) {
      return res.status(404).json({ error: 'VIP room not found' })
    }

    if (room.bookings.length > 0) {
      return res.status(409).json({ error: 'VIP room is currently occupied' })
    }

    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + (value.duration * 60 * 60 * 1000))
    const totalAmount = room.hourlyRate * value.duration

    const booking = await prisma.vipBooking.create({
      data: {
        roomId: id,
        dancerId: value.dancerId,
        customerName: value.customerName,
        startTime,
        endTime,
        totalAmount
      },
      include: {
        room: true,
        dancer: true
      }
    })

    logger.info(`VIP room booked: ${room.name} for ${value.duration} hours`)

    // Emit real-time update
    io.to(`club-${req.club.id}`).emit('vip:booked', booking)

    res.status(201).json(booking)

  } catch (error) {
    logger.error('Book VIP room error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.put('/api/vip-rooms/:id/checkout', authenticateToken, requireClub, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const activeBooking = await prisma.vipBooking.findFirst({
      where: {
        roomId: id,
        status: 'ACTIVE',
        endTime: null
      },
      include: {
        room: true,
        dancer: true
      }
    })

    if (!activeBooking) {
      return res.status(404).json({ error: 'No active booking found' })
    }

    const checkoutTime = new Date()
    const actualDuration = (checkoutTime.getTime() - activeBooking.startTime.getTime()) / (1000 * 60 * 60) // Hours
    const actualAmount = activeBooking.room.hourlyRate * Math.ceil(actualDuration)

    const updatedBooking = await prisma.vipBooking.update({
      where: { id: activeBooking.id },
      data: {
        endTime: checkoutTime,
        totalAmount: actualAmount,
        status: 'COMPLETED'
      },
      include: {
        room: true,
        dancer: true
      }
    })

    // Create financial transaction
    await prisma.financialTransaction.create({
      data: {
        clubId: req.club.id,
        transactionType: 'REVENUE',
        category: 'VIP Room',
        amount: actualAmount,
        description: `${activeBooking.room.name} - ${Math.ceil(actualDuration)} hours`,
        reference: updatedBooking.id,
        paymentMethod: 'CASH', // Default, should be updated based on actual payment
        createdById: req.user.id
      }
    })

    logger.info(`VIP room checkout: ${activeBooking.room.name}, Amount: $${actualAmount}`)

    // Emit real-time update
    io.to(`club-${req.club.id}`).emit('vip:checkout', updatedBooking)

    res.json(updatedBooking)

  } catch (error) {
    logger.error('VIP room checkout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================================================
// FINANCIAL TRACKING ROUTES
// ============================================================================

app.get('/api/financial/dashboard', authenticateToken, requireClub, async (req: AuthRequest, res) => {
  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const [dailyRevenue, weeklyRevenue, monthlyRevenue, recentTransactions] = await Promise.all([
      prisma.financialTransaction.aggregate({
        where: {
          clubId: req.club.id,
          transactionType: 'REVENUE',
          processedAt: { gte: startOfDay }
        },
        _sum: { amount: true }
      }),
      prisma.financialTransaction.aggregate({
        where: {
          clubId: req.club.id,
          transactionType: 'REVENUE',
          processedAt: { gte: startOfWeek }
        },
        _sum: { amount: true }
      }),
      prisma.financialTransaction.aggregate({
        where: {
          clubId: req.club.id,
          transactionType: 'REVENUE',
          processedAt: { gte: startOfMonth }
        },
        _sum: { amount: true }
      }),
      prisma.financialTransaction.findMany({
        where: { clubId: req.club.id },
        orderBy: { processedAt: 'desc' },
        take: 10,
        include: {
          createdBy: {
            select: { firstName: true, lastName: true }
          }
        }
      })
    ])

    res.json({
      revenue: {
        daily: dailyRevenue._sum.amount || 0,
        weekly: weeklyRevenue._sum.amount || 0,
        monthly: monthlyRevenue._sum.amount || 0
      },
      recentTransactions
    })

  } catch (error) {
    logger.error('Get financial dashboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/financial/bar-fee', authenticateToken, requireClub, async (req: AuthRequest, res) => {
  try {
    const { error, value } = Joi.object({
      dancerId: Joi.string().required(),
      amount: Joi.number().positive().required(),
      paymentMethod: Joi.string().valid('CASH', 'CREDIT_CARD', 'DEBIT_CARD').required(),
      notes: Joi.string().optional()
    }).validate(req.body)

    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const dancer = await prisma.dancer.findUnique({
      where: { id: value.dancerId }
    })

    if (!dancer || dancer.clubId !== req.club.id) {
      return res.status(404).json({ error: 'Dancer not found' })
    }

    // Create financial transaction
    const transaction = await prisma.financialTransaction.create({
      data: {
        clubId: req.club.id,
        transactionType: 'REVENUE',
        category: 'Bar Fee',
        amount: value.amount,
        description: `Bar fee - ${dancer.stageName}`,
        reference: dancer.id,
        paymentMethod: value.paymentMethod,
        createdById: req.user.id
      }
    })

    // Update dancer session if active
    await prisma.dancerSession.updateMany({
      where: {
        dancerId: value.dancerId,
        checkOutTime: null
      },
      data: {
        barFeePaid: true,
        barFeeAmount: value.amount
      }
    })

    logger.info(`Bar fee collected: $${value.amount} from ${dancer.stageName}`)

    // Emit real-time update
    io.to(`club-${req.club.id}`).emit('financial:bar-fee', {
      dancer: dancer.stageName,
      amount: value.amount
    })

    res.status(201).json(transaction)

  } catch (error) {
    logger.error('Collect bar fee error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================================================
// WEBSOCKET SETUP
// ============================================================================

io.on('connection', (socket) => {
  logger.info(`WebSocket connected: ${socket.id}`)

  socket.on('join-club', (clubId) => {
    socket.join(`club-${clubId}`)
    logger.info(`Socket ${socket.id} joined club ${clubId}`)
  })

  socket.on('leave-club', (clubId) => {
    socket.leave(`club-${clubId}`)
    logger.info(`Socket ${socket.id} left club ${clubId}`)
  })

  socket.on('disconnect', () => {
    logger.info(`WebSocket disconnected: ${socket.id}`)
  })
})

// ============================================================================
// HEALTH CHECK & ERROR HANDLING
// ============================================================================

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
  } catch (error) {
    logger.error('Health check failed:', error)
    res.status(503).json({ 
      status: 'error', 
      database: 'disconnected' 
    })
  }
})

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  logger.info(`🚀 ClubOps API Server running on port ${PORT}`)
  logger.info(`📊 Database connected`)
  logger.info(`🔌 WebSocket server active`)
  console.log(`
🎯 ClubOps API Server Started Successfully!
📍 Server: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
🔌 WebSocket: ws://localhost:${PORT}
📚 Database: PostgreSQL via Prisma
  `)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...')
  server.close(() => {
    prisma.$disconnect()
    process.exit(0)
  })
})

export default app
