// Design Ref: §5.1 + §11.4 — react-body-highlighter wrapper with primary/secondary highlighting.
// Plan SC (FR-04, FR-05): primary 빨강 + secondary 주황, 정면+후면 동시 표시.
// 라이브러리 v2.0.5: README에 따르면 anterior/posterior type prop 지원, highlightedColors/bodyColor 지원.
// 정확한 .d.ts는 Do 단계 npm install 후 검증 — 그 결과에 따라 본 파일 미세 조정.
"use client";

import type { ComponentType, CSSProperties } from "react";
import Model from "react-body-highlighter";
import type { MuscleGroup } from "@/lib/types";
import { MUSCLE_KO } from "@/lib/i18n";
import { MUSCLE_TO_LIBRARY, toLibraryMuscles } from "@/lib/muscle-map";
import type { LibraryMuscle } from "@/lib/muscle-map";

// 라이브러리 v2.0.5의 prop 시그니처를 명시적으로 타이핑.
// 라이브러리 자체 .d.ts와 차이가 있으면 npm install 후 본 인터페이스를 .d.ts에 맞춰 정렬.
interface ExerciseEntry {
  name: string;
  muscles: LibraryMuscle[];
  frequency?: number;
}
interface ModelProps {
  data: ExerciseEntry[];
  type?: "anterior" | "posterior";
  highlightedColors?: readonly string[];
  bodyColor?: string;
  style?: CSSProperties;
}

// 라이브러리 default export를 위 인터페이스로 캐스팅.
const TypedModel = Model as unknown as ComponentType<ModelProps>;

interface Props {
  primary: readonly MuscleGroup[];
  secondary: readonly MuscleGroup[];
  exerciseName: string;
}

const COLOR_PRIMARY = "#dc2626"; // Tailwind red-600
const COLOR_SECONDARY = "#f59e0b"; // Tailwind amber-500
// 실루엣 컬러 — 컨테이너 배경(light: neutral-50 / dark: neutral-200)과 충분히 대비.
// 이전 #e5e7eb은 다크모드에서 컨테이너와 동일 색이라 실루엣이 안 보였음.
const COLOR_BASE = "#9ca3af"; // Tailwind neutral-400

// frequency=1 → highlightedColors[0], frequency=2 → highlightedColors[1].
// 따라서 [secondary, primary] 순서로 전달.
const HIGHLIGHT_COLORS = [COLOR_SECONDARY, COLOR_PRIMARY] as const;

export default function BodyDiagram({
  primary,
  secondary,
  exerciseName,
}: Props) {
  const primaryLib = toLibraryMuscles(primary);
  const secondaryLib = toLibraryMuscles(secondary);

  // 빈 데이터 가드
  if (primaryLib.length === 0 && secondaryLib.length === 0) {
    return null;
  }

  const data: ExerciseEntry[] = [
    { name: exerciseName, muscles: primaryLib, frequency: 2 },
    { name: exerciseName, muscles: secondaryLib, frequency: 1 },
  ];

  // 매핑 안 된 muscle 폴백 (현재 매핑상 모두 매핑되나 defensive).
  const allMuscles = [...primary, ...secondary];
  const unmapped = Array.from(
    new Set(allMuscles.filter((m) => MUSCLE_TO_LIBRARY[m].length === 0)),
  );

  const modelStyle: CSSProperties = { width: "100%", height: "auto" };

  return (
    <figure className="mt-2">
      <figcaption className="sr-only">
        {`${exerciseName}의 자극 근육 다이어그램`}
      </figcaption>
      <div
        className="grid grid-cols-2 gap-2 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-200"
        role="img"
        aria-label={`자극 근육: 주근육 ${primary
          .map((m) => MUSCLE_KO[m])
          .join(", ")}${
          secondary.length > 0
            ? `; 보조근육 ${secondary.map((m) => MUSCLE_KO[m]).join(", ")}`
            : ""
        }`}
      >
        <TypedModel
          data={data}
          highlightedColors={HIGHLIGHT_COLORS}
          bodyColor={COLOR_BASE}
          type="anterior"
          style={modelStyle}
        />
        <TypedModel
          data={data}
          highlightedColors={HIGHLIGHT_COLORS}
          bodyColor={COLOR_BASE}
          type="posterior"
          style={modelStyle}
        />
      </div>

      {unmapped.length > 0 && (
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          추가 자극: {unmapped.map((m) => MUSCLE_KO[m]).join(", ")}
        </p>
      )}
    </figure>
  );
}
