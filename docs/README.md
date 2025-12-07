# Documentation Index

Welcome to the AC Server Manager documentation.

---

## 📖 Getting Started

### For End Users

Start here if you want to install and use AC Server Manager:

1. **[INSTALLATION.md](./INSTALLATION.md)** - Install on Proxmox, Linux, or Windows
2. **[USER_MANUAL.md](./USER_MANUAL.md)** - Complete usage guide
3. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Fix common problems

### For Developers

Start here if you want to contribute or modify the codebase:

1. **[DEVELOPMENT_PROCEDURE.md](./DEVELOPMENT_PROCEDURE.md)** - Workflow and best practices
2. **[VERSION_MANAGEMENT.md](./VERSION_MANAGEMENT.md)** - Versioning system
3. **[API.md](./API.md)** - REST API reference

---

## 📚 Complete Documentation

### User Documentation

- **[INSTALLATION.md](./INSTALLATION.md)** - Installation for all platforms
  - Proxmox LXC one-command install
  - Linux server installation
  - Local development setup
  - Docker installation
  - Troubleshooting installation issues

- **[USER_MANUAL.md](./USER_MANUAL.md)** - Complete usage guide
  - Quick start
  - Setup wizard walkthrough
  - Creating/managing server configs
  - Content management (tracks/cars)
  - Starting/stopping servers
  - Updates and maintenance

- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues
  - Server won't start
  - Can't join from game
  - Configuration not applying
  - Port conflicts
  - Module errors

- **[CONTENT_UPLOAD.md](./CONTENT_UPLOAD.md)** - Uploading custom content
  - Track upload via web UI
  - Car upload via web UI
  - ZIP file structure requirements
  - Validation and error handling

### Developer Documentation

- **[DEVELOPMENT_PROCEDURE.md](./DEVELOPMENT_PROCEDURE.md)** - Development workflow
  - Preferred workflow (commit → deploy → test)
  - Version management (automatic via git hooks)
  - Deployment to Proxmox
  - Testing procedures
  - Unified installer architecture
  - AI agent guidelines

- **[VERSION_MANAGEMENT.md](./VERSION_MANAGEMENT.md)** - Versioning system
  - Automatic version bumping via git hooks
  - Semantic versioning rules
  - Manual version management
  - Validation and troubleshooting

- **[API.md](./API.md)** - REST API reference
  - Server control endpoints
  - Configuration management
  - Content scanning
  - Entry list management
  - Update system

- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - QA procedures
  - Test environments
  - Test scenarios (fresh install, upgrade, Docker)
  - Error condition testing
  - Acceptance criteria
  - Pre-release checklist

- **[DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md)** - System architecture
  - Current architecture
  - Content management dependencies
  - Alternative deployment models
  - Headless manager architecture

### Reference

- **[COMMANDS.md](./COMMANDS.md)** - Quick command reference
  - Installation commands
  - Development commands
  - Deployment commands
  - Docker commands
  - PM2 management

- **[UPDATE_SYSTEM.md](./UPDATE_SYSTEM.md)** - Update system
  - How updates work
  - Git-based updates
  - Automatic dependency installation
  - Frontend rebuild process
  - Security considerations

- **[SERVER_INSTALL.md](./SERVER_INSTALL.md)** - Bare-metal installation
  - Installation script options
  - Manual installation steps
  - System requirements
  - Post-installation configuration

### Examples

- **[examples/CarSelector.md](./examples/CarSelector.md)** - Car selector component example
- **[examples/entry_list_example.ini](./examples/entry_list_example.ini)** - Entry list format
- **[examples/server_cfg_example.ini](./examples/server_cfg_example.ini)** - Server config format

---

## 🗺️ Documentation Map

```
User Journey:
  Installation → Setup Wizard → User Manual → Troubleshooting

Developer Journey:
  Development Procedure → API Reference → Testing Checklist → Deploy

Quick Reference:
  Commands → Troubleshooting → API → Version Management
```

---

## 🔍 Find What You Need

### I want to...

- **Install the app** → [INSTALLATION.md](./INSTALLATION.md)
- **Learn how to use it** → [USER_MANUAL.md](./USER_MANUAL.md)
- **Fix a problem** → [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Upload custom tracks/cars** → [CONTENT_UPLOAD.md](./CONTENT_UPLOAD.md)
- **Update to latest version** → [UPDATE_SYSTEM.md](./UPDATE_SYSTEM.md)
- **Develop/contribute** → [DEVELOPMENT_PROCEDURE.md](./DEVELOPMENT_PROCEDURE.md)
- **Understand the API** → [API.md](./API.md)
- **Deploy to production** → [INSTALLATION.md](./INSTALLATION.md) + [DEVELOPMENT_PROCEDURE.md](./DEVELOPMENT_PROCEDURE.md)

---

## 📝 Documentation Standards

All documentation follows these principles:

1. **User-focused** - Written for the target audience
2. **Actionable** - Clear steps, not just explanations
3. **Searchable** - Good headings, keywords, examples
4. **Maintained** - Updated with code changes
5. **Concise** - Respect reader's time

---

## 🆘 Still Need Help?

If you can't find what you're looking for:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
2. Search the documentation (Ctrl+F in your editor)
3. Review [USER_MANUAL.md](./USER_MANUAL.md) for detailed usage
4. Check [API.md](./API.md) for endpoint details

---

**Last Updated:** December 7, 2025  
**Documentation Version:** 2.0 (Post-Cleanup)
