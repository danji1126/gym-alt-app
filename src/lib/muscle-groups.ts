// Design Ref: §3.1 — 7 muscle bucket definitions for Home grid + URL routing.
// Plan SC: bucket slug -> MuscleGroup[] OR-match for /muscles/[muscle] page.

import type { MuscleGroup } from "./types";

/** Home 부위 그리드의 1개 카드 = MuscleBucket. */
export interface MuscleBucket {
  /** URL slug (lowercase, hyphenated). */
  slug: string;
  /** 한국어 표시명. */
  labelKo: string;
  /** 매칭되는 MuscleGroup 배열 (primary OR 매칭). */
  muscles: MuscleGroup[];
  /** Home 그리드 아이콘 이모지. */
  emoji: string;
}

/** 7 부위 버킷. PRD §6.2 부위 그리드 + 사용자 친화적 그룹핑.
 *  Design §3.2 — bucket slug만 generateStaticParams로 사전 생성. */
export const MUSCLE_BUCKETS: readonly MuscleBucket[] = [
  {
    slug: "chest",
    labelKo: "가슴",
    muscles: ["chest"],
    emoji: "💪",
  },
  {
    slug: "back",
    labelKo: "등",
    muscles: ["lats", "middle back", "traps"],
    emoji: "🦋",
  },
  {
    slug: "shoulders",
    labelKo: "어깨",
    muscles: ["shoulders"],
    emoji: "🏋️",
  },
  {
    slug: "biceps",
    labelKo: "이두",
    muscles: ["biceps"],
    emoji: "💪",
  },
  {
    slug: "triceps",
    labelKo: "삼두",
    muscles: ["triceps"],
    emoji: "🔱",
  },
  {
    slug: "legs",
    labelKo: "하체",
    muscles: ["quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors"],
    emoji: "🦵",
  },
  {
    slug: "abs",
    labelKo: "복근",
    muscles: ["abdominals"],
    emoji: "🔥",
  },
];

/** slug 으로 bucket 조회. */
export function getBucketBySlug(slug: string): MuscleBucket | undefined {
  return MUSCLE_BUCKETS.find((b) => b.slug === slug);
}
