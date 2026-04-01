import { STORAGE_KEYS } from "@streamify/shared";

interface StoredRoomAccess {
  accessToken: string;
  creator: boolean;
}

type StoredRoomAccessMap = Record<string, StoredRoomAccess>;

function readRoomAccessMap(): StoredRoomAccessMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.roomAccess);
    return raw ? (JSON.parse(raw) as StoredRoomAccessMap) : {};
  } catch {
    return {};
  }
}

function writeRoomAccessMap(next: StoredRoomAccessMap) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEYS.roomAccess, JSON.stringify(next));
}

export function storeRoomAccess(roomId: string, accessToken: string, creator = false) {
  const next = readRoomAccessMap();
  next[roomId] = {
    accessToken,
    creator: creator || next[roomId]?.creator === true,
  };
  writeRoomAccessMap(next);
}

export function markAsCreator(roomId: string, accessToken: string) {
  storeRoomAccess(roomId, accessToken, true);
}

export function getRoomAccessToken(roomId: string): string | null {
  return readRoomAccessMap()[roomId]?.accessToken ?? null;
}

export function clearRoomAccess(roomId: string) {
  const next = readRoomAccessMap();
  if (!(roomId in next)) {
    return;
  }

  delete next[roomId];
  writeRoomAccessMap(next);
}

export function isRoomCreator(roomId: string): boolean {
  return readRoomAccessMap()[roomId]?.creator === true;
}
