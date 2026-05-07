// Design Ref: §4.1 + §11.4 — Pure recommendation algorithm.
// Plan SC: PRD §5.2 weighted Jaccard + §5.3 hard constraint (primary intersection)
//          + 사용자 지시 level 차이 ≤1 (auto-relax on empty result).
// Pure module. Deterministic. No I/O.

import type {
  DetailedEquipment,
  EnrichedExercise,
  ExerciseLevel,
} from "./types";
import { getAllExercises } from "./data";

/** 추천 결과 1건. */
export interface Recommendation {
  exercise: EnrichedExercise;
  score: number; // 0..1
  primaryOverlap: number; // 0..1, Jaccard
  secondaryOverlap: number; // 0..1, Jaccard
}

const LEVEL_RANK: Record<ExerciseLevel, number> = {
  beginner: 0,
  intermediate: 1,
  expert: 2,
};

function jaccard<T>(a: readonly T[], b: readonly T[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const sa = new Set<T>(a);
  const sb = new Set<T>(b);
  let inter = 0;
  for (const x of sa) {
    if (sb.has(x)) inter += 1;
  }
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * PRD §5.2 — 가중 점수 산출.
 *   score = 0.6 × primaryJaccard + 0.2 × secondaryJaccard + 0.1 × forceMatch + 0.1 × mechanicMatch
 */
function calcScore(
  candidate: EnrichedExercise,
  target: EnrichedExercise,
): { score: number; primary: number; secondary: number } {
  const primary = jaccard(candidate.primaryMuscles, target.primaryMuscles);
  const secondary = jaccard(
    candidate.secondaryMuscles,
    target.secondaryMuscles,
  );
  const forceMatch =
    candidate.force !== null && candidate.force === target.force ? 1 : 0;
  const mechanicMatch =
    candidate.mechanic !== null && candidate.mechanic === target.mechanic
      ? 1
      : 0;
  const score = 0.6 * primary + 0.2 * secondary + 0.1 * forceMatch + 0.1 * mechanicMatch;
  return { score, primary, secondary };
}

/**
 * 추천 운동 상위 N개 반환. PRD §5.2/§5.3 + 사용자 지시 준수.
 *
 * Plan SC:
 *   - 자기 자신 제외
 *   - candidate.detailedEquipment ∩ availableEquipment ≠ ∅
 *   - candidate.primaryMuscles ∩ target.primaryMuscles ≠ ∅ (PRD §5.3 hard)
 *   - |levelRank(candidate) - levelRank(target)| ≤ 1 (1차) — 0건 시 완화
 *   - tie-breaker: level 같음 우선 → mechanic 같음 우선 → nameKo 가나다
 */
export function recommend(
  target: EnrichedExercise,
  availableEquipment: readonly DetailedEquipment[],
  allExercises: readonly EnrichedExercise[],
  topN: number = 5,
): Recommendation[] {
  if (availableEquipment.length === 0) return [];

  const availableSet = new Set<DetailedEquipment>(availableEquipment);
  const targetLevelRank = LEVEL_RANK[target.level];

  // 공통 hard filter (자기제외, 기구, primary muscle 교집합)
  const baseFilter = (e: EnrichedExercise): boolean =>
    e.id !== target.id &&
    e.detailedEquipment.some((eq) => availableSet.has(eq)) &&
    e.primaryMuscles.some((m) => target.primaryMuscles.includes(m));

  // 1차: level 차이 ≤ 1 hard filter 적용
  let candidates = allExercises.filter(
    (e) =>
      baseFilter(e) && Math.abs(LEVEL_RANK[e.level] - targetLevelRank) <= 1,
  );

  // 0건 시 level 제약 완화 (사용자 지시 — empty result 방지)
  if (candidates.length === 0) {
    candidates = allExercises.filter(baseFilter);
  }

  // 점수 계산
  const scored: Recommendation[] = candidates.map((c) => {
    const { score, primary, secondary } = calcScore(c, target);
    return {
      exercise: c,
      score,
      primaryOverlap: primary,
      secondaryOverlap: secondary,
    };
  });

  // 정렬: score 내림차순 → tie-breaker (PRD §5.3)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // tie 1: level 같음 우선
    const aSameLvl = a.exercise.level === target.level ? 1 : 0;
    const bSameLvl = b.exercise.level === target.level ? 1 : 0;
    if (aSameLvl !== bSameLvl) return bSameLvl - aSameLvl;
    // tie 2: mechanic 같음 우선
    const aSameMech = a.exercise.mechanic === target.mechanic ? 1 : 0;
    const bSameMech = b.exercise.mechanic === target.mechanic ? 1 : 0;
    if (aSameMech !== bSameMech) return bSameMech - aSameMech;
    // tie 3: nameKo 가나다
    return a.exercise.nameKo.localeCompare(b.exercise.nameKo, "ko");
  });

  return scored.slice(0, topN);
}

/** Convenience wrapper — `getAllExercises()`를 자동 사용. */
export function recommendForTarget(
  target: EnrichedExercise,
  availableEquipment: readonly DetailedEquipment[],
  topN: number = 5,
): Recommendation[] {
  return recommend(target, availableEquipment, getAllExercises(), topN);
}
