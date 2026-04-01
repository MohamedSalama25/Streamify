"use client";

import { useCallback, useEffect, useRef } from "react";

export function useMediaStream(stream: MediaStream | null) {
  const mediaRef = useRef<HTMLVideoElement | null>(null);

  const attachMediaRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (mediaRef.current && mediaRef.current !== node) {
        mediaRef.current.srcObject = null;
      }

      mediaRef.current = node;

      if (!node) {
        return;
      }

      if (node.srcObject !== stream) {
        node.srcObject = stream;
      }

      if (stream) {
        void node.play().catch(() => {
          // Autoplay can be interrupted during rapid mount/unmount cycles.
        });
      }
    },
    [stream],
  );

  useEffect(() => {
    const mediaElement = mediaRef.current;
    if (!mediaElement) {
      return;
    }

    if (mediaElement.srcObject !== stream) {
      mediaElement.srcObject = stream;
    }

    if (stream) {
      void mediaElement.play().catch(() => {
        // The browser may delay playback until metadata is ready.
      });
    }
  }, [stream]);

  return attachMediaRef;
}
