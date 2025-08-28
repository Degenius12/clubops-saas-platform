# 🔥 IMMEDIATE EXECUTION - ClubOps Phase 3C

## **CLAUDE CODE EXECUTION SEQUENCE** (Next 40 minutes)

### **STEP 1: Database Schema Development** (15 minutes)

**Open Claude Code Extension in VS Code**

**Prompt**:
```
I need you to create a complete PostgreSQL database schema using Prisma for the ClubOps SaaS platform. This is a gentlemen's club management system.

CONTEXT: Working directory is ./clubops-database/

REQUIREMENTS FROM PRD:
- Multi-tenant club management system
- Dancer licensing with 14-day expiration alerts  
- DJ queue management with drag-and-drop functionality
- VIP room booking and real-time availability
- Bar fee collection and financial tracking
- User authentication with role-based access
- Real-time WebSocket support

CREATE THESE FILES:

1. **prisma/schema.prisma** - Complete data model with:
   - Multi-tenant architecture (club_id on all relevant tables)
   - Users, clubs, dancer management, licensing
   - DJ queues, stages, playlists, songs
   - VIP rooms, bookings, financial transactions
   - Audit trails and soft deletes
   - Proper indexes and constraints

2. **prisma/migrations/** - Database migration files

3. **prisma/seed.ts** - Development seed data with:
   - Sample clubs, users, dancers
   - Test DJ queues and VIP rooms
   - Sample financial transactions

4. **database.config.ts** - Connection configuration

5. **types/database.ts** - TypeScript type definitions

TECHNICAL SPECS:
- Use PostgreSQL as the database
- Include created_at, updated_at, created_by on all tables
- Add soft delete support where needed
- Multi-tenant isolation with club_id
- Performance indexes on frequently queried fields
- Data validation constraints

Please create all files and ensure the schema is production-ready.
```

### **STEP 2: Backend API Development** (25 minutes)

**Continue in Claude Code Extension**

**Prompt**:
```
Now create a complete Express.js backend API server for ClubOps in TypeScript.

CONTEXT: Working directory is ./clubops-backend/src/

INTEGRATION: Use the database schema you just created in ../clubops-database/

ARCHITECTURE:
- Express.js with TypeScript
- Prisma ORM integration
- JWT authentication with role-based access
- Socket.io for real-time updates
- Joi validation, Helmet security, Winston logging

CREATE THIS STRUCTURE:

1. **server.ts** - Main application entry point
2. **app.ts** - Express app configuration  
3. **config/database.ts** - Database connection
4. **config/auth.ts** - JWT configuration
5. **middleware/** - Authentication, validation, error handling
6. **routes/** - API endpoint definitions
7. **controllers/** - Business logic
8. **services/** - Database operations
9. **websocket/** - Real-time Socket.io handlers
10. **types/** - TypeScript interfaces

REQUIRED API ENDPOINTS:

**Authentication**: POST /auth/login, /auth/register, GET /auth/me
**Dancers**: GET,POST,PUT,DELETE /dancers, GET /dancers/alerts  
**DJ Queue**: GET,POST,PUT,DELETE /queue/:stageId/*
**VIP Rooms**: GET,POST,PUT /vip-rooms/*
**Financial**: GET /financial/*, POST /financial/bar-fee

FEATURES TO IMPLEMENT:
- Multi-tenant middleware (club isolation)
- Real-time WebSocket events for queue updates
- License expiration background checks
- Comprehensive input validation
- Error handling and logging
- API documentation setup

The backend must be production-ready and connect properly to the Prisma database.
```

## **VERIFICATION COMMANDS** (After external execution)

```bash
# Terminal commands to run after Claude Code completion:

# 1. Database Setup
cd clubops-database
npm install
npx prisma generate
npx prisma db push
npx prisma db seed

# 2. Backend Setup  
cd ../clubops-backend
npm install
npm run build
npm run dev

# 3. Integration Test
curl http://localhost:3001/health
curl http://localhost:3001/api/dancers
```

## **SUCCESS INDICATORS**

- [ ] Database schema with 15+ tables created
- [ ] Prisma client generated successfully  
- [ ] Backend server starts without errors
- [ ] All API endpoints responding
- [ ] WebSocket connections working
- [ ] Database queries executing properly

**EXECUTE NOW**: Open Claude Code extension and run the prompts above sequentially.

**TIME TARGET**: 40 minutes total execution time
**STATUS**: Ready for immediate external execution
