# Development Procedure for AI Agents

## Core Principle: Minimize User Interaction

**Golden Rule**: The user should only be involved when absolutely necessary. Exhaust all autonomous troubleshooting capabilities before requesting user input.

## Standard Development Workflow

### 1. Problem Investigation

**DO**:
- Use `grep_search`, `semantic_search`, and `file_search` in parallel to gather comprehensive context
- Read multiple related files simultaneously to understand the full scope
- Check logs, error output, and service status independently
- Trace code execution paths through multiple files
- Review git history and recent commits for context

**DON'T**:
- Ask "what file should I check?" - search for it
- Ask "where is this defined?" - use semantic search
- Ask "what's the error?" - check logs yourself
- Stop at first search result - verify across codebase

**Example**:
```bash
# GOOD: Parallel investigation
grep_search("EADDRINUSE", isRegexp=false)  # Find port binding issues
semantic_search("port configuration")       # Understand port setup
read_file("/var/log/installer.log")        # Check installation logs
```

### 2. Issue Analysis

**DO**:
- Identify root cause through code analysis, not guessing
- Trace the full execution flow from start to finish
- Check for race conditions, timing issues, and state management
- Verify assumptions with actual code inspection
- Cross-reference multiple sources (logs, code, config)

**DON'T**:
- Present multiple possibilities and ask user to choose
- Say "it might be X or Y" - determine which one it is
- Ask for clarification when you can test/verify yourself
- Stop investigation when one issue is found - look for related problems

**Example Investigation Pattern**:
1. Error found: `EADDRINUSE port 3001`
2. Check what's binding the port: `ss -tulpn | grep 3001`
3. Review service startup order in code
4. Identify race condition between wizard and PM2
5. Propose fix with clear rationale

### 3. Solution Implementation

**DO**:
- Implement fixes immediately, don't just suggest them
- Make targeted changes with clear purpose
- Test the fix after implementation
- Commit with descriptive messages explaining WHY
- Update related documentation if needed

**DON'T**:
- Say "you could try..." - implement it
- Ask "should I change X?" - if it fixes the issue, change it
- Provide code snippets without applying them
- Make changes without testing
- Leave work in a broken state

**Example**:
```javascript
// GOOD: Implement and explain
// Changed: Added PM2 restart after wizard shutdown
// Why: PM2 starts during install before wizard stops, causing EADDRINUSE
// Fix: Restart PM2 after wizard releases port 3001
exec('systemctl disable ac-setup-wizard && systemctl stop ac-setup-wizard && pm2 restart all', ...)
```

### 4. Testing & Validation

**DO**:
- Test changes immediately after implementation
- Verify both success and failure cases
- Check logs for new errors or warnings
- Validate the complete user flow, not just the fix
- Destroy and recreate test environments for clean testing

**DON'T**:
- Say "this should work" - verify it works
- Test only the happy path
- Skip testing edge cases
- Leave failing tests unresolved
- Assume partial success is good enough

**Testing Checklist**:
- [ ] Code executes without errors
- [ ] Services start and bind correctly
- [ ] Logs show expected behavior
- [ ] No race conditions or timing issues
- [ ] End-to-end user flow completes
- [ ] Cleanup/shutdown works properly

### 5. Iteration & Refinement

**DO**:
- Continue troubleshooting until issue is fully resolved
- Track progress with `manage_todo_list` for complex tasks
- Fix newly discovered issues immediately
- Refine solution based on test results
- Document non-obvious behavior or gotchas

**DON'T**:
- Stop at "partially working"
- Hand back to user with unresolved issues
- Leave TODO comments in code
- Accept workarounds when proper fixes are possible
- Forget about related or dependent issues

## Project-Specific Patterns

### Proxmox Container Development

**Environment Setup**:
```bash
# Test containers: 998 (git-cache), 999 (ac-server)
# Host: 192.168.1.199
# Git-cache: 192.168.1.70
# AC Server: 192.168.1.71

# Always sync git-cache after pushing
git push && ssh root@192.168.1.70 'cd /opt/git-cache/ac-server-manager && git pull'

# Fresh test requires container recreation
pct stop 999 && pct destroy 999 -purge
curl -fsSL http://192.168.1.70/ac-server-manager/install-proxmox-unified.sh | TERM=xterm nohup bash
```

