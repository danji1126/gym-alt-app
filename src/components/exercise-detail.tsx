// Design Ref: §5.1 Screen 3 + §5.4 — Exercise detail body composer.
// RSC. Composes MuscleBadgeList, ExerciseImage, and metadata sections.
// M5: BodyDiagram (lazy Client via body-diagram-loader wrapper) + YoutubeLinkButton 추가.

import type { EnrichedExercise } from "@/lib/types";
import {
  CATEGORY_KO,
  EQUIPMENT_KO,
  FORCE_KO,
  LEVEL_KO,
  MECHANIC_KO,
} from "@/lib/i18n";
import { MuscleBadgeList } from "./muscle-badge-list";
import { ExerciseImage } from "./exercise-image";
import { YoutubeLinkButton } from "./youtube-link-button";
import { BodyDiagramLoader } from "./body-diagram-loader";

interface Props {
  exercise: EnrichedExercise;
}

export function ExerciseDetail({ exercise }: Props) {
  const firstEquipment = exercise.detailedEquipment[0];
  const equipmentLabel = firstEquipment ? EQUIPMENT_KO[firstEquipment] : "-";
  const forceLabel = exercise.force ? FORCE_KO[exercise.force] : "-";
  const mechanicLabel = exercise.mechanic
    ? MECHANIC_KO[exercise.mechanic]
    : "-";

  // Plan SC: 첫 2장은 grid, 나머지는 stack.
  const [firstImage, secondImage, ...restImages] = exercise.imageUrls;

  return (
    <article className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold leading-tight">{exercise.nameKo}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {exercise.nameEn}
        </p>
        <p className="mt-2">
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {CATEGORY_KO[exercise.category]}
          </span>
        </p>
      </header>

      {/* Muscle badges + Body diagram (M5) */}
      <div>
        <MuscleBadgeList
          primary={exercise.primaryMuscles}
          secondary={exercise.secondaryMuscles}
        />
        <BodyDiagramLoader
          primary={exercise.primaryMuscles}
          secondary={exercise.secondaryMuscles}
          exerciseName={exercise.nameKo}
        />
      </div>

      {/* Demo images */}
      {exercise.imageUrls.length > 0 && (
        <section aria-label="시연 이미지">
          {firstImage && secondImage ? (
            <div className="grid grid-cols-2 gap-2">
              <ExerciseImage src={firstImage} alt={exercise.nameKo} eager />
              <ExerciseImage src={secondImage} alt={exercise.nameKo} />
            </div>
          ) : firstImage ? (
            <ExerciseImage src={firstImage} alt={exercise.nameKo} eager />
          ) : null}

          {restImages.length > 0 && (
            <div className="mt-2 space-y-2">
              {restImages.map((src, idx) => (
                <ExerciseImage
                  key={src}
                  src={src}
                  alt={`${exercise.nameKo} (${idx + 3})`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Instructions */}
      {exercise.instructionsKo.length > 0 && (
        <section aria-labelledby="instructions">
          <h2
            id="instructions"
            className="text-sm font-semibold text-neutral-700 dark:text-neutral-300"
          >
            단계별 설명
          </h2>
          <ol className="mt-2 space-y-2 text-sm leading-relaxed">
            {exercise.instructionsKo.map((step, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* YouTube 시연 검색 (M5 — F-6) */}
      {exercise.youtubeSearchUrl && (
        <YoutubeLinkButton
          url={exercise.youtubeSearchUrl}
          exerciseName={exercise.nameKo}
        />
      )}

      {/* Metadata */}
      <section aria-labelledby="meta">
        <h2
          id="meta"
          className="text-sm font-semibold text-neutral-700 dark:text-neutral-300"
        >
          메타 정보
        </h2>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <MetaItem label="난이도" value={LEVEL_KO[exercise.level]} />
          <MetaItem label="방향" value={forceLabel} />
          <MetaItem label="형태" value={mechanicLabel} />
          <MetaItem label="기구" value={equipmentLabel} />
        </dl>
      </section>
    </article>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
