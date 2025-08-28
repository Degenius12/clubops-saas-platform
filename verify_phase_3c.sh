#!/bin/bash
# ClubOps Phase 3C - Post-Development Verification Script

echo "🔍 ClubOps Phase 3C Verification Starting..."

# Check database setup
echo "📊 Verifying Database Schema..."
cd clubops-database

if [ -f "prisma/schema.prisma" ]; then
    echo "✅ Prisma schema file exists"
    npx prisma generate > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Prisma client generated successfully"
    else
        echo "❌ Prisma client generation failed"
    fi
else
    echo "❌ Prisma schema file missing"
fi

# Check backend setup
echo "🔧 Verifying Backend API..."
cd ../clubops-backend

if [ -f "src/server.ts" ]; then
    echo "✅ Backend server file exists"
    npm run build > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Backend builds successfully"
    else
        echo "❌ Backend build failed"
    fi
else
    echo "❌ Backend server file missing"
fi

# Test API endpoints (if server is running)
echo "🌐 Testing API Connectivity..."
curl -s http://localhost:3001/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ API server responding"
else
    echo "⚠️ API server not responding (may need manual start)"
fi

echo "🎯 Phase 3C Verification Complete!"
echo "📋 Check PHASE_3C_PROGRESS_TRACKER.md for detailed status"
