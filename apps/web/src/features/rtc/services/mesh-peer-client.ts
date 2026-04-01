"use client";

import type {
  RtcAnswerPayload,
  RtcIceCandidatePayload,
  RtcOfferPayload,
} from "@streamify/shared";

import type { RtcSessionAdapter, RtcSessionAdapterOptions } from "../types";
import {
  fromIceCandidateValue,
  fromSessionDescriptionValue,
  toIceCandidateValue,
  toSessionDescriptionValue,
} from "../utils/signal-mappers";

export class MeshPeerClient implements RtcSessionAdapter {
  private readonly peers = new Map<string, RTCPeerConnection>();
  private readonly remoteStreams = new Map<string, MediaStream>();
  private readonly pendingIceCandidates = new Map<string, RTCIceCandidateInit[]>();
  private readonly senderKindMap = new WeakMap<RTCRtpSender, "audio" | "video">();
  private readonly pendingNegotiations = new Set<string>();
  private readonly negotiationTasks = new Map<string, Promise<void>>();
  private localStream: MediaStream | null;

  constructor(private readonly options: RtcSessionAdapterOptions) {
    this.localStream = options.localStream;
  }

  async createOffer(targetUserId: string) {
    this.pendingNegotiations.add(targetUserId);
    await this.flushNegotiation(targetUserId);
  }

  async handleOffer(payload: RtcOfferPayload) {
    const peer = this.ensurePeer(payload.fromUserId);
    if (peer.signalingState === "have-local-offer") {
      await peer.setLocalDescription({ type: "rollback" });
    }

    await peer.setRemoteDescription(fromSessionDescriptionValue(payload.description));
    await this.flushPendingCandidates(payload.fromUserId);

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    if (!peer.localDescription) {
      return;
    }

    this.options.onSignalAnswer({
      roomId: payload.roomId,
      fromUserId: this.options.selfUserId,
      toUserId: payload.fromUserId,
      description: toSessionDescriptionValue({
        type: peer.localDescription.type,
        sdp: peer.localDescription.sdp ?? undefined,
      }),
    });

    this.flushNegotiation(payload.fromUserId);
  }

  async handleAnswer(payload: RtcAnswerPayload) {
    const peer = this.ensurePeer(payload.fromUserId);
    await peer.setRemoteDescription(fromSessionDescriptionValue(payload.description));
    await this.flushPendingCandidates(payload.fromUserId);
    this.flushNegotiation(payload.fromUserId);
  }

  async handleIceCandidate(payload: RtcIceCandidatePayload) {
    const peer = this.ensurePeer(payload.fromUserId);
    const candidate = fromIceCandidateValue(payload.candidate);

    if (!peer.remoteDescription) {
      const queue = this.pendingIceCandidates.get(payload.fromUserId) ?? [];
      queue.push(candidate);
      this.pendingIceCandidates.set(payload.fromUserId, queue);
      return;
    }

    await peer.addIceCandidate(candidate);
  }

  updateLocalStream(stream: MediaStream | null) {
    this.localStream = stream;

    this.peers.forEach((peer, userId) => {
      const requiresRenegotiation = this.syncPeerTracks(peer);

      if (requiresRenegotiation) {
        this.pendingNegotiations.add(userId);
        this.flushNegotiation(userId);
      }
    });
  }

  removePeer(userId: string) {
    const peer = this.peers.get(userId);
    if (peer) {
      peer.close();
      this.peers.delete(userId);
    }

    const remoteStream = this.remoteStreams.get(userId);
    remoteStream?.getTracks().forEach((track) => track.stop());
    this.remoteStreams.delete(userId);
    this.pendingIceCandidates.delete(userId);
    this.pendingNegotiations.delete(userId);
    this.negotiationTasks.delete(userId);
    this.options.onRemoteStream(userId, null);
    this.options.onConnectionStateChange(userId, "closed");
  }

  destroy() {
    Array.from(this.peers.keys()).forEach((userId) => this.removePeer(userId));
  }

