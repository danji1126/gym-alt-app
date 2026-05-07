// Design Ref: §5.1 Modal + §5.4 — Recommendation card list.
// Pure props 기반. 호출자가 Client component(AlternativesModal)이라 자동 client boundary.

import Link from "next/link";
import type { Recommendation } from "@/lib/recommend";
import { EQUIPMENT_KO, LEVEL_KO } from "@/lib/i18n";
import { LIST_CARD_CLS } from "@/lib/list-card-styles";
import { BodyMini } from "./body-mini";

interface Props {
  recommendations: readonly Recommendation[];
  /** 모달 닫기 콜백 — 카드 클릭 시 모달 닫고 페이지 이동. */
  onNavigate?: () => void;
}

export function AlternativesList({ recommendations, onNavigate }: Props) {
  if (recommendations.length === 0) {
    return (
      <p className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
        조건에 맞는 운동이 없습니다. 가용 기구를 추가해 보세요.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {recommendations.map((r) => (
        <li key={r.exercise.id}>
          <RecommendationCard rec={r} onNavigate={onNavigate} />
        </li>
      ))}
    </ul>
  );
}

function RecommendationCard({
  rec,
  onNavigate,
}: {
  rec: Recommendation;
  onNavigate?: () => void;
}) {
  const { exercise, primaryOverlap, secondaryOverlap } = rec;
  const firstEquipment = exercise.detailedEquipment[0];
  const equipmentLabel = firstEquipment ? EQUIPMENT_KO[firstEquipment] : null;
  const showEquipment =
    equipmentLabel !== null && !exercise.nameKo.includes(equipmentLabel);
  const primaryPct = Math.round(primaryOverlap * 100);
  const secondaryPct = Math.round(secondaryOverlap * 100);

  return (
    <Link
      href={`/exercises/${exercise.id}/`}
      onClick={onNavigate}
      className={`${LIST_CARD_CLS} items-start`}
    >
      <BodyMini
        primaryMuscles={exercise.primaryMuscles}
        exerciseName={exercise.nameKo}
      />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold leading-tight">
          {exercise.nameKo}
        </h3>
        <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {showEquipment && equipmentLabel ? `${equipmentLabel} · ` : ""}
          {LEVEL_KO[exercise.level]}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <Badge tone="primary" label={`주근육 ${primaryPct}%`} />
          {secondaryPct > 0 && (
            <Badge tone="secondary" label={`보조근육 ${secondaryPct}%`} />
          )}
        </div>
      </div>
    </Link>
  );
}

function Badge({
  tone,
  label,
}: {
  tone: "primary" | "secondary";
  label: string;
}) {
  const cls =
    tone === "primary"
      ? "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
      : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}
    >
      {label}
    </span>
  );
}
