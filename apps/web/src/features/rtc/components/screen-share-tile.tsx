"use client";

import { MonitorUp } from "lucide-react";
import type { ParticipantViewModel } from "@/features/room/types/room-state";
import { useMediaStream } from "@/features/rtc/hooks/use-media-stream";

interface ScreenShareTileProps {
    participant: ParticipantViewModel;
}

/**
 * A full-width "stage" tile that renders the screen-share stream
 * of a given participant. Styled with Glassmorphic overlays
 * consistent with the Kinetic Void design system.
 */
export function ScreenShareTile({ participant }: ScreenShareTileProps) {
    const videoRef = useMediaStream(participant.stream);

    return (
        <section className="relative w-full rounded-2xl overflow-hidden bg-surface-container-lowest border border-white/5 shadow-2xl aspect-video max-h-[65vh]">
            {/* Video stream */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={participant.isLocal}
                className="absolute inset-0 w-full h-full object-contain bg-black"
            />

            {/* Top-left presenter badge — Glassmorphic */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <MonitorUp className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] uppercase tracking-widest font-bold text-white/90">
                        {participant.isLocal ? "You are presenting" : `${participant.displayName} is presenting`}
                    </span>
                </div>
            </div>

            {/* Bottom-right quality badge */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-slate-400">
                <span>Screen Share</span>
                <span className="flex items-center gap-1.5 text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_#4edea3]" />
                    LIVE
                </span>
            </div>
        </section>
    );
}
