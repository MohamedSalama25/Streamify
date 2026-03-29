import type { ParticipantViewModel } from "@/features/room/types/room-state";
import { VideoTile } from "./video-tile";

interface VideoGridProps {
  participants: ParticipantViewModel[];
  onPin?: (userId: string) => void;
  isHorizontal?: boolean;
}

export function VideoGrid({ participants, onPin, isHorizontal }: VideoGridProps) {
  if (participants.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] text-center text-sm text-slate-500">
        Waiting for participants to join.
      </div>
    );
  }

  if (isHorizontal) {
    return (
      <div className="flex flex-row overflow-x-auto gap-4 custom-scrollbar pb-2 min-h-[140px]">
        {participants.map((participant) => (
          <div key={participant.userId} className="w-[200px] h-[120px] flex-shrink-0">
            <VideoTile participant={participant} onPin={onPin} />
          </div>
        ))}
        {/* Placeholder for +X more tile if there were many speakers, but mapped here as is */}
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
      {participants.map((participant) => (
        <VideoTile key={participant.userId} participant={participant} onPin={onPin} />
      ))}
    </div>
  );
}

