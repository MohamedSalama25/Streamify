import type { ParticipantViewModel } from "@/features/room/types/room-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/components/card";
import { ScrollArea } from "@/features/ui/components/scroll-area";
import { Separator } from "@/features/ui/components/separator";
import { cn } from "@/shared/lib/cn";
import { ParticipantListItem } from "./participant-list-item";

interface ParticipantsSidebarProps {
  participants: ParticipantViewModel[];
  className?: string;
}

export function ParticipantsSidebar({
  participants,
  className,
}: ParticipantsSidebarProps) {
  return (
    <div className={cn("flex-1 overflow-hidden flex flex-col pl-4 pr-2", className)}>
      <ScrollArea className="h-full pr-4 custom-scrollbar">
        <div className="space-y-4 pt-4">
          {participants.map((participant) => (
            <ParticipantListItem key={participant.userId} participant={participant} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

