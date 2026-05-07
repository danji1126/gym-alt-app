// Design Ref: §11.4 — DetailedEquipment classification per PRD §4.4.
// Pure function. No I/O. Deterministic.

import type { DetailedEquipment, EquipmentRaw } from "../../src/lib/types";

interface NameRule {
  pattern: RegExp;
  result: DetailedEquipment;
  /**
   * 추가 가드 — true 반환 시에만 매칭 적용.
   * M9 신규 머신 룰들은 raw equipment === "machine"인 경우만 매칭하도록 사용.
   * 미지정이면 무조건 적용 (기존 룰 호환).
   */
  guard?: (equipmentRaw: EquipmentRaw | null) => boolean;
}

/** raw equipment === "machine"인 경우만 매칭하는 가드. */
const onlyMachine = (eq: EquipmentRaw | null): boolean => eq === "machine";

/**
 * 기존 운동명 패턴 룰 (PRD §4.4 우선순위 1-9).
 * `s?`/`(?:es)?`로 단·복수형 모두 매칭 — Leg Extensions·Lying Leg Curls·Hack Squats 등 누락 방지.
 * 위에서부터 평가. smith / cable이 가장 먼저 — 다른 머신과 결합된 이름(예: Smith Machine Calf Raise)을 우선 매칭.
 */
const BASE_RULES: NameRule[] = [
  { pattern: /\bsmith\b/i, result: "smith-machine" },
  { pattern: /\bcables?\b/i, result: "cable" },
  { pattern: /\bleg press(?:es)?\b/i, result: "leg-press-machine" },
  { pattern: /\blat pulldowns?\b/i, result: "lat-pulldown-machine" },
  { pattern: /\bchest press(?:es)?\b/i, result: "chest-press-machine" },
  { pattern: /\bleg extensions?\b/i, result: "leg-extension-machine" },
  { pattern: /\bleg curls?\b/i, result: "leg-curl-machine" },
  { pattern: /\b(pec decks?|butterfly|butterflies)\b/i, result: "pec-deck-machine" },
  { pattern: /\bhack squats?\b/i, result: "hack-squat-machine" },
];

/**
 * M9 — generic-machine 안의 자주 쓰이는 머신을 별도 분리.
 * 모두 raw equipment === "machine" 가드 — Barbell/Dumbbell 등 자유 중량 변형은
 * 이름이 비슷해도 머신으로 오분류 X.
 *
 * `.*?` lazy quantifier로 ReDoS 잠재 백트래킹 회피 (실위험은 0이지만 방어적).
 */
const M9_MACHINE_RULES: Omit<NameRule, "guard">[] = [
  { pattern: /\b(machine|leverage)\b.*?\bshoulder\b.*?\bpress(?:es)?\b/i, result: "shoulder-press-machine" },
  { pattern: /\bt[\s-]bar\s+rows?\b/i, result: "t-bar-row-machine" },
  { pattern: /\bdip\s+machines?\b|\b(assisted|weighted)\s+dips?\b/i, result: "dip-machine" },
  { pattern: /\bcrunch\s+machines?\b/i, result: "ab-crunch-machine" },
  { pattern: /\b(thigh|hip)\s+(ab|ad)ductors?\b|\b(ab|ad)ductor\s+machines?\b/i, result: "abductor-adductor-machine" },
  { pattern: /\bcalf-machine\b|\b(seated|standing)\s+calf\s+(raises?|press(?:es)?)\b|\bcalf\s+press(?:es)?\b/i, result: "calf-raise-machine" },
  { pattern: /\bleverage\b.*?\brows?\b|\bseated\s+row\s+machines?\b|\bhammer\s+strength\b.*?\brows?\b/i, result: "row-machine" },
];

const NAME_RULES: NameRule[] = [
  ...BASE_RULES,
  ...M9_MACHINE_RULES.map((r): NameRule => ({ ...r, guard: onlyMachine })),
];

/**
 * 운동명과 원본 equipment를 받아 세분화된 DetailedEquipment[] 반환.
 * 항상 length >= 1 보장 (fallback "other" 포함).
 *
 * Plan SC: detailedEquipment.length >= 1 보장.
 */
export function classifyDetailedEquipment(
  name: string,
  equipmentRaw: EquipmentRaw | null,
): DetailedEquipment[] {
  // 1) 운동명 정규식 매칭 (우선순위 위에서부터). guard가 있으면 해당 검사도 통과해야 적용.
  for (const rule of NAME_RULES) {
    if (rule.pattern.test(name) && (!rule.guard || rule.guard(equipmentRaw))) {
      return [rule.result];
    }
  }

  // 2) equipment === "machine" → generic-machine (우선순위 10)
  if (equipmentRaw === "machine") {
    return ["generic-machine"];
  }

  // 3) null / "none" / "other" → "other" fallback
  if (equipmentRaw === null || equipmentRaw === "none" || equipmentRaw === "other") {
    return ["other"];
  }

  // 4) 직접 매핑 (barbell, dumbbell, cable, bands, etc.)
  // EquipmentRaw 중 위 케이스를 제외한 값들은 모두 DetailedEquipment의 부분집합.
  return [equipmentRaw as DetailedEquipment];
}
