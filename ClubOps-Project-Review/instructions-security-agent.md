# 🔒 SECURITY AGENT INSTRUCTIONS
## ClubOps Security & Compliance Implementation

**TOOL**: Claude Code (VS Code Extension)
**PRIORITY**: CRITICAL - Execute Before Any Other Development
**ESTIMATED TIME**: 40-60 minutes

---

## 🎯 PRIMARY OBJECTIVES

### 1. Implement Security-First Architecture
Create comprehensive security framework addressing:
- PCI DSS compliance requirements
- SOC 2 Type II preparation
- Data protection standards (GDPR/CCPA)
- Multi-tenant security isolation

### 2. Critical Security Gaps to Address
Based on PRD analysis, implement missing security components:
- Authentication & authorization framework
- Data encryption standards
- Audit trail implementation
- Incident response procedures

---

## 📋 IMPLEMENTATION TASKS

### **Task 1: Authentication System**
```typescript
// Create: src/auth/auth-config.ts
// Implement Auth0 integration with RBAC
// Support roles: Owner, Manager, DJ, Security, Dancer
// MFA required for Admin roles
// Session management with JWT tokens
```

### **Task 2: Data Protection Framework**
```typescript
// Create: src/security/encryption.ts
// AES-256 encryption for PII data
// Field-level encryption for sensitive data
// Key rotation mechanism
// Secure key storage configuration
```

### **Task 3: Multi-Tenant Data Isolation**
```sql
-- Create: database/security/tenant-isolation.sql
-- Implement row-level security (RLS)
-- Tenant-specific data access policies
-- Prevent cross-tenant data leakage
-- Audit trail for all data access
```

### **Task 4: PCI DSS Compliance Framework**
```typescript
// Create: src/compliance/pci-framework.ts
// Payment data handling protocols
// Tokenization for card data
// Secure transmission requirements
// Compliance monitoring dashboard
```

### **Task 5: Audit & Monitoring System**
```typescript
// Create: src/monitoring/audit-trail.ts
// Comprehensive logging framework
// Real-time security monitoring
// Compliance report generation
// Incident response automation
```

---

## 🔧 SPECIFIC FILES TO CREATE

### **Authentication Module**
```
src/auth/
├── auth-config.ts          # Auth0 configuration
├── rbac-permissions.ts     # Role-based access control
├── session-manager.ts      # JWT session handling
├── mfa-setup.ts           # Multi-factor authentication
└── auth-middleware.ts     # Route protection
```

### **Security Infrastructure**
```
src/security/
├── encryption.ts          # Data encryption utilities
├── key-management.ts      # Secure key handling
├── data-sanitization.ts   # Input sanitization
├── rate-limiting.ts       # API rate limiting
└── security-headers.ts    # HTTP security headers
```

### **Compliance Framework**
```
src/compliance/
├── pci-framework.ts       # PCI DSS compliance
├── gdpr-framework.ts      # GDPR compliance
├── audit-logger.ts        # Compliance audit trail
├── data-retention.ts      # Data retention policies
└── compliance-reports.ts  # Automated reporting
```

### **Database Security**
```
database/security/
├── tenant-isolation.sql   # Multi-tenant security
├── encryption-setup.sql   # Database encryption
├── access-policies.sql    # Data access policies
├── audit-triggers.sql     # Database audit trail
└── backup-encryption.sql  # Secure backup procedures
```

---

## 📊 COMPLIANCE CHECKLIST

### **PCI DSS Requirements**
- [ ] Secure cardholder data storage
- [ ] Encrypted transmission protocols
- [ ] Access control implementation
- [ ] Network security monitoring
- [ ] Vulnerability management
- [ ] Information security policies

### **SOC 2 Type II Preparation**
- [ ] Security control implementation
- [ ] Availability monitoring
- [ ] Processing integrity
- [ ] Confidentiality measures
- [ ] Privacy protection

### **GDPR/CCPA Compliance**
- [ ] Data subject rights implementation
- [ ] Consent management
- [ ] Data breach notification
- [ ] Data protection impact assessment
- [ ] Privacy by design implementation

---

## 🚨 CRITICAL SECURITY CONFIGURATIONS

### **Environment Variables**
```bash
# Create: .env.security
AUTH0_DOMAIN=your-auth0-domain
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
ENCRYPTION_KEY=generate-secure-key
DATABASE_ENCRYPTION_KEY=generate-db-key
JWT_SECRET=generate-jwt-secret
AUDIT_LOG_ENCRYPTION_KEY=generate-audit-key
```

### **Database Security Setup**
```sql
-- Enable encryption at rest
ALTER DATABASE clubops_prod SET encryption = 'enabled';

-- Create secure audit schema
CREATE SCHEMA audit AUTHORIZATION audit_user;

-- Enable row-level security
ALTER TABLE dancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
```

### **API Security Middleware**
```typescript
// Implement in all API routes
app.use(helmet()); // Security headers
app.use(rateLimiter); // Rate limiting
app.use(authMiddleware); // Authentication
app.use(auditLogger); // Audit trail
app.use(dataValidation); // Input sanitization
```

---

## 🎯 SUCCESS CRITERIA

### **Implementation Verification**
- [ ] All authentication flows working with MFA
- [ ] Data encryption verified at rest and in transit
- [ ] Multi-tenant isolation tested and confirmed
- [ ] Audit trail capturing all security events
- [ ] PCI DSS compliance framework operational
- [ ] Security monitoring dashboard functional

### **Testing Requirements**
- [ ] Penetration testing simulation
- [ ] Authentication bypass attempts
- [ ] Data leakage prevention testing
- [ ] SQL injection protection verification
- [ ] Cross-tenant access prevention testing

---

## 📁 DELIVERABLES

1. **Complete security module** (`src/security/`)
2. **Authentication system** (`src/auth/`)
3. **Compliance framework** (`src/compliance/`)
4. **Database security setup** (`database/security/`)
5. **Security configuration files**
6. **Security testing documentation**
7. **Compliance checklist completion**

---

## ⚡ NEXT STEPS AFTER COMPLETION

1. **Report security implementation status**
2. **Provide security testing results**
3. **Document any compliance gaps**
4. **Recommend third-party security audit**
5. **Prepare for SOC 2 certification process**

**CRITICAL**: Do not proceed with other development until security framework is implemented and verified.