// Design Ref: §4.1, §5.1 — RSC 인라인 SVG 미니 다이어그램.
// 외부 의존 0. 17 muscle path는 lib/body-mini-paths에서 lookup.
// primary muscle만 빨강 fill, 나머지는 베이스 실루엣 (라이트/다크 분기).
//
// A+B+D 적용:
//  - A: primary가 한쪽 패널에만 있으면 그 패널만 표시 (viewBox/width 동적).
//  - B: 머리 얼굴 디테일 — anterior=눈 2개, posterior=뒤통수 가로선.
//  - D: 패널 배경 톤 — anterior=warm amber, posterior=cool sky로 앞·뒤 직관 구분.

import type { MuscleGroup } from "@/lib/types";
import {
  SILHOUETTE_PATH_ANTERIOR,
  SILHOUETTE_PATH_POSTERIOR,
  MUSCLE_REGIONS,
  COLOR_PRIMARY,
} from "@/lib/body-mini-paths";

interface Props {
  primaryMuscles: readonly MuscleGroup[];
  exerciseName?: string;
  /** 추가 className. 미지정 시 PanelMode에 맞춰 자체 sizing. */
  className?: string;
}

type PanelMode = "anterior" | "posterior" | "both";

/**
 * primary muscles의 region 합집합으로 표시할 패널 결정.
 * - 비어 있으면 both (전체 실루엣 노출 — 무엇이 강조될지 모르므로).
 * - region "both"가 하나라도 있으면 양 패널 필요.
 * - 그 외 한쪽만 있으면 해당 패널만.
 */
function computePanelMode(muscles: readonly MuscleGroup[]): PanelMode {
  if (muscles.length === 0) return "both";
  let hasAnterior = false;
  let hasPosterior = false;
  for (const m of muscles) {
    const r = MUSCLE_REGIONS[m].region;
    if (r === "both") return "both";
    if (r === "anterior") hasAnterior = true;
    else hasPosterior = true;
    if (hasAnterior && hasPosterior) return "both";
  }
  return hasAnterior ? "anterior" : "posterior";
}

const VIEWBOX_BY_MODE: Record<PanelMode, string> = {
  both: "0 0 56 56",
  anterior: "0 0 24 56",
  posterior: "32 0 24 56",
};

/** 자체 sizing 시 사용할 기본 className (h-14 = 56px, w는 PanelMode 비례). */
const SIZE_CLS_BY_MODE: Record<PanelMode, string> = {
  both: "h-14 w-14",
  anterior: "h-14 w-6",
  posterior: "h-14 w-6",
};

export function BodyMini({ primaryMuscles, exerciseName, className }: Props) {
  const mode = computePanelMode(primaryMuscles);
  const showAnterior = mode === "both" || mode === "anterior";
  const showPosterior = mode === "both" || mode === "posterior";

  // 한국어 부위명 join — primary 없으면 "-".
  const labels = primaryMuscles
    .map((m) => MUSCLE_REGIONS[m].labelKo)
    .join(", ");
  const ariaLabel = exerciseName
    ? `${exerciseName} 자극 근육: ${labels || "-"}`
    : `자극 근육: ${labels || "-"}`;

  return (
    <svg
      viewBox={VIEWBOX_BY_MODE[mode]}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMidYMid meet"
      className={`block shrink-0 ${className ?? SIZE_CLS_BY_MODE[mode]}`}
    >
      <title>{ariaLabel}</title>

      {/* D: 패널 배경 — anterior=warm, posterior=cool. 라이트·다크 분기. */}
      {showAnterior && (
        <rect
          x={0}
          y={0}
          width={24}
          height={56}
          rx={2}
          className="fill-amber-50 dark:fill-amber-950/40"
        />
      )}
      {showPosterior && (
        <rect
          x={32}
          y={0}
          width={24}
          height={56}
          rx={2}
          className="fill-sky-50 dark:fill-sky-950/40"
        />
      )}

      {/* 베이스 실루엣 — Tailwind dark variant로 자동 분기 */}
      <g className="fill-neutral-300 dark:fill-neutral-700">
        {showAnterior && <path d={SILHOUETTE_PATH_ANTERIOR} />}
        {showPosterior && <path d={SILHOUETTE_PATH_POSTERIOR} />}
      </g>

      {/* B: 얼굴 디테일 — anterior=눈, posterior=뒤통수 가로선. */}
      {showAnterior && (
        <g className="fill-neutral-600 dark:fill-neutral-300">
          <circle cx={11} cy={5} r={0.9} />
          <circle cx={13} cy={5} r={0.9} />
        </g>
      )}
      {showPosterior && (
        <line
          x1={42}
          y1={5}
          x2={46}
          y2={5}
          strokeWidth={0.8}
          strokeLinecap="round"
          className="stroke-neutral-500 dark:stroke-neutral-400"
        />
      )}

      {/* primary muscle 강조 — d 안에 region별 좌표가 이미 포함됨 */}
      <g fill={COLOR_PRIMARY}>
        {primaryMuscles.map((m) => (
          <path key={m} d={MUSCLE_REGIONS[m].d} />
        ))}
      </g>
    </svg>
  );
}
