"use client";

import { STORAGE_KEYS, displayNameSchema, type UserIdentity } from "@streamify/shared";

export function getStoredIdentity() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEYS.identity);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<UserIdentity>;
    if (!parsed.userId || !parsed.displayName) {
      return null;
    }

    return {
      userId: parsed.userId,
      displayName: parsed.displayName,
    } satisfies UserIdentity;
  } catch {
    return null;
  }
}

export function persistIdentity(identity: UserIdentity) {
  if (typeof window === "undefined") {
    return identity;
  }

  window.localStorage.setItem(STORAGE_KEYS.identity, JSON.stringify(identity));
  return identity;
}

export function ensureStoredIdentity(displayName: string) {
  const nextDisplayName = displayNameSchema.parse(displayName);
  const existing = getStoredIdentity();

  const identity: UserIdentity = {
    userId: existing?.userId ?? crypto.randomUUID(),
    displayName: nextDisplayName,
  };

  return persistIdentity(identity);
}

