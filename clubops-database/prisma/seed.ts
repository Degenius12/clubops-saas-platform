import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting ClubOps database seed...')

  // Create sample club
  const club = await prisma.club.create({
    data: {
      name: 'Elite Gentlemen\'s Club',
      address: '123 Entertainment Blvd',
      city: 'Las Vegas',
      state: 'Nevada', 
      zipCode: '89101',
      phone: '(555) 123-4567',
      email: 'info@eliteclub.com',
      licenseNumber: 'LV-2025-001'
    }
  })

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@eliteclub.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Manager',
      phone: '(555) 987-6543'
    }
  })

  // Create user-club role
  await prisma.userClubRole.create({
    data: {
      userId: adminUser.id,
      clubId: club.id,
      role: 'MANAGER'
    }
  })

  // Create DJ user
  const djUser = await prisma.user.create({
    data: {
      email: 'dj@eliteclub.com',
      password: await bcrypt.hash('dj123', 10),
      firstName: 'Mike',
      lastName: 'DJ',
      phone: '(555) 555-0123'
    }
  })

  await prisma.userClubRole.create({
    data: {
      userId: djUser.id,
      clubId: club.id,
      role: 'DJ'
    }
  })

  // Create stages
  const mainStage = await prisma.stage.create({
    data: {
      clubId: club.id,
      name: 'Main Stage',
      description: 'Primary performance area',
      maxCapacity: 1
    }
  })

  const stage2 = await prisma.stage.create({
    data: {
      clubId: club.id,
      name: 'Side Stage', 
      description: 'Secondary performance area',
      maxCapacity: 1
    }
  })

  // Create DJ queues
  const mainQueue = await prisma.djQueue.create({
    data: {
      clubId: club.id,
      stageId: mainStage.id,
      name: 'Main Stage Queue'
    }
  })

  const sideQueue = await prisma.djQueue.create({
    data: {
      clubId: club.id,
      stageId: stage2.id,
      name: 'Side Stage Queue'
    }
  })

  // Create sample dancers
  const dancers = await Promise.all([
    prisma.dancer.create({
      data: {
        clubId: club.id,
        stageName: 'Aria',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '(555) 111-2222',
        email: 'aria@email.com',
        createdById: adminUser.id
      }
    }),
    prisma.dancer.create({
      data: {
        clubId: club.id,
        stageName: 'Bella',
        firstName: 'Emily',
        lastName: 'Davis',
        phone: '(555) 333-4444',
        email: 'bella@email.com',
        createdById: adminUser.id
      }
    }),
    prisma.dancer.create({
      data: {
        clubId: club.id,
        stageName: 'Crystal',
        firstName: 'Jessica',
        lastName: 'Wilson',
        phone: '(555) 555-6666',
        email: 'crystal@email.com',
        createdById: adminUser.id
      }
    })
  ])

  // Create dancer licenses
  for (const dancer of dancers) {
    await prisma.dancerLicense.create({
      data: {
        dancerId: dancer.id,
        licenseType: 'ENTERTAINMENT',
        licenseNumber: `ENT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        issueDate: new Date(2024, 0, 1),
        expirationDate: new Date(2025, 11, 31),
        issuingAuthority: 'Nevada Gaming Commission'
      }
    })
  }

  // Create VIP rooms
  const vipRooms = await Promise.all([
    prisma.vipRoom.create({
      data: {
        clubId: club.id,
        name: 'VIP Suite 1',
        description: 'Luxury private room with bar service',
        hourlyRate: 150.00,
        capacity: 4,
        amenities: ['Private bar', 'Sound system', 'Comfortable seating']
      }
    }),
    prisma.vipRoom.create({
      data: {
        clubId: club.id,
        name: 'VIP Suite 2',
        description: 'Premium private room',
        hourlyRate: 125.00,
        capacity: 2,
        amenities: ['Sound system', 'Private seating']
      }
    })
  ])

  // Create sample queue entries
  await Promise.all([
    prisma.queueEntry.create({
      data: {
        queueId: mainQueue.id,
        dancerId: dancers[0].id,
        position: 1,
        songTitle: 'Sexy Back',
        artist: 'Justin Timberlake',
        duration: 240
      }
    }),
    prisma.queueEntry.create({
      data: {
        queueId: mainQueue.id,
        dancerId: dancers[1].id,
        position: 2,
        songTitle: 'Crazy',
        artist: 'Gnarls Barkley',
        duration: 180
      }
    })
  ])

  // Create sample financial transactions
  await Promise.all([
    prisma.financialTransaction.create({
      data: {
        clubId: club.id,
        transactionType: 'REVENUE',
        category: 'Bar Fee',
        amount: 25.00,
        description: 'Dancer bar fee - Aria',
        reference: dancers[0].id,
        paymentMethod: 'CASH',
        createdById: adminUser.id
      }
    }),
    prisma.financialTransaction.create({
      data: {
        clubId: club.id,
        transactionType: 'REVENUE',
        category: 'VIP Room',
        amount: 150.00,
        description: 'VIP Suite 1 - 1 hour',
        reference: vipRooms[0].id,
        paymentMethod: 'CREDIT_CARD',
        createdById: adminUser.id
      }
    })
  ])

  console.log('✅ Database seed completed successfully!')
  console.log(`📊 Created: 1 club, 2 users, 3 dancers, 2 stages, 2 VIP rooms`)
}

main()
  .catch((e) => {
    console.error('❌ Database seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
