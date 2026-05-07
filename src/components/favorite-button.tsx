// Design Ref: §5.2 — Favorite toggle button (☆ ↔ ★).
// Client component (LocalStorage 의존). 운동 상세 헤더 옆에 배치.
"use client";

import { useFavorites } from "@/lib/favorite-store";

interface Props {
  exerciseId: string;
  exerciseName: string;
}

export function FavoriteButton({ exerciseId, exerciseName }: Props) {
  const { has, toggle, hydrated } = useFavorites();
  const isOn = has(exerciseId);

  // mount 전엔 default(off) 상태로 렌더 → mismatch 0
  const display = hydrated ? isOn : false;

  return (
    <button
      type="button"
      onClick={() => toggle(exerciseId)}
      aria-label={
        display
          ? `${exerciseName} 즐겨찾기 해제`
          : `${exerciseName} 즐겨찾기 추가`
      }
      aria-pressed={display}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl transition hover:bg-neutral-100 active:scale-95 dark:hover:bg-neutral-900"
    >
      <span className={display ? "text-amber-500" : "text-neutral-400"}>
        {display ? "★" : "☆"}
      </span>
    </button>
  );
}
