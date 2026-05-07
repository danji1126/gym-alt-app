// Design Ref: §5.1 Modal + §11.4 — Native <dialog> with equipment toggles + recommendations.
// Plan SC: PRD §6.5 모달 UX, 즉석 토글 시 추천 즉시 갱신.
"use client";

import { useEffect, useMemo, useRef } from "react";
import type { EnrichedExercise } from "@/lib/types";
import { recommendForTarget } from "@/lib/recommend";
import { usePreset } from "@/lib/preset-store";
import { AlternativesList } from "./alternatives-list";
import { EquipmentToggleGrid } from "./equipment-toggle-grid";

interface Props {
  open: boolean;
  onClose: () => void;
  target: EnrichedExercise;
}

export function AlternativesModal({ open, onClose, target }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { preset, toggleEquipment } = usePreset();

  // open 상태 ↔ native <dialog> 동기화
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  // 추천 결과 — preset.availableEquipment 변경에 반응
  const recommendations = useMemo(
    () => recommendForTarget(target, preset.availableEquipment, 5),
    [target, preset.availableEquipment],
  );

  const isEmpty = preset.availableEquipment.length === 0;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // backdrop click — dialog 자체 클릭은 외곽이라 backdrop으로 간주
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto w-full max-w-md rounded-2xl bg-white p-0 backdrop:bg-black/40 dark:bg-neutral-950"
      aria-labelledby="alternatives-title"
    >
      <div className="max-h-[85dvh] overflow-y-auto px-4 py-4">
        {/* Header */}
        <header className="flex items-start justify-between gap-2">
          <div>
            <h2
              id="alternatives-title"
              className="text-lg font-bold leading-tight"
            >
              🔄 다른 기구로 대체
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {target.nameKo}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
          >
            ✕
          </button>
        </header>

        {/* Equipment toggles (chip) */}
        <section className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            가용 기구
          </h3>
          <div className="mt-2">
            <EquipmentToggleGrid
              selected={preset.availableEquipment}
              onToggle={toggleEquipment}
              variant="chip"
            />
          </div>
        </section>

        {/* Recommendations */}
        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            추천 운동
          </h3>
          <div className="mt-2">
            {isEmpty ? (
              <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                가용 기구를 1개 이상 선택해 주세요.
              </p>
            ) : (
              <AlternativesList
                recommendations={recommendations}
                onNavigate={onClose}
              />
            )}
          </div>
        </section>

      </div>
    </dialog>
  );
}
