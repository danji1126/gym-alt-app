// Design Ref: §5.1 Screen 2 + §11.5 — Bucket-based muscle list page.
// Plan SC: 7 bucket slugs all statically generated via generateStaticParams.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MUSCLE_BUCKETS, getBucketBySlug } from "@/lib/muscle-groups";
import { getExercisesByMuscles, sortForList } from "@/lib/data";
import { ExerciseListItem } from "@/components/exercise-list-item";
import { BackLink } from "@/components/back-link";

export async function generateStaticParams() {
  return MUSCLE_BUCKETS.map((b) => ({ muscle: b.slug }));
}

// output: 'export' + dynamicParams=false → 정의된 7 slug만 빌드, 그 외 404.
export const dynamicParams = false;

interface Props {
  params: Promise<{ muscle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { muscle } = await params;
  const bucket = getBucketBySlug(muscle);
  if (!bucket) return { title: "부위를 찾을 수 없음" };
  return { title: `${bucket.labelKo} 운동 | gym-alt-app` };
}

export default async function MusclePage({ params }: Props) {
  const { muscle } = await params;
  const bucket = getBucketBySlug(muscle);
  if (!bucket) notFound();

  const exercises = sortForList(getExercisesByMuscles(bucket.muscles));

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <BackLink />

      <header className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight">
          <span aria-hidden="true">{bucket.emoji}</span> {bucket.labelKo}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          운동 {exercises.length}개
        </p>
      </header>

      {exercises.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          해당 부위 운동이 없습니다.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {exercises.map((e) => (
            <li key={e.id}>
              <ExerciseListItem exercise={e} showAlternatives />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
