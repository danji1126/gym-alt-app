// Design Ref: §4.1 + Plan §9.3 — SSR-safe LocalStorage hook for favorite exercise IDs.
// /simplify: storage-hook의 useVersionedStorage로 LS 패턴 위임. public API 변경 0.
"use client";

import { useCallback } from "react";
import {
  useVersionedStorage,
  type VersionedState,
} from "./storage-hook";

const STORAGE_KEY = "gym-alt-app:favorites:v1";

interface StoredState extends VersionedState<1> {
  version: 1;
  ids: string[];
}

const FALLBACK: StoredState = { version: 1, ids: [] };

const STORAGE_OPTS = {
  key: STORAGE_KEY,
  fallback: FALLBACK,
  validate: (parsed: unknown): parsed is StoredState => {
    if (typeof parsed !== "object" || parsed === null) return false;
    const p = parsed as Partial<StoredState>;
    return p.version === 1 && Array.isArray(p.ids);
  },
};

export interface UseFavoritesReturn {
  ids: readonly string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  hydrated: boolean;
}

/** SSR-safe favorite hook. mount 전 빈 배열 (mismatch 0). */
export function useFavorites(): UseFavoritesReturn {
  const { state, setState, hydrated } = useVersionedStorage(STORAGE_OPTS);

  const has = useCallback(
    (id: string) => state.ids.includes(id),
    [state.ids],
  );

  const toggle = useCallback(
    (id: string) => {
      setState((prev) => ({
        version: 1,
        ids: prev.ids.includes(id)
          ? prev.ids.filter((x) => x !== id)
          : [...prev.ids, id],
      }));
    },
    [setState],
  );

  return { ids: state.ids, has, toggle, hydrated };
}
