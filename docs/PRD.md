# PRD — Gym Alternative Exercise Web App

**작성일**: 2026-04-30
**작성자**: jiinbae
**버전**: v0.2
**상태**: Approved — 구현 진행 가능
**변경 이력**:
- v0.1 (2026-04-30): 초안 작성
- v0.2 (2026-04-30): Open Questions Q-1~Q-7 결정 반영 (전체 한국어 번역 / 기본 풀 헬스장 프리셋 / 호흡 메모 제거 / 이미지 호스팅·다이어그램·도메인 기본값 확정)
- v0.3 (2026-04-30): D-1 결정 — 번역은 본 Claude Code 세션에서 직접 수행, M0 진행 중
- v0.4 (2026-04-30): 번역 스타일 변경 — instructions를 word-for-word가 아닌 **간결화 (condensed) 스타일**로. 운동당 2-5줄, 헬스장 현장 사용에 최적화. M0 Pass 1 완료 (873/873), Pass 2 batch 1 완료 (100/873).

---

## 1. Overview

### 1.1 Problem Statement
헬스장에서 사용하려던 기구가 (1) 다른 사람이 쓰고 있거나, (2) 그 헬스장에 아예 없을 때, 동일 근육군을 자극하는 **대체 운동을 30초 이내에** 찾을 수 있는 도구가 부족하다. 기존 솔루션(YouTube 검색, ChatGPT, 헬스 앱)은 검색·읽기 시간이 길어 헬스장 현장에서 쓰기 부적합하다.

### 1.2 Solution Summary
공개 운동 데이터셋(Free Exercise DB, 873개 운동)을 **빌드 타임에 한국어로 일괄 번역하여** 단일 한국어 JSON으로 변환한 뒤, 사용자가 **부위 또는 사용 불가 운동**을 선택하면 동일 근육군을 자극하는 대체 운동을 **자극 근육 시각화 + 시연 이미지 + YouTube 시연 검색 링크**와 함께 보여주는 정적 모바일 웹앱.

### 1.3 Goals
- **G1**: 헬스장 현장에서 한 손으로 30초 이내에 대체 운동 도달
- **G2**: 추천된 운동이 원래 운동과 **동일한 주근육**을 자극함을 시각적으로 확인
- **G3**: 운영 비용 ₩0, 회원가입·로그인·서버 의존성 0
- **G4**: 본인이 자주 가는 헬스장의 가용 기구만 필터링하여 정밀도 향상

### 1.4 Non-Goals (명시적 배제)
- ❌ 운동 기록·일지 기능 (Strong, Hevy 영역)
- ❌ 운동 플랜·루틴 수립 기능 (Fitbod 영역)
- ❌ 영양·수면·체중 트래킹
- ❌ 커뮤니티·소셜·공유 기능
- ❌ AI 챗봇·자연어 질의 (ChatGPT가 더 잘함)
- ❌ 사용자 계정·로그인
- ❌ 다국어 지원 (한국어 단일 — 영어 원문은 검색 보조용으로만 보존)
- ❌ 자체 영상 콘텐츠 제작
- ❌ 호흡법 별도 메모/주석 (영상 자막에 의존)
- ❌ 런타임 LLM 호출 (번역은 빌드 타임 1회성 작업)

### 1.5 Success Criteria
| 지표 | 목표 |
|------|------|
| Time-to-Answer | 앱 진입 → 추천 운동 카드 도달까지 < 15초 |
| Resolution Rate | 추천 운동 중 1개를 실제로 수행한 비율 > 80% (자가 측정) |
| 운영 비용 | 월 ₩0 |
| 추천 정확도 | 추천 운동의 primaryMuscle ≥ 1개 일치 100% |

---

## 2. User & Use Cases

### 2.1 Target User
**단일 사용자(jiinbae)** — 헬스장 이용 중급자, 여러 지점·헬스장 이용 가능성 있음.

### 2.2 User Stories

