# SiteSpector Documentation Framework - Installation Checklist

**Generated**: 2025-02-01  
**Time to complete**: ~15 minutes

---

## ✅ Step-by-Step Installation

### 1. Backup Current Project (Optional but Recommended)

```bash
cd /Users/dawid/Desktop/projekty\ nowe/sitespector
git status  # Check for uncommitted changes
git commit -am "chore: backup before documentation framework install"
```

---

### 2. Copy Documentation Files

```bash
# Navigate to downloaded documentation package
cd /path/to/sitespector-docs

# Go to your SiteSpector project
cd /Users/dawid/Desktop/projekty\ nowe/sitespector

# Copy main project rules
cp /path/to/sitespector-docs/.cursorrules .

# Copy user preferences
mkdir -p .cursor/rules
cp /path/to/sitespector-docs/.cursor/rules/user-preferences.md .cursor/rules/

# Copy Context7 documentation
cp -r /path/to/sitespector-docs/.context7 .

# Copy startup docs
mkdir -p docs
cp -r /path/to/sitespector-docs/docs/* docs/
```

**Verify**:
```bash
ls -la .cursorrules
ls -la .cursor/rules/user-preferences.md
ls -la .context7/
ls -la docs/
```

You should see:
- `.cursorrules` (main file)
- `.cursor/rules/user-preferences.md`
- `.context7/project/`, `.context7/frontend/` directories
- `docs/00-STARTUP-PROMPT.md`, `docs/CONTEXT7_SETUP.md`, `docs/README.md`

---

### 3. Install Context7 MCP Server

```bash
# Install globally
npm install -g @context7/mcp-server

# Verify installation
context7 --version
# Should output: @context7/mcp-server v1.x.x or similar
```

**If npm not found**:
```bash
# Install Node.js first (if not installed)
brew install node  # macOS with Homebrew

# Then install Context7
npm install -g @context7/mcp-server
```

---

### 4. Configure Cursor for Context7

**Option A: Global Configuration** (Recommended)

```bash
# Create or edit ~/.cursor/mcp.json
nano ~/.cursor/mcp.json

# Paste this content:
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

# Save (Ctrl+O, Enter, Ctrl+X)
```

**Option B: Project-Specific Configuration**

```bash
# In your SiteSpector project root
mkdir -p .cursor
nano .cursor/mcp.json

# Paste this content:
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

# Save
```

---

### 5. Restart Cursor

```bash
# Close Cursor completely
# Reopen Cursor
# Open SiteSpector project
```

---

### 6. Verify Context7 is Working

In Cursor, open a new chat and type:

```
query-docs project overview
```

**Expected behavior**:
- Claude uses the `query-docs` tool
- Responds with project overview information

**If it doesn't work**:
1. Check Cursor Settings → MCP Servers
2. Look for "context7" in the list
3. Click "View Logs" to see errors
4. Common issue: JSON syntax error in mcp.json (use JSONLint to validate)

---

### 7. Commit Documentation to Git

```bash
cd /Users/dawid/Desktop/projekty\ nowe/sitespector

# Check what's new
git status

# Add documentation files
git add .cursorrules .cursor/ .context7/ docs/

# Commit
git commit -m "docs: add complete documentation framework with Context7

- Main project rules (.cursorrules)
- User preferences (.cursor/rules/user-preferences.md)
- Context7 MCP documentation (.context7/)
- Startup prompt and guides (docs/)
- Installation checklist"

# Push (confirm with user as per workflow)
# You'll be asked: "Ready to push to origin/release?"
git push origin release
```

---

### 8. Test with AI Agent

1. **Open Cursor** in SiteSpector project

2. **Start new chat** with Claude Sonnet 4.5

3. **Copy-paste** the entire contents of `docs/00-STARTUP-PROMPT.md` into chat

4. **Claude should respond** confirming it has full project context

5. **Test Context7**:
   ```
   query-docs missing frontend features
   ```
   
   Claude should reference the MISSING_FEATURES.md file and list the 3 critical rendering functions.

