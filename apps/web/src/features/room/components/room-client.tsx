"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { UserIdentity } from "@streamify/shared";

import { usePersistentIdentity } from "@/features/auth/hooks/use-persistent-identity";
import { useSortedParticipants } from "@/features/participants/hooks/use-sorted-participants";
import { ParticipantsSidebar } from "@/features/participants/components/participants-sidebar";
import { ChatPanel } from "@/features/chat/components/chat-panel";
import { useRoomSession } from "@/features/room/hooks/use-room-session";
import { RoomProvider, useRoomStore } from "@/features/room/store/room-store";
import { RoomControls } from "@/features/room/components/room-controls";
import { RoomHeader } from "@/features/room/components/room-header";
import { VideoGrid } from "@/features/rtc/components/video-grid";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/features/ui/components/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/ui/components/card";
import { LoadingState } from "@/shared/components/loading-state";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/cn";

function RoomExperience({ roomId, identity }: { roomId: string; identity: UserIdentity }) {
  const { state, dispatch } = useRoomStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");
  const { copyRoomLink, leaveRoom, sendMessage, toggleCamera, toggleMicrophone, toggleScreenShare } =
    useRoomSession(roomId, identity);

  const participants = useSortedParticipants(Object.values(state.participants));
  const localParticipant = participants.find((participant) => participant.userId === identity.userId);

  if (state.status === "preparing" || state.status === "joining") {
    return <LoadingState label="Joining room and preparing media..." />;
  }

  if (state.roomError && participants.length === 0) {
    return (
      <Card className="mx-auto max-w-xl z-50 relative mt-20">
        <CardHeader>
          <CardTitle>Unable to join room</CardTitle>
          <CardDescription>{state.roomError.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={ROUTES.home}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-100 transition hover:bg-white/10",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="fixed inset-0 bg-surface-container-lowest font-body text-on-surface flex overflow-hidden">
      {/* Dynamic Background from Stitch Kinetic Void */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] opacity-20" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[160px] opacity-30" />
      </div>

      {/* Top Header */}
      <header className="absolute top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold font-display tracking-tight text-white">Streamify</div>
          <div className="w-px h-6 bg-white/10 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              Room ID: {roomId}
            </span>
            <span className="text-xs font-bold text-slate-400 flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] mr-2"></span>
              Live: {participants.length} Participants
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="ml-2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary border border-outline-variant/20 overflow-hidden">
            {identity.displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className="absolute left-0 top-0 bottom-0 z-40 flex flex-col pt-16 bg-surface-container-low w-80 transition-transform duration-300 hidden xl:flex border-r border-white/5 shadow-2xl">
        <div className="px-6 py-4">
          <h2 className="text-xl font-bold text-primary font-headline">Collaboration</h2>
          <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest font-label mt-1">Real-time Sync</p>
        </div>

        <nav className="flex flex-col mt-2">
          <button
            onClick={() => setActiveTab("participants")}
            className={cn(
              "flex items-center gap-4 px-6 py-4 transition-all duration-200 border-r-2 outline-none",
              activeTab === "participants"
                ? "text-primary border-primary bg-primary/10 font-bold"
                : "text-on-surface-variant border-transparent hover:text-on-surface hover:bg-white/5 font-medium"
            )}
          >
            <span className="font-label">Participants</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex items-center gap-4 px-6 py-4 transition-all duration-200 border-r-2 outline-none",
              activeTab === "chat"
                ? "text-primary border-primary bg-primary/10 font-bold"
                : "text-on-surface-variant border-transparent hover:text-on-surface hover:bg-white/5 font-medium"
            )}
          >
            <span className="font-label">Chat</span>
          </button>
        </nav>

        {/* Dynamic Sidebar Content */}
        <div className="flex-1 flex flex-col px-4 pb-6 mt-4 min-h-0 overflow-hidden">
          {activeTab === "chat" ? (
            <ChatPanel
              messages={state.messages}
              currentUserId={identity.userId}
              onSendMessage={sendMessage}
              className="h-full border-0 bg-transparent shadow-none [&>div]:px-0"
            />
          ) : (
            <ParticipantsSidebar
              participants={participants}
              className="h-full border-0 bg-transparent shadow-none [&>div]:px-0 flex-1 overflow-hidden"
            />
          )}
        </div>

        <div className="p-6 pt-2 border-t border-outline-variant/10 shrink-0">
          <button
            onClick={() => void copyRoomLink()}
            className="w-full bg-primary/20 text-primary border border-primary/30 font-bold py-3 rounded-full hover:bg-primary hover:text-on-primary transition-all active:scale-95 text-sm uppercase tracking-widest outline-none"
          >
            Invite Members
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 absolute top-0 right-0 bottom-0 left-0 xl:left-80 pt-16 flex flex-col z-10 overflow-hidden">
        <div className="flex-1 flex flex-col p-4 md:p-6 relative min-h-0 max-w-full overflow-hidden">
          {state.mediaError ? (
            <Card className="border-error/20 bg-error-container/20 flex-shrink-0 mb-4 mx-auto">
              <CardContent className="p-4 text-sm text-error">{state.mediaError}</CardContent>
            </Card>
          ) : null}

          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-24 flex flex-col min-h-0 min-w-0">
            <VideoGrid
              participants={participants}
              onPin={(userId) => dispatch({ type: "ui/set-pinned", payload: userId })}
              onSwitchTo={async (userId) => {
                // Exit fullscreen first, then pin the selected participant
                if (document.fullscreenElement) {
                  await document.exitFullscreen();
                }
                dispatch({ type: "ui/set-pinned", payload: userId });
              }}
            />
          </div>
        </div>
      </main>

      {/* Room Controls overlaps everything */}
      <RoomControls
        microphoneEnabled={localParticipant?.media.microphoneEnabled ?? false}
        cameraEnabled={localParticipant?.media.cameraEnabled ?? false}
        screenSharing={localParticipant?.media.screenSharing ?? false}
        onToggleMicrophone={toggleMicrophone}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onCopyLink={() => void copyRoomLink()}
        onLeaveRoom={leaveRoom}
        onOpenParticipants={() => { setParticipantsOpen(true); setActiveTab("participants"); }}
        onOpenChat={() => { setChatOpen(true); setActiveTab("chat"); }}
      />

      {/* Mobile Sheets */}
      <Sheet open={participantsOpen && window.innerWidth < 1280} onOpenChange={setParticipantsOpen}>
        <SheetContent side="right" className="xl:hidden bg-surface border-white/5">
          <SheetHeader>
            <SheetTitle>Participants</SheetTitle>
          </SheetHeader>
          <ParticipantsSidebar participants={participants} className="border-0 bg-transparent mt-4 shadow-none" />
        </SheetContent>
      </Sheet>

      <Sheet open={chatOpen && window.innerWidth < 1280} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="xl:hidden bg-surface border-white/5">
          <SheetHeader>
            <SheetTitle>Chat</SheetTitle>
          </SheetHeader>
          <ChatPanel messages={state.messages} currentUserId={identity.userId} onSendMessage={sendMessage} className="h-full border-0 bg-transparent mt-4 shadow-none" />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function RoomClient({ roomId }: { roomId: string }) {
  const { identity, hydrated } = usePersistentIdentity();

  if (!hydrated) {
    return <LoadingState label="Loading your identity..." className="min-h-screen" />;
  }

  if (!identity) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Display name required</CardTitle>
            <CardDescription>
              Join through the home page first so Streamify can store your local
              identity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={ROUTES.home}
              className={cn(
                "inline-flex h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-100 transition hover:bg-white/10",
              )}
            >
              Go to home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <RoomProvider roomId={roomId} currentUser={identity}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-6 lg:py-8">
        <RoomExperience roomId={roomId} identity={identity} />
      </div>
    </RoomProvider>
  );
}
