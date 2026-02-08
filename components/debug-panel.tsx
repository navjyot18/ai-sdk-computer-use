"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolCallEvent, DerivedState } from "@/lib/types";

type DebugPanelProps = {
  events: ToolCallEvent[];
  derivedState: DerivedState;
};

export const DebugPanel = ({ events, derivedState }: DebugPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium">Debug Panel</span>
          <span className="text-xs text-zinc-500">
            {derivedState.totalEvents} events
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 max-h-80 overflow-y-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg">
              <div className="text-xs text-zinc-500 mb-1">Agent Status</div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <span
                  className={cn("w-2 h-2 rounded-full", {
                    "bg-green-500": derivedState.agentStatus === "idle",
                    "bg-blue-500": derivedState.agentStatus === "thinking",
                    "bg-yellow-500": derivedState.agentStatus === "executing",
                    "bg-red-500": derivedState.agentStatus === "error",
                  })}
                />
                {derivedState.agentStatus}
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg">
              <div className="text-xs text-zinc-500 mb-1">Success Rate</div>
              <div className="text-sm font-semibold">
                {derivedState.successRate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg">
              <div className="text-xs text-zinc-500 mb-1">Avg Duration</div>
              <div className="text-sm font-semibold">
                {derivedState.averageDuration.toFixed(0)}ms
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg">
              <div className="text-xs text-zinc-500 mb-1">Total Events</div>
              <div className="text-sm font-semibold">
                {derivedState.totalEvents}
              </div>
            </div>
          </div>

          {/* Action Counts */}
          <div>
            <div className="text-xs text-zinc-500 mb-2">Action Counts</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {Object.entries(derivedState.actionCounts).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between bg-zinc-50 dark:bg-zinc-900 px-2 py-1 rounded"
                >
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {key}
                  </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Events */}
          <div>
            <div className="text-xs text-zinc-500 mb-2">Recent Events</div>
            <div className="space-y-1 text-xs">
              {events.slice(-10).reverse().map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-2 py-1.5 rounded"
                >
                  <span
                    className={cn("w-1.5 h-1.5 rounded-full", {
                      "bg-yellow-500": event.status === "pending",
                      "bg-blue-500": event.status === "running",
                      "bg-green-500": event.status === "success",
                      "bg-red-500": event.status === "error",
                      "bg-gray-500": event.status === "aborted",
                    })}
                  />
                  <span className="flex-1 font-mono truncate">
                    {event.toolCall.tool === "bash"
                      ? event.toolCall.command.slice(0, 30)
                      : event.toolCall.action.type}
                  </span>
                  {event.duration && (
                    <span className="text-zinc-500">{event.duration}ms</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
