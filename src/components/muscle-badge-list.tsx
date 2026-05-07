// Design Ref: §5.1 Screen 3 + §5.4 — Primary/secondary muscle badges in Korean.
// RSC. Pure rendering.

import type { MuscleGroup } from "@/lib/types";
import { MUSCLE_KO } from "@/lib/i18n";

interface Props {
  primary: readonly MuscleGroup[];
  secondary: readonly MuscleGroup[];
}

export function MuscleBadgeList({ primary, secondary }: Props) {
  if (primary.length === 0 && secondary.length === 0) return null;

  return (
    <section aria-labelledby="muscle-section">
      <h2
        id="muscle-section"
        className="text-sm font-semibold text-neutral-700 dark:text-neutral-300"
      >
        자극 근육
      </h2>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {primary.map((m) => (
          <li key={`p-${m}`}>
            <Badge tone="primary" label={MUSCLE_KO[m]} suffix="주" />
          </li>
        ))}
        {secondary.map((m) => (
          <li key={`s-${m}`}>
            <Badge tone="secondary" label={MUSCLE_KO[m]} suffix="보" />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Badge({
  tone,
  label,
  suffix,
}: {
  tone: "primary" | "secondary";
  label: string;
  suffix: string;
}) {
  const cls =
    tone === "primary"
      ? "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
      : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      {label}
      <span className="text-[10px] opacity-70">({suffix})</span>
    </span>
  );
}