  private ensurePeer(userId: string) {
    const existing = this.peers.get(userId);
    if (existing) {
      return existing;
    }

    const peer = new RTCPeerConnection({
      iceServers: this.options.iceServers,
    });

    peer.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }

      this.options.onIceCandidate({
        roomId: this.options.roomId,
        fromUserId: this.options.selfUserId,
        toUserId: userId,
        candidate: toIceCandidateValue({
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          usernameFragment: event.candidate.usernameFragment,
        }),
      });
    };

    peer.ontrack = (event) => {
      const current = this.remoteStreams.get(userId) ?? new MediaStream();

      event.streams[0]?.getTracks().forEach((track) => {
        if (!current.getTracks().find((existingTrack) => existingTrack.id === track.id)) {
          current.addTrack(track);
        }
      });

      if (event.streams[0] && current.getTracks().length === 0) {
        event.streams[0].getTracks().forEach((track) => current.addTrack(track));
      }

      this.remoteStreams.set(userId, current);
      this.options.onRemoteStream(userId, current);
    };

    peer.onconnectionstatechange = () => {
      this.options.onConnectionStateChange(userId, peer.connectionState);
      if (peer.connectionState === "failed" || peer.connectionState === "closed") {
        this.options.onRemoteStream(userId, null);
      }
    };

    this.peers.set(userId, peer);
    this.syncPeerTracks(peer);
    return peer;
  }

  private syncPeerTracks(peer: RTCPeerConnection) {
    const audioTrack = this.localStream?.getAudioTracks()[0] ?? null;
    const videoTrack = this.localStream?.getVideoTracks()[0] ?? null;

    const audioRenegotiation = this.syncTrack(peer, "audio", audioTrack);
    const videoRenegotiation = this.syncTrack(peer, "video", videoTrack);

    return audioRenegotiation || videoRenegotiation;
  }

  private syncTrack(
    peer: RTCPeerConnection,
    kind: "audio" | "video",
    nextTrack: MediaStreamTrack | null,
  ) {
    const sender = peer.getSenders().find(
      (candidate) =>
        candidate.track?.kind === kind ||
        (!candidate.track && this.senderKindMap.get(candidate) === kind),
    );

    if (sender) {
      if (sender.track === nextTrack) {
        return false;
      }

      this.senderKindMap.set(sender, kind);
      void sender.replaceTrack(nextTrack);
      return false;
    }

    if (nextTrack && this.localStream) {
      const newSender = peer.addTrack(nextTrack, this.localStream);
      this.senderKindMap.set(newSender, kind);
      return true;
    }

    return false;
  }

  private flushNegotiation(userId: string) {
    const existingTask = this.negotiationTasks.get(userId);
    if (existingTask) {
      return existingTask;
    }

    const task = (async () => {
      while (this.pendingNegotiations.has(userId)) {
        const peer = this.ensurePeer(userId);

        if (peer.signalingState !== "stable") {
          return;
        }

        this.pendingNegotiations.delete(userId);

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        if (!peer.localDescription) {
          continue;
        }

        this.options.onSignalOffer({
          roomId: this.options.roomId,
          fromUserId: this.options.selfUserId,
          toUserId: userId,
          description: toSessionDescriptionValue({
            type: peer.localDescription.type,
            sdp: peer.localDescription.sdp ?? undefined,
          }),
        });
      }
    })().finally(() => {
      this.negotiationTasks.delete(userId);

      const peer = this.peers.get(userId);
      if (this.pendingNegotiations.has(userId) && peer?.signalingState === "stable") {
        void this.flushNegotiation(userId);
      }
    });

    this.negotiationTasks.set(userId, task);
    return task;
  }

  private async flushPendingCandidates(userId: string) {
    const peer = this.peers.get(userId);
    if (!peer) {
      return;
    }

    const queue = this.pendingIceCandidates.get(userId) ?? [];
    for (const candidate of queue) {
      await peer.addIceCandidate(candidate);
    }
    this.pendingIceCandidates.delete(userId);
  }
}
