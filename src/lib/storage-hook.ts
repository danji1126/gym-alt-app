// /simplify: preset-store와 favorite-store가 동일한 SSR-safe LocalStorage 패턴을 공유 → generic 추출.
// 동작 변경 0, public API 변경 0. 단지 내부 재사용을 위한 helper.
"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Versioned LocalStorage state — schema 마이그레이션 마커 포함.
 * 모든 LS 항목은 `version` 필드를 가져 향후 호환성을 유지.
 */
export interface VersionedState<V extends number> {
  version: V;
}

interface StorageHookOptions<T extends VersionedState<number>> {
  /** LocalStorage 키 (namespace 포함 권장: `app:scope:vN`). */
  key: string;
  /** 미설정 / parse 실패 / version 미스매치 시 fallback. */
  fallback: T;
  /** 사용자 정의 검증 — true 반환 시 valid. version 외 추가 검증 가능. */
  validate?: (parsed: unknown) => parsed is T;
}

function read<T extends VersionedState<number>>(
  opts: StorageHookOptions<T>,
): T {
  if (typeof window === "undefined") return opts.fallback;
  try {
    const raw = window.localStorage.getItem(opts.key);
    if (!raw) return opts.fallback;
    const parsed: unknown = JSON.parse(raw);
    if (opts.validate) {
      return opts.validate(parsed) ? parsed : opts.fallback;
    }
    // 기본 검증: version 매치 + object
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "version" in parsed &&
      (parsed as { version: unknown }).version === opts.fallback.version
    ) {
      return parsed as T;
    }
    return opts.fallback;
  } catch {
    return opts.fallback;
  }
}

function write<T extends VersionedState<number>>(
  key: string,
  state: T,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // quota / private mode — silent
  }
}

export interface UseVersionedStorageReturn<T extends VersionedState<number>> {
  state: T;
  setState: (updater: (prev: T) => T) => void;
  hydrated: boolean;
}

/**
 * Versioned LocalStorage SSR-safe hook.
 *
 * - SSR 단계 / 첫 client render: fallback 사용 (mismatch 0)
 * - mount 후 useEffect로 LS 동기화
 * - setState 호출 시 LS write
 *
 * 사용처: preset-store, favorite-store.
 */
export function useVersionedStorage<T extends VersionedState<number>>(
  opts: StorageHookOptions<T>,
): UseVersionedStorageReturn<T> {
  const [state, setStateRaw] = useState<T>(opts.fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStateRaw(read(opts));
    setHydrated(true);
    // opts는 호출자에서 stable 객체 가정 — 모듈 레벨 const로 정의됨
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setState = useCallback(
    (updater: (prev: T) => T) => {
      setStateRaw((prev) => {
        const next = updater(prev);
        write(opts.key, next);
        return next;
      });
    },
    [opts.key],
  );

  return { state, setState, hydrated };
}
