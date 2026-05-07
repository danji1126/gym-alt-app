// Design Ref: §5.1 Modal + §5.3 — Trigger button + lazy-loaded modal.
// Plan SC (NFR): First Load JS 회귀 ≤ +20KB — modal + 873 exercise JSON을 lazy chunk로 분리.
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { EnrichedExercise } from "@/lib/types";

// Lazy load — 873 exercise JSON + recommend module이 modal chunk에만 포함되도록.
const AlternativesModal = dynamic(
  () =>
    import("./alternatives-modal").then((m) => ({
      default: m.AlternativesModal,
    })),
  { ssr: false },
);

type Variant = "full" | "icon";

interface Props {
  target: EnrichedExercise;
  /**
   * "full": 운동 상세 페이지의 가로 꽉 채우는 라벨 버튼 (default).
   * "icon": 카드 우측 인라인 44×44 아이콘 버튼 (M8 — 카드용).
   */
  variant?: Variant;
}

const COMMON_BTN_CLS =
  "bg-blue-600 text-white transition hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-400";

const VARIANT_CLS: Record<Variant, string> = {
  full: `flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${COMMON_BTN_CLS}`,
  icon: `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base ${COMMON_BTN_CLS}`,
};

export function AlternativesButton({ target, variant = "full" }: Props) {
  const [open, setOpen] = useState(false);
  // 모달은 한 번이라도 열린 후에만 mount 유지 — 첫 클릭 전에는 chunk fetch도 안 함.
  const [everOpened, setEverOpened] = useState(false);

  const handleOpen = (e: React.MouseEvent) => {
    // variant="icon"은 카드 내부 Link와 형제 — 이미 bubble 무관하지만,
    // capture phase·다른 wrapper에 대비한 이중 방어 (Design §10.2 / D-3).
    e.preventDefault();
    e.stopPropagation();
    setEverOpened(true);
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={
          variant === "icon" ? `${target.nameKo} 다른 기구로 대체` : undefined
        }
        className={VARIANT_CLS[variant]}
      >
        <span aria-hidden="true">🔄</span>
        {variant === "full" && <span>다른 기구로 대체</span>}
      </button>
      {everOpened && (
        <AlternativesModal
          open={open}
          onClose={() => setOpen(false)}
          target={target}
        />
      )}
    </>
  );
}
