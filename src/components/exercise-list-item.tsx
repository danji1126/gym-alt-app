// Design Ref: M3 §5.1 + M8 §5.1 — 카드는 BodyMini · Link 본체 · (조건부) 🔄 버튼.
// RSC. Link와 🔄 버튼은 형제 — 클릭 영역 분리로 bubble 충돌 0.

import Link from "next/link";
import type { EnrichedExercise } from "@/lib/types";
import { EQUIPMENT_KO, LEVEL_KO } from "@/lib/i18n";
import { LIST_CARD_CLS } from "@/lib/list-card-styles";
import { BodyMini } from "./body-mini";
import { AlternativesButton } from "./alternatives-button";

interface Props {
  exercise: EnrichedExercise;
  /**
   * true 시 카드 우측에 인라인 🔄 트리거 노출 (AlternativesModal).
   * 호출처가 모달 in 모달을 회피하도록 명시 — AlternativesList에서는 false.
   * @default false
   */
  showAlternatives?: boolean;
}

export function ExerciseListItem({ exercise, showAlternatives = false }: Props) {
  const firstEquipment = exercise.detailedEquipment[0];
  const equipmentLabel = firstEquipment ? EQUIPMENT_KO[firstEquipment] : null;
  // 운동명에 equipment 라벨이 이미 포함된 경우 중복 표기 회피 (예: "복근 크런치 머신 · 복근 크런치 머신").
  const showEquipment =
    equipmentLabel !== null && !exercise.nameKo.includes(equipmentLabel);

  return (
    <div className={`${LIST_CARD_CLS} items-center`}>
      <BodyMini
        primaryMuscles={exercise.primaryMuscles}
        exerciseName={exercise.nameKo}
      />
      <Link
        href={`/exercises/${exercise.id}/`}
        className="block min-w-0 flex-1"
      >
        <h3 className="truncate text-base font-semibold leading-tight">
          {exercise.nameKo}
        </h3>
        <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {showEquipment && equipmentLabel ? `${equipmentLabel} · ` : ""}
          {LEVEL_KO[exercise.level]}
        </p>
      </Link>
      {showAlternatives && (
        <AlternativesButton target={exercise} variant="icon" />
      )}
    </div>
  );
}
