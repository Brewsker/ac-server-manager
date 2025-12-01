# Contributing to AC Server Manager

Thank you for contributing! This guide will help you get started.

## Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ac-server-manager.git`
3. Add upstream: `git remote add upstream https://github.com/Brewsker/ac-server-manager.git`
4. Create a feature branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Test thoroughly
7. Commit with conventional commits (see below)
8. Push and create a Pull Request

## Development Setup

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/Brewsker/ac-server-manager.git
cd ac-server-manager

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running Locally

```bash
# Terminal 1 - Backend (from backend/)
npm run dev

# Terminal 2 - Frontend (from frontend/)
npm run dev
```

Backend runs on `http://localhost:3001`
Frontend runs on `http://localhost:5173`

## Branch Strategy

See [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md) for full details.

**Quick Reference:**
- `main` - Production releases only
- `develop` - Integration branch (base your work here)
- `feature/*` - New features
- `fix/*` - Bug fixes
- `chore/*` - Maintenance tasks
- `docs/*` - Documentation updates

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `chore:` Maintenance (refactoring, dependencies)
- `test:` Adding or updating tests
- `perf:` Performance improvements
- `ci:` CI/CD changes

**Examples:**
```
feat: Add real-time player monitoring dashboard

fix: Resolve config save failure on Windows paths

docs: Update installation guide for Proxmox

chore: Upgrade dependencies to latest versions
```

## Pull Request Process

1. **Update from develop:**
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout your-branch
   git rebase develop
   ```

2. **Ensure tests pass:**
   ```bash
   npm test
   ```

3. **Create PR:**
   - Target the `develop` branch (not `main`)
   - Fill out the PR template
   - Link related issues
   - Add screenshots for UI changes

4. **Code review:**
   - Address feedback
   - Keep commits clean
   - Squash if requested

5. **Merge:**
   - Maintainer will merge when approved
   - Feature branch will be deleted after merge

## Code Style

### JavaScript/React
- Use ES6+ features
- Functional components with hooks
- Destructuring where appropriate
- Meaningful variable names
- Comments for complex logic

### File Organization
- Components: `frontend/src/components/`
- Pages: `frontend/src/pages/`
- API calls: `frontend/src/api/`
- Services: `backend/src/services/`
- Routes: `backend/src/routes/`

### Naming Conventions
- Components: PascalCase (`PlayerList.jsx`)
- Files: camelCase (`configService.js`)
- Variables: camelCase (`playerData`)
- Constants: UPPER_SNAKE_CASE (`MAX_PLAYERS`)
- CSS classes: kebab-case (`player-list-item`)

## Testing

### Frontend
```bash
cd frontend
npm test
```

### Backend
```bash
cd backend
npm test
```

### Integration Tests
```bash
# From root
npm run test:integration
```

## Documentation

- Update relevant docs in `docs/`
- Add JSDoc comments for new functions
- Update API.md for new endpoints
- Include examples where helpful

## Reporting Issues

**Bug Reports:**
- Use the bug report template
- Include steps to reproduce
- Provide system information
- Add screenshots if applicable

**Feature Requests:**
- Use the feature request template
- Describe the use case
- Explain expected behavior
- Suggest implementation if possible

## Getting Help

- Check existing issues and PRs
- Read the documentation in `docs/`
- Ask in GitHub Discussions
- Join our Discord (if available)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Recognition

Contributors will be added to the README.md contributors section.

Thank you for making AC Server Manager better!
