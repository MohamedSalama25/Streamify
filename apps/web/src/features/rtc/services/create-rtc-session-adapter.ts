"use client";

import type { RtcSessionAdapter, RtcSessionAdapterOptions } from "../types";
import { MeshPeerClient } from "./mesh-peer-client";

export function createRtcSessionAdapter(
  options: RtcSessionAdapterOptions,
): RtcSessionAdapter {
  return new MeshPeerClient(options);
}
