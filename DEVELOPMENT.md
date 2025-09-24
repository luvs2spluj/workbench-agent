# Development Workflow

## 🌳 Branch Strategy

We use **Git Flow** with the following branches:

- **`main`** - Production-ready code, deployed to production
- **`develop`** - Integration branch for features, deployed to staging
- **`feature/*`** - Feature development branches
- **`hotfix/*`** - Critical production fixes
- **`release/*`** - Release preparation branches

## 🚀 Development Workflow

### 1. Starting New Feature Development

```bash
# Switch to develop and pull latest
git checkout develop
git pull origin develop

# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Make your changes...
# Commit frequently with clear messages
git add .
git commit -m "feat: add new feature functionality"

# Push feature branch
git push -u origin feature/your-feature-name
```

### 2. Testing Your Changes

```bash
# Install dependencies
pnpm install

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Run tests (when available)
pnpm test

# Test individual apps
pnpm dev:web      # Test web app
pnpm dev:worker   # Test worker
pnpm dev:intertools # Test intertools

# Test full stack
pnpm dev          # All services together
```

### 3. Integration Testing

```bash
# Switch to develop branch
git checkout develop

# Merge your feature (or create PR)
git merge feature/your-feature-name

# Test integration
pnpm install
pnpm build
pnpm dev

# Push to develop
git push origin develop
```

### 4. Creating Pull Requests

1. Push your feature branch to GitHub
2. Create PR from `feature/your-feature-name` → `develop`
3. Fill out PR template with:
   - **Description** of changes
   - **Testing** steps performed
   - **Screenshots** if UI changes
   - **Breaking changes** if any

### 5. Release Process

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.1.0

# Update version numbers, changelog, etc.
# Test thoroughly

# Merge to main
git checkout main
git merge release/v1.1.0
git tag v1.1.0
git push origin main --tags

# Merge back to develop
git checkout develop
git merge main
git push origin develop
```

## 🧪 Testing Strategy

### Current Test Setup
- **Type Checking**: TypeScript compiler
- **Linting**: ESLint + Prettier
- **Build Tests**: Turbo build pipeline
- **Integration**: Manual testing with `pnpm dev`

### Planned Test Additions
- **Unit Tests**: Vitest for utility functions
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for web app flows
- **Worker Tests**: Mock Supabase interactions

## 🔧 Development Tools

### Essential Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm dev:web               # Web app only (:3000)
pnpm dev:worker            # Worker only
pnpm dev:intertools        # InterTools only (:3001)

# Quality
pnpm lint                  # Lint all packages
pnpm type-check           # TypeScript checking
pnpm format               # Format code
pnpm format:check         # Check formatting

# Building
pnpm build                # Build all packages
pnpm clean                # Clean build artifacts

# Testing
pnpm test                 # Run tests
pnpm test:watch          # Watch mode
```

### Environment Setup

```bash
# Copy environment template
cp env.example .env.local

# Required for full functionality:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY  
# - SUPABASE_SERVICE_ROLE_KEY

# Optional for enhanced features:
# - OPENAI_API_KEY
# - GITHUB_TOKEN
# - VERCEL_TOKEN
```

## 🐳 Docker Development

```bash
# Build containers
pnpm docker:build

# Start services
pnpm docker:up

# Stop services  
pnpm docker:down
```

## 📊 Monitoring Development

### Local Development URLs
- **Web App**: http://localhost:3000
- **InterTools**: http://localhost:3001
- **InterTools Health**: http://localhost:3001/health

### Development Database
- Set up local Supabase project
- Run `infra/supabase.sql` schema
- Configure environment variables

## 🔄 Integration Patterns

### With Other Workflows

1. **API Integration**:
   ```javascript
   // Send messages from external tools
   fetch('http://localhost:3001/api/messages', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       message: 'External tool event',
       context: { tool: 'your-tool', action: 'deploy' }
     })
   })
   ```

2. **Webhook Integration**:
   - InterTools can receive webhooks from CI/CD
   - Worker can trigger external APIs
   - Graph execution can include custom tools

3. **Data Export**:
   - Supabase provides REST API
   - Export runs, logs, costs via API
   - Integration with analytics tools

## 🎯 Development Best Practices

### Code Style
- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write descriptive commit messages

### Architecture
- Keep packages loosely coupled
- Use proper TypeScript interfaces
- Handle errors gracefully
- Log important events

### Testing
- Test critical paths manually
- Add unit tests for utilities
- Verify environment variable handling
- Test with minimal/missing API keys

### Performance
- Monitor token usage costs
- Optimize database queries
- Use proper caching strategies
- Profile worker execution times

## 🚨 Troubleshooting

### Common Issues

1. **Environment Variables**:
   ```bash
   # Check if .env.local exists
   ls -la .env*
   
   # Verify variables are loaded
   node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
   ```

2. **Database Connection**:
   ```bash
   # Test Supabase connection
   curl -H "apikey: YOUR_ANON_KEY" \
        "YOUR_SUPABASE_URL/rest/v1/projects?select=*"
   ```

3. **Port Conflicts**:
   ```bash
   # Check what's using ports
   lsof -i :3000
   lsof -i :3001
   
   # Kill processes if needed
   kill -9 PID
   ```

4. **Dependencies**:
   ```bash
   # Clean install
   rm -rf node_modules
   pnpm install --frozen-lockfile
   ```

### Getting Help
- Check GitHub Issues
- Review logs in terminal
- Test with minimal configuration
- Ask in GitHub Discussions
