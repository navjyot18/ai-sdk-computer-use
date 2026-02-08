"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { ToolCallEvent } from "@/lib/types";
import {
  Camera,
  MousePointer,
  MousePointerClick,
  Keyboard,
  KeyRound,
  Clock,
  ScrollText,
  CheckCircle,
  XCircle,
  Loader2,
  CircleSlash,
} from "lucide-react";

type ToolCallDetailsProps = {
  events: ToolCallEvent[];
  activeToolCall: ToolCallEvent | null;
};

export const ToolCallDetails = ({
  events,
  activeToolCall,
}: ToolCallDetailsProps) => {
  const getIcon = (event: ToolCallEvent) => {
    if (event.toolCall.tool === "bash") {
      return <ScrollText className="w-4 h-4" />;
    }

    const action = event.toolCall.action.type;
    switch (action) {
      case "screenshot":
        return <Camera className="w-4 h-4" />;
      case "left_click":
      case "right_click":
      case "double_click":
        return <MousePointerClick className="w-4 h-4" />;
      case "mouse_move":
        return <MousePointer className="w-4 h-4" />;
      case "type":
        return <Keyboard className="w-4 h-4" />;
      case "key":
        return <KeyRound className="w-4 h-4" />;
      case "wait":
        return <Clock className="w-4 h-4" />;
      case "scroll":
        return <ScrollText className="w-4 h-4" />;
      default:
        return <MousePointer className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: ToolCallEvent["status"]) => {
    switch (status) {
      case "running":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "aborted":
        return <CircleSlash className="w-4 h-4 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatToolCall = (event: ToolCallEvent): string => {
    if (event.toolCall.tool === "bash") {
      return event.toolCall.command;
    }

    const action = event.toolCall.action;
    switch (action.type) {
      case "screenshot":
        return "Take screenshot";
      case "left_click":
        return `Left click at (${action.coordinate[0]}, ${action.coordinate[1]})`;
      case "right_click":
        return `Right click at (${action.coordinate[0]}, ${action.coordinate[1]})`;
      case "double_click":
        return `Double click at (${action.coordinate[0]}, ${action.coordinate[1]})`;
      case "mouse_move":
        return `Move mouse to (${action.coordinate[0]}, ${action.coordinate[1]})`;
      case "type":
        return `Type: "${action.text}"`;
      case "key":
        return `Press key: "${action.text}"`;
      case "wait":
        return `Wait ${action.duration}s`;
      case "scroll":
        return `Scroll ${action.scroll_direction} by ${action.scroll_amount}`;
      case "left_click_drag":
        return `Drag from (${action.start_coordinate[0]}, ${action.start_coordinate[1]}) to (${action.coordinate[0]}, ${action.coordinate[1]})`;
      default:
        return "Unknown action";
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-zinc-950">
      <div className="sticky top-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4 z-10">
        <h2 className="text-lg font-semibold">Tool Call Details</h2>
        <p className="text-sm text-zinc-500 mt-1">
          {events.length} total calls
        </p>
      </div>

      {/* Active Tool Call */}
      {activeToolCall && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
            CURRENTLY EXECUTING
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              {getIcon(activeToolCall)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm mb-1">
                {formatToolCall(activeToolCall)}
              </div>
              <div className="text-xs text-zinc-500">
                Started {new Date(activeToolCall.timestamp).toLocaleTimeString()}
              </div>
            </div>
            {getStatusIcon(activeToolCall.status)}
          </div>
        </div>
      )}

      {/* Event List */}
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {events.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            No tool calls yet
          </div>
        ) : (
          events
            .slice()
            .reverse()
            .map((event) => (
              <div
                key={event.id}
                className={cn(
                  "p-4 transition-colors",
                  event.id === activeToolCall?.id
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      event.status === "success"
                        ? "bg-green-50 dark:bg-green-900/20"
                        : event.status === "error"
                        ? "bg-red-50 dark:bg-red-900/20"
                        : "bg-zinc-100 dark:bg-zinc-800"
                    )}
                  >
                    {getIcon(event)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-1">
                      {formatToolCall(event)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                      {event.duration && (
                        <>
                          <span>•</span>
                          <span>{event.duration}ms</span>
                        </>
                      )}
                    </div>
                    {event.error && (
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        {event.error}
                      </div>
                    )}
                  </div>
                  {getStatusIcon(event.status)}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};
