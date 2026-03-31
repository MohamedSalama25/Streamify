"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { displayNameSchema, roomIdSchema } from "@streamify/shared";
import { toast } from "sonner";

import type { UserIdentity } from "@streamify/shared";
import { createRoomRequest } from "@/features/room/services/room-socket-service";
import { markAsCreator } from "@/features/room/utils/room-creator-store";
import { ROUTES } from "@/shared/constants/routes";
import { getSocket } from "@/shared/lib/socket";

interface UseHomeActionsOptions {
  displayName: string;
  roomId: string;
  upsertIdentity: (displayName: string) => UserIdentity;
}

export function useHomeActions({
  displayName,
  roomId,
  upsertIdentity,
}: UseHomeActionsOptions) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleCreateRoom() {
    try {
      const normalizedDisplayName = displayNameSchema.parse(displayName);
      const identity = upsertIdentity(normalizedDisplayName);
      const socket = getSocket();
      const result = await createRoomRequest(socket, {
        user: identity,
      });

      // Mark this user as the creator of this room
      markAsCreator(result.roomId);

      startTransition(() => {
        router.push(ROUTES.room(result.roomId));
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create a room.");
    }
  }

  function handleJoinRoom() {
    try {
      const normalizedDisplayName = displayNameSchema.parse(displayName);
      const normalizedRoomId = roomIdSchema.parse(roomId);
      upsertIdentity(normalizedDisplayName);

      startTransition(() => {
        router.push(ROUTES.room(normalizedRoomId));
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to join that room.");
    }
  }

  return {
    isPending,
    handleCreateRoom,
    handleJoinRoom,
  };
}

