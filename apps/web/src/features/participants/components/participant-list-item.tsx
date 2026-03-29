import { MicOff, MonitorUp, UserRound, VideoOff } from "lucide-react";

import type { ParticipantViewModel } from "@/features/room/types/room-state";
import { Avatar, AvatarFallback } from "@/features/ui/components/avatar";
import { Badge } from "@/features/ui/components/badge";
import { cn } from "@/shared/lib/cn";
import { getConnectionBadgeVariant, getParticipantInitials } from "../utils/participant-display";

interface ParticipantListItemProps {
  participant: ParticipantViewModel;
}

export function ParticipantListItem({ participant }: ParticipantListItemProps) {
  const isPresenting = participant.media.screenSharing;
  const isSpeaking = participant.media.microphoneEnabled;
  const isOffline = participant.connectionState === "disconnected" || participant.connectionState === "failed";

  return (
    <div className="flex items-center justify-between group px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className={cn(
            "h-10 w-10 border",
            isPresenting ? "border-primary" : "border-outline-variant/30",
            isOffline ? "opacity-50 grayscale" : ""
          )}>
            <AvatarFallback className="bg-surface-container-high text-on-surface font-headline font-bold">
              {getParticipantInitials(participant.displayName)}
            </AvatarFallback>
          </Avatar>

          {/* Status Badge overlay on avatar */}
          {isPresenting && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center border-2 border-surface shadow-sm">
              <MonitorUp className="h-2.5 w-2.5 text-on-primary" strokeWidth={3} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex flex-col justify-center">
          <p className={cn(
            "truncate text-sm font-bold font-headline",
            isOffline ? "text-on-surface-variant/50" : "text-on-surface"
          )}>
            {participant.displayName}
            {participant.isLocal ? " (You)" : ""}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center">
            {isPresenting ? (
              <span className="text-[9px] uppercase tracking-widest font-bold text-primary">
                Presenting
              </span>
            ) : isOffline ? (
              <span className="text-[9px] uppercase tracking-widest font-bold text-on-surface-variant/50">
                Offline
              </span>
            ) : isSpeaking ? (
              <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-400">
                Speaking
              </span>
            ) : (
              <span className="text-[9px] uppercase tracking-widest font-bold text-secondary">
                Listening
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-on-surface-variant/40 group-hover:text-on-surface-variant/80 transition-all">
        {!isSpeaking && <MicOff className="h-3.5 w-3.5" />}
      </div>
    </div>
  );
}

