// Design Ref: §5.3 + §11.2 — DetailedEquipment toggle grid.
// 사용처: AlternativesModal (즉석 토글) + /settings/ (정밀 편집).
"use client";

import type { DetailedEquipment } from "@/lib/types";
import { EQUIPMENT_KO } from "@/lib/i18n";

/** PRD §4.5.1 시드 기준 그룹핑. */
interface EquipmentGroup {
  labelKo: string;
  items: DetailedEquipment[];
}

const GROUPS: readonly EquipmentGroup[] = [
  {
    labelKo: "자유 중량",
    items: ["barbell", "dumbbell", "e-z curl bar", "kettlebells"],
  },
  {
    labelKo: "케이블·스미스",
    items: ["cable", "smith-machine"],
  },
  {
    labelKo: "머신",
    items: [
      "leg-press-machine",
      "lat-pulldown-machine",
      "chest-press-machine",
      "leg-extension-machine",
      "leg-curl-machine",
      "pec-deck-machine",
      "hack-squat-machine",
      "shoulder-press-machine",
      "calf-raise-machine",
      "row-machine",
      "t-bar-row-machine",
      "abductor-adductor-machine",
      "ab-crunch-machine",
      "dip-machine",
      "generic-machine",
    ],
  },
  {
    labelKo: "보조 도구",
    items: ["bands", "exercise ball", "medicine ball", "foam roll"],
  },
  {
    labelKo: "맨몸 / 기타",
    items: ["body only", "other"],
  },
];

interface Props {
  /** 현재 선택된 기구 집합. */
  selected: readonly DetailedEquipment[];
  /** 단일 기구 토글 콜백. */
  onToggle: (eq: DetailedEquipment) => void;
  /** chip 형태(컴팩트) 또는 박스 형태(설정 페이지). */
  variant?: "chip" | "box";
}

export function EquipmentToggleGrid({
  selected,
  onToggle,
  variant = "box",
}: Props) {
  const selectedSet = new Set(selected);

  return (
    <div className="space-y-5">
      {GROUPS.map((group) => (
        <fieldset key={group.labelKo}>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {group.labelKo}
          </legend>
          <div className={variant === "chip" ? "flex flex-wrap gap-1.5" : "grid grid-cols-2 gap-2"}>
            {group.items.map((eq) => {
              const isOn = selectedSet.has(eq);
              return (
                <ToggleButton
                  key={eq}
                  label={EQUIPMENT_KO[eq]}
                  isOn={isOn}
                  onClick={() => onToggle(eq)}
                  variant={variant}
                />
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function ToggleButton({
  label,
  isOn,
  onClick,
  variant,
}: {
  label: string;
  isOn: boolean;
  onClick: () => void;
  variant: "chip" | "box";
}) {
  const base =
    "min-h-11 select-none transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";
  const layout =
    variant === "chip"
      ? "rounded-full px-3 py-1.5 text-xs"
      : "rounded-xl px-3 py-2.5 text-sm";
  const tone = isOn
    ? "bg-blue-600 text-white"
    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      onClick={onClick}
      className={`${base} ${layout} ${tone}`}
    >
      {isOn && <span className="mr-1" aria-hidden="true">✓</span>}
      {label}
    </button>
  );
}
