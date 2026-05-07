// Design Ref: §4.1 + Plan §9.2 — Pure search function with normalization.
// Plan SC: 한국어 nameKo + 영문 nameEn 정규화 매칭, score 기반 정렬.
// Pure module. No I/O. Deterministic.

import type { EnrichedExercise } from "./types";

/** 검색 정규화 — 공백·하이픈·언더스코어 제거 + lowercase. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]/g, "");
}

export interface SearchHit {
  exercise: EnrichedExercise;
  score: number; // higher = better
}

/**
 * 운동명으로 검색.
 * 우선순위: nameKo 정확 > nameEn 정확 > nameKo 시작 > nameEn 시작 > nameKo 부분 > nameEn 부분.
 */
export function searchExercises(
  query: string,
  exercises: readonly EnrichedExercise[],
  topN: number = 20,
): SearchHit[] {
  const q = normalize(query);
  if (q.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const e of exercises) {
    const ko = normalize(e.nameKo);
    const en = normalize(e.nameEn);

    let score = 0;
    if (ko === q) score = 100;
    else if (en === q) score = 90;
    else if (ko.startsWith(q)) score = 80;
    else if (en.startsWith(q)) score = 70;
    else if (ko.includes(q)) score = 60;
    else if (en.includes(q)) score = 50;

    if (score > 0) {
      hits.push({ exercise: e, score });
    }
  }

  hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.exercise.nameKo.localeCompare(b.exercise.nameKo, "ko");
  });

  return hits.slice(0, topN);
}
