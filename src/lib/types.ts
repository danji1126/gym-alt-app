// Design Ref: §3.1 Entity Definition — single source-of-truth for domain types.
// Pure types only. No external imports.

/** Free Exercise DB의 17개 근육군. */
export type MuscleGroup =
  | "abdominals"
  | "abductors"
  | "adductors"
  | "biceps"
  | "calves"
  | "chest"
  | "forearms"
  | "glutes"
  | "hamstrings"
  | "lats"
  | "lower back"
  | "middle back"
  | "neck"
  | "quadriceps"
  | "shoulders"
  | "traps"
  | "triceps";

/** Free Exercise DB의 원본 equipment 버킷. */
export type EquipmentRaw =
  | "body only"
  | "machine"
  | "other"
  | "foam roll"
  | "kettlebells"
  | "dumbbell"
  | "cable"
  | "barbell"
  | "bands"
  | "medicine ball"
  | "exercise ball"
  | "e-z curl bar"
  | "none";

/** PRD §4.4 — 운동명 정규식 + equipment 기반 세분화 분류. */
export type DetailedEquipment =
  // 머신류 (운동명 기반)
  | "smith-machine"
  | "leg-press-machine"
  | "lat-pulldown-machine"
  | "chest-press-machine"
  | "leg-extension-machine"
  | "leg-curl-machine"
  | "pec-deck-machine"
  | "hack-squat-machine"
  // M9 — generic-machine 안의 자주 쓰이는 머신을 별도 분류
  | "shoulder-press-machine"
  | "calf-raise-machine"
  | "row-machine"
  | "t-bar-row-machine"
  | "abductor-adductor-machine"
  | "ab-crunch-machine"
  | "dip-machine"
  | "generic-machine"
  // 자유 중량
  | "barbell"
  | "dumbbell"
  | "e-z curl bar"
  | "kettlebells"
  // 케이블
  | "cable"
  // 보조 도구
  | "bands"
  | "exercise ball"
  | "medicine ball"
  | "foam roll"
  // 맨몸
  | "body only"
  // fallback
  | "other";

export type ExerciseLevel = "beginner" | "intermediate" | "expert";
export type ExerciseForce = "static" | "pull" | "push" | null;
export type ExerciseMechanic = "isolation" | "compound" | null;
export type ExerciseCategory =
  | "strength"
  | "stretching"
  | "plyometrics"
  | "strongman"
  | "powerlifting"
  | "cardio"
  | "olympic weightlifting"
  | "crossfit";

/** Free Exercise DB 원본 운동 (data/exercises.json의 원소). */
export interface RawExercise {
  id: string;
  name: string;
  force: ExerciseForce;
  level: ExerciseLevel;
  mechanic: ExerciseMechanic;
  equipment: EquipmentRaw | null;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  instructions: string[];
  category: ExerciseCategory;
  images: string[];
}

/** 한국어 번역 (data/translations.json 구조). */
export interface TranslationsFile {
  version: string;
  translationStyle: string;
  names: Record<string, string>;
  instructions: Record<string, string[]>;
}

/** 빌드 산출물 — public/data/exercises-ko.json의 원소.
 *  Plan SC: 873/873 ID 매칭 + detailedEquipment.length >= 1 보장. */
export interface EnrichedExercise {
  id: string;
  // 영어 원본 (검색·YouTube 쿼리용)
  nameEn: string;
  instructionsEn: string[];
  // 한국어 (UI 표시용)
  nameKo: string;
  instructionsKo: string[];
  // 근육
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  // 메타
  force: ExerciseForce;
  level: ExerciseLevel;
  mechanic: ExerciseMechanic;
  category: ExerciseCategory;
  // 기구
  equipmentRaw: EquipmentRaw | null;
  detailedEquipment: DetailedEquipment[];
  // 미디어
  imageUrls: string[];
  youtubeSearchUrl: string;
}

/** 헬스장 프리셋 (data/gym-presets.json + LocalStorage). */
export interface GymPreset {
  id: string;
  name: string;
  availableEquipment: DetailedEquipment[];
}
