import type { ParticipantViewModel } from "@/features/room/types/room-state";
import { Badge } from "@/features/ui/components/badge";
import { MonitorUp } from "lucide-react";

interface PinnedStageProps {
  participant: ParticipantViewModel;
}

export function PinnedStage({ participant }: PinnedStageProps) {
  const isPresenting = participant.media.screenSharing;

  return (
    <section className="flex-1 w-full bg-surface-container rounded-3xl border border-white/5 relative overflow-hidden flex justify-center items-center shadow-2xl min-h-[400px]">
      {/* Top Left Header overlays */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap items-center gap-3 z-10">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] uppercase tracking-widest font-bold text-slate-300">
          <MonitorUp className="h-3.5 w-3.5" />
          {participant.isLocal ? "You are presenting" : `${participant.displayName} is presenting`}
        </div>
        {isPresenting && (
          <div className="hidden sm:block bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] tracking-widest font-bold text-slate-400">
            Active Stream Session
          </div>
        )}
      </div>

      {/* Connection details bottom right */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-slate-400 z-10">
        <span>1080p • 60fps</span>
        <span className="flex items-center gap-1.5 text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_#4edea3]"></span>
          STABLE
        </span>
      </div>

      {/* The video stream itself */}
      <div className="w-full h-full max-h-full p-2">
        {/* Reusing VideoTile but forcing it to essentially be the raw stream. 
             We can actually just render the raw video tag here if we wanted to extract the useMediaStream logic,
             but since we are using components, we can render VideoTile and override its styles or just keep it simple.
             Actually, VideoTile brings its own styling which clashes. 
             So we will not use VideoTile here, we use the hook directly! (Wait, let me just pass a prop to VideoTile? No, this component is isolated).
             Since useMediaStream is available, we can just use the video tag!
          */}
        <PinnedVideo participant={participant} />
      </div>
    </section>
  );
}

// Extract hook call to a subcomponent to cleanly use the hook.
import { useMediaStream } from "@/features/rtc/hooks/use-media-stream";

function PinnedVideo({ participant }: { participant: ParticipantViewModel }) {
  const videoRef = useMediaStream(participant.stream);
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={participant.isLocal}
      className="w-full h-full object-contain rounded-2xl"
    />
  );
}

