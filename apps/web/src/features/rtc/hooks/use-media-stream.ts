"use client";

import { useEffect, useRef } from "react";

export function useMediaStream(stream: MediaStream | null) {
  const mediaRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!mediaRef.current) {
      return;
    }

    mediaRef.current.srcObject = stream;
  }, [stream]);

  return mediaRef;
}

