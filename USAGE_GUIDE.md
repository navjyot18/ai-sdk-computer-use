# Quick Start Guide

## Running the Enhanced Dashboard

### 1. Install Dependencies (if not already done)

```bash
npm install
```

### 2. Set Environment Variables

Ensure your `.env.local` file contains:

```bash
ANTHROPIC_API_KEY=your_anthropic_key_here
E2B_API_KEY=your_e2b_key_here
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Interface Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Dashboard                               │
├───────────────────┬─────────────────────────────────────────────┤
│   LEFT PANEL      │              RIGHT PANEL                     │
│   (Chat + Debug)  │            (VNC + Details)                   │
│                   │                                              │
│ ┌───────────────┐ │ ┌──────────────────────────────────────────┐│
│ │ Session Mgr   │ │ │                                          ││
│ └───────────────┘ │ │                                          ││
│                   │ │           VNC Desktop                     ││
│ ┌───────────────┐ │ │                                          ││
│ │               │ │ │                                          ││
│ │ Chat Messages │ │ └──────────────────────────────────────────┘│
│ │               │ │ ┌──────────────────────────────────────────┐│
│ │               │ │ │      Tool Call Details                   ││
│ └───────────────┘ │ │  - Active tool call                      ││
│                   │ │  - Event history                         ││
│ ┌───────────────┐ │ └──────────────────────────────────────────┘│
│ │ Debug Panel ▼ │ │                                              │
│ └───────────────┘ │                                              │
│ ┌───────────────┐ │                                              │
│ │ Input Box     │ │                                              │
│ └───────────────┘ │                                              │
└───────────────────┴─────────────────────────────────────────────┘
```

---

## Feature Walkthroughs

### Managing Sessions

**Create a new session:**
1. Look for the "Sessions" section at the top of the left panel
2. Click the "+" button
3. A new session is created and becomes active
4. Previous session's messages and sandbox are preserved

**Switch between sessions:**
1. Click on any session name in the session list
2. The chat history and sandbox will load
3. Continue where you left off

**Delete a session:**
1. Click the trash icon (🗑️) next to a session name
2. Session is deleted (minimum 1 session always kept)
3. If deleting active session, automatically switches to another

---

### Using the Debug Panel

**Open/Close:**
- Click on "Debug Panel" header at bottom of left panel
- Shows chevron up (▲) when closed, down (▼) when open

**Interpret the Stats:**
- **Agent Status**: 
  - 🟢 Green = Idle (no active tools)
  - 🔵 Blue = Thinking (not yet implemented)
  - 🟡 Yellow = Executing (tools running)
  - 🔴 Red = Error occurred

- **Success Rate**: Percentage of successful tool calls
- **Avg Duration**: Average time each tool call takes
- **Total Events**: Count of all tool calls in this session

**Action Counts:**
- Grid showing how many times each action was used
- Helps identify which tools the agent prefers

**Recent Events:**
- Last 10 tool calls in reverse order
- Color indicators:
  - 🟡 Yellow = Pending
  - 🔵 Blue = Running
  - 🟢 Green = Success
  - 🔴 Red = Error
  - ⚪ Gray = Aborted

---

### Monitoring Tool Calls

**Tool Call Details Panel (Right Panel Bottom):**

**Active Tool Call Section:**
- Blue highlighted section when a tool is running
- Shows what action is being executed
- Real-time spinner indicates progress

**Event History:**
- All tool calls listed in reverse chronological order
- Each entry shows:
  - Icon representing the action type
  - Full description of what was executed
  - Timestamp
  - Duration in milliseconds
  - Status indicator
  - Error details (if failed)

**Click any event:**
- Currently just displays (click interactions can be added)

---

### Resizing Panels

**Horizontal Resize (Left ↔ Right):**
1. Hover over the vertical divider between left and right panels
2. Cursor changes to resize cursor
3. Click and drag to adjust panel sizes
4. Left panel: 20-50% of width
5. Right panel: 50-80% of width

