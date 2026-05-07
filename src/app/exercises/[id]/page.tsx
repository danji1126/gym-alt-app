// Design Ref: §5.1 Screen 3 + §11.6 — Exercise detail page.
// Plan SC: 873 exercise IDs all statically generated.
// M4: Client island <AlternativesButton/> 추가 — 추천 모달 진입점.
// M7: <FavoriteButton/> 상단 우측 추가.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllExerciseIds, getExerciseById } from "@/lib/data";
import { ExerciseDetail } from "@/components/exercise-detail";
import { BackLink } from "@/components/back-link";
import { AlternativesButton } from "@/components/alternatives-button";
import { FavoriteButton } from "@/components/favorite-button";

export async function generateStaticParams() {
  return getAllExerciseIds().map((id) => ({ id }));
}

export const dynamicParams = false;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const exercise = getExerciseById(id);
  if (!exercise) return { title: "운동을 찾을 수 없음" };
  return {
    title: `${exercise.nameKo} | gym-alt-app`,
    description: exercise.instructionsKo[0] ?? exercise.nameKo,
  };
}

export default async function ExercisePage({ params }: Props) {
  const { id } = await params;
  const exercise = getExerciseById(id);
  if (!exercise) notFound();

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <div className="flex items-center justify-between">
        <BackLink />
        <FavoriteButton exerciseId={exercise.id} exerciseName={exercise.nameKo} />
      </div>
      <div className="mt-4">
        <ExerciseDetail exercise={exercise} />
      </div>
      <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <AlternativesButton target={exercise} />
      </div>
    </main>
  );
}
