# Agent Integration Guide

## Overview

This guide explains how to integrate AI agents (like Claude, ChatGPT, or other AI assistants) into the development workflow for the AC Server Manager project. Agents can help with code generation, debugging, feature implementation, and documentation.

## Why Use Agents for This Project?

- **Accelerated Development**: Agents can scaffold components, write boilerplate, and implement standard patterns quickly
- **Learning Tool**: Great for understanding best practices and learning new concepts
- **Code Review**: Agents can review code for improvements and potential bugs
- **Documentation**: Auto-generate or improve documentation
- **Problem Solving**: Help debug issues and suggest solutions

## Project Context for Agents

When working with an agent on this project, provide this context:

### Project Summary
```
AC Server Manager is a web-based management interface for Assetto Corsa dedicated servers.

Tech Stack:
- Backend: Node.js + Express (ES modules)
- Frontend: React + Vite + Tailwind CSS
- Database: SQLite (planned)
- WebSockets: ws library for real-time updates

Key Features:
- Server control (start/stop/restart)
- Configuration editor (server_cfg.ini)
- Entry list management (entry_list.ini)
- Track/car selection
- Live monitoring
- Configuration presets
```

### Project Structure
```
backend/
├── src/
│   ├── server.js          # Main Express server
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic
│   └── utils/             # Helper functions
└── package.json

frontend/
├── src/
│   ├── App.jsx            # Main app with routing
│   ├── components/        # Reusable components
│   ├── pages/             # Page components
│   └── api/               # API client (axios)
└── package.json
```

## Common Agent Tasks

### 1. Adding a New Feature

**Example Prompt:**
```
I need to add a feature to the AC Server Manager to display live lap times.

Context:
- Backend: Node.js/Express in backend/src/
- Frontend: React in frontend/src/
- API client is in frontend/src/api/client.js

Please:
1. Create a new API endpoint in backend to fetch lap times
2. Add the API method to the frontend client
3. Create a React component to display lap times
4. Show me where to integrate it in the app

Use the existing code style and patterns from the project.
```

### 2. Debugging Issues

**Example Prompt:**
```
I'm getting a CORS error when the frontend tries to call the backend API.

Setup:
- Backend running on localhost:3001
- Frontend running on localhost:5173
- Backend has cors middleware configured
- Error: "Access-Control-Allow-Origin header is missing"

Here's my backend/src/server.js:
[paste relevant code]

Can you help identify and fix the issue?
```

### 3. Code Review

**Example Prompt:**
```
Can you review this service file for best practices?

File: backend/src/services/configService.js
[paste code]

Please check for:
- Error handling
- Code organization
- Potential bugs
- Performance issues
- Security concerns
```

### 4. Implementing TODOs

**Example Prompt:**
```
I have TODOs in backend/src/services/serverService.js for actually starting/stopping the AC server process.

Context:
- AC server executable path is in process.env.AC_SERVER_PATH
- Need to spawn a child process
- Should capture stdout/stderr for logging
- Need graceful shutdown handling

Can you implement the startServer() and stopServer() functions?
```

### 5. Creating Components

**Example Prompt:**
```
I need a React component for a car selector with multi-select capability.

Requirements:
- Use Tailwind CSS (existing styles in project)
- Props: cars (array), selectedCars (array), onChange (function)
- Show car name and preview image
- Allow selecting multiple cars
- Responsive design

Please create the component following the project's style.
```

## Best Practices for Agent Collaboration

### Provide Context

Always share:
- **File structure** - Where files are located
- **Existing patterns** - How similar features are implemented
- **Dependencies** - What libraries are available
- **Environment** - Node version, OS, etc.

### Be Specific

❌ Bad: "Add monitoring to the app"
✅ Good: "Add a monitoring page that shows connected players. Use the existing Layout component, add a route in App.jsx, and create the page in pages/Monitoring.jsx"

### Share Code

When asking for help with existing code:
- Paste the relevant code snippet
- Include imports and function signatures
- Mention the file path

### Iterate

Start with basic implementation, then refine:
1. Get basic functionality working
2. Add error handling
3. Improve UI/UX
4. Add tests

### Verify Agent Output

Always:
- Review generated code before using it
- Test thoroughly
- Understand what the code does
- Adapt to your specific needs

## Agent-Friendly Code Patterns

This project uses consistent patterns that agents can easily work with:

### Backend Service Pattern
```javascript
// services/exampleService.js
export async function getData() {
  try {
    // Implementation
    return result;
  } catch (error) {
    throw new Error(`Failed to get data: ${error.message}`);
  }
}
```

### Backend Route Pattern
```javascript
// routes/exampleRoutes.js
import express from 'express';
import * as exampleService from '../services/exampleService.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const data = await exampleService.getData();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Frontend API Client Pattern
```javascript
// api/client.js
export const getData = async () => {
  const response = await client.get('/endpoint');
  return response.data;
};
```

### React Component Pattern
```jsx
// components/Example.jsx
import PropTypes from 'prop-types';

function Example({ data, onUpdate }) {
  // Component logic
  
  return (
    <div className="card">
      {/* JSX */}
    </div>
  );
}

Example.propTypes = {
  data: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default Example;
```

## Example Agent Workflow

### Scenario: Adding Weather Selection

**Step 1: Ask for Plan**
```
I want to add weather selection to the server config page.
Can you outline the steps needed?
```

**Step 2: Implement Backend**
```
Please implement step 1 - updating the backend service to handle weather.
Here's the current configService.js:
[paste code]
```

**Step 3: Update Frontend**
```
Now update the ServerConfig page to include weather selection.
Current code:
[paste frontend/src/pages/ServerConfig.jsx]

Use the weather data from the API we already have at /api/content/weather
```

**Step 4: Test & Refine**
```
The weather dropdown works but the styling doesn't match the rest of the form.
Can you update it to match the track selector style?
```

## Tools for Agent Integration

### VS Code Extensions
- **Continue** - AI coding assistant
- **GitHub Copilot** - Code completion
- **Cursor** - AI-powered IDE

### Standalone Tools
- **ChatGPT** - General assistance
- **Claude** - Code and documentation help
- **Tabnine** - Code completion

## Tips for Success

1. **Start Small** - Begin with simple, well-defined tasks
2. **Maintain Context** - Keep conversation focused on one feature/issue
3. **Document Decisions** - Record why certain approaches were chosen
4. **Review Everything** - Never blindly accept generated code
5. **Learn as You Go** - Understand the code being generated

## Common Pitfalls

❌ **Don't:**
- Copy/paste without understanding
- Skip testing generated code
- Let agents make architectural decisions without review
- Forget to update documentation

✅ **Do:**
- Verify code matches project patterns
- Test edge cases
- Ask for explanations
- Keep human oversight

## Next Steps

1. Try a simple agent task (e.g., add a new component)
2. Use agents to implement TODOs in existing files
3. Get help debugging issues as they arise
4. Use agents to improve documentation

Remember: Agents are tools to accelerate development and learning, not replacements for understanding the code!
