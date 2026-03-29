import type { ParticipantMediaState } from "@streamify/shared";

export interface MediaBootstrapResult {
  previewStream: MediaStream | null;
  outgoingStream: MediaStream | null;
  mediaState: ParticipantMediaState;
  error?: string;
}