**Common Investigation Commands**:
```bash
# Service status
pct exec 999 -- systemctl status ac-setup-wizard
pct exec 999 -- systemctl status pm2-root
pct exec 999 -- pm2 list
pct exec 999 -- pm2 logs --lines 50

# Port binding
pct exec 999 -- ss -tulpn | grep 3001

# Log inspection
pct exec 999 -- tail -f /var/log/installer.log
pct exec 999 -- tail -f /var/log/ac-setup.log
pct exec 999 -- cat /root/.pm2/logs/error.log

# Process inspection
pct exec 999 -- ps aux | grep node
pct exec 999 -- ps aux | grep pm2
```

### Installation Flow Architecture

**Critical Sequence**:
1. Proxmox unified installer creates LXC container
2. Container configured with Node.js, SSH, network
3. Setup wizard service installed and started (port 3001)
4. User accesses wizard → completes form → triggers installation
5. `install-server.sh` runs, installs AC Server Manager
6. PM2 systemd service started during installation
7. Health check polling detects `SETUP_WIZARD_COMPLETE` marker
8. Wizard auto-disables itself AND restarts PM2
9. Main app binds to port 3001 (now available)
10. User automatically sees main app (wizard auto-reloaded page)

**Race Conditions to Avoid**:
- PM2 starting before wizard stops (EADDRINUSE)
- Wizard checking for completion before installer finishes
- Health check polling starting too early
- PM2 running as wizard child process (dies when wizard exits)

**Key Implementation Details**:
```bash
# PM2 must be systemd-managed, not wizard child
pm2 kill                          # Kill user-space daemon
systemctl start pm2-root          # Start systemd service

# Wizard must wait before checking completion
setTimeout(checkInstallationStatus, 30000)  # 30s delay

# Wizard must restart PM2 after stopping
systemctl disable ac-setup-wizard && systemctl stop ac-setup-wizard && pm2 restart all
```

### Shell Escaping & Execution

**Rules**:
1. Avoid nested shell quoting (`bash -c 'bash -c "..."'`)
2. Use simple environment variable passing: `VAR=value bash script.sh`
3. Add `TERM=xterm` for signal handling
4. Use `nohup` for background processes that outlive parent
5. Redirect to logs for debugging: `>> /var/log/file.log 2>&1`

**Good Pattern**:
```bash
# Simple, direct execution
VARS="VAR1=value1 VAR2=value2"
curl script.sh | ${VARS} bash >> /var/log/output.log 2>&1 &
```

**Bad Pattern**:
```bash
# Complex nested quoting - prone to escaping errors
nohup bash -c 'curl script.sh | bash -c "VAR=\"value\" bash" > /dev/null 2>&1' &
```

### PM2 Process Management

**Systemd Integration**:
```bash
# Initial setup (done by installer)
pm2 startup systemd              # Generate startup script
systemctl enable pm2-root        # Enable service
systemctl start pm2-root         # Start service

# Development pattern
pm2 save                         # Save process list
pm2 kill                         # Kill user daemon
sleep 2                          # Wait for cleanup
systemctl start pm2-root         # Start systemd service
```

**Common Issues**:
- PM2 running as user daemon instead of systemd service
- Process list not saved before daemon kill
- Port binding failures when previous instance still running
- Logs in `/root/.pm2/logs/` not being checked

## Troubleshooting Decision Tree

```
Error Encountered
    ↓
Can I read logs? → YES → Read all relevant logs in parallel
    ↓                     ↓
   NO                  Error identified?
    ↓                     ↓
Can I check service → YES → Fix based on error
status?                   ↓
    ↓                  Test fix
   YES                    ↓
    ↓                  Working? → YES → Commit + Document
Check all services        ↓
    ↓                    NO
Services running?         ↓
    ↓                  Investigate deeper
   NO → Start services    ↓
    ↓    Test again    Find root cause
   YES                    ↓
    ↓                  Implement proper fix
Port conflicts?           ↓
    ↓                  Repeat until resolved
Check ss -tulpn
    ↓
Identify binding process
    ↓
Fix race condition/service order
    ↓
Test fresh install
```

## Common Pitfalls & Solutions

### 1. "I can't find the file"
**Wrong**: Ask user where file is located  
**Right**: `file_search("filename")` or `grep_search("unique content", isRegexp=false)`

### 2. "The service won't start"
**Wrong**: Ask user to manually start it  
**Right**: 
```bash
systemctl status service-name    # Get error details
journalctl -u service-name -n 50 # Check journal logs
cat /var/log/service.log         # Check application logs
# Identify and fix root cause
```