6. **Test workflow understanding**:
   ```
   I want to implement the renderSeoResults function. What do I need to know?
   ```
   
   Claude should:
   - Query Context7 for implementation details
   - Reference the data structure (audit.results.crawl)
   - Provide implementation guidance
   - Remind about VPS deployment workflow

---

### 9. Update .gitignore (If Needed)

```bash
# Check if .context7 is ignored
cat .gitignore | grep context7

# If it says .context7/ → REMOVE THIS LINE
# Context7 docs should be committed to Git

# Edit .gitignore
nano .gitignore

# Remove or comment out:
# .context7/

# Save
```

**Important**: `.context7/` should be version controlled (it's documentation, not secrets).

---

### 10. Optional: Archive Old Documentation

If you had old docs in `.cursor/rules/global.mdc` or `docs/` folder:

```bash
# Create archive directory
mkdir -p docs/archive

# Move old files
mv .cursor/rules/global.mdc docs/archive/global.mdc.old  # If exists

# Commit
git add docs/archive/
git commit -m "docs: archive outdated documentation"
```

---

## ✅ Installation Complete!

You should now have:

- [x] `.cursorrules` in project root
- [x] `.cursor/rules/user-preferences.md`
- [x] `.context7/` directory structure
- [x] `docs/00-STARTUP-PROMPT.md` and other guides
- [x] Context7 MCP server installed
- [x] Cursor configured for Context7
- [x] Everything committed to Git
- [x] AI agent tested and working

---

## 🚀 Next Steps

### Immediate (Today):

1. **Familiarize yourself** with the documentation:
   - Read `docs/README.md` for overview
   - Skim `.cursorrules` to understand project rules
   - Review `.context7/frontend/MISSING_FEATURES.md` for priorities

2. **Test the workflow**:
   - Initialize AI agent with `docs/00-STARTUP-PROMPT.md`
   - Query Context7: `query-docs project overview`
   - Ask agent about frontend rendering functions

### This Week:

3. **Implement Priority 1** (Frontend Detail Rendering):
   - Follow `.context7/frontend/MISSING_FEATURES.md`
   - Implement `renderSeoResults()`, `renderPerformanceResults()`, `renderContentResults()`
   - Test with audit ID: 85d6ee6f-8c55-4c98-abd8-60dedfafa9df
   - Deploy to VPS
   - Update Context7: `update-docs "frontend/MISSING_FEATURES.md" "Completed: renderSeoResults"`

4. **Build the habit**:
   - Query Context7 **before** implementing features
   - Update Context7 **after** completing work
   - Commit doc updates regularly

---

## 🛠️ Troubleshooting

### Context7 Not Working

**Symptoms**: `query-docs` doesn't work, Claude doesn't use the tool

**Solutions**:
1. Check `~/.cursor/mcp.json` or `.cursor/mcp.json` exists
2. Validate JSON syntax (use JSONLint.com)
3. Restart Cursor completely
4. Check Cursor Settings → MCP Servers → context7 → View Logs

### "context7: command not found"

**Solution**:
```bash
# Check if installed
which context7

# If not found, reinstall
npm install -g @context7/mcp-server

# Verify
context7 --version
```

### Cursor Can't Read .context7/ Files

**Solution**:
```bash
# Fix permissions
chmod -R 755 .context7/

# Verify ownership
ls -la .context7/
# Should show your user, not root
```

---

## 📞 Need Help?

- **Context7 Setup**: Read `docs/CONTEXT7_SETUP.md`
- **Project Overview**: Read `.context7/project/OVERVIEW.md`
- **Workflow**: Read `.cursorrules` or `docs/00-STARTUP-PROMPT.md`
- **Priorities**: Read `.context7/frontend/MISSING_FEATURES.md`

---

## 🎉 You're All Set!

The documentation framework is now installed and configured. You have:

✅ **Single source of truth** (Context7)  
✅ **AI agent initialization** (startup prompt)  
✅ **Clear priorities** (missing features)  
✅ **VPS workflow** (documented in rules)  
✅ **Git workflow** (auto-commit yes, auto-push ask)

**Start coding** with confidence! 🚀

---

**Installation Time**: ~15 minutes  
**Last Updated**: 2025-02-01  
**Framework Version**: 1.0 (SiteSpector Custom)
