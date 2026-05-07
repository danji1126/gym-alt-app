// Design Ref: §5.1 Screen 1 — Home page.
// Iterations: M2 placeholder → M3 부위 그리드 → M4 ⚙️ 설정 → M7 검색 + 즐겨찾기.

import Link from "next/link";
import { MuscleGrid } from "@/components/muscle-grid";
import { HomeSearch } from "@/components/home-search";
import { FavoritesSection } from "@/components/favorites-section";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">gym-alt-app</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          헬스장 대체 운동 추천
        </p>
      </header>

      {/* M7: 검색 — 검색어 있으면 결과만, 빈 경우 children 표시 */}
      <div className="mt-6">
        <HomeSearch>
          <div className="mt-6 space-y-8">
            <FavoritesSection />
            <MuscleGrid />
          </div>
        </HomeSearch>
      </div>

      {/* M4: 헬스장 설정 (검색 상태와 무관하게 항상 하단) */}
      <section className="mt-10">
        <Link
          href="/settings/"
          className="flex h-12 items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
        >
          <span>
            <span aria-hidden="true">⚙️</span> 헬스장 설정
          </span>
          <span aria-hidden="true" className="text-neutral-400">
            →
          </span>
        </Link>
      </section>
    </main>
  );
}