**US-1 (핵심 시나리오 1)**: 기구 점유로 인한 대체
> "스미스머신에서 벤치프레스를 하려고 했는데 두 사람이 줄 서 있다. 가슴 운동을 비슷하게 할 수 있는 다른 기구로 뭐가 있는지 알고 싶다."

**US-2 (핵심 시나리오 2)**: 기구 부재로 인한 대체
> "오늘 간 헬스장에 레그 익스텐션 머신이 없다. 대퇴사두를 자극할 수 있는 대체 운동을 찾고 싶다."

**US-3**: 부위별 탐색
> "오늘은 등 운동의 날인데 어떤 운동들이 있는지 한눈에 보고 가용 기구로 가능한 것을 고르고 싶다."

**US-4**: 호흡법·자세 확인
> "처음 해보는 운동이라 자세와 호흡법을 30초 안에 확인하고 싶다."

### 2.3 Anti-Use Cases
- 운동 중 무게·횟수·세트를 기록하려는 경우 → 다른 앱 사용
- 4주 헬스 플랜을 짜려는 경우 → 본 앱 범위 밖

---

## 3. Functional Requirements

### 3.1 Core Features (MVP)

| ID | 기능 | 우선순위 |
|----|------|---------|
| F-1 | 부위 선택 → 해당 부위 운동 목록 표시 | P0 |
| F-2 | 사용 불가 운동 선택 → 대체 운동 1-3개 추천 | P0 |
| F-3 | 운동 카드: 한국어 운동명, 자극 근육 시각화, 기구, 단계별 한국어 설명 | P0 |
| F-4 | 가용 기구 필터 (헬스장 프리셋, 기본값 = "기본 풀 헬스장") | P0 |
| F-5 | 운동 시연 이미지 표시 (시작·종료 자세 2장) | P0 |
| F-6 | YouTube 검색 딥링크 (영어 운동명 자동 쿼리) | P0 |
| F-7 | 운동명 검색 (한국어 + 영문 동시 검색) | P1 |
| F-8 | 즐겨찾기 (LocalStorage) | P2 |
| F-9 | PWA (오프라인 동작) | P2 |

### 3.2 Non-Functional Requirements
- **NFR-1**: 모바일 우선(375px ~ 430px 기준 디자인)
- **NFR-2**: 첫 화면 LCP < 1.5s (3G 환경)
- **NFR-3**: 번들 크기 (JS+CSS+데이터) < 2MB
- **NFR-4**: 정적 사이트 — 서버 함수·DB 0
- **NFR-5**: iOS Safari 16+, Android Chrome 최신 2버전 지원

---

## 4. Data Model

### 4.1 원본 데이터셋
- **소스**: [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db) `dist/exercises.json`
- **라이선스**: Unlicense (Public Domain)
- **운동 수**: 873
- **크기**: 약 1MB

### 4.2 Exercise (원본 스키마)
```typescript
interface Exercise {
  id: string;                    // "Smith_Machine_Bench_Press"
  name: string;                  // "Smith Machine Bench Press"
  force: "static" | "pull" | "push" | null;
  level: "beginner" | "intermediate" | "expert";
  mechanic: "isolation" | "compound" | null;
  equipment: EquipmentType | null;  // 13개 enum
  primaryMuscles: MuscleGroup[];    // 17개 enum
  secondaryMuscles: MuscleGroup[];
  instructions: string[];           // 단계별 영문 설명
  category: ExerciseCategory;       // strength/cardio/stretching 등
  images: string[];                 // ["{id}/0.jpg", "{id}/1.jpg"]
}
```

### 4.3 Enriched Exercise (전처리 후 최종 스키마)
원본 데이터의 `equipment` 필드가 너무 거칠어서(13개 버킷, "machine"이 catch-all) 추천 정확도를 위해, 그리고 한국어 UI를 위해 전처리 단계에서 다음 필드를 추가한다:

