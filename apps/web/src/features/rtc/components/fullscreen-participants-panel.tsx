"use client";

import { Check, Maximize, Mic, MicOff, MonitorUp, UserPlus, Users, Video, VideoOff, X } from "lucide-react";
import type { ParticipantViewModel } from "@/features/room/types/room-state";
import type { UserIdentity } from "@streamify/shared";
import { getParticipantInitials } from "@/features/participants/utils/participant-display";
import { Separator } from "@/features/ui/components/separator";
import { cn } from "@/shared/lib/cn";
import { useState } from "react";

interface FullscreenParticipantsPanelProps {
    participants: ParticipantViewModel[];
    currentParticipantId: string;
    joinRequests?: UserIdentity[];
    onAcceptRequest?: (userId: string) => void;
    onRejectRequest?: (userId: string) => void;
    onAcceptAll?: () => void;
    onSwitchTo?: (userId: string) => void;
}

/**
 * A compact, glassmorphic participants panel that overlays on the left
 * side of a fullscreen video/screen-share tile. Shows each participant's
 * status (mic, camera, screen share) and allows switching the fullscreen
 * view to another participant.
 */
export function FullscreenParticipantsPanel({
    participants,
    currentParticipantId,
    joinRequests = [],
    onAcceptRequest,
    onRejectRequest,
    onAcceptAll,
    onSwitchTo,
}: FullscreenParticipantsPanelProps) {
    const [collapsed, setCollapsed] = useState(false);

    if (collapsed) {
        return (
            <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="absolute top-4 left-4 z-50 flex items-center justify-center h-10 w-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 cursor-pointer shadow-2xl"
                aria-label="Show participants"
            >
                <Users className="h-4.5 w-4.5" />
            </button>
        );
    }

    return (
        <div className="absolute top-4 left-4 bottom-4 z-50 w-64 flex flex-col bg-black/50 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/90">
                        Participants
                    </span>
                    <span className="text-[10px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded-full">
                        {participants.length}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setCollapsed(true)}
                    className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-all text-white/50 hover:text-white cursor-pointer"
                    aria-label="Collapse panel"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Participants List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 space-y-4">

                {/* Waiting Room Section */}
                {joinRequests.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-white/50">
                                Waiting Room ({joinRequests.length})
                            </span>
                        </div>
                        <div className="space-y-1">
                            {joinRequests.map((req) => (
                                <div key={req.userId} className="flex items-center justify-between group px-3 py-2.5 rounded-xl border border-transparent hover:bg-white/5 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                                            <UserPlus className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex flex-col justify-center">
                                            <p className="truncate text-[12px] font-semibold text-white/90">
                                                {req.displayName}
                                            </p>
                                            <span className="text-[9px] uppercase tracking-widest font-bold text-white/40">
                                                Waiting...
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-100 transition-opacity">
                                        <button onClick={() => onRejectRequest?.(req.userId)} className="p-1.5 rounded-full hover:bg-destructive/20 text-destructive/70 hover:text-destructive transition-colors">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => onAcceptRequest?.(req.userId)} className="p-1.5 rounded-full hover:bg-emerald-500/20 text-emerald-500/80 hover:text-emerald-500 transition-colors">
                                            <Check className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {onAcceptAll && joinRequests.length > 1 && (
                            <div className="pt-1 pb-1">
                                <button
                                    onClick={onAcceptAll}
                                    className="w-full bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 text-secondary hover:text-secondary text-[10px] font-bold py-2 rounded-xl transition-all uppercase tracking-widest"
                                >
                                    Accept All
                                </button>
                            </div>
                        )}
                        <div className="px-2 pt-1">
                            <Separator className="bg-white/10" />
                        </div>
                    </div>
                )}

                {/* In Meeting Section */}
                <div className="space-y-2">
                    {joinRequests.length > 0 && (
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-white/50">
                                In Meeting ({participants.length})
                            </span>
                        </div>
                    )}
                    <div className="space-y-1">
                        {participants.map((participant) => {
                            const isCurrentView = participant.userId === currentParticipantId;
                            const isMicOn = participant.media.microphoneEnabled;
                            const isCamOn = participant.media.cameraEnabled;
                            const isPresenting = participant.media.screenSharing;
                            const isOffline =
                                participant.connectionState === "disconnected" ||
                                participant.connectionState === "failed";

                            return (
                                <div
                                    key={participant.userId}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                                        isCurrentView
                                            ? "bg-primary/15 border border-primary/30"
                                            : "hover:bg-white/5 border border-transparent"
                                    )}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div
                                            className={cn(
                                                "h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold border",
                                                isPresenting
                                                    ? "bg-primary/20 border-primary/50 text-primary"
                                                    : isOffline
                                                        ? "bg-white/5 border-white/10 text-white/30"
                                                        : "bg-white/10 border-white/15 text-white/80"
                                            )}
                                        >
                                            {getParticipantInitials(participant.displayName)}
                                        </div>
                                        {/* Online / presenting dot */}
                                        {isPresenting && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center border-2 border-black/60">
                                                <MonitorUp className="h-2 w-2 text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-[12px] font-semibold truncate",
                                            isOffline ? "text-white/30" : "text-white/90"
                                        )}>
                                            {participant.displayName}
                                            {participant.isLocal ? " (You)" : ""}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {isPresenting ? (
                                                <span className="text-[9px] uppercase tracking-widest font-bold text-primary">
                                                    Presenting
                                                </span>
                                            ) : isOffline ? (
                                                <span className="text-[9px] uppercase tracking-widest font-bold text-white/30">
                                                    Offline
                                                </span>
                                            ) : isMicOn ? (
                                                <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-400">
                                                    Speaking
                                                </span>
                                            ) : (
                                                <span className="text-[9px] uppercase tracking-widest font-bold text-white/40">
                                                    Listening
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status icons */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {isMicOn ? (
                                            <Mic className="h-3 w-3 text-emerald-400" />
                                        ) : (
                                            <MicOff className="h-3 w-3 text-red-400/70" />
                                        )}
                                        {isCamOn ? (
                                            <Video className="h-3 w-3 text-emerald-400" />
                                        ) : (
                                            <VideoOff className="h-3 w-3 text-red-400/70" />
                                        )}

                                        {/* Switch-to button: show for other participants who have screen share or video */}
                                        {onSwitchTo && !isCurrentView && !isOffline && (
                                            <button
                                                type="button"
                                                onClick={() => onSwitchTo(participant.userId)}
                                                className="ml-1 h-6 w-6 rounded-full flex items-center justify-center bg-white/10 hover:bg-primary/30 text-white/60 hover:text-white transition-all cursor-pointer"
                                                aria-label={`Switch to ${participant.displayName}`}
                                            >
                                                <Maximize className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
