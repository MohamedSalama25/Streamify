"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize, Minimize, MonitorUp } from "lucide-react";
import type { ParticipantViewModel } from "@/features/room/types/room-state";
import { useMediaStream } from "@/features/rtc/hooks/use-media-stream";
import type { UserIdentity } from "@streamify/shared";
import { FullscreenParticipantsPanel } from "./fullscreen-participants-panel";

interface ScreenShareTileProps {
    participant: ParticipantViewModel;
    participants?: ParticipantViewModel[];
    joinRequests?: UserIdentity[];
    onAcceptRequest?: (userId: string) => void;
    onRejectRequest?: (userId: string) => void;
    onAcceptAll?: () => void;
    onSwitchTo?: (userId: string) => void;
}

/**
 * A full-width "stage" tile that renders the screen-share stream
 * of a given participant. Styled with Glassmorphic overlays
 * consistent with the Kinetic Void design system.
 */
export function ScreenShareTile({
    participant,
    participants = [],
    joinRequests = [],
    onAcceptRequest,
    onRejectRequest,
    onAcceptAll,
    onSwitchTo
}: ScreenShareTileProps) {
    const videoRef = useMediaStream(participant.stream);
    const containerRef = useRef<HTMLElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

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
        <section
            ref={containerRef}
            className="relative w-full rounded-2xl overflow-hidden bg-surface-container-lowest border border-white/5 shadow-2xl aspect-video max-h-[65vh]"
        >
            {/* Video stream */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={participant.isLocal}
                className="absolute inset-0 w-full h-full object-contain bg-black"
            />

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

            {/* Top-left presenter badge — Glassmorphic */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <MonitorUp className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] uppercase tracking-widest font-bold text-white/90">
                        {participant.isLocal ? "You are presenting" : `${participant.displayName} is presenting`}
                    </span>
                </div>
            </div>

            {/* Bottom-right: quality badge + fullscreen toggle */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-slate-400">
                    <span>Screen Share</span>
                    <span className="flex items-center gap-1.5 text-secondary">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_#4edea3]" />
                        LIVE
                    </span>
                </div>

                {/* Fullscreen / Minimize toggle */}
                <button
                    type="button"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer"
                >
                    {isFullscreen ? (
                        <Minimize className="h-4 w-4" />
                    ) : (
                        <Maximize className="h-4 w-4" />
                    )}
                </button>
            </div>
        </section>
    );
}

