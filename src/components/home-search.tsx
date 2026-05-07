// Design Ref: §5.1 Home + §11.3 — Combined search input + results component.
// Client component. 검색어 빈 경우 children(부위 그리드 등) 표시, 검색어 있으면 결과만.
// /simplify: lib/data 직접 import 금지 → useExercises hook으로 lazy fetch.
"use client";

import { useEffect, useState } from "react";
import { useExercises } from "@/lib/exercise-fetch";
import { searchExercises } from "@/lib/search-index";
import { ExerciseListItem } from "./exercise-list-item";

interface Props {
  /** 검색 안 할 때 표시할 콘텐츠 (부위 그리드, 즐겨찾기 등). */
  children: React.ReactNode;
}

export function HomeSearch({ children }: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const exercises = useExercises();

  // Plan SC: 디바운스 150ms, cleanup으로 unmount race 방지
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const isSearching = debounced.trim().length > 0;
  const hits = isSearching && exercises
    ? searchExercises(debounced, exercises, 20)
    : [];

  return (
    <>
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 운동 검색 (한국어 또는 영문)"
          aria-label="운동 검색"
          maxLength={64}
          className="block w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-neutral-800 dark:bg-neutral-950"
        />
      </div>

      {isSearching ? (
        <section aria-live="polite" className="mt-4">
          {!exercises ? (
            <p className="rounded-xl border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-500 dark:border-neutral-800">
              검색 데이터를 불러오는 중...
            </p>
          ) : hits.length === 0 ? (
            <p className="rounded-xl border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-500 dark:border-neutral-800">
              검색 결과가 없습니다.
            </p>
          ) : (
            <>
              <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                검색 결과 {hits.length}개
              </p>
              <ul className="space-y-2.5">
                {hits.map((h) => (
                  <li key={h.exercise.id}>
                    <ExerciseListItem exercise={h.exercise} showAlternatives />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      ) : (
        <>{children}</>
      )}
    </>
  );
}
