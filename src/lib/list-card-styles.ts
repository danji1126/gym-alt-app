// Shared card styling for ExerciseListItem and RecommendationCard.
// Card 외형 토큰을 한 곳에 두어 hover·dark 변경 시 양쪽 동기화 비용 0.
//
// 사용처:
//  - components/exercise-list-item.tsx — flex items-center
//  - components/alternatives-list.tsx (RecommendationCard) — flex items-start
//
// 호출처에서 items-center / items-start만 추가로 합치면 됨.

export const LIST_CARD_CLS =
  "flex min-h-11 gap-3 rounded-xl border border-neutral-200 bg-white p-3 transition hover:border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700 dark:hover:bg-neutral-900";