```typescript
interface EnrichedExercise {
  id: string;
  // 영어 원본 (검색·YouTube 쿼리용 보존)
  nameEn: string;
  instructionsEn: string[];

  // 한국어 번역 (UI 표시용 — F-3, F-6 외 모든 화면의 기본값)
  nameKo: string;                // ex) "스미스머신 벤치 프레스"
  instructionsKo: string[];      // 단계별 한국어 번역

  // 근육군 (한국어 표시명은 별도 enum 매핑 테이블)
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];

  // 메타데이터
  force: "static" | "pull" | "push" | null;
  level: "beginner" | "intermediate" | "expert";
  mechanic: "isolation" | "compound" | null;
  category: ExerciseCategory;

  // 원본 + 파생 기구 분류
  equipmentRaw: EquipmentType | null;
  detailedEquipment: DetailedEquipment[];
  // ex) "Smith Machine Bench Press" → ["smith-machine"]
  //     "Cable Crossover" → ["cable"]
  //     "Leg Press" → ["leg-press-machine"]

  // 미디어
  imageUrls: string[];           // GitHub raw URL로 절대화
  youtubeSearchUrl: string;      // 영어명 + "form breathing" 쿼리
}
```

**MuscleGroup 한국어 매핑** (별도 상수, UI에서 사용):
```typescript
const MUSCLE_KO: Record<MuscleGroup, string> = {
  "abdominals": "복근",       "abductors": "외전근",      "adductors": "내전근",
  "biceps": "이두",          "calves": "종아리",         "chest": "가슴",
  "forearms": "전완",        "glutes": "둔근",          "hamstrings": "햄스트링",
  "lats": "광배근",          "lower back": "허리",       "middle back": "등 중부",
  "neck": "목",             "quadriceps": "대퇴사두",    "shoulders": "어깨",
  "traps": "승모근",         "triceps": "삼두",
};
```

### 4.4 DetailedEquipment 분류 (운동명 기반)
정규식 매칭 우선순위:
1. `smith` → `smith-machine`
2. `cable` → `cable`
3. `leg press` → `leg-press-machine`
4. `lat pulldown` → `lat-pulldown-machine`
5. `chest press` → `chest-press-machine`
6. `leg extension` → `leg-extension-machine`
7. `leg curl` → `leg-curl-machine`
8. `pec deck` / `butterfly` → `pec-deck-machine`
9. `hack squat` → `hack-squat-machine`
10. (기타 `equipment === "machine"`) → `generic-machine`
11. 그 외 → `equipment` 필드 그대로 (`barbell`, `dumbbell`, `body only` 등)

### 4.5 GymPreset (사용자 설정)
```typescript
interface GymPreset {
  id: string;             // "default-full", "home-gym", ...
  name: string;           // 한국어 표시명
  availableEquipment: DetailedEquipment[];
}
```
- LocalStorage에 저장
- 앱 첫 실행 시 **기본 프리셋 1개 자동 시드** (아래 4.5.1)
- 사용자는 프리셋 추가·편집·삭제 가능

#### 4.5.1 기본 프리셋: "기본 풀 헬스장"
한국 일반 풀옵션 헬스장 기준으로 활성화될 기구 (DetailedEquipment 전체 중 일반적인 항목):

```typescript
const DEFAULT_FULL_GYM: GymPreset = {
  id: "default-full",
  name: "기본 풀 헬스장",
  availableEquipment: [
    // 자유 중량
    "barbell", "dumbbell", "e-z curl bar", "kettlebells",
    // 케이블·스미스
    "cable", "smith-machine",
    // 일반 머신류
    "leg-press-machine", "lat-pulldown-machine", "chest-press-machine",
    "leg-extension-machine", "leg-curl-machine", "pec-deck-machine",
    "hack-squat-machine", "generic-machine",
    // 보조 도구
    "bands", "exercise ball", "medicine ball", "foam roll",
    // 맨몸
    "body only",
  ],
};
```

