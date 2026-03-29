"use client";

import type { ReactNode } from "react";
import {
  Copy,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Users,
  Video,
  VideoOff,
} from "lucide-react";


import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/features/ui/components/tooltip";
import { cn } from "@/shared/lib/cn";

interface RoomControlsProps {
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
  screenSharing: boolean;
  onToggleMicrophone: () => Promise<void>;
  onToggleCamera: () => Promise<void>;
  onToggleScreenShare: () => Promise<void>;
  onCopyLink: () => void;
  onLeaveRoom: () => Promise<void>;
  onOpenParticipants: () => void;
  onOpenChat: () => void;
}

function ControlButton({
  label,
  destructive = false,
  onClick,
  children,
}: {
  label: string;
  destructive?: boolean;
  onClick: () => void | Promise<void>;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="flex flex-col items-center gap-1 group"
          onClick={() => void onClick()}
          type="button"
        >
          <div className={cn(
            "p-2.5 sm:p-3 rounded-full transition-all duration-150 active:scale-90 flex items-center justify-center border",
            destructive
              ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              : label.includes("Mute") && !label.includes("Unmute")
                ? "bg-primary/15 border-primary/30 text-primary scale-105 shadow-[0_0_15px_rgba(192,193,255,0.2)] hover:bg-primary/25"
                : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-primary hover:border-primary/20"
          )}>
            {children}
          </div>
          <span className={cn(
            "text-[7px] sm:text-[8px] uppercase font-bold tracking-[0.15em] hidden sm:block mt-0.5",
            destructive ? "text-red-500" : label.includes("Mute") && !label.includes("Unmute") ? "text-primary" : "text-slate-500"
          )}>
            {label.split(" ")[0]}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent className="sm:hidden">{label}</TooltipContent>
    </Tooltip>
  );
}

export function RoomControls({
  microphoneEnabled,
  cameraEnabled,
  screenSharing,
  onToggleMicrophone,
  onToggleCamera,
  onToggleScreenShare,
  onCopyLink,
  onLeaveRoom,
  onOpenParticipants,
  onOpenChat,
}: RoomControlsProps) {
  return (
    <TooltipProvider>
      <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center items-center pb-3 sm:pb-6 pointer-events-none">
        <div className="bg-slate-950/90 backdrop-blur-2xl rounded-full px-3 sm:px-5 py-1 flex items-center gap-1 sm:gap-2 shadow-[0_0_50px_0_rgba(0,0,0,0.5)] pointer-events-auto border border-white/5 mx-4 max-w-full overflow-x-auto custom-scrollbar">
          <ControlButton
            label={microphoneEnabled ? "Mute microphone" : "Unmute microphone"}
            onClick={onToggleMicrophone}
          >
            {microphoneEnabled ? <Mic className="h-5 w-5 sm:h-6 sm:w-6" /> : <MicOff className="h-5 w-5 sm:h-6 sm:w-6" />}
          </ControlButton>

          <ControlButton
            label={cameraEnabled ? "Turn camera off" : "Turn camera on"}
            onClick={onToggleCamera}
          >
            {cameraEnabled ? <Video className="h-5 w-5 sm:h-6 sm:w-6" /> : <VideoOff className="h-5 w-5 sm:h-6 sm:w-6" />}
          </ControlButton>

          {screenSharing ? (
            <button
              onClick={onToggleScreenShare}
              className="flex items-center gap-2 bg-secondary text-on-secondary px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold uppercase tracking-widest text-[9px] sm:text-[10px] shadow-[0_0_20px_rgba(78,222,163,0.3)] hover:brightness-110 active:scale-95 transition-all mx-1"
            >
              <MonitorUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Stop Sharing
            </button>
          ) : (
            <ControlButton
              label="Share screen"
              onClick={onToggleScreenShare}
            >
              <MonitorUp className="h-5 w-5 sm:h-6 sm:w-6" />
            </ControlButton>
          )}

          <div className="xl:hidden flex items-center gap-1 sm:gap-2">
            <ControlButton label="Participants" onClick={onOpenParticipants}>
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            </ControlButton>
            <ControlButton label="Chat" onClick={onOpenChat}>
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
            </ControlButton>
          </div>

          <div className="w-px h-8 bg-outline-variant/20 mx-1 sm:mx-2 hidden sm:block" />

          <ControlButton label="Copy link" onClick={onCopyLink}>
            <Copy className="h-5 w-5 sm:h-6 sm:w-6" />
          </ControlButton>

          <ControlButton label="Leave room" destructive onClick={onLeaveRoom}>
            <PhoneOff className="h-5 w-5 sm:h-6 sm:w-6" />
          </ControlButton>
        </div>
      </div>
    </TooltipProvider>
  );
}