### 3. "Port already in use"
**Wrong**: Ask user to kill the process  
**Right**:
```bash
ss -tulpn | grep PORT            # Find what's using it
ps aux | grep PID                # Identify process
# Fix service startup order or race condition
```

### 4. "Installation seems stuck"
**Wrong**: Wait and ask user if they see progress  
**Right**:
```bash
tail -f /var/log/installer.log   # Check current progress
ps aux | grep install            # Verify process running
# If hung, identify blocking operation and fix
```

### 5. "Multiple possible causes"
**Wrong**: Present options to user  
**Right**: Test each hypothesis systematically until root cause found

## Code Quality Standards

### Commit Messages
```bash
# GOOD: Explains what and why
"Fix PM2 startup race condition by killing daemon before systemd start"
"Restart PM2 after wizard shutdown to prevent EADDRINUSE"

# BAD: Too vague
"Fix bug"
"Update setup"
```

### Code Comments
```javascript
// GOOD: Explains non-obvious behavior
// PM2 must be killed before systemd start to prevent running as child process
pm2 kill
systemctl start pm2-root

// BAD: States the obvious
// Kill PM2
pm2 kill
```

### Error Handling
```javascript
// GOOD: Comprehensive with context
exec('command', (error, stdout, stderr) => {
  if (error) {
    console.error('[Context] Operation failed:', error);
    console.error('[Context] stderr:', stderr);
    // Take corrective action or graceful degradation
  }
});

// BAD: Silent failure
exec('command', () => {});
```

## Time Management

### Parallel Operations
**DO**: Batch independent operations
```javascript
// Read multiple files at once
read_file("file1.js")
read_file("file2.js") 
read_file("file3.js")

// Search in parallel
grep_search("pattern1")
semantic_search("concept")
file_search("*.config.js")
```

**DON'T**: Sequential when parallel is possible
```javascript
// WRONG: Wait for each operation
read_file("file1.js")  // Wait
read_file("file2.js")  // Wait
read_file("file3.js")  // Wait
```

### Investigation Depth
- Spend time on thorough investigation upfront
- Prevents wasted time on incorrect solutions
- Reduces back-and-forth with testing
- Builds complete mental model before coding

### When to Ask User

**Only ask when**:
1. Design decision with business implications
2. User preference needed (e.g., "Keep old config or overwrite?")
3. Access credentials required
4. External dependency user must provide
5. All autonomous options exhausted

**Don't ask about**:
- Technical implementation details
- Where to find files/code
- How to debug issues
- What error means
- Next steps in troubleshooting

## Success Criteria

✅ **Task Complete When**:
- Feature works end-to-end
- All tests pass
- Logs show clean execution
- No race conditions or timing issues
- Code committed with clear message
- Related documentation updated
- No known bugs or workarounds

❌ **Task NOT Complete When**:
- "Works on my machine"
- Manual intervention required
- Errors present but ignored
- Edge cases untested
- Workarounds instead of fixes
- User must take additional steps

## Example: Complete Problem Resolution

**Scenario**: Wizard loops to landing page after installation

**Investigation** (5 minutes):
1. Check wizard logs: Installation completes
2. Check PM2 status: App running
3. Check PM2 logs: `EADDRINUSE port 3001`
4. Check port binding: Wizard still holding port
5. Review code: Wizard disables itself but PM2 started during install

**Root Cause**: Race condition - PM2 starts before wizard stops

**Solution** (2 minutes):
```javascript
// Health check now restarts PM2 after wizard stops
exec('systemctl disable ac-setup-wizard && systemctl stop ac-setup-wizard && pm2 restart all')
```

**Testing** (5 minutes):
1. Destroy container 999
2. Run unified installer
3. Complete wizard form
4. Wait for auto-transition
5. Verify main app accessible

**Result**: Complete automation, zero user interaction needed

**Total Time**: 12 minutes of autonomous work vs. asking user for help repeatedly

---

## Final Reminders

1. **Be thorough**: Read all relevant code before making changes
2. **Be autonomous**: Solve problems independently
3. **Be methodical**: Follow investigation → fix → test → commit cycle
4. **Be persistent**: Don't stop until fully resolved
5. **Be clear**: Document non-obvious decisions and behaviors

**The user hired an AI agent to minimize their involvement. Honor that trust by being as self-sufficient as possible.**