→ 사용자는 본인 헬스장에 없는 기구만 토글로 끄면 됨 (감산 방식이 더 효율적).

### 4.6 번역 파이프라인 (한국어 JSON 생성)

#### 4.6.1 원칙
- **빌드 타임 1회성 작업** (런타임 LLM 호출 금지 — Non-Goal)
- 결과물은 git 커밋되어 재현 가능 (LLM 출력의 불확정성 제거)
- 번역 품질 검수는 수동 — 잘못된 운동명/근육명만 수정 후 커밋

#### 4.6.2 번역 대상 필드
| 원본 필드 | 번역 필드 | 비고 |
|----------|----------|------|
| `name` | `nameKo` | 운동명 — 가장 중요, 검수 필수 |
| `instructions[]` | `instructionsKo[]` | 단계별 설명 — 자세·동작 위주 |
| `primaryMuscles`, `secondaryMuscles` | (번역 안 함) | 표시 시 `MUSCLE_KO` 매핑 사용 |
| `equipment`, `force`, `level`, `mechanic`, `category` | (번역 안 함) | 표시 시 별도 enum→한국어 매핑 |

#### 4.6.3 번역 워크플로우
```
1. scripts/translate.ts 실행
   - dist/exercises.json 로드
   - 873개 운동의 (id, name, instructions[]) 추출
   - LLM에 batch 요청 (50개씩 ~18배치)
     · 시스템 프롬프트: "헬스 전문 번역가. 해부학·운동명은 한국 헬스 커뮤니티 통용어로."
     · 출력 포맷: JSON {id, nameKo, instructionsKo[]}
   - 응답을 data/translations.json에 저장
2. 사용자 검수 (한 번에 처리)
   - 자주 쓰는 운동 50개를 우선 검수
   - 명백한 오역만 수정 → 커밋
3. scripts/preprocess.ts에서 translations.json + exercises.json 머지
   → public/data/exercises-ko.json 산출
```

#### 4.6.4 번역 도구 선택 (구현 단계 결정)
- 후보 A: Claude API / GPT API — 비용 ≈ $1-3 일회성
- 후보 B: 본 Claude Code 세션에서 50개씩 처리 — 추가 비용 0
- 후보 C: 로컬 LLM (Ollama llama3.1) — 시간 ↑, 품질 변동
- **권장**: B로 시작, 품질 부족 시 A. (사용자 확정 필요)

#### 4.6.5 운동명 번역 가이드라인
| 영어 패턴 | 한국어 변환 예시 |
|----------|----------------|
| "Barbell Bench Press" | "바벨 벤치 프레스" |
| "Smith Machine ~" | "스미스머신 ~" |
| "Cable ~" | "케이블 ~" |
| "Dumbbell ~" | "덤벨 ~" |
| "~ Squat" | "~ 스쿼트" |
| "~ Row" | "~ 로우" |
| "~ Curl" | "~ 컬" |
| "~ Press" | "~ 프레스" |
| "~ Raise" | "~ 레이즈" |
| "~ Extension" | "~ 익스텐션" |
| "~ Deadlift" | "~ 데드리프트" |
| "~ Pulldown" | "~ 풀다운" |

원칙: 한국 헬스 커뮤니티에서 통용되는 외래어 표기 우선, 의역보다 음차.

---

## 5. Recommendation Algorithm

### 5.1 입력
- `targetExercise`: 사용 불가 운동 1개
- `availableEquipment`: 현재 가용 기구 목록 (GymPreset 또는 사용자 토글)

