// Design Ref: §4.1 — Build-time static data access. No runtime fetch/IO.
// Plan SC: 모든 도우미 deterministic, 빌드 타임 evaluable.

import exercisesData from "../../public/data/exercises-ko.json";
import type { EnrichedExercise, ExerciseLevel, MuscleGroup } from "./types";

const EXERCISES = exercisesData as EnrichedExercise[];

/** 전체 운동 (readonly view). */
export function getAllExercises(): readonly EnrichedExercise[] {
  return EXERCISES;
}

/** ID 조회. 없으면 undefined. */
export function getExerciseById(id: string): EnrichedExercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

/** muscle 배열 OR 매칭 (primaryMuscles 우선). */
export function getExercisesByMuscles(
  muscles: readonly MuscleGroup[],
): EnrichedExercise[] {
  if (muscles.length === 0) return [];
  const set = new Set<MuscleGroup>(muscles);
  return EXERCISES.filter((e) => e.primaryMuscles.some((m) => set.has(m)));
}

/** generateStaticParams 헬퍼 — 873개 ID. */
export function getAllExerciseIds(): string[] {
  return EXERCISES.map((e) => e.id);
}

// Plan SC: 카드 정렬은 level 오름차순 → nameKo 가나다 tie-break.
const LEVEL_ORDER: Record<ExerciseLevel, number> = {
  beginner: 0,
  intermediate: 1,
  expert: 2,
};

/** 운동 목록을 사용자 친화 순서로 정렬 (불변, 새 배열 반환). */
export function sortForList(
  exercises: readonly EnrichedExercise[],
): EnrichedExercise[] {
  return [...exercises].sort((a, b) => {
    const lvl = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
    if (lvl !== 0) return lvl;
    return a.nameKo.localeCompare(b.nameKo, "ko");
  });
}
