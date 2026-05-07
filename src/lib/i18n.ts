// Design Ref: §3.1 — Korean label mappings for UI display.
// Plan SC: PRD §4.3 17개 항목 모두 포함.

import type {
  MuscleGroup,
  DetailedEquipment,
  ExerciseLevel,
  ExerciseForce,
  ExerciseMechanic,
  ExerciseCategory,
} from "./types";

/** 17개 근육군의 한국어 표시명. PRD §4.3 매핑. */
export const MUSCLE_KO: Record<MuscleGroup, string> = {
  abdominals: "복근",
  abductors: "외전근",
  adductors: "내전근",
  biceps: "이두",
  calves: "종아리",
  chest: "가슴",
  forearms: "전완",
  glutes: "둔근",
  hamstrings: "햄스트링",
  lats: "광배근",
  "lower back": "허리",
  "middle back": "등 중부",
  neck: "목",
  quadriceps: "대퇴사두",
  shoulders: "어깨",
  traps: "승모근",
  triceps: "삼두",
};

/** DetailedEquipment의 한국어 표시명. */
export const EQUIPMENT_KO: Record<DetailedEquipment, string> = {
  "smith-machine": "스미스머신",
  "leg-press-machine": "레그 프레스 머신",
  "lat-pulldown-machine": "랫 풀다운 머신",
  "chest-press-machine": "체스트 프레스 머신",
  "leg-extension-machine": "레그 익스텐션 머신",
  "leg-curl-machine": "레그 컬 머신",
  "pec-deck-machine": "펙덱 머신",
  "hack-squat-machine": "핵 스쿼트 머신",
  "shoulder-press-machine": "숄더 프레스 머신",
  "calf-raise-machine": "카프 레이즈 머신",
  "row-machine": "시티드 로우 머신",
  "t-bar-row-machine": "T바 로우 머신",
  "abductor-adductor-machine": "외전·내전 머신",
  "ab-crunch-machine": "복근 크런치 머신",
  "dip-machine": "딥 머신",
  "generic-machine": "일반 머신",
  barbell: "바벨",
  dumbbell: "덤벨",
  "e-z curl bar": "이지 컬 바",
  kettlebells: "케틀벨",
  cable: "케이블",
  bands: "밴드",
  "exercise ball": "짐볼",
  "medicine ball": "메디신볼",
  "foam roll": "폼롤러",
  "body only": "맨몸",
  other: "기타",
};

export const LEVEL_KO: Record<ExerciseLevel, string> = {
  beginner: "초급",
  intermediate: "중급",
  expert: "고급",
};

export const FORCE_KO: Record<NonNullable<ExerciseForce>, string> = {
  static: "정적",
  pull: "당기기",
  push: "밀기",
};

export const MECHANIC_KO: Record<NonNullable<ExerciseMechanic>, string> = {
  isolation: "고립",
  compound: "복합",
};

export const CATEGORY_KO: Record<ExerciseCategory, string> = {
  strength: "근력",
  stretching: "스트레칭",
  plyometrics: "플라이오메트릭",
  strongman: "스트롱맨",
  powerlifting: "파워리프팅",
  cardio: "유산소",
  "olympic weightlifting": "역도",
  crossfit: "크로스핏",
};
