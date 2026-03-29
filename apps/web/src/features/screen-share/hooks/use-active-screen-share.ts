"use client";

import { useMemo } from "react";

import type { ParticipantViewModel } from "@/features/room/types/room-state";

export function useActiveScreenShare(participants: ParticipantViewModel[]) {
  return useMemo(
    () => participants.find((participant) => participant.media.screenSharing) ?? null,
    [participants],
  );
}

