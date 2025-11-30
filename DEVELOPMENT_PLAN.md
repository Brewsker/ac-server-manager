# AC Server Manager - Development Plan

## Week 1: Foundation & Learning

### Day 1-2: Environment Setup & Learning
- [ ] Install Node.js (https://nodejs.org/)
- [ ] Install Git
- [ ] Set up VS Code with extensions:
  - ESLint
  - Prettier
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
- [ ] Complete JavaScript basics refresher
- [ ] Complete React basics tutorial

### Day 3-4: Backend Foundation
- [ ] Initialize Node.js project
- [ ] Set up Express server
- [ ] Create basic API routes
- [ ] Implement .ini file parser (read/write)
- [ ] Test parsing actual AC server files

### Day 5-7: Frontend Foundation
- [ ] Initialize React + Vite project
- [ ] Set up Tailwind CSS
- [ ] Create basic layout/navigation
- [ ] Create component structure
- [ ] Connect to backend API

## Week 2: MVP Features

### Core Functionality
- [ ] Track selector component
- [ ] Car selector component (multi-select)
- [ ] Server config form
- [ ] Generate server_cfg.ini from form data
- [ ] Start/stop server buttons
- [ ] Server status indicator

### Testing
- [ ] Test with actual AC server installation
- [ ] Verify .ini files are correct
- [ ] Test server start/stop

## Week 3-4: Polish MVP

### Features
- [ ] Entry list manager
- [ ] Auto-scan AC content folder
- [ ] Save/load configuration presets
- [ ] Server log viewer
- [ ] Better error handling

### UI/UX
- [ ] Improve styling
- [ ] Add loading states
- [ ] Add form validation
- [ ] Mobile responsive design

## Month 2: Advanced Features

### Live Monitoring
- [ ] WebSocket connection
- [ ] Live player list
- [ ] Session progress
- [ ] Lap times display

### Results & Stats
- [ ] Parse result JSON files
- [ ] Display race results
- [ ] Basic leaderboards
- [ ] Driver statistics

## Technical Milestones

### Milestone 1: Hello World
- Backend serves "Hello World"
- Frontend displays "Hello World"
- Both talk to each other

### Milestone 2: Config Reader
- Can read server_cfg.ini
- Display values in frontend
- Parse all important fields

### Milestone 3: Config Writer
- Form in frontend
- Write to server_cfg.ini
- Verify file is valid

### Milestone 4: Server Control
- Start AC server from web UI
- Stop AC server from web UI
- Show server status (running/stopped)

### Milestone 5: MVP Complete
- Full config editor
- Entry list manager
- Start/stop controls
- Track/car selection working

## Code Examples to Build

### Example 1: Parse INI File (Node.js)
```javascript
const ini = require('ini');
const fs = require('fs');

function parseServerConfig(path) {
  const config = ini.parse(fs.readFileSync(path, 'utf-8'));
  return config;
}

function writeServerConfig(path, config) {
  fs.writeFileSync(path, ini.stringify(config));
}
```

### Example 2: Start AC Server (Node.js)
```javascript
const { spawn } = require('child_process');

function startACServer(acServerPath) {
  const server = spawn(acServerPath, [], {
    cwd: path.dirname(acServerPath)
  });
  
  server.stdout.on('data', (data) => {
    console.log(`AC Server: ${data}`);
  });
  
  return server;
}
```

### Example 3: Track Selector (React)
```jsx
function TrackSelector({ tracks, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        Track
      </label>
      <select 
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg"
      >
        {tracks.map(track => (
          <option key={track.id} value={track.id}>
            {track.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## Learning Path

### Week 1: Fundamentals
**JavaScript:**
- Variables, functions, arrays, objects
- Promises, async/await
- ES6+ features (arrow functions, destructuring, spread operator)

**Node.js:**
- npm/package.json basics
- require/import modules
- File system operations
- Child processes

**React:**
- Components (function components)
- Props and state (useState)
- Effects (useEffect)
- Event handling

### Week 2: Practical Skills
**Backend:**
- Express routing
- Middleware concept
- Error handling
- CORS

**Frontend:**
- Component composition
- Form handling
- API calls (fetch/axios)
- State management

### Week 3-4: Advanced Concepts
- WebSockets for real-time
- File uploads
- Authentication basics
- Database operations (SQLite)

## Resources by Topic

### JavaScript Basics
1. [JavaScript.info](https://javascript.info/) - Start here
2. [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
3. [Eloquent JavaScript](https://eloquentjavascript.net/) - Free book

### Node.js
1. [Node.js Official Tutorial](https://nodejs.dev/learn)
2. [Express.js Guide](https://expressjs.com/en/starter/installing.html)
3. [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### React
1. [Official React Tutorial](https://react.dev/learn) - Interactive
2. [React for Beginners (Wes Bos)](https://reactforbeginners.com/) - Paid but excellent
3. [Full Stack Open](https://fullstackopen.com/en/) - Free university course

### Tailwind CSS
1. [Tailwind Docs](https://tailwindcss.com/docs) - Excellent documentation
2. [Tailwind UI](https://tailwindui.com/) - Component examples (some free)

## Daily Practice Schedule

### Weekdays (2-3 hours)
- 30 min: Tutorial/learning
- 60 min: Coding on project
- 30 min: Testing/debugging

### Weekends (4-6 hours)
- 1 hour: Learning new concepts
- 2-3 hours: Feature development
- 1 hour: Testing and polish
- 30 min: Documentation

## Success Metrics

### Week 1
- ✅ Can run Node.js server
- ✅ Can run React app
- ✅ Can parse .ini file
- ✅ Can display data in UI

### Week 2
- ✅ Can edit server config in UI
- ✅ Can save config to .ini file
- ✅ Can select tracks/cars

### Week 4
- ✅ Can start AC server from UI
- ✅ Can stop AC server from UI
- ✅ Can manage entry list
- ✅ Configuration presets work

### Month 2
- ✅ Live monitoring working
- ✅ Results viewer functional
- ✅ Ready to share with friends

## When You Get Stuck

1. **Read the error message** - Most errors tell you exactly what's wrong
2. **Console.log everything** - Debug by printing values
3. **Google the error** - Someone has had this problem before
4. **Check documentation** - Official docs are usually best
5. **Ask AI** - ChatGPT/Claude can explain concepts and debug
6. **Take a break** - Sometimes you just need fresh eyes

## Motivation Reminders

- **You're building something useful** - You'll actually use this!
- **Every feature is a win** - Celebrate small victories
- **Learning compounds** - Each concept makes the next easier
- **It's okay to copy** - Learn by example, then customize
- **Perfect is the enemy of done** - Ship MVP, improve later

---

**Start Date:** _________
**Target MVP Date:** _________ (4 weeks out)
**Target Polish Date:** _________ (8 weeks out)

**Remember:** The goal is to learn AND build something useful. Don't rush, enjoy the process!
