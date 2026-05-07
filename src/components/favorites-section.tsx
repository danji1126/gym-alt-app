// Design Ref: §5.1 Home — Favorites section on Home page.
// Client component (LocalStorage 의존).
// /simplify: lib/data 직접 import 금지 → useExercises hook으로 lazy fetch.
"use client";

import { useFavorites } from "@/lib/favorite-store";
import { useExercises } from "@/lib/exercise-fetch";
import { ExerciseListItem } from "./exercise-list-item";

export function FavoritesSection() {
  const { ids, hydrated } = useFavorites();
  const exercises = useExercises();

  // mount 전엔 빈 상태 (mismatch 0)
  const visibleIds = hydrated ? ids : [];

  // 데이터 로딩 중엔 ID만으로는 정보 부족 → 빈 표시.
  // 로드 완료 후 ID 매칭. 데이터에서 사라진 ID는 자동 필터링.
  const favorites = exercises
    ? visibleIds
        .map((id) => exercises.find((e) => e.id === id))
        .filter((e): e is NonNullable<typeof e> => e !== undefined)
    : [];

  return (
    <section aria-labelledby="favorites-heading">
      <h2
        id="favorites-heading"
        className="text-sm font-semibold text-neutral-700 dark:text-neutral-300"
      >
        ★ 즐겨찾기 {favorites.length > 0 && `(${favorites.length})`}
      </h2>

      {favorites.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-neutral-200 px-4 py-6 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-500">
          {hydrated && visibleIds.length > 0 && !exercises
            ? "즐겨찾기 데이터를 불러오는 중..."
            : "운동 상세에서 ☆를 눌러 즐겨찾기에 추가하세요"}
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {favorites.map((e) => (
            <li key={e.id}>
              <ExerciseListItem exercise={e} showAlternatives />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
