import type { PeerConnectionState } from "@streamify/shared";

import type { ParticipantViewModel } from "@/features/room/types/room-state";

export function getParticipantInitials(displayName: string) {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join("");
}

export function sortParticipants(participants: ParticipantViewModel[]) {
  return [...participants].sort((left, right) => {
    if (left.isLocal !== right.isLocal) {
      return left.isLocal ? -1 : 1;
    }

    if (left.media.screenSharing !== right.media.screenSharing) {
      return left.media.screenSharing ? -1 : 1;
    }

    if (left.isHost !== right.isHost) {
      return left.isHost ? -1 : 1;
    }

    return left.joinedAt.localeCompare(right.joinedAt);
  });
}

export function getConnectionBadgeVariant(state: PeerConnectionState) {
  switch (state) {
    case "connected":
      return "success" as const;
    case "connecting":
    case "new":
      return "warning" as const;
    case "failed":
    case "disconnected":
    case "closed":
      return "danger" as const;
    default:
      return "muted" as const;
  }
}

