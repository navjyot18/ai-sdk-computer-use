# Dashboard Features Documentation

## Overview

This AI SDK Computer Use dashboard has been enhanced with a comprehensive two-panel interface featuring advanced debugging capabilities, session management, and real-time tool call monitoring.

## Architecture

### Type System (`lib/types.ts`)

All types follow TypeScript best practices with **discriminated unions** and **no `any` types**:

```typescript
// Tool calls use discriminated unions for type safety
export type ToolCall = BashToolCall | ComputerToolCall;

export type ToolCallEvent = {
  id: string;
  toolCallId: string;
  timestamp: number;
  toolCall: ToolCall;
  status: ToolCallStatus;
  duration?: number;
  result?: unknown;
  error?: string;
};
```

### State Management (`lib/store.ts`)

Uses **Zustand** with **localStorage persistence** for session management:

- Events are **ephemeral** (not persisted) for performance
- Sessions are **persisted** to localStorage
- Provides derived state calculations (action counts, success rate, etc.)

## Features

### 1. Two-Panel Dashboard Layout

#### Left Panel (30% default, 20-50% resizable)
- Chat interface with message history
- Session manager at the top
- Collapsible debug panel at the bottom
- Input area

#### Right Panel (70% default, 50%+ resizable)
- **Top**: VNC viewer (70% default)
- **Bottom**: Tool call details (30% default)
- Both vertically resizable

### 2. Event Pipeline with Typed State Management

**Event Capture:**
- Automatically tracks all tool calls
- Records: id, timestamp, type, payload, status, duration
- Real-time status updates (pending → running → success/error/aborted)

**Derived State:**
```typescript
{
  actionCounts: ActionTypeCounts,  // Count per action type
  agentStatus: AgentStatus,         // idle/thinking/executing/error
  totalEvents: number,
  successRate: number,              // Percentage of successful calls
  averageDuration: number,          // Average execution time in ms
  activeToolCall: ToolCallEvent | null  // Currently executing call
}
```

### 3. Debug Panel (Collapsible)

Located at the bottom of the left panel, shows:

**Stats Grid:**
- Agent Status (with color-coded indicator)
- Success Rate percentage
- Average Duration in milliseconds
- Total Events count

**Action Counts:**
- Grid showing count for each action type (bash, screenshot, click, etc.)

**Recent Events:**
- Last 10 events with status indicators
- Shows timestamp and duration
- Color-coded by status (pending/running/success/error/aborted)

### 4. Tool Call Details Panel

Right panel bottom section shows:

**Active Tool Call:**
- Highlighted section for currently executing tool
- Shows action details and start time
- Real-time status indicator

**Event History:**
- Reverse chronological list of all tool calls
- Detailed view with:
  - Action icon
  - Full description
  - Timestamp
  - Duration
  - Status indicator
  - Error details (if any)

### 5. Session Management

**Features:**
- Create new sessions with the "+" button
- Switch between sessions by clicking
- Delete sessions (keeps at least one)
- Auto-saves messages and sandbox IDs
- Persists to localStorage

**Session Data:**
```typescript
{
  id: string,
  name: string,
  createdAt: number,
  updatedAt: number,
  messages: unknown[],
  sandboxId: string | null
}
```

### 6. VNC Viewer Optimization

The VNC component is **memoized** to prevent re-renders:

```typescript
export const VNCViewer = memo(
  VNCViewerComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.streamUrl === nextProps.streamUrl &&
      prevProps.isInitializing === nextProps.isInitializing
    );
  }
);
```

This ensures the VNC iframe doesn't reload when:
- Chat messages update
- Events are added
- Debug panel expands/collapses
- Tool calls complete

## Component Hierarchy

```
app/page.tsx (Main Dashboard)
├── Left Panel (ResizablePanel)
│   ├── Header (Logo + Deploy Button)
│   ├── SessionManager
│   ├── Chat Messages (scrollable)
│   │   └── PreviewMessage (memoized)
│   ├── PromptSuggestions
│   ├── DebugPanel (collapsible)
│   └── Input
└── Right Panel (ResizablePanel)
    ├── VNCViewer (memoized, top)
    └── ToolCallDetails (bottom)
```

## State Flow

1. **Tool Call Initiated**
   - User sends message → AI decides to use tool
   - `useChat` hook detects tool-invocation with state="call"
   - Event created with status="running"

2. **Tool Call Executing**
   - Event stored in Zustand store
   - Displayed in ToolCallDetails with spinner
   - Shown in DebugPanel recent events
   - Derived state updated (agentStatus → "executing")

3. **Tool Call Completed**
   - `useChat` hook detects tool-invocation with state="result"
   - Event updated with duration, result, status
   - UI updates across all components
   - Derived state recalculated

4. **Session Persistence**
   - Messages synced to active session on update
   - Sandbox ID synced on creation/change
   - All sessions saved to localStorage
   - Loaded on session switch

## TypeScript Best Practices

✅ **No `any` types** - All types are explicitly defined
✅ **Discriminated unions** - Tool calls use type-safe unions
✅ **Strict null checks** - Proper handling of nullable values
✅ **Type inference** - Leverages TypeScript's inference where appropriate
✅ **Readonly where appropriate** - Immutable patterns in state updates

## Performance Optimizations

1. **VNC Memoization**: Prevents iframe reloads
2. **Message Memoization**: PreviewMessage uses `fast-deep-equal`
3. **Ephemeral Events**: Events not persisted to localStorage
4. **Derived State**: Calculated on-demand, not stored
5. **Lazy Session Loading**: Messages loaded only when switching

## Keyboard Shortcuts

(Future enhancement opportunity)
- `Ctrl/Cmd + N`: New session
- `Ctrl/Cmd + D`: Toggle debug panel
- `Ctrl/Cmd + T`: Toggle tool details

## Mobile Responsiveness

- Desktop layout requires XL screens (1280px+)
- Mobile shows simplified chat-only view
- Banner indicates "Desktop view recommended"

## Browser Compatibility

- Modern browsers with ResizeObserver support
- sendBeacon API for cleanup
- localStorage for persistence
- Tailwind CSS for styling
