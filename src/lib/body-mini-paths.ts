// Design Ref: §3.2 — 17 muscle SVG path data.
// SVG viewBox: 56x56. anterior x=0..24, gap x=24..32, posterior x=32..56.
// 자체 작성 (라이브러리 차용 0). 단순 사각·곡선으로 인지 보조 목적 충분.
//
// 단순화 정책:
//  - 사각·다각으로 부위 영역만 표시 (해부학적 정확도 X, 인지 보조 O)
//  - 양쪽 패널에 동시 표시되는 muscle은 d 안에 anterior + posterior 좌표 모두 포함
//  - primary muscle만 색칠 — secondary는 시각 단순화 위해 표시 X

import type { MuscleGroup } from "./types";

export const SVG_VIEWBOX = "0 0 56 56" as const;

/** 해부학적 패널 위치 — A안(single panel mode)에서 viewBox 결정용. */
export type BodyMiniRegion = "anterior" | "posterior" | "both";

export interface BodyMiniMuscleEntry {
  /** SVG <path d="..."> — viewBox 0 0 56 56 좌표계. */
  readonly d: string;
  /** aria-label 및 <title>에 사용할 짧은 한국어 부위명. */
  readonly labelKo: string;
  /** 표시되는 패널 — primary 집합이 한쪽이면 그 패널만 렌더(A). */
  readonly region: BodyMiniRegion;
}

// 인체 실루엣 (anterior + posterior) — 머리 4..8, 어깨 12..16, 허리 28..32, 발 54.
// 좌표 단위: 1 viewBox unit ≈ 1px @ rendered 56px.
export const SILHOUETTE_PATH_ANTERIOR =
  "M 9 2 L 15 2 Q 16 5 15 9 L 19 12 L 22 14 L 22 28 L 19 30 L 18 32 L 18 36 L 17 54 L 13 54 L 12 38 L 11 54 L 7 54 L 6 36 L 6 32 L 5 30 L 2 28 L 2 14 L 5 12 L 9 9 Q 8 5 9 2 Z" as const;

export const SILHOUETTE_PATH_POSTERIOR =
  "M 41 2 L 47 2 Q 48 5 47 9 L 51 12 L 54 14 L 54 28 L 51 30 L 50 32 L 50 36 L 49 54 L 45 54 L 44 38 L 43 54 L 39 54 L 38 36 L 38 32 L 37 30 L 34 28 L 34 14 L 37 12 L 41 9 Q 40 5 41 2 Z" as const;

// ────────────────────────────────────────────────────────────────────────────
// 공통 좌표 상수 — 동일 위치를 사용하는 muscle 간 path 재사용 (DRY).
// ────────────────────────────────────────────────────────────────────────────

// 양 패널 어깨 (anterior + posterior 합집합).
const PATH_SHOULDERS_BOTH =
  "M 4 12 H 8 V 16 H 4 Z M 16 12 H 20 V 16 H 16 Z M 36 12 H 40 V 16 H 36 Z M 48 12 H 52 V 16 H 48 Z";
// 양 패널 전완 — 같이 강조.
const PATH_FOREARMS_BOTH =
  "M 2 22 H 5 V 30 H 2 Z M 19 22 H 22 V 30 H 19 Z M 34 22 H 37 V 30 H 34 Z M 51 22 H 54 V 30 H 51 Z";
// 양 패널 종아리.
const PATH_CALVES_BOTH =
  "M 6 46 H 11 V 54 H 6 Z M 13 46 H 18 V 54 H 13 Z M 38 46 H 43 V 54 H 38 Z M 45 46 H 50 V 54 H 45 Z";
// 양 패널 목.
const PATH_NECK_BOTH = "M 10 10 H 14 V 12 H 10 Z M 42 10 H 46 V 12 H 42 Z";
// anterior 상완 (이두) — 앞면 양 측면만.
const PATH_BICEPS_ANTERIOR =
  "M 2 14 H 5 V 22 H 2 Z M 19 14 H 22 V 22 H 19 Z";
