import type {
  IceCandidateValue,
  SessionDescriptionValue,
} from "@streamify/shared";

export function toSessionDescriptionValue(
  description: RTCSessionDescriptionInit,
): SessionDescriptionValue {
  if (!description.type || !description.sdp) {
    throw new Error("Invalid session description.");
  }

  return {
    type: description.type,
    sdp: description.sdp,
  };
}

export function fromSessionDescriptionValue(
  description: SessionDescriptionValue,
): RTCSessionDescriptionInit {
  return {
    type: description.type,
    sdp: description.sdp,
  };
}

export function toIceCandidateValue(candidate: RTCIceCandidateInit): IceCandidateValue {
  if (!candidate.candidate) {
    throw new Error("Invalid ICE candidate.");
  }

  return {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid ?? null,
    sdpMLineIndex: candidate.sdpMLineIndex ?? null,
    usernameFragment: candidate.usernameFragment ?? null,
  };
}

export function fromIceCandidateValue(candidate: IceCandidateValue): RTCIceCandidateInit {
  return {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
    usernameFragment: candidate.usernameFragment ?? undefined,
  };
}

