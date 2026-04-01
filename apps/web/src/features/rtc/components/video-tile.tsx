"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Maximize, MicOff, Minimize, Pin } from "lucide-react";

import type { ParticipantViewModel } from "@/features/room/types/room-state";
import type { UserIdentity } from "@streamify/shared";
import { useMediaStream } from "@/features/rtc/hooks/use-media-stream";
import { Button } from "@/features/ui/components/button";
import { cn } from "@/shared/lib/cn";
import { getParticipantInitials } from "@/features/participants/utils/participant-display";
import { FullscreenParticipantsPanel } from "./fullscreen-participants-panel";

interface VideoTileProps {
  participant: ParticipantViewModel;
  isPinned?: boolean;
  onPin?: (userId: string) => void;
  participants?: ParticipantViewModel[];
  joinRequests?: UserIdentity[];
  onAcceptRequest?: (userId: string) => void;
  onRejectRequest?: (userId: string) => void;
  onAcceptAll?: () => void;
  onSwitchTo?: (userId: string) => void;
}

export const VideoTile = memo(function VideoTile({
  participant,
  isPinned = false,
  onPin,
  participants = [],
  joinRequests = [],
  onAcceptRequest,
  onRejectRequest,
  onAcceptAll,
  onSwitchTo,
}: VideoTileProps) {
  const videoRef = useMediaStream(participant.stream);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const shouldShowVideo =
    Boolean(participant.stream) &&
    (participant.media.cameraEnabled || participant.media.screenSharing);

  // The target active speaker logic can be simulated by checking if they are the local participant, or just pinned
  // Here we assume if they are pinned or it's just a demo prop, we show the "active speaker" border
  const isActiveSpeaker = isPinned; // Using isPinned to simulate active speaker for now

  // Keep state in sync when user exits fullscreen via Escape key
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not supported or blocked
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative w-full h-full overflow-hidden rounded-3xl shadow-lg transition-all duration-500 hover:ring-2 hover:ring-primary/40",
        isActiveSpeaker
          ? "bg-surface-container-lowest border-2 border-indigo-400/50 ring-4 ring-indigo-400/10"
          : "bg-surface-container-lowest"
      )}
    >
      {shouldShowVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            participant.isLocal ? "grayscale-[20%]" : ""
          )}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-container-high">
          {participant.connectionState === "connecting" || participant.connectionState === "new" ? (
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-primary/30 bg-gradient-to-br from-primary/20 to-primary-container/20">
              <span className="text-3xl font-bold text-primary">
                {getParticipantInitials(participant.displayName)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>

      {/* Fullscreen Participants Panel — only visible in fullscreen */}
      {isFullscreen && (participants.length > 0 || joinRequests.length > 0) && (
        <FullscreenParticipantsPanel
          participants={participants}
          currentParticipantId={participant.userId}
          joinRequests={joinRequests}
          onAcceptRequest={onAcceptRequest}
          onRejectRequest={onRejectRequest}
          onAcceptAll={onAcceptAll}
          onSwitchTo={onSwitchTo}
        />
      )}

      {isActiveSpeaker && (
        <div className="absolute top-4 right-4 bg-indigo-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter">
          Speaking
        </div>
      )}

      {/* Participant Info Floating Badge */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
        <span className="text-xs font-bold text-white font-label pb-0.5">
          {participant.displayName} {participant.isLocal ? "(You)" : participant.isHost ? "(Host)" : ""}
        </span>
        {participant.media.screenSharing && (
          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-primary/20 text-primary">Screen</span>
        )}
      </div>

      {/* Bottom-right controls: Mic Off + Fullscreen toggle */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
        {/* Mic Off Status */}
        {!participant.media.microphoneEnabled && (
          <div className="bg-error-container/80 backdrop-blur-sm p-1.5 rounded-full border border-error/20">
            <MicOff className="h-4 w-4 text-error" />
          </div>
        )}

        {/* Fullscreen / Minimize toggle — visible on hover */}
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          className="flex items-center justify-center h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer opacity-0 group-hover:opacity-100"
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Action icons / Statuses on the right  */}
      <div className="absolute top-4 left-4 flex gap-2">
        {onPin ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-lg bg-indigo-500/80 hover:bg-indigo-500 border border-white/20 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-md"
            onClick={() => onPin(participant.userId)}
            aria-label={`Pin ${participant.displayName}`}
          >
            <Pin className="h-4 w-4 text-white" />
          </Button>
        ) : null}
      </div>
    </div>
  );
});

