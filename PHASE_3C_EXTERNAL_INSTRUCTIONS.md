# 🔥 ClubOps Phase 3C - External Tool Instructions

## **IMMEDIATE ACTION: Database Schema Development (15 minutes)**

### **Tool**: Claude Code (VS Code Extension)
### **Task**: Create Complete PostgreSQL Schema

**Prompt for Claude Code**:
```
Create a complete PostgreSQL database schema for ClubOps SaaS platform.

REQUIREMENTS FROM PRD:
1. **Multi-tenant architecture** - Support multiple clubs
2. **Dancer management** with license tracking and proactive alerts
3. **DJ queue management** with drag-and-drop functionality  
4. **VIP room bookings** and real-time availability
5. **Financial tracking** for bar fees and revenue
6. **User authentication** with role-based access
7. **Real-time updates** support via WebSocket

SCHEMA SPECIFICATIONS:
- Use Prisma ORM for type safety
- Include audit trails (created_at, updated_at, created_by)
- Implement soft deletes where appropriate
- Add proper indexes for performance
- Include data validation constraints
- Support for multi-stage venues

DELIVERABLES:
1. schema.prisma file with complete data model
2. Migration files for database setup
3. Seed data for development testing
4. Database configuration and connection setup
5. Type definitions for TypeScript integration

SAVE TO: ./clubops-database/

FOCUS ON:
- Dancer license expiration tracking (14-day alerts)
- Queue management with real-time position updates
- VIP room availability and booking conflicts
- Revenue tracking with detailed breakdowns
- Multi-tenant data isolation
```

---

## **IMMEDIATE ACTION: Backend API Development (25 minutes)**

### **Tool**: Claude Code (VS Code Extension)
### **Task**: Create Express.js Backend Server

**Prompt for Claude Code**:
```
Create a complete Express.js backend API server for ClubOps SaaS platform.

TECHNICAL REQUIREMENTS:
- **Framework**: Express.js with TypeScript
- **Authentication**: JWT with role-based access control
- **Database**: Prisma ORM integration
- **Real-time**: Socket.io for live updates
- **Validation**: Joi for input validation
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston for structured logging

API ENDPOINTS REQUIRED:

### Authentication & Users
- POST /auth/login - User authentication
- POST /auth/register - New user registration  
- GET /auth/me - Current user profile
- PUT /auth/profile - Update profile

### Dancer Management
- GET /dancers - List dancers with filtering
- POST /dancers - Add new dancer
- PUT /dancers/:id - Update dancer info
- DELETE /dancers/:id - Remove dancer
- GET /dancers/:id/license - License status
- PUT /dancers/:id/license - Update license
- GET /dancers/alerts - License expiration alerts

### DJ Queue Management
- GET /queue/:stageId - Current queue for stage
- POST /queue/:stageId/add - Add dancer to queue
- PUT /queue/:stageId/reorder - Reorder queue items
- DELETE /queue/:stageId/:itemId - Remove from queue
- POST /queue/:stageId/next - Advance queue

### VIP Room Management
- GET /vip-rooms - Room availability
- POST /vip-rooms/:id/book - Book room
- PUT /vip-rooms/:id/checkout - Check out of room
- GET /vip-rooms/revenue - Room revenue stats

### Financial Tracking
- GET /financial/dashboard - Revenue overview
- GET /financial/transactions - Transaction history
- POST /financial/bar-fee - Collect bar fee
- GET /financial/reports - Generate reports

FEATURES TO IMPLEMENT:
- Multi-tenant middleware (club isolation)
- Real-time WebSocket events for queue updates
- License expiration background jobs
- Input validation and error handling
- API documentation with Swagger
- Database connection pooling
- Comprehensive logging

SAVE TO: ./clubops-backend/src/

INTEGRATION:
- Connect to database schema from ./clubops-database/
- Ensure API matches frontend expectations
- Include environment configuration
- Add Docker configuration for deployment
```

---

## **VERIFICATION TASKS (5 minutes)**

### **Database Verification**
```bash
cd clubops-database
npx prisma db push
npx prisma generate
npx prisma db seed
```

### **Backend Verification**
```bash
cd clubops-backend
npm install
npm run build
npm run dev
# Verify server starts on http://localhost:3001
```

### **Integration Test**
```bash
# Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/dancers
curl http://localhost:3001/api/queue/stage-1
```

---

## **SUCCESS CRITERIA - Phase 3C**

- [ ] **Database Schema**: Complete Prisma schema with migrations
- [ ] **API Server**: Express.js server running with all endpoints
- [ ] **Authentication**: JWT login system working
- [ ] **Real-time**: WebSocket connections functional
- [ ] **Multi-tenant**: Club isolation implemented
- [ ] **Integration**: Database connected to API server
- [ ] **Documentation**: API docs and schema documentation

**Time Allocation**:
- Database Schema: 15 minutes
- Backend API: 25 minutes  
- Testing & Integration: 5 minutes
- **Total**: 45 minutes

---

## **HANDOFF TO PHASE 3D**

Upon completion, you'll have:
1. **Full-stack foundation** ready for frontend integration
2. **Real-time capabilities** for live queue updates
3. **Authentication system** for user management
4. **Multi-tenant architecture** for SaaS scaling
5. **Production-ready API** with proper validation and logging

**Next Phase**: Frontend integration with backend APIs and real-time features.

---

**EXECUTION STATUS**: Ready for external tool execution
**ESTIMATED COMPLETION**: 45 minutes
**CRITICAL PATH**: Database schema → Backend API → Integration testing
