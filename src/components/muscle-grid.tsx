// Design Ref: §5.1 Screen 1 + §5.4 — Home muscle bucket grid.
// RSC. 7 buckets from MUSCLE_BUCKETS.

import Link from "next/link";
import { MUSCLE_BUCKETS } from "@/lib/muscle-groups";

export function MuscleGrid() {
  return (
    <nav aria-label="부위 선택">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        부위 선택
      </h2>
      <ul className="mt-3 grid grid-cols-3 gap-2.5">
        {MUSCLE_BUCKETS.map((bucket) => (
          <li key={bucket.slug}>
            <Link
              href={`/muscles/${bucket.slug}/`}
              className="flex aspect-square min-h-11 flex-col items-center justify-center gap-1 rounded-2xl border border-neutral-200 bg-white text-center transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
            >
              <span className="text-2xl" aria-hidden="true">
                {bucket.emoji}
              </span>
              <span className="text-sm font-medium">{bucket.labelKo}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
