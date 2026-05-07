// Design Ref: §5.3 — Top-left navigation: 뒤로 (router.back) + 홈 (/).
// 두 액션 — 뒤로는 한 단계, 홈은 깊은 진입에서 즉시 루트.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const BTN_CLS =
  "inline-flex h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";

export function BackLink() {
  const router = useRouter();
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => router.back()}
        className={BTN_CLS}
        aria-label="이전 페이지로"
      >
        <span aria-hidden="true">←</span>
        <span>뒤로</span>
      </button>
      <Link href="/" className={BTN_CLS} aria-label="처음 화면으로">
        <span aria-hidden="true">🏠</span>
        <span>홈</span>
      </Link>
    </div>
  );
}
