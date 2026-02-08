"use client";

import React, { memo } from "react";
import { cn } from "@/lib/utils";

type VNCViewerProps = {
  streamUrl: string | null;
  isInitializing: boolean;
  onRefresh: () => void;
};

const VNCViewerComponent = ({
  streamUrl,
  isInitializing,
  onRefresh,
}: VNCViewerProps) => {
  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {streamUrl ? (
        <>
          <iframe
            src={streamUrl}
            className="w-full h-full"
            style={{
              transformOrigin: "center",
              width: "100%",
              height: "100%",
            }}
            allow="autoplay"
            title="VNC Desktop Stream"
          />
          <button
            onClick={onRefresh}
            disabled={isInitializing}
            className={cn(
              "absolute top-4 right-4 z-10",
              "bg-black/50 hover:bg-black/70 text-white",
              "px-4 py-2 rounded-lg text-sm font-medium",
              "transition-colors duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isInitializing ? "Creating desktop..." : "New Desktop"}
          </button>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-white text-sm">
          {isInitializing ? "Initializing desktop..." : "Loading stream..."}
        </div>
      )}
    </div>
  );
};

// Memoize to prevent re-renders when chat updates
export const VNCViewer = memo(
  VNCViewerComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.streamUrl === nextProps.streamUrl &&
      prevProps.isInitializing === nextProps.isInitializing
    );
  }
);

VNCViewer.displayName = "VNCViewer";
