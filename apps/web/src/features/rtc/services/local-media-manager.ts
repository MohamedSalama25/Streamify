"use client";

import type { ParticipantMediaState } from "@streamify/shared";

import type { MediaBootstrapResult } from "../types";

function composeStream(audioTrack: MediaStreamTrack | null, videoTrack: MediaStreamTrack | null) {
  const stream = new MediaStream();

  if (audioTrack) {
    stream.addTrack(audioTrack);
  }

  if (videoTrack) {
    stream.addTrack(videoTrack);
  }

  return stream;
}

function toUserFacingMediaError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to access your camera or microphone.";
  }

  if (error.name === "NotAllowedError") {
    return "Camera or microphone permission was denied.";
  }

  if (error.name === "NotFoundError") {
    return "No camera or microphone was found on this device.";
  }

  return error.message || "Unable to access your camera or microphone.";
}

export class LocalMediaManager {
  private audioTrack: MediaStreamTrack | null = null;
  private cameraTrack: MediaStreamTrack | null = null;
  private screenStream: MediaStream | null = null;
  private screenTrack: MediaStreamTrack | null = null;

  onScreenShareEnded?: () => void;

  async initialize(): Promise<MediaBootstrapResult> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return {
        previewStream: null,
        outgoingStream: null,
        mediaState: this.getMediaState(),
        error: "Media devices are not available in this browser.",
      };
    }

    const constraintsList: MediaStreamConstraints[] = [
      { audio: true, video: true },
      { audio: true, video: false },
      { audio: false, video: true },
    ];

    let lastError: unknown;

    for (const constraints of constraintsList) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.audioTrack = stream.getAudioTracks()[0] ?? this.audioTrack;
        this.cameraTrack = stream.getVideoTracks()[0] ?? this.cameraTrack;
        this._cameraEnabled = !!this.cameraTrack;

        return {
          previewStream: this.getPreviewStream(),
          outgoingStream: this.getOutgoingStream(),
          mediaState: this.getMediaState(),
        };
      } catch (error) {
        lastError = error;
      }
    }

    return {
      previewStream: null,
      outgoingStream: null,
      mediaState: this.getMediaState(),
      error: toUserFacingMediaError(lastError),
    };
  }

  getPreviewStream() {
    return this.getOutgoingStream();
  }

  getOutgoingStream() {
    const audioTrack = this.audioTrack;
    const videoTrack = this.getActiveVideoTrack();

    if (!audioTrack && !videoTrack) {
      return null;
    }

    return composeStream(audioTrack, videoTrack);
  }

  private _cameraEnabled = false;

  getMediaState(): ParticipantMediaState {
    return {
      microphoneEnabled: this.audioTrack?.enabled ?? false,
      cameraEnabled: this._cameraEnabled,
      screenSharing: Boolean(this.screenTrack),
    };
  }

  getActiveVideoTrack() {
    return this.screenTrack ?? this.cameraTrack;
  }

  toggleMicrophone() {
    if (!this.audioTrack) {
      throw new Error("Microphone is unavailable.");
    }

    this.audioTrack.enabled = !this.audioTrack.enabled;
    return this.getMediaState();
  }

  async toggleCamera() {
    if (this._cameraEnabled && this.cameraTrack) {
      // Turning camera OFF: stop the track entirely so remote peers
      // receive replaceTrack(null) and stop showing stale frames.
      this.cameraTrack.stop();
      this.cameraTrack = null;
      this._cameraEnabled = false;
    } else {
      // Turning camera ON: acquire a fresh track so remote peers
      // receive replaceTrack(newTrack) and properly render video.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.cameraTrack = stream.getVideoTracks()[0] ?? null;
        this._cameraEnabled = !!this.cameraTrack;
      } catch {
        throw new Error("Camera is unavailable.");
      }
    }

    return this.getMediaState();
  }

  async startScreenShare() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      throw new Error("Screen sharing is not available in this browser.");
    }

    if (this.screenTrack) {
      return {
        previewStream: this.getPreviewStream(),
        outgoingStream: this.getOutgoingStream(),
        mediaState: this.getMediaState(),
      };
    }

    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    const screenTrack = screenStream.getVideoTracks()[0];

    if (!screenTrack) {
      throw new Error("No screen track was provided.");
    }

    this.screenStream = screenStream;
    this.screenTrack = screenTrack;
    this.screenTrack.onended = () => {
      this.stopScreenShare();
      this.onScreenShareEnded?.();
    };

    return {
      previewStream: this.getPreviewStream(),
      outgoingStream: this.getOutgoingStream(),
      mediaState: this.getMediaState(),
    };
  }

  stopScreenShare() {
    if (this.screenTrack) {
      this.screenTrack.onended = null;
      this.screenTrack.stop();
    }
    this.screenStream?.getTracks().forEach((track) => track.stop());
    this.screenTrack = null;
    this.screenStream = null;

    return {
      previewStream: this.getPreviewStream(),
      outgoingStream: this.getOutgoingStream(),
      mediaState: this.getMediaState(),
    };
  }

  dispose() {
    this.audioTrack?.stop();
    this.cameraTrack?.stop();
    this.stopScreenShare();
    this.audioTrack = null;
    this.cameraTrack = null;
  }
}
