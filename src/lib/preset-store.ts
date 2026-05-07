// Design Ref: §4.2 + Plan §9.4 — SSR-safe LocalStorage hook for active GymPreset.
// /simplify: storage-hook의 useVersionedStorage로 LS 패턴 위임. public API 변경 0.
"use client";

import { useCallback } from "react";
import seedPresets from "../../data/gym-presets.json";
import {
  useVersionedStorage,
  type VersionedState,
} from "./storage-hook";
import type { DetailedEquipment, GymPreset } from "./types";

const STORAGE_KEY = "gym-alt-app:preset:v1";

const SEED: GymPreset[] = seedPresets as GymPreset[];
// 시드는 최소 1개 이상이어야 함 (data/gym-presets.json — M1 산출물 보장).
const DEFAULT_PRESET: GymPreset = SEED[0] ?? {
  id: "fallback-empty",
  name: "(빈 프리셋)",
  availableEquipment: [],
};

interface StoredState extends VersionedState<1> {
  version: 1;
  activeId: string;
  presets: GymPreset[];
}

const FALLBACK: StoredState = {
  version: 1,
  activeId: DEFAULT_PRESET.id,
  presets: SEED,
};

// 모듈 레벨 const — useVersionedStorage 내부 useEffect deps에 안전.
const STORAGE_OPTS = {
  key: STORAGE_KEY,
  fallback: FALLBACK,
  validate: (parsed: unknown): parsed is StoredState => {
    if (typeof parsed !== "object" || parsed === null) return false;
    const p = parsed as Partial<StoredState>;
    return (
      p.version === 1 &&
      typeof p.activeId === "string" &&
      Array.isArray(p.presets) &&
      p.presets.length > 0
    );
  },
};

export interface UsePresetReturn {
  /** 현재 활성 프리셋. SSR/mount 전엔 시드 default, mount 후 LS 값. */
  preset: GymPreset;
  /** 단일 기구 토글 (in/out). */
  toggleEquipment: (eq: DetailedEquipment) => void;
  /** 전체 가용 기구 교체. */
  setEquipment: (eqs: DetailedEquipment[]) => void;
  /** 시드 default로 복원. */
  reset: () => void;
  /** mount 후 LS 동기화 완료 여부. UI에서 깜빡임 회피용. */
  hydrated: boolean;
}

/**
 * SSR-safe 활성 프리셋 hook.
 *
 * /simplify 후 useVersionedStorage를 위임자로 사용.
 * 동작은 동일 — SSR fallback, mount-time hydration, write-on-change.
 */
export function usePreset(): UsePresetReturn {
  const { state, setState, hydrated } = useVersionedStorage(STORAGE_OPTS);

  const preset: GymPreset =
    state.presets.find((p) => p.id === state.activeId) ?? DEFAULT_PRESET;

  const toggleEquipment = useCallback(
    (eq: DetailedEquipment) => {
      setState((prev) => {
        const target =
          prev.presets.find((p) => p.id === prev.activeId) ?? DEFAULT_PRESET;
        const has = target.availableEquipment.includes(eq);
        const updated: GymPreset = {
          ...target,
          availableEquipment: has
            ? target.availableEquipment.filter((e) => e !== eq)
            : [...target.availableEquipment, eq],
        };
        return {
          ...prev,
          presets: prev.presets.map((p) => (p.id === target.id ? updated : p)),
        };
      });
    },
    [setState],
  );

  const setEquipment = useCallback(
    (eqs: DetailedEquipment[]) => {
      setState((prev) => {
        const target =
          prev.presets.find((p) => p.id === prev.activeId) ?? DEFAULT_PRESET;
        const updated: GymPreset = { ...target, availableEquipment: eqs };
        return {
          ...prev,
          presets: prev.presets.map((p) => (p.id === target.id ? updated : p)),
        };
      });
    },
    [setState],
  );

  const reset = useCallback(() => {
    setState(() => FALLBACK);
  }, [setState]);

  return { preset, toggleEquipment, setEquipment, reset, hydrated };
}
