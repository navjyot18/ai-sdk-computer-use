// Discriminated union types for tool calls
export type ToolCallAction =
  | { type: "screenshot" }
  | { type: "left_click"; coordinate: [number, number] }
  | { type: "right_click"; coordinate: [number, number] }
  | { type: "double_click"; coordinate: [number, number] }
  | { type: "mouse_move"; coordinate: [number, number] }
  | { type: "type"; text: string }
  | { type: "key"; text: string }
  | { type: "wait"; duration: number }
  | { type: "scroll"; scroll_direction: string; scroll_amount: number }
  | { type: "left_click_drag"; start_coordinate: [number, number]; coordinate: [number, number] };

export type BashToolCall = {
  tool: "bash";
  command: string;
};

export type ComputerToolCall = {
  tool: "computer";
  action: ToolCallAction;
};

export type ToolCall = BashToolCall | ComputerToolCall;

export type ToolCallStatus = "pending" | "running" | "success" | "error" | "aborted";

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

export type ActionTypeCounts = {
  bash: number;
  screenshot: number;
  left_click: number;
  right_click: number;
  double_click: number;
  mouse_move: number;
  type: number;
  key: number;
  wait: number;
  scroll: number;
  left_click_drag: number;
};

export type AgentStatus = "idle" | "thinking" | "executing" | "error";

export type DerivedState = {
  actionCounts: ActionTypeCounts;
  agentStatus: AgentStatus;
  totalEvents: number;
  successRate: number;
  averageDuration: number;
  activeToolCall: ToolCallEvent | null;
};

export type ChatSession = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messages: unknown[];
  sandboxId: string | null;
};

export type EventStore = {
  events: ToolCallEvent[];
  sessions: ChatSession[];
  activeSessionId: string | null;
};