### 5.2 알고리즘 (정확도 우선)
```
function recommend(target, availableEquipment):
  candidates = exercises.filter(e =>
    e.id !== target.id &&
    e.detailedEquipment.some(eq => availableEquipment.includes(eq))
  )

  scored = candidates.map(e => ({
    exercise: e,
    score: calcScore(e, target)
  }))

  return scored.sort((a, b) => b.score - a.score).slice(0, 3)

function calcScore(candidate, target):
  // 1. Primary muscle 일치 (가중치 0.6)
  primaryOverlap = jaccard(candidate.primaryMuscles, target.primaryMuscles)

  // 2. Secondary muscle 일치 (가중치 0.2)
  secondaryOverlap = jaccard(
    candidate.secondaryMuscles,
    target.secondaryMuscles
  )

  // 3. force 일치 (가중치 0.1) — push/pull 방향성
  forceMatch = (candidate.force === target.force) ? 1 : 0

  // 4. mechanic 일치 (가중치 0.1) — compound/isolation
  mechanicMatch = (candidate.mechanic === target.mechanic) ? 1 : 0

  return 0.6 * primaryOverlap +
         0.2 * secondaryOverlap +
         0.1 * forceMatch +
         0.1 * mechanicMatch
```

### 5.3 정확도 보장 규칙
- **Hard constraint**: `candidate.primaryMuscles ∩ target.primaryMuscles ≠ ∅`
  → primary가 하나도 안 겹치면 후보에서 제외
- **Tie-breaker**: 점수 동률 시 `level` 같은 것 우선 → `mechanic` 같은 것 우선

### 5.4 부위별 검색 (F-1)
- `primaryMuscles`에 선택 부위 포함 + `availableEquipment` 필터 → 그대로 표시 (스코어 X, 정렬은 level 오름차순)

---

## 6. Screen Specifications

### 6.1 Information Architecture
```
/                        Home (부위 선택 + 검색)
/muscle/[muscle]         부위별 운동 목록
/exercise/[id]           운동 상세 + 대체 운동 추천
/settings                헬스장 프리셋 관리
```

### 6.2 Screen 1: Home
**목적**: 빠른 진입점 제공
**구성**:
- 상단: 현재 활성 헬스장 프리셋 칩 (ex: "🏋️ 회사 헬스장 ▾")
- 검색창: "운동명 또는 부위 검색"
- 부위 선택 그리드 (8개 큰 버튼):
  - 가슴 / 등 / 어깨 / 팔(이두) / 팔(삼두) / 하체 / 복근 / 코어
- 하단: "최근 본 운동" 3개 (LocalStorage)

### 6.3 Screen 2: 부위별 운동 목록
**목적**: 가용 기구로 가능한 운동을 모두 탐색
**구성**:
- 상단: 부위명 + 가용 기구 필터 토글
- 카드 리스트 (level 오름차순):
  - 운동명 / 기구 아이콘 / 자극 근육 미니 다이어그램 / 작은 시연 이미지

### 6.4 Screen 3: 운동 상세 (가장 중요)
**목적**: 사용자가 헬스장에서 보는 핵심 화면
**구성** (스크롤 우선순위):
1. **운동명(한국어)** + 영어명 작게 부기 + 카테고리 태그
2. **자극 근육 다이어그램** — 인체 정면/후면, 주근육 빨강·보조근육 주황 강조 + 한국어 근육명
3. **시연 이미지 2장** — 시작 자세 ↔ 종료 자세 (탭 시 토글 또는 자동 GIF처럼 토글)
4. **단계별 설명** (`instructionsKo[]`) — 한국어 번역, 작게 영어 원문 토글 가능
5. **▶ YouTube 시연 검색** 버튼 — 영어 운동명으로 새 탭 열기 (호흡법은 영상 자막에 의존)
6. **🔄 다른 기구로 대체** 버튼 → 추천 운동 3개 모달

### 6.5 Screen 4: 대체 운동 추천 (모달 또는 페이지)
**목적**: F-2 핵심 시나리오 처리
**구성**:
- 헤더: "❌ {원래 운동} 대체"
- 가용 기구 토글 (이 화면에서 즉시 변경 가능)
- 추천 카드 1-3개:
  - 점수 표시 안 함 (혼란 방지)
  - 자극 근육 일치 배지: "주근육 100% / 보조 67%"
  - 탭하면 운동 상세로 이동

