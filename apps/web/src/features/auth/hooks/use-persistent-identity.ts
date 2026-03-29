"use client";

import { useEffect, useState } from "react";
import type { UserIdentity } from "@streamify/shared";

import { ensureStoredIdentity, getStoredIdentity, persistIdentity } from "../utils/identity-storage";

export function usePersistentIdentity() {
  const [identity, setIdentityState] = useState<UserIdentity | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIdentityState(getStoredIdentity());
    setHydrated(true);
  }, []);

  return {
    identity,
    hydrated,
    upsertIdentity(displayName: string) {
      const nextIdentity = ensureStoredIdentity(displayName);
      setIdentityState(nextIdentity);
      return nextIdentity;
    },
    setIdentity(nextIdentity: UserIdentity) {
      persistIdentity(nextIdentity);
      setIdentityState(nextIdentity);
      return nextIdentity;
    },
  };
}
