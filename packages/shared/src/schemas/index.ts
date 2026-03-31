import { z } from "zod";

export const roomIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z2-9]{6}$/, "Room codes are 6 uppercase characters.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Display name must be at least 2 characters.")
  .max(32, "Display name must be 32 characters or less.");

export const userIdentitySchema = z.object({
  userId: z.string().uuid(),
  displayName: displayNameSchema,
});

export const participantMediaStateSchema = z.object({
  microphoneEnabled: z.boolean(),
  cameraEnabled: z.boolean(),
  screenSharing: z.boolean(),
});

export const roomParticipantSchema = z.object({
  userId: z.string().uuid(),
  displayName: displayNameSchema,
  isHost: z.boolean(),
  joinedAt: z.string().datetime(),
  media: participantMediaStateSchema,
});

export const roomCreatePayloadSchema = z.object({
  user: userIdentitySchema,
});

export const roomJoinPayloadSchema = z.object({
  roomId: roomIdSchema,
  user: userIdentitySchema,
});

export const roomLeavePayloadSchema = z.object({
  roomId: roomIdSchema,
  userId: z.string().uuid(),
});

export const presenceMediaStatePayloadSchema = z.object({
  roomId: roomIdSchema,
  userId: z.string().uuid(),
  media: participantMediaStateSchema.partial(),
});

export const chatSendPayloadSchema = z.object({
  roomId: roomIdSchema,
  sender: userIdentitySchema,
  text: z.string().trim().min(1).max(1000),
});

export const chatMessageSchema = z.object({
  id: z.string().min(1),
  roomId: roomIdSchema,
  text: z.string().trim().min(1).max(1000),
  sender: userIdentitySchema,
  timestamp: z.string().datetime(),
});

export const sessionDescriptionSchema = z.object({
  type: z.enum(["offer", "answer", "pranswer", "rollback"]),
  sdp: z.string().min(1),
});

export const iceCandidateSchema = z.object({
  candidate: z.string().min(1),
  sdpMid: z.string().nullable(),
  sdpMLineIndex: z.number().int().nullable(),
  usernameFragment: z.string().nullable().optional(),
});

export const rtcSignalEnvelopeSchema = z.object({
  roomId: roomIdSchema,
  fromUserId: z.string().uuid(),
  toUserId: z.string().uuid(),
});

export const rtcOfferPayloadSchema = rtcSignalEnvelopeSchema.extend({
  description: sessionDescriptionSchema,
});

export const rtcAnswerPayloadSchema = rtcSignalEnvelopeSchema.extend({
  description: sessionDescriptionSchema,
});

export const rtcIceCandidatePayloadSchema = rtcSignalEnvelopeSchema.extend({
  candidate: iceCandidateSchema,
});

export const rtcPeerReadyPayloadSchema = z.object({
  roomId: roomIdSchema,
  user: userIdentitySchema,
});

export const rtcConnectionStatePayloadSchema = rtcSignalEnvelopeSchema.extend({
  state: z.enum(["new", "connecting", "connected", "disconnected", "failed", "closed"]),
});

export const screenSharePayloadSchema = z.object({
  roomId: roomIdSchema,
  userId: z.string().uuid(),
});

export const joinRequestPayloadSchema = z.object({
  roomId: roomIdSchema,
  user: userIdentitySchema,
});

export const joinResponsePayloadSchema = z.object({
  roomId: roomIdSchema,
  targetUserId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});

export const cancelJoinRequestPayloadSchema = z.object({
  roomId: roomIdSchema,
  userId: z.string().uuid(),
});

export const iceServerConfigSchema = z.object({
  urls: z.array(z.string().min(1)).min(1),
  username: z.string().optional(),
  credential: z.string().optional(),
});

export const rtcConfigurationResponseSchema = z.object({
  iceServers: z.array(iceServerConfigSchema),
});