### 6.6 Screen 5: 설정 (헬스장 프리셋)
**목적**: 가용 기구 정의
**구성**:
- 프리셋 목록
- 추가/편집: 기구 체크박스 그리드 (DetailedEquipment 전체)
- 활성 프리셋 선택

### 6.7 Doumont 원칙 적용
- 한 화면 내 결정점 ≤ 1개
- 운동 카드 첫 번째 fold 안에 핵심 정보(이름, 근육, 시연) 모두 표시
- 텍스트보다 시각(다이어그램, 이미지)을 우선
- 큰 탭 영역(최소 44×44pt)

---

## 7. Tech Stack & Deployment

### 7.1 Stack
| 레이어 | 기술 | 비고 |
|--------|------|------|
| 프레임워크 | Next.js 15 (App Router) | `output: 'export'` 정적 빌드 |
| 언어 | TypeScript | strict 모드 |
| 스타일 | Tailwind CSS | 모바일 퍼스트 |
| 상태 | React Server Components + LocalStorage | 글로벌 상태 라이브러리 불필요 |
| 데이터 | 정적 JSON 번들 | 빌드 타임에 enriched JSON 생성 |
| 이미지 | GitHub raw URL (1차) → Cloudflare R2 미러링 (2차) | |
| 근육 다이어그램 | SVG (직접 그리거나 OSS 사용) | |
| PWA | next-pwa | F-9 단계에서 추가 |

### 7.2 Build Pipeline
```
[1회성 — 번역 작업]
0. scripts/translate.ts
   - dist/exercises.json 다운로드 (873개)
   - LLM batch로 한국어 번역 → data/translations.json
   - 사용자 수동 검수 (자주 쓰는 50개 우선) → 커밋

[매 빌드마다]
1. scripts/preprocess.ts
   - dist/exercises.json + data/translations.json 머지
   - DetailedEquipment 정규식 추출
   - imageUrls 절대화 (GitHub raw)
   - youtubeSearchUrl 생성 (영어명 기반)
   → public/data/exercises-ko.json 생성

2. next build (output: export)
   → out/ 정적 파일

3. Cloudflare Pages 자동 배포 (GitHub push 트리거)
```

### 7.3 Hosting: Cloudflare Pages
- **무료 플랜**으로 충분: 무제한 대역폭, 500 빌드/월
- GitHub 연동 자동 배포
- 한국 PoP로 레이턴시 우수
- `*.pages.dev` 서브도메인 무료
- 커스텀 도메인 선택 사항

