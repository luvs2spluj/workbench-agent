# Agent WorkBench

An MVP agentic full-stack development tool built with a modern monorepo architecture.

## 🚀 Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd agent-workbench
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your API keys and Supabase credentials
   ```

3. **Set up your Supabase database:**
   - Create a new Supabase project
   - Run the SQL from `infra/supabase.sql` in your Supabase SQL editor
   - Copy your project URL and keys to `.env.local`

4. **Start the development environment:**
   ```bash
   pnpm dev
   ```

This will start:
- **Web app** on http://localhost:3000 (Next.js)
- **InterTools server** on http://localhost:3001 (Express)
- **Worker** (polling for queued runs)

## 📁 Project Structure

```
agent-workbench/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── worker/              # Node.js job runner
├── packages/
│   └── intertools/          # Express server for click-to-chat
├── infra/
│   └── supabase.sql         # Database schema
├── env.example              # Environment variables template
└── vercel.env.example       # Vercel deployment template
```

## 🔧 Architecture

### Apps

**apps/web** - Next.js frontend with:
- Project management dashboard
- Real-time run visualization with Mermaid graphs
- Cost tracking and logs display
- Supabase integration for data

**apps/worker** - Node.js background worker that:
- Polls for queued runs from Supabase
- Executes a simple 3-node graph:
  - Repository analysis (GitHub API integration)
  - Vercel deployments check
  - LLM-powered HTML improvements
- Records costs, logs, and graph state

**packages/intertools** - Express server providing:
- POST `/api/messages` - Universal click-to-chat intake
- Automatic run association and logging
- CORS-enabled for browser integration

### Database Schema

- **projects** - User projects with optional repo URLs
- **runs** - Execution instances with status tracking
- **logs** - Structured logging with source attribution
- **graph_nodes/edges** - Visual graph representation
- **costs** - Token usage and cost tracking
- **artifacts** - Generated files and outputs

## 🎯 Usage

1. **Create a Project:**
   - Visit http://localhost:3000
   - Fill in project name and optional GitHub repo URL
   - Click "Create Project"

2. **Start a Run:**
   - Click "Start Run" on any project
   - Watch the real-time graph execution at `/runs/[id]`
   - Monitor logs, costs, and progress

3. **InterTools Integration:**
   ```javascript
   // From any webpage, send messages to active runs
   fetch('http://localhost:3001/api/messages', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       message: 'User clicked on pricing section',
       pageUrl: window.location.href,
       pageTitle: document.title,
       elementInfo: { id: 'pricing', text: 'Premium Plan' }
     })
   })
   ```

## 🔑 Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

Optional:
- `OPENAI_API_KEY` - For LLM HTML improvements
- `GITHUB_TOKEN` - For repository analysis
- `VERCEL_TOKEN` - For deployment checking
- `ANTHROPIC_API_KEY` - Alternative LLM provider

## 🚀 Deployment

### Vercel (Web App)
1. Connect your GitHub repo to Vercel
2. Set environment variables from `vercel.env.example`
3. Deploy automatically on push

### Railway/Render (Worker + InterTools)
1. Deploy worker as a background service
2. Deploy InterTools as a web service on port 3001
3. Set environment variables

## 🛠 Development

```bash
# Install dependencies
pnpm install

# Start all services in development
pnpm dev

# Start individual services
pnpm dev:web        # Next.js on :3000
pnpm dev:worker     # Worker polling
pnpm dev:intertools # Express on :3001

# Build for production
pnpm build

# Clean build artifacts
pnpm clean
```

## 🎨 Features

- ✅ **Real-time visualization** - Mermaid graphs update live
- ✅ **Cost tracking** - Token usage and $ costs per run
- ✅ **Universal logging** - InterTools messages appear in run logs
- ✅ **Graceful failures** - Individual node failures don't crash runs
- ✅ **Modern stack** - TypeScript, Tailwind, Supabase, Turborepo
- 🚧 **Agent Zero integration** - Stub ready for agentic framework
- 🚧 **Cytoscape graphs** - Alternative to Mermaid (installed but not active)

## 🤝 Contributing

This is an MVP built for rapid iteration. Key extension points:

1. **Add new graph nodes** in `apps/worker/src/tools/`
2. **Extend InterTools** for richer browser integration
3. **Replace Agent Zero stub** with actual framework
4. **Add authentication** and multi-tenancy
5. **Implement artifacts** storage and rendering

## 📝 License

MIT - Build cool things! 🎉
