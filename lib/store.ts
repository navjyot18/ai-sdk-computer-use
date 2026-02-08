import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ToolCallEvent,
  DerivedState,
  ChatSession,
  EventStore,
  ActionTypeCounts,
  AgentStatus,
} from "./types";

type EventStoreState = EventStore & {
  // Event management
  addEvent: (event: ToolCallEvent) => void;
  updateEvent: (id: string, updates: Partial<ToolCallEvent>) => void;
  clearEvents: () => void;

  // Session management
  createSession: (name?: string) => string;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionMessages: (messages: unknown[]) => void;
  updateSessionSandboxId: (sandboxId: string | null) => void;

  // Derived state getters
  getDerivedState: () => DerivedState;
  getActiveSession: () => ChatSession | null;
};

export const useEventStore = create<EventStoreState>()(
  persist(
    (set, get) => ({
      events: [],
      sessions: [],
      activeSessionId: null,

      // Event management
      addEvent: (event) => {
        set((state) => ({
          events: [...state.events, event],
        }));
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...updates } : event
          ),
        }));
      },

      clearEvents: () => {
        set({ events: [] });
      },

      // Session management
      createSession: (name) => {
        const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const session: ChatSession = {
          id,
          name: name || `Session ${get().sessions.length + 1}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          sandboxId: null,
        };

        set((state) => ({
          sessions: [...state.sessions, session],
          activeSessionId: id,
        }));

        return id;
      },

      switchSession: (sessionId) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (session) {
          set({ activeSessionId: sessionId });
        }
      },

      deleteSession: (sessionId) => {
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== sessionId);
          let newActiveId = state.activeSessionId;

          // If deleting active session, switch to another
          if (state.activeSessionId === sessionId) {
            newActiveId = newSessions.length > 0 ? newSessions[0].id : null;
          }

          return {
            sessions: newSessions,
            activeSessionId: newActiveId,
          };
        });
      },

      updateSessionMessages: (messages) => {
        const activeSessionId = get().activeSessionId;
        if (!activeSessionId) return;

        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === activeSessionId
              ? { ...session, messages, updatedAt: Date.now() }
              : session
          ),
        }));
      },

      updateSessionSandboxId: (sandboxId) => {
        const activeSessionId = get().activeSessionId;
        if (!activeSessionId) return;

        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === activeSessionId
              ? { ...session, sandboxId, updatedAt: Date.now() }
              : session
          ),
        }));
      },

      // Derived state
      getDerivedState: () => {
        const { events } = get();
        const activeSessionId = get().activeSessionId;
        const sessionEvents = activeSessionId
          ? events.filter(() => {
              const session = get().sessions.find((s) => s.id === activeSessionId);
              return session !== undefined;
            })
          : events;

        // Calculate action counts
        const actionCounts: ActionTypeCounts = {
          bash: 0,
          screenshot: 0,
          left_click: 0,
          right_click: 0,
          double_click: 0,
          mouse_move: 0,
          type: 0,
          key: 0,
          wait: 0,
          scroll: 0,
          left_click_drag: 0,
        };

        sessionEvents.forEach((event) => {
          if (event.toolCall.tool === "bash") {
            actionCounts.bash++;
          } else if (event.toolCall.tool === "computer") {
            const actionType = event.toolCall.action.type;
            actionCounts[actionType]++;
          }
        });

        // Determine agent status
        let agentStatus: AgentStatus = "idle";
        const runningEvents = sessionEvents.filter((e) => e.status === "running");
        if (runningEvents.length > 0) {
          agentStatus = "executing";
        } else if (sessionEvents.some((e) => e.status === "error")) {
          agentStatus = "error";
        }

        // Calculate success rate
        const completedEvents = sessionEvents.filter(
          (e) => e.status === "success" || e.status === "error"
        );
        const successRate =
          completedEvents.length > 0
            ? (sessionEvents.filter((e) => e.status === "success").length /
                completedEvents.length) *
              100
            : 0;

        // Calculate average duration
        const eventsWithDuration = sessionEvents.filter(
          (e) => e.duration !== undefined
        );
        const averageDuration =
          eventsWithDuration.length > 0
            ? eventsWithDuration.reduce((sum, e) => sum + (e.duration || 0), 0) /
              eventsWithDuration.length
            : 0;

        // Get active tool call
        const activeToolCall =
          sessionEvents.find((e) => e.status === "running") || null;

        return {
          actionCounts,
          agentStatus,
          totalEvents: sessionEvents.length,
          successRate,
          averageDuration,
          activeToolCall,
        };
      },

      getActiveSession: () => {
        const activeSessionId = get().activeSessionId;
        if (!activeSessionId) return null;
        return get().sessions.find((s) => s.id === activeSessionId) || null;
      },
    }),
    {
      name: "event-store",
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        // Don't persist events - they're ephemeral
      }),
    }
  )
);