### 7.4 Repository 구조
```
gym-alt-app/
├── docs/
│   └── PRD.md (본 문서)
├── data/
│   ├── translations.json      # 한국어 번역 (1회성, 커밋됨)
│   └── gym-presets.json       # 기본 프리셋 시드
├── public/
│   └── data/
│       └── exercises-ko.json  # 빌드 산출물 (한국어 번역 머지됨)
├── scripts/
│   ├── translate.ts           # 1회성 번역 스크립트
│   └── preprocess.ts          # 매 빌드 전처리
├── src/
│   ├── app/                   # Next.js App Router
│   ├── components/
│   ├── lib/
│   │   ├── recommend.ts       # 추천 알고리즘
│   │   ├── filter.ts
│   │   ├── i18n.ts            # MUSCLE_KO 등 enum 매핑
│   │   └── types.ts
│   └── styles/
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 8. Out of Scope (재확인)

| 기능 | 이유 |
|------|------|
| 운동 기록·세트·횟수 | 다른 앱이 더 잘함, 본 앱은 "순간 도구" |
| 회원가입·계정 | 본인만 사용, 무용 |
| 영양·수면·심박수 | 범위 폭증 |
| AI 챗봇 / 런타임 LLM 호출 | ChatGPT가 더 잘함, 비용·지연 발생 |
| 자체 영상 제작 | YouTube 위임 |
| 다국어 (i18n) | 한국어 단일 — 영어 원문은 검색 보조용 보존만 |
| 호흡법 별도 메모 | 영상 자막 의존 (Q-4 결정) |
| 헬스장 위치 검색 | 본 앱 직무 아님 |
| 부상 회복·재활 운동 | 의료 영역, 면책 리스크 |

---

## 9. Decisions Resolved & Open Items

### 9.1 결정 완료 (v0.2)
| ID | 질문 | ✅ 결정 |
|----|------|--------|
| Q-1 | 운동명 언어 | **전체 한국어 번역 JSON 생성** (§4.6 번역 파이프라인) |
| Q-2 | 이미지 호스팅 | **GitHub raw URL 1차 사용**, 핫링크/속도 문제 발견 시 R2 미러 (P2) |
| Q-3 | 헬스장 프리셋 초기값 | **"기본 풀 헬스장" 프리셋** 자동 시드 (§4.5.1) |
| Q-4 | 호흡법 메모 | **추가하지 않음** — YouTube 영상 자막에 의존 |
| Q-5 | 근육 다이어그램 | **`react-body-highlighter` 우선 시도**, 부족 시 SVG 직접 작성 |
| Q-6 | UI 라벨 언어 | **한국어 전체** |
| Q-7 | 도메인 | **`*.pages.dev` 무료 서브도메인** |

### 9.2 추가 결정 사항 (구현 단계)
| ID | 질문 | ✅ 결정 |
|----|------|--------|
| D-1 | 번역 도구 선택 (§4.6.4) | **(a) 본 Claude Code 세션에서 직접 처리** — 추가 비용 0, 검수 동시 가능 |

### 9.3 기술 검증 필요 (구현 중)
- **TV-1**: GitHub raw 이미지 직접 임베드 시 핫링크 차단·속도 이슈 확인 (M3에서)
- **TV-2**: 1MB JSON + 한국어 필드 추가 후 First Load JS 크기 측정 (M2에서)
- **TV-3**: `react-body-highlighter` 한국어 라벨 표시 가능 여부, 17개 muscle 매핑 정확도 (M5에서)
- **TV-4**: PWA 오프라인 캐시 시 873개 이미지 전략 (P2 — F-9 단계)

### 9.4 후속 검토 항목 (구현 후)
- 자주 사용하는 운동 패턴이 보이면 홈 화면 "즐겨찾기" 자동화
- 정확도 부족한 추천 케이스 발견 시 score 가중치 튜닝
- 번역 품질 부족한 운동 발견 시 `translations.json` 직접 수정 후 커밋
- 사용 빈도 낮은 기능은 과감히 제거

---

## 10. 마일스톤

| 단계 | 산출물 | 예상 |
|------|--------|------|
| **M0** | **번역 작업** — `translate.ts` 실행 → `translations.json` 생성 → 자주 쓰는 50개 검수 → 커밋 | **1일** |
| M1 | 데이터 전처리 스크립트 + `exercises-ko.json` (번역 머지) | 1일 |
| M2 | Next.js 초기 세팅 + Cloudflare Pages 배포 파이프라인 | 0.5일 |
| M3 | F-1, F-3, F-5 (부위 → 목록 → 상세) 구현 | 2일 |
| M4 | F-2, F-4 (대체 추천 + 가용 기구 필터, 기본 풀 헬스장 프리셋 시드) | 1.5일 |
| M5 | F-6 YouTube 딥링크 + 근육 다이어그램(`react-body-highlighter`) | 1일 |
| M6 | 모바일 반응형·UX 다듬기 | 1일 |
| M7 (옵션) | F-7 검색, F-8 즐겨찾기, F-9 PWA | 1.5일 |

**MVP 도달까지**: 약 7일 (M0 추가)

---

## 11. References
- Free Exercise DB: https://github.com/yuhonas/free-exercise-db
- Next.js Static Export: https://nextjs.org/docs/app/guides/static-exports
- Cloudflare Pages: https://pages.cloudflare.com/
