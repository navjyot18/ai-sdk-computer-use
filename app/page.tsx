"use client";

import { PreviewMessage } from "@/components/message";
import { VNCViewer } from "@/components/vnc-viewer";
import { DebugPanel } from "@/components/debug-panel";
import { SessionManager } from "@/components/session-manager";
import { ToolCallDetails } from "@/components/tool-call-details";
import { getDesktopURL } from "@/lib/e2b/utils";
import { useScrollToBottom } from "@/lib/use-scroll-to-bottom";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/input";
import { toast } from "sonner";
import { DeployButton, ProjectInfo } from "@/components/project-info";
import { AISDKLogo } from "@/components/icons";
import { PromptSuggestions } from "@/components/prompt-suggestions";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ABORTED } from "@/lib/utils";
import { useEventStore } from "@/lib/store";
import type { ToolCallEvent, ToolCallStatus } from "@/lib/types";

export default function Chat() {
  // Scroll management
  const [chatContainerRef, chatEndRef] = useScrollToBottom();

  // Desktop state
  const [isInitializing, setIsInitializing] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);

  // Event store
  const {
    events,
    sessions,
    activeSessionId,
    createSession,
    switchSession,
    deleteSession,
    updateSessionMessages,
    updateSessionSandboxId,
    getDerivedState,
    getActiveSession,
    addEvent,
    updateEvent,
  } = useEventStore();

  const derivedState = getDerivedState();

  // Initialize first session
  useEffect(() => {
    if (sessions.length === 0) {
      createSession("Session 1");
    }
  }, [sessions.length, createSession]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop: stopGeneration,
    append,
    setMessages,
  } = useChat({
    api: "/api/chat",
    id: activeSessionId ?? undefined,
    body: {
      sandboxId,
    },
    maxSteps: 30,
    onError: (error) => {
      console.error(error);
      toast.error("There was an error", {
        description: "Please try again later.",
        richColors: true,
        position: "top-center",
      });
    },
  });

  // Track tool calls and create events
  useEffect(() => {
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "assistant") return;

    lastMessage.parts?.forEach((part) => {
      if (part.type === "tool-invocation") {
        const { toolCallId, toolName, args, state } = part.toolInvocation;
        
        // Check if event already exists
        const existingEvent = events.find((e) => e.toolCallId === toolCallId);
        
        if (!existingEvent && state === "call") {
          // Create new event
          const toolCall =
            toolName === "bash"
              ? { tool: "bash" as const, command: args.command }
              : {
                  tool: "computer" as const,
                  action: {
                    type: args.action,
                    ...args,
                  },
                };

          const event: ToolCallEvent = {
            id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            toolCallId,
            timestamp: Date.now(),
            toolCall,
            status: "running",
          };

          addEvent(event);
        } else if (existingEvent && state === "result") {
          // Update event with result
          const duration = Date.now() - existingEvent.timestamp;
          const result = part.toolInvocation.result;
          
          let status: ToolCallStatus = "success";
          let error: string | undefined;

          if (result === ABORTED) {
            status = "aborted";
          } else if (typeof result === "string" && result.startsWith("Error")) {
            status = "error";
            error = result;
          }

          updateEvent(existingEvent.id, {
            status,
            duration,
            result,
            error,
          });
        }
      }
    });
  }, [messages, events, addEvent, updateEvent]);

  // Sync messages to session
  useEffect(() => {
    if (activeSessionId) {
      updateSessionMessages(messages);
    }
  }, [messages, activeSessionId, updateSessionMessages]);

  // Sync sandbox ID to session
  useEffect(() => {
    if (activeSessionId && sandboxId) {
      updateSessionSandboxId(sandboxId);
    }
  }, [sandboxId, activeSessionId, updateSessionSandboxId]);

  // Load session messages
  useEffect(() => {
    const session = getActiveSession();
    if (session && session.messages.length > 0) {
      setMessages(session.messages as never[]);
      if (session.sandboxId) {
        setSandboxId(session.sandboxId);
      }
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  const stop = () => {
    stopGeneration();

    const lastMessage = messages.at(-1);
    const lastMessageLastPart = lastMessage?.parts.at(-1);
    if (
      lastMessage?.role === "assistant" &&
      lastMessageLastPart?.type === "tool-invocation"
    ) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          ...lastMessage,
          parts: [
            ...lastMessage.parts.slice(0, -1),
            {
              ...lastMessageLastPart,
              toolInvocation: {
                ...lastMessageLastPart.toolInvocation,
                state: "result",
                result: ABORTED,
              },
            },
          ],
        },
      ]);
    }
  };

  const isLoading = status !== "ready";

  const refreshDesktop = useCallback(async () => {
    try {
      setIsInitializing(true);
      const { streamUrl, id } = await getDesktopURL(sandboxId || undefined);
      setStreamUrl(streamUrl);
      setSandboxId(id);
    } catch (err) {
      console.error("Failed to refresh desktop:", err);
      toast.error("Failed to refresh desktop");
    } finally {
      setIsInitializing(false);
    }
  }, [sandboxId]);

  // Kill desktop on page close
  useEffect(() => {
    if (!sandboxId) return;

    const killDesktop = () => {
      if (!sandboxId) return;
      navigator.sendBeacon(
        `/api/kill-desktop?sandboxId=${encodeURIComponent(sandboxId)}`
      );
    };

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS || isSafari) {
      window.addEventListener("pagehide", killDesktop);
      return () => {
        window.removeEventListener("pagehide", killDesktop);
        killDesktop();
      };
    } else {
      window.addEventListener("beforeunload", killDesktop);
      return () => {
        window.removeEventListener("beforeunload", killDesktop);
        killDesktop();
      };
    }
  }, [sandboxId]);

  // Initialize desktop
  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);
        const session = getActiveSession();
        const { streamUrl, id } = await getDesktopURL(
          session?.sandboxId || undefined
        );
        setStreamUrl(streamUrl);
        setSandboxId(id);
      } catch (err) {
        console.error("Failed to initialize desktop:", err);
        toast.error("Failed to initialize desktop");
      } finally {
        setIsInitializing(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateSession = () => {
    createSession(`Session ${sessions.length + 1}`);
    setSandboxId(null);
    setStreamUrl(null);
    setIsInitializing(true);
    // Trigger desktop initialization for new session
    setTimeout(() => {
      refreshDesktop();
    }, 100);
  };

  const handleSwitchSession = (sessionId: string) => {
    switchSession(sessionId);
    const session = sessions.find((s) => s.id === sessionId);
    if (session?.sandboxId) {
      setSandboxId(session.sandboxId);
    }
  };

  return (
    <div className="flex h-dvh relative bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile banner */}
      <div className="flex items-center justify-center fixed left-1/2 -translate-x-1/2 top-5 shadow-md text-xs mx-auto rounded-lg h-8 w-fit bg-blue-600 text-white px-3 py-2 text-left z-50 xl:hidden">
        <span>Desktop view recommended</span>
      </div>

      {/* Desktop Layout */}
      <div className="w-full hidden xl:block">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel: Chat + Debug */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
              {/* Header */}
              <div className="bg-white dark:bg-zinc-950 py-4 px-4 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
                <AISDKLogo />
                <DeployButton />
              </div>

              {/* Session Manager */}
              <SessionManager
                sessions={sessions}
                activeSessionId={activeSessionId}
                onCreateSession={handleCreateSession}
                onSwitchSession={handleSwitchSession}
                onDeleteSession={deleteSession}
              />

              {/* Chat Messages */}
              <div
                className="flex-1 space-y-6 py-4 overflow-y-auto px-4"
                ref={chatContainerRef}
              >
                {messages.length === 0 ? <ProjectInfo /> : null}
                {messages.map((message, i) => (
                  <PreviewMessage
                    message={message}
                    key={message.id}
                    isLoading={isLoading}
                    status={status}
                    isLatestMessage={i === messages.length - 1}
                  />
                ))}
                <div ref={chatEndRef} className="pb-2" />
              </div>

              {/* Prompt Suggestions */}
              {messages.length === 0 && (
                <PromptSuggestions
                  disabled={isInitializing}
                  submitPrompt={(prompt: string) =>
                    append({ role: "user", content: prompt })
                  }
                />
              )}

              {/* Debug Panel */}
              <DebugPanel events={events} derivedState={derivedState} />

              {/* Input */}
              <div className="bg-white dark:bg-zinc-950">
                <form onSubmit={handleSubmit} className="p-4">
                  <Input
                    handleInputChange={handleInputChange}
                    input={input}
                    isInitializing={isInitializing}
                    isLoading={isLoading}
                    status={status}
                    stop={stop}
                  />
                </form>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel: VNC + Tool Details */}
          <ResizablePanel defaultSize={70} minSize={50}>
            <ResizablePanelGroup direction="vertical">
              {/* VNC Viewer */}
              <ResizablePanel defaultSize={70} minSize={30}>
                <VNCViewer
                  streamUrl={streamUrl}
                  isInitializing={isInitializing}
                  onRefresh={refreshDesktop}
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Tool Call Details */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <ToolCallDetails
                  events={events}
                  activeToolCall={derivedState.activeToolCall}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile View (simplified) */}
      <div className="w-full xl:hidden flex flex-col">
        <div className="bg-white dark:bg-zinc-950 py-4 px-4 flex justify-between items-center">
          <AISDKLogo />
          <DeployButton />
        </div>

        <div className="flex-1 space-y-6 py-4 overflow-y-auto px-4">
          {messages.length === 0 ? <ProjectInfo /> : null}
          {messages.map((message, i) => (
            <PreviewMessage
              message={message}
              key={message.id}
              isLoading={isLoading}
              status={status}
              isLatestMessage={i === messages.length - 1}
            />
          ))}
        </div>

        {messages.length === 0 && (
          <PromptSuggestions
            disabled={isInitializing}
            submitPrompt={(prompt: string) =>
              append({ role: "user", content: prompt })
            }
          />
        )}
        <div className="bg-white dark:bg-zinc-950">
          <form onSubmit={handleSubmit} className="p-4">
            <Input
              handleInputChange={handleInputChange}
              input={input}
              isInitializing={isInitializing}
              isLoading={isLoading}
              status={status}
              stop={stop}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
