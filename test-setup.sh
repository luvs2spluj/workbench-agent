#!/bin/bash

# Agent WorkBench - Quick Setup Test Script
echo "🚀 Agent WorkBench - Testing Setup"
echo "=================================="

# Check Node.js version
echo "📋 Checking Node.js version..."
node --version

# Check pnpm version
echo "📦 Checking pnpm version..."
pnpm --version

# Install dependencies
echo "⬇️  Installing dependencies..."
pnpm install

# Type check all packages
echo "🔍 Running type check..."
pnpm type-check

# Build all packages
echo "🔨 Building all packages..."
pnpm build

# Test individual package builds
echo "🧪 Testing individual builds..."
echo "  - Building web app..."
pnpm --filter @app/web build

echo "  - Building worker..."
pnpm --filter @app/worker build

echo "  - Building intertools..."
pnpm --filter @pkg/intertools build

echo ""
echo "✅ Setup test completed!"
echo ""
echo "🎯 Next steps:"
echo "1. Copy env.example to .env.local and configure"
echo "2. Set up your Supabase project with infra/supabase.sql"
echo "3. Run 'pnpm dev' to start all services"
echo ""
echo "📚 Development workflow:"
echo "- Read DEVELOPMENT.md for detailed workflow"
echo "- Use feature branches for development"
echo "- Create PRs to develop branch"
echo "- Merge to main for releases"
