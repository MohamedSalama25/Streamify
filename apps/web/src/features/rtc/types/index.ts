import type {
  ParticipantMediaState,
  PeerConnectionState,
  RtcAnswerPayload,
  RtcIceCandidatePayload,
  RtcOfferPayload,
} from "@streamify/shared";

export interface MediaBootstrapResult {
  previewStream: MediaStream | null;
  outgoingStream: MediaStream | null;
  mediaState: ParticipantMediaState;
  error?: string;
}

export interface RtcSessionAdapterOptions {
  roomId: string;
  selfUserId: string;
  iceServers: RTCIceServer[];
  localStream: MediaStream | null;
  onRemoteStream: (userId: string, stream: MediaStream | null) => void;
  onConnectionStateChange: (userId: string, state: PeerConnectionState) => void;
  onSignalOffer: (payload: RtcOfferPayload) => void;
  onSignalAnswer: (payload: RtcAnswerPayload) => void;
  onIceCandidate: (payload: RtcIceCandidatePayload) => void;
}

export interface RtcSessionAdapter {
  createOffer(targetUserId: string): Promise<void>;
  handleOffer(payload: RtcOfferPayload): Promise<void>;
  handleAnswer(payload: RtcAnswerPayload): Promise<void>;
  handleIceCandidate(payload: RtcIceCandidatePayload): Promise<void>;
  updateLocalStream(stream: MediaStream | null): void;
  removePeer(userId: string): void;
  destroy(): void;
}