**Vertical Resize (VNC ↔ Tool Details):**
1. In the right panel, hover over horizontal divider
2. Cursor changes to vertical resize
3. Drag up/down to adjust
4. VNC: Minimum 30% of right panel
5. Tool Details: Minimum 20% of right panel

---

### Understanding Event Flow

**1. User sends message:**
```
"Click on the search button at position 500, 300"
```

**2. AI responds with tool call:**
- Event created immediately
- Status: "running" 🔵
- Appears in Tool Call Details with spinner
- Shows in Debug Panel recent events

**3. Tool executes:**
- VNC viewer shows the click happening
- Event still "running"

**4. Tool completes:**
- Event status changes to "success" 🟢
- Duration recorded (e.g., 234ms)
- Derived state updated:
  - Action count incremented
  - Average duration recalculated
  - Success rate updated

---

### Interpreting Derived State

**Success Rate Calculation:**
```
Success Rate = (Successful Events / Total Completed Events) × 100
```

Example:
- 45 successful events
- 5 failed events
- Success rate = (45/50) × 100 = 90%

**Average Duration:**
```
Avg Duration = Sum of all durations / Number of events with duration
```

Only includes completed events with recorded duration.

---

### Tips and Best Practices

**1. Session Management:**
- Create new sessions for different tasks
- Name them descriptively (can be enhanced in future)
- Sessions persist across browser refreshes

**2. Monitoring Performance:**
- Watch success rate - if dropping below 80%, investigate errors
- Check average duration - spikes indicate slow tools
- Use action counts to see which tools are most used

**3. Debugging Issues:**
- Expand debug panel when things go wrong
- Check recent events for errors
- Look at Tool Call Details for full error messages
- Red status indicators show failures

**4. Panel Layout:**
- Resize to your preference (settings not persisted yet)
- More space for chat = easier to read conversations
- More space for VNC = better visual feedback
- Expand tool details when debugging specific actions

**5. Performance:**
- VNC won't reload unnecessarily thanks to memoization
- Events are kept in memory only (not localStorage)
- Close unused sessions to reduce memory

---

## Keyboard Shortcuts (Future Enhancement)

Currently not implemented, but planned:
- `Ctrl/Cmd + N`: New session
- `Ctrl/Cmd + D`: Toggle debug panel
- `Ctrl/Cmd + [`: Focus left panel
- `Ctrl/Cmd + ]`: Focus right panel

---

## Troubleshooting

**VNC not loading:**
- Check E2B_API_KEY in .env.local
- Click "New Desktop" button
- Check browser console for errors

**Sessions not persisting:**
- Check localStorage is enabled in browser
- Open DevTools → Application → Local Storage
- Look for "event-store" key

**Debug panel not showing stats:**
- Interact with the AI first to generate events
- Stats only appear after tool calls

**Build errors:**
- Run `npm run build` to check
- Ensure all dependencies installed
- Check console for specific errors

---

## API Reference

### useEventStore Hook

```typescript
import { useEventStore } from "@/lib/store";

// In component:
const {
  events,              // ToolCallEvent[]
  sessions,            // ChatSession[]
  activeSessionId,     // string | null
  createSession,       // (name?: string) => string
  switchSession,       // (id: string) => void
  deleteSession,       // (id: string) => void
  getDerivedState,     // () => DerivedState
  addEvent,            // (event: ToolCallEvent) => void
  updateEvent,         // (id: string, updates: Partial<ToolCallEvent>) => void
} = useEventStore();
```

### Type Definitions

See `lib/types.ts` for full type definitions:
- `ToolCallEvent`
- `ToolCall`
- `DerivedState`
- `ChatSession`
- `ActionTypeCounts`
- `AgentStatus`

---

## Next Steps

1. **Run the app**: `npm run dev`
2. **Test a session**: Ask the AI to do something
3. **Monitor events**: Watch the tool calls execute
4. **Check debug panel**: See real-time metrics
5. **Create new session**: Test session management
6. **Resize panels**: Find your preferred layout

Enjoy your enhanced AI SDK Computer Use dashboard! 🚀
