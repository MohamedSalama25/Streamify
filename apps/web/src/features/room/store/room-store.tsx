"use client";

import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from "react";
import type { RoomParticipant, UserIdentity } from "@streamify/shared";

import {
  createInitialRoomState,
  type ParticipantViewModel,
  type RoomAction,
  type RoomState,
} from "../types/room-state";

interface RoomStoreValue {
  state: RoomState;
  dispatch: Dispatch<RoomAction>;
}

const RoomStoreContext = createContext<RoomStoreValue | null>(null);

function createParticipantViewModel(
  participant: RoomParticipant,
  currentUser: UserIdentity | null,
  existing?: ParticipantViewModel,
): ParticipantViewModel {
  const isLocal = participant.userId === currentUser?.userId;

  return {
    ...participant,
    isLocal,
    stream: existing?.stream ?? null,
    connectionState: existing?.connectionState ?? (isLocal ? "connected" : "new"),
  };
}

function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case "session/reset":
      return createInitialRoomState(action.payload.roomId, action.payload.currentUser);
    case "session/set-status":
      return { ...state, status: action.payload };
    case "session/set-current-user":
      return { ...state, currentUser: action.payload };
    case "session/set-room-error":
      return { ...state, roomError: action.payload };
    case "session/set-media-error":
      return { ...state, mediaError: action.payload };
    case "session/set-socket-connected":
      return { ...state, socketConnected: action.payload };
    case "messages/add":
      return {
        ...state,
        messages: [...state.messages.filter((message) => message.id !== action.payload.id), action.payload],
      };
    case "participants/set": {
      const nextParticipants = action.payload.reduce<Record<string, ParticipantViewModel>>(
        (accumulator, participant) => {
          accumulator[participant.userId] = createParticipantViewModel(
            participant,
            state.currentUser,
            state.participants[participant.userId],
          );
          return accumulator;
        },
        {},
      );

      return {
        ...state,
        participants: nextParticipants,
      };
    }
    case "participants/upsert":
      return {
        ...state,
        participants: {
          ...state.participants,
          [action.payload.userId]: createParticipantViewModel(
            action.payload,
            state.currentUser,
            state.participants[action.payload.userId],
          ),
        },
      };
    case "participants/remove": {
      const nextParticipants = { ...state.participants };
      delete nextParticipants[action.payload.userId];

      return {
        ...state,
        participants: nextParticipants,
        pinnedUserId:
          state.pinnedUserId === action.payload.userId ? null : state.pinnedUserId,
      };
    }
    case "participants/set-stream": {
      const existing = state.participants[action.payload.userId];
      if (!existing) {
        const currentUser = state.currentUser;
        if (!currentUser || currentUser.userId !== action.payload.userId) {
          return state;
        }

        return {
          ...state,
          participants: {
            ...state.participants,
            [currentUser.userId]: {
              userId: currentUser.userId,
              displayName: currentUser.displayName,
              joinedAt: new Date().toISOString(),
              isHost: false,
              media: {
                microphoneEnabled: false,
                cameraEnabled: false,
                screenSharing: false,
              },
              isLocal: true,
              stream: action.payload.stream,
              connectionState: "connected",
            },
          },
        };
      }

      return {
        ...state,
        participants: {
          ...state.participants,
          [action.payload.userId]: {
            ...existing,
            stream: action.payload.stream,
          },
        },
      };
    }
    case "participants/set-media": {
      const existing = state.participants[action.payload.userId];
      if (!existing) {
        return state;
      }

      return {
        ...state,
        participants: {
          ...state.participants,
          [action.payload.userId]: {
            ...existing,
            media: action.payload.media,
          },
        },
      };
    }
    case "participants/set-connection-state": {
      const existing = state.participants[action.payload.userId];
      if (!existing) {
        return state;
      }

      return {
        ...state,
        participants: {
          ...state.participants,
          [action.payload.userId]: {
            ...existing,
            connectionState: action.payload.connectionState,
          },
        },
      };
    }
    case "ui/set-pinned":
      return {
        ...state,
        pinnedUserId: action.payload,
      };
    default:
      return state;
  }
}

interface RoomProviderProps {
  roomId: string;
  currentUser: UserIdentity | null;
  children: ReactNode;
}

export function RoomProvider({ roomId, currentUser, children }: RoomProviderProps) {
  const [state, dispatch] = useReducer(roomReducer, createInitialRoomState(roomId, currentUser));

  const value = useMemo(
    () => ({
      state,
      dispatch,
    }),
    [state],
  );

  return <RoomStoreContext.Provider value={value}>{children}</RoomStoreContext.Provider>;
}

export function useRoomStore() {
  const context = useContext(RoomStoreContext);
  if (!context) {
    throw new Error("useRoomStore must be used inside RoomProvider.");
  }

  return context;
}
