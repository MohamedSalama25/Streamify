"use client";

import { useMemo } from "react";
import type { ParticipantViewModel } from "@/features/room/types/room-state";
import { VideoTile } from "./video-tile";
import { ScreenShareTile } from "./screen-share-tile";
import { cn } from "@/shared/lib/cn";

interface VideoGridProps {
  participants: ParticipantViewModel[];
  onPin?: (userId: string) => void;
  onSwitchTo?: (userId: string) => void;
}

/**
 * Zoom-like adaptive grid layout.
 *
 * Rules:
 *  - 1 participant  → 1 full-size tile
 *  - 2 participants → 2 side-by-side (1×2)
 *  - 3-4            → 2×2
 *  - 5-6            → 3×2 (3 cols, 2 rows)
 *  - 7-9            → 3×3
 *  - 10+            → 5 per row (5×N)
 *
 * If someone is screen-sharing, their screen-share stream gets a
 * separate large tile in the same grid (it takes the full width,
 * pushing the webcam tiles below).
 */
export function VideoGrid({ participants, onPin, onSwitchTo }: VideoGridProps) {
  // Separate screen-sharing participants
  const { screenSharers, allTiles } = useMemo(() => {
    const sharers = participants.filter((p) => p.media.screenSharing);
    return { screenSharers: sharers, allTiles: participants };
  }, [participants]);

  if (participants.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] text-center text-sm text-slate-500 min-h-[320px]">
        Waiting for participants to join.
      </div>
    );
  }

  const hasScreenShare = screenSharers.length > 0;

  // Calculate grid layout based on participant count (excluding screen-share tiles)
  const webcamCount = allTiles.length;
  const gridClass = getGridClass(webcamCount, hasScreenShare);

  return (
    <div className="flex flex-1 flex-col gap-4 min-h-0 w-full">
      {/* Screen Share Stage(s) — full-width, stacked at the top */}
      {hasScreenShare && (
        <div className="flex flex-col gap-4 w-full">
          {screenSharers.map((sharer) => (
            <ScreenShareTile
              key={`screen-${sharer.userId}`}
              participant={sharer}
              participants={participants}
              onSwitchTo={onSwitchTo}
            />
          ))}
        </div>
      )}

      {/* Webcam Grid */}
      <div
        className={cn(
          "grid w-full gap-3 flex-1 min-h-0",
          gridClass,
        )}
      >
        {allTiles.map((participant) => (
          <div key={participant.userId} className="relative w-full h-full min-h-[120px]">
            <VideoTile
              participant={participant}
              onPin={onPin}
              participants={participants}
              onSwitchTo={onSwitchTo}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Returns appropriate Tailwind grid classes based on how many webcam tiles
 * need to be shown, and whether a screen-share is active (which shrinks
 * the webcam area).
 */
function getGridClass(count: number, hasScreenShare: boolean): string {
  if (hasScreenShare) {
    // When screen-share is active, webcam tiles are small — fit as many as possible
    if (count <= 1) return "grid-cols-1 max-h-[200px]";
    if (count <= 4) return "grid-cols-2 sm:grid-cols-4 max-h-[200px]";
    return "grid-cols-3 sm:grid-cols-5 max-h-[200px]";
  }

  // No screen share — full Zoom-like layout
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  if (count <= 6) return "grid-cols-2 sm:grid-cols-3";
  if (count <= 9) return "grid-cols-3";
  return "grid-cols-3 sm:grid-cols-5";
}
