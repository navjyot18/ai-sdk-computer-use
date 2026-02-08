"use client";

import React from "react";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/lib/types";

type SessionManagerProps = {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onCreateSession: () => void;
  onSwitchSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
};

export const SessionManager = ({
  sessions,
  activeSessionId,
  onCreateSession,
  onSwitchSession,
  onDeleteSession,
}: SessionManagerProps) => {
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Sessions
        </span>
        <button
          onClick={onCreateSession}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          title="New Session"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={cn(
              "flex items-center justify-between p-2 rounded-lg text-sm cursor-pointer transition-colors",
              {
                "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100":
                  session.id === activeSessionId,
                "hover:bg-zinc-100 dark:hover:bg-zinc-800":
                  session.id !== activeSessionId,
              }
            )}
            onClick={() => onSwitchSession(session.id)}
          >
            <div className="flex-1 truncate">
              <div className="font-medium truncate">{session.name}</div>
              <div className="text-xs text-zinc-500">
                {new Date(session.updatedAt).toLocaleTimeString()}
              </div>
            </div>
            {sessions.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
                title="Delete Session"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
