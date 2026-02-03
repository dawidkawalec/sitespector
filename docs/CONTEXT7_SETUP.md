# Context7 MCP - Setup Instructions for SiteSpector

## Overview

Context7 is an MCP (Model Context Protocol) server that provides persistent documentation management for AI agents. It allows Claude/GPT to query and update project documentation, creating a **single source of truth** for all project knowledge.

**Why Context7?**
- Persistent memory across sessions
- Query documentation before implementing
- Update documentation after changes
- Maintain consistency across team (or future you)
- Prevent re-explaining the same concepts

---

## Prerequisites

- ✅ Cursor IDE installed (version 0.43.6 or later)
- ✅ MCP support enabled in Cursor settings
- ✅ Node.js 18+ (for running Context7 server)

---

## Installation Steps

### 1. Install Context7 MCP Server

```bash
# Install globally via npm
npm install -g @context7/mcp-server

# Verify installation
context7 --version
# Should output: @context7/mcp-server v1.x.x
```

### 2. Configure Cursor to Use Context7

**Option A: Global Configuration** (Recommended for multi-project use)

Create or edit: `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "context7": {
      "command": "context7",
      "args": ["server"],
      "env": {
        "CONTEXT7_ROOT": "${HOME}/.context7"
      }
    }
  }
}
```

**Option B: Project-Specific Configuration** (Only for SiteSpector)

