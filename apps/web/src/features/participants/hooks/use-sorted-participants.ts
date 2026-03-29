"use client";

import { useMemo } from "react";

import type { ParticipantViewModel } from "@/features/room/types/room-state";
import { sortParticipants } from "../utils/participant-display";

export function useSortedParticipants(participants: ParticipantViewModel[]) {
  return useMemo(() => sortParticipants(participants), [participants]);
}

