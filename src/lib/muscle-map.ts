// Design Ref: §3.1 + §3.2 — Dataset 17 MuscleGroup → react-body-highlighter LibraryMuscle 매핑.
// Plan SC: TV-3 — 17개 muscle 모두 매핑. lats/middle back은 upper-back 근사 매핑 (라이브러리에 별도 키 없음).
// Pure module. No external deps (라이브러리는 컴포넌트에서 import).

import type { MuscleGroup } from "./types";

/** react-body-highlighter v2.0.5가 인식하는 muscle 키. */
export type LibraryMuscle =
  | "trapezius"
  | "upper-back"
  | "lower-back"
  | "chest"
  | "biceps"
  | "triceps"
  | "forearm"
  | "back-deltoids"
  | "front-deltoids"
  | "abs"
  | "obliques"
  | "adductor"
  | "hamstring"
  | "quadriceps"
  | "abductors"
  | "calves"
  | "gluteal"
  | "head"
  | "neck";

/**
 * Dataset 17 MuscleGroup → LibraryMuscle[] 매핑.
 * Design §3.2 정확도 기록 참조 — lats / middle back은 upper-back 근사.
 * shoulders는 1:N (front-deltoids + back-deltoids).
 */
export const MUSCLE_TO_LIBRARY: Record<MuscleGroup, readonly LibraryMuscle[]> = {
  abdominals: ["abs"],
  abductors: ["abductors"],
  adductors: ["adductor"],
  biceps: ["biceps"],
  calves: ["calves"],
  chest: ["chest"],
  forearms: ["forearm"],
  glutes: ["gluteal"],
  hamstrings: ["hamstring"],
  // Approx — 라이브러리에 별도 lats 키 없음. upper-back에 광배근 영역 포함.
  lats: ["upper-back"],
  "lower back": ["lower-back"],
  // Approx — middle back(rhomboid)도 upper-back에 포함.
  "middle back": ["upper-back"],
  neck: ["neck"],
  quadriceps: ["quadriceps"],
  // 1:N — 어깨는 anterior + posterior 모두 강조.
  shoulders: ["front-deltoids", "back-deltoids"],
  traps: ["trapezius"],
  triceps: ["triceps"],
};

/**
 * dataset MuscleGroup 배열을 LibraryMuscle 배열로 변환 (중복 제거).
 * Plan SC: deduplicated, deterministic.
 */
export function toLibraryMuscles(
  muscles: readonly MuscleGroup[],
): LibraryMuscle[] {
  const seen = new Set<LibraryMuscle>();
  for (const m of muscles) {
    for (const lib of MUSCLE_TO_LIBRARY[m]) {
      seen.add(lib);
    }
  }
  return Array.from(seen);
}