Create: `.cursor/mcp.json` in project root (`/Users/dawid/Desktop/projekty nowe/sitespector/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "context7": {
      "command": "context7",
      "args": ["server"],
      "env": {
        "CONTEXT7_ROOT": "${workspaceFolder}/.context7"
      }
    }
  }
}
```

### 3. Create `.context7` Directory Structure

In your SiteSpector project root:

```bash
cd /Users/dawid/Desktop/projekty\ nowe/sitespector

# Create directory structure
mkdir -p .context7/{project,backend,frontend,infrastructure,decisions}

# Verify structure
tree .context7
# Should show:
# .context7/
# ├── project/
# ├── backend/
# ├── frontend/
# ├── infrastructure/
# └── decisions/
```

### 4. Add `.context7` to Git

```bash
# .gitignore (ensure .context7 is NOT ignored - we want to commit it)
# Remove any line that says:
# .context7/

# Instead, add to track it:
git add .context7/
git commit -m "docs: add Context7 directory structure"
```

**Important**: `.context7/` should be committed to Git. It's project documentation, not secrets.

### 5. Restart Cursor

```bash
# Close Cursor completely
# Reopen Cursor
# The MCP server should start automatically
```

### 6. Verify Context7 is Working

In Cursor, open a new chat and try:

```
Agent: "Query the docs for project overview"
```

If Context7 is working, Claude will use the `query-docs` tool.

Alternatively, check Cursor's MCP server logs:
```
Cursor → Settings → MCP Servers → context7 → View Logs
```

You should see:
```
[context7] Server started
[context7] Root: /Users/dawid/.context7 (or project path)
```

---

## Context7 Directory Structure for SiteSpector

```
.context7/
├── project/
│   ├── OVERVIEW.md           # Project summary, status, goals
│   ├── ARCHITECTURE.md       # System architecture, containers, data flow
│   ├── STACK.md              # Tech stack details, versions, rationale
│   └── DEPLOYMENT.md         # VPS workflow, Docker commands, SSH access
│
├── backend/
│   ├── API.md                # All API endpoints, schemas, examples
│   ├── MODELS.md             # SQLAlchemy models, database schema
│   ├── WORKER.md             # Worker process, audit flow, async logic
│   └── AI_SERVICES.md        # Gemini integration, AI functions
│
├── frontend/
│   ├── COMPONENTS.md         # React components, shadcn/ui usage
│   ├── API_CLIENT.md         # Frontend API client, types, error handling
│   ├── PAGES.md              # Next.js pages, routing, layouts
│   └── MISSING_FEATURES.md   # TODO list, known gaps, priorities
│
├── infrastructure/
│   ├── DOCKER.md             # Docker Compose services, networking
│   ├── NGINX.md              # Nginx reverse proxy, SSL config
│   └── DATABASE.md           # PostgreSQL schema, migrations, indexes
│
└── decisions/
    ├── DECISIONS_LOG.md      # Architectural decisions, rationale
    └── BUGS_AND_FIXES.md     # Known issues, solutions, workarounds
```

---

## Usage Examples

### Querying Documentation

```typescript
// In Cursor chat with Claude:

User: "How do I create a new API endpoint?"

Claude (internally uses):
query-docs "API endpoint creation pattern"
query-docs "backend API.md"

// Claude reads backend/API.md, finds examples, responds with pattern
```

### Updating Documentation

```typescript
// After implementing a feature:

User: "I just added a retry endpoint for audits"

Claude (internally uses):
update-docs "backend/API.md" "Added POST /api/audits/{id}/retry endpoint"
update-docs "decisions/DECISIONS_LOG.md" "Decision: Allow users to retry failed audits"
```

### Common Query Patterns

```bash
# Before implementing:
query-docs "worker process flow"
query-docs "database schema for audits table"
query-docs "frontend API client usage"
query-docs "deployment workflow"

# After implementing:
update-docs "backend/WORKER.md" "Updated timeout handling to 30min"
update-docs "frontend/MISSING_FEATURES.md" "Completed: SEO details rendering"
```

---

## Best Practices

### 1. Query Before Implementing
**Always** check existing docs before writing code:
- Prevents duplicating logic
- Ensures consistency with existing patterns
- Saves time by reusing solutions

### 2. Update After Changes
**Always** update docs after making changes:
- Keep docs in sync with code
- Help future you (or future agents) understand decisions
- Create institutional knowledge

### 3. Keep Docs Concise
- **Short entries** - 1-3 paragraphs per concept
- **Code examples** - Show, don't just tell
- **Links** - Reference other docs instead of duplicating

### 4. Organize by Topic
- **project/** - High-level overview
- **backend/** - Backend implementation details
- **frontend/** - Frontend implementation details
- **infrastructure/** - DevOps, deployment, config
- **decisions/** - Why we did things, known issues

### 5. Use Consistent Formatting
```markdown
# Document Title

## Section Name

### Subsection

**Bold** for important terms
`code` for technical terms
```code blocks``` for examples

**Example**:
- Shows the pattern
- Explains why
```

---

## Troubleshooting

### Context7 Not Found

**Problem**: Cursor says "context7 command not found"

**Solution**:
```bash
# Check if installed
which context7

# If not found, reinstall
npm install -g @context7/mcp-server

# Verify
context7 --version
```

### MCP Server Not Starting

**Problem**: Cursor doesn't show Context7 in MCP servers list

**Solution**:
1. Check `~/.cursor/mcp.json` or `.cursor/mcp.json` exists
2. Verify JSON syntax is correct (use JSONLint)
3. Restart Cursor completely
4. Check Cursor logs: Settings → MCP Servers → View Logs

### Permission Errors

**Problem**: "Permission denied" when accessing .context7/

**Solution**:
```bash
# Fix permissions
chmod -R 755 .context7/

# Verify ownership
ls -la .context7/
# Should show your user, not root
```

### Docs Not Updating

**Problem**: Changes to .context7/*.md files not reflected in queries

**Solution**:
1. Restart Cursor (MCP server caches docs)
2. Check file was actually saved (Cmd+S)
3. Verify file is in correct location (.context7/backend/API.md not .context7/API.md)

---

## Migration from Existing Docs

If you have existing documentation (README.md, docs/ folder):

```bash
# 1. Create .context7 structure
mkdir -p .context7/{project,backend,frontend,infrastructure,decisions}

# 2. Migrate content
# Move high-level info → .context7/project/OVERVIEW.md
# Move API docs → .context7/backend/API.md
# Move deployment docs → .context7/infrastructure/DEPLOYMENT.md

# 3. Keep or archive old docs
# Option A: Keep README.md as user-facing intro (links to .context7/)
# Option B: Archive to docs/archive/
```

**For SiteSpector**: Existing docs in `.cursor/rules/global.mdc` are outdated. We're starting fresh with Context7.

---

## Maintenance

### Regular Tasks

**Weekly**:
- Review MISSING_FEATURES.md, remove completed items
- Update BUGS_AND_FIXES.md with new discovered issues
- Audit DECISIONS_LOG.md, add any new decisions

**After Major Changes**:
- Update ARCHITECTURE.md if system design changed
- Update STACK.md if dependencies changed
- Update API.md if endpoints added/changed

**Git Commits**:
```bash
git add .context7/
git commit -m "docs: update Context7 with new audit retry feature"
git push origin release
```

---

## Next Steps

After completing this setup:

1. ✅ Install Context7 MCP server
2. ✅ Configure Cursor (mcp.json)
3. ✅ Create .context7/ directory structure
4. ✅ Copy documentation files (provided separately)
5. ✅ Commit .context7/ to Git
6. ✅ Restart Cursor
7. ✅ Test with: "query-docs project overview"

**Then**: You're ready to use Context7! All agents will have access to project knowledge.

---

**Documentation Status**: Setup guide created 2025-02-01
**Next**: Populate .context7/ with actual project documentation
