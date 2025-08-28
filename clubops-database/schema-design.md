# ClubOps Database Schema Design

## Overview
PostgreSQL database schema for multi-tenant ClubOps SaaS platform supporting:
- Club management with multi-location support
- Dancer licensing and compliance tracking
- DJ queue management with real-time updates
- VIP room booking and tracking
- Financial reporting and analytics
- User authentication and role-based access

## Core Entities

### Users & Authentication
- **users**: System users (managers, DJs, staff)
- **clubs**: Club/organization entities (multi-tenant)
- **user_club_roles**: User permissions per club

### Dancer Management
- **dancers**: Dancer profiles and information
- **dancer_licenses**: License tracking with expiration dates
- **dancer_sessions**: Check-in/out tracking
- **dancer_fees**: Bar fee collection and history

### DJ & Music Management
- **dj_queues**: Current queue state per stage
- **queue_entries**: Individual queue items with order
- **playlists**: Dancer-specific music preferences
- **songs**: Music library and metadata

### VIP & Revenue
- **vip_rooms**: Room definitions and availability
- **vip_bookings**: Room reservations and tracking
- **financial_transactions**: All revenue tracking
- **reports**: Generated financial and operational reports

## Schema Requirements
- Multi-tenant architecture with club_id foreign keys
- Audit trails for compliance (created_at, updated_at, created_by)
- Soft deletes for data retention
- Indexes for performance on frequently queried fields
- Constraints for data integrity and business rules

## Next Steps
1. Create Prisma schema definition
2. Generate migrations
3. Create seed data for development
4. Set up database connection configuration