// posterior 상완 (삼두) — 뒷면 양 측면만.
const PATH_TRICEPS_POSTERIOR =
  "M 34 14 H 37 V 22 H 34 Z M 51 14 H 54 V 22 H 51 Z";

/**
 * Dataset 17 MuscleGroup → SVG path 매핑.
 * Design §3.2 — 좌표는 56x56 viewBox 기준.
 */
export const MUSCLE_REGIONS: Record<MuscleGroup, BodyMiniMuscleEntry> = {
  // 가슴 — anterior 양쪽 가슴
  chest: {
    d: "M 6 14 H 11 V 22 H 6 Z M 13 14 H 18 V 22 H 13 Z",
    labelKo: "가슴",
    region: "anterior",
  },
  // 복근 — anterior 중앙
  abdominals: {
    d: "M 10 22 H 14 V 32 H 10 Z",
    labelKo: "복근",
    region: "anterior",
  },
  // 이두 — anterior 상완 (해부학적으로 앞면 전용).
  biceps: { d: PATH_BICEPS_ANTERIOR, labelKo: "이두", region: "anterior" },
  // 삼두 — posterior 상완 (해부학적으로 뒷면 전용).
  triceps: { d: PATH_TRICEPS_POSTERIOR, labelKo: "삼두", region: "posterior" },
  // 전완 — both panel 하완.
  forearms: { d: PATH_FOREARMS_BOTH, labelKo: "전완", region: "both" },
  // 어깨 (front + back deltoid) — both panel 어깨.
  shoulders: { d: PATH_SHOULDERS_BOTH, labelKo: "어깨", region: "both" },
  // 승모근 — posterior 목·어깨 윗부분
  traps: {
    d: "M 41 10 H 47 V 14 H 41 Z",
    labelKo: "승모근",
    region: "posterior",
  },
  // 광배근 — posterior 등 양 측면
  lats: {
    d: "M 37 16 H 40 V 26 H 37 Z M 48 16 H 51 V 26 H 48 Z",
    labelKo: "광배",
    region: "posterior",
  },
  // 등 중부 (rhomboid) — posterior 등 중앙
  "middle back": {
    d: "M 41 14 H 47 V 22 H 41 Z",
    labelKo: "등 중부",
    region: "posterior",
  },
  // 허리 — posterior 등 하부
  "lower back": {
    d: "M 41 26 H 47 V 32 H 41 Z",
    labelKo: "허리",
    region: "posterior",
  },
  // 둔근 — posterior 엉덩이
  glutes: {
    d: "M 39 32 H 49 V 38 H 39 Z",
    labelKo: "둔근",
    region: "posterior",
  },
  // 대퇴사두 — anterior 대퇴 전면
  quadriceps: {
    d: "M 6 36 H 11 V 46 H 6 Z M 13 36 H 18 V 46 H 13 Z",
    labelKo: "대퇴사두",
    region: "anterior",
  },
  // 햄스트링 — posterior 대퇴 후면
  hamstrings: {
    d: "M 38 36 H 43 V 46 H 38 Z M 45 36 H 50 V 46 H 45 Z",
    labelKo: "햄스트링",
    region: "posterior",
  },
  // 종아리 — both panel 하퇴.
  calves: { d: PATH_CALVES_BOTH, labelKo: "종아리", region: "both" },
  // 외전근 — anterior 외측 둔부 (고관절 외측)
  abductors: {
    d: "M 4 32 H 7 V 38 H 4 Z M 17 32 H 20 V 38 H 17 Z",
    labelKo: "외전근",
    region: "anterior",
  },
  // 내전근 — anterior 내측 대퇴
  adductors: {
    d: "M 11 36 H 13 V 44 H 11 Z",
    labelKo: "내전근",
    region: "anterior",
  },
  // 목 — both panel 목.
  neck: { d: PATH_NECK_BOTH, labelKo: "목", region: "both" },
};

export const COLOR_PRIMARY = "#dc2626" as const; // Tailwind red-600
