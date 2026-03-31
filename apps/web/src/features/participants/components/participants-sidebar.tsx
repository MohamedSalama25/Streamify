import type { ParticipantViewModel } from "@/features/room/types/room-state";
import type { UserIdentity } from "@streamify/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/components/card";
import { ScrollArea } from "@/features/ui/components/scroll-area";
import { Separator } from "@/features/ui/components/separator";
import { Check, UserPlus, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { ParticipantListItem } from "./participant-list-item";

interface ParticipantsSidebarProps {
  participants: ParticipantViewModel[];
  joinRequests?: UserIdentity[];
  onAcceptRequest?: (userId: string) => void;
  onRejectRequest?: (userId: string) => void;
  onAcceptAll?: () => void;
  className?: string;
}

export function ParticipantsSidebar({
  participants,
  joinRequests = [],
  onAcceptRequest,
  onRejectRequest,
  onAcceptAll,
  className,
}: ParticipantsSidebarProps) {
  return (
    <div className={cn("flex-1 overflow-hidden flex flex-col pl-4 pr-2", className)}>
      <ScrollArea className="h-full pr-4 custom-scrollbar">
        <div className="space-y-6 pt-4 pb-4">

          {/* Waiting Room Section */}
          {joinRequests.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                  Waiting Room ({joinRequests.length})
                </span>
              </div>
              <div className="space-y-1">
                {joinRequests.map((req) => (
                  <div key={req.userId} className="flex items-center justify-between group px-2 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center border border-primary/20 shrink-0">
                        <UserPlus className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        <p className="truncate text-sm font-bold font-headline text-on-surface">
                          {req.displayName}
                        </p>
                        <span className="text-[9px] uppercase tracking-widest font-bold text-on-surface-variant/70">
                          Waiting...
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-100 transition-opacity">
                      <button onClick={() => onRejectRequest?.(req.userId)} className="p-1.5 rounded-full hover:bg-destructive/20 text-destructive/70 hover:text-destructive transition-colors" title="Reject">
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => onAcceptRequest?.(req.userId)} className="p-1.5 rounded-full hover:bg-emerald-500/20 text-emerald-500/80 hover:text-emerald-500 transition-colors" title="Accept">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {onAcceptAll && joinRequests.length > 1 && (
                <div className="px-2 pt-1 pb-2">
                  <button
                    onClick={onAcceptAll}
                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 text-[11px] font-bold py-2 rounded-xl transition-all uppercase tracking-widest"
                  >
                    Accept All
                  </button>
                </div>
              )}
              <div className="px-2 pt-1">
                <Separator className="bg-outline-variant/10" />
              </div>
            </div>
          )}

          {/* Participants Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                In Meeting ({participants.length})
              </span>
            </div>
            <div className="space-y-1">
              {participants.map((participant) => (
                <ParticipantListItem key={participant.userId} participant={participant} />
              ))}
            </div>
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}

