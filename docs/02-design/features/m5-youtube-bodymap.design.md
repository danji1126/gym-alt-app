# M5 YouTube + Body Diagram Design Document

> **Summary**: `react-body-highlighter` Client Component + dynamic ssr:false lazy load + 17→19 muscle 매핑 + YouTube 외부 링크. 라이브러리 정확 API는 Do 단계에 `.d.ts`로 최종 확인.
>
> **Project**: gym-alt-app
> **Author**: jiinbae (CTO)
> **Date**: 2026-04-30
> **Status**: Draft (옵션 A — KISS)
> **Planning Doc**: [m5-youtube-bodymap.plan.md](../../01-plan/features/m5-youtube-bodymap.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | PRD §6.4 운동 상세는 "헬스장에서 보는 핵심 화면" — 시각적 근육 위치 + 시연 영상 진입 |
| **WHO** | 단일 사용자, 모바일, 한 손, iOS Safari 16+/Android Chrome |
| **RISK** | 라이브러리 SSR 미호환 / TV-3 매핑 정확도 / First Load JS 회귀 |
| **SUCCESS** | F-6 노출 + 17 muscle 모두 매핑 + typecheck 0 + build 회귀 0 + First Load JS ≤ +50 kB + TV-3 통과 |
| **SCOPE** | F-5 강화(다이어그램) + F-6 YouTube 딥링크. 추천 카드 미니어처는 후속 |

---

## 1. Overview

### 1.1 Design Goals

1. **PRD §6.4 시각적 위계 완성**: 자극 근육의 위치 시각화. text 배지 + 다이어그램 두 모두 유지 (시각 + 한국어 명시).
2. **외부 라이브러리 격리**: `body-diagram.tsx` 단일 컴포넌트가 라이브러리 의존을 캡슐화. 다른 코드는 `<BodyDiagram primary={} secondary={} />` 인터페이스만 사용.
3. **First Load JS 회귀 방지**: dynamic import + ssr:false. 운동 상세 SSR HTML에 다이어그램 chunk 미포함.
4. **TV-3 검증 가능 구조**: 매핑 표가 단일 lib에 있어 변경·검증·교체 쉬움.

### 1.2 Design Principles

- **단일 source-of-truth 매핑**: `src/lib/muscle-map.ts` 하나가 17→19 변환의 진실.
- **Defensive on lib API**: 라이브러리 정확 시그니처 미확정 — Do 단계에서 `.d.ts` 확인 후 prop 사용을 정제. 잘못된 prop은 코드에서 제거.
- **Fallback 우선**: 매핑이 부실하더라도 텍스트 배지(M3)는 유지. 다이어그램은 보조 시각.

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: Direct | Option B: Wrapped + Direct | Option C: Wrapped + Lazy |
|----------|:-:|:-:|:-:|
| **Approach** | exercise-detail.tsx에 라이브러리 직접 import | body-diagram.tsx wrapper, static import | body-diagram.tsx wrapper + dynamic ssr:false |
| **First Load JS impact** | High (~50+ kB 즉시 포함) | High (동일) | Low (chunk 분리) |
| **SSR risk** | Medium (라이브러리 window 접근 시 깨질 수 있음) | Medium | Low (ssr:false) |
| **Replaceability** | Low (라이브러리 변경 시 모든 사용처 수정) | High | High |
| **Risk** | High | Medium | Low |
| **Recommendation** | 빠른 prototype | 단일 페이지 | **default 채택** |

**Selected**: **Option C — Wrapped + Lazy**
**Rationale**: M4의 alternatives-modal에서 검증된 dynamic import 패턴 재사용. SSR 호환성 우려 0 + 번들 영향 최소.

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       Build Time                                │
│                                                                 │
│  data/exercises-ko.json                                         │
│         │ youtubeSearchUrl 필드 (M1 산출, 변경 X)               │
│         ▼                                                       │
│  Server-rendered HTML (운동 상세 페이지)                        │
│   ┌──────────────────────────┐                                  │
│   │ ExerciseDetail (RSC)     │                                  │
│   │  ├─ Header               │                                  │
│   │  ├─ <BodyDiagramLazy/>   │  ◀ dynamic import boundary       │
│   │  ├─ MuscleBadgeList      │                                  │
│   │  ├─ Images               │                                  │
│   │  ├─ Instructions         │                                  │
│   │  ├─ <YoutubeLinkButton/> │  ◀ RSC OK (외부 a 링크만)        │
│   │  └─ Meta                 │                                  │
│   └──────────────────────────┘                                  │
│                                                                 │
│ ───────────────────────────────────────────────────────────────│
│                       Client Runtime                            │
│                                                                 │
│  운동 상세 페이지 hydration                                     │
│         │                                                       │
│         ▼                                                       │
│  <BodyDiagramLazy/> chunk fetch (lazy)                          │
│         │                                                       │
│         ▼                                                       │
│  body-diagram.tsx ("use client")                                │
│   ├─ uses lib/muscle-map (17→19 변환)                           │
│   ├─ uses react-body-highlighter Model                          │
│   └─ renders 정면 + 후면 SVG                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
EnrichedExercise (build-time)
   │
   ├── primaryMuscles, secondaryMuscles (MuscleGroup[])
   │      │
   │      ▼ toLibraryMuscles(...)
   │      │
   │      ▼ Model data prop
   │      └── react-body-highlighter SVG
   │
   └── youtubeSearchUrl (string)
          │
          ▼ <a href={url} target="_blank">
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `lib/muscle-map.ts` | `lib/types`, `react-body-highlighter` (type only) | 17→19 변환 |
| `components/body-diagram.tsx` | `react-body-highlighter`, `lib/muscle-map`, `lib/i18n` | 다이어그램 |
| `components/youtube-link-button.tsx` | (외부 의존 0) | 외부 링크 버튼 |
| `components/exercise-detail.tsx` | (M3 그대로) + dynamic body-diagram + youtube-link-button | 통합 |

---

## 3. Data Model

### 3.1 LibraryMuscle 타입

```typescript
// src/lib/muscle-map.ts
export type LibraryMuscle =
  | "trapezius" | "upper-back" | "lower-back" | "chest"
  | "biceps" | "triceps" | "forearm"
  | "back-deltoids" | "front-deltoids"
  | "abs" | "obliques" | "adductor"
  | "hamstring" | "quadriceps" | "abductors"
  | "calves" | "gluteal" | "head" | "neck";
```

### 3.2 MUSCLE_TO_LIBRARY 매핑 (TV-3 핵심)

| Dataset MuscleGroup | LibraryMuscle[] | 정확도 | 비고 |
|--------------------|----------------|:------:|------|
| abdominals | ["abs"] | ✅ Direct | |
| abductors | ["abductors"] | ✅ Direct | |
| adductors | ["adductor"] | ✅ Direct | 단수형 차이 |
| biceps | ["biceps"] | ✅ Direct | |
| calves | ["calves"] | ✅ Direct | |
| chest | ["chest"] | ✅ Direct | |
| forearms | ["forearm"] | ✅ Direct | 단수형 |
| glutes | ["gluteal"] | ✅ Direct | |
| hamstrings | ["hamstring"] | ✅ Direct | 단수형 |
| lats | ["upper-back"] | ⚠️ Approx | lats(광배근)는 upper-back과 위치적으로 일부 겹침. 라이브러리에 별도 lats 키 없음 |
| lower back | ["lower-back"] | ✅ Direct | |
| middle back | ["upper-back"] | ⚠️ Approx | rhomboid 영역. upper-back에 포함됨 |
| neck | ["neck"] | ✅ Direct | |
| quadriceps | ["quadriceps"] | ✅ Direct | |
| shoulders | ["front-deltoids", "back-deltoids"] | ✅ 1:N | 어깨는 anterior+posterior |
| traps | ["trapezius"] | ✅ Direct | |
| triceps | ["triceps"] | ✅ Direct | |

**누락 가능성**: lats + middle back이 모두 upper-back에 매핑됨. 둘이 동시에 있으면 시각적으로 동일 표시. 사용자 인지엔 무해 (정보 손실 < 추가 시각 가치).

### 3.3 Color Constants

```typescript
const COLOR_PRIMARY = "#dc2626";    // Tailwind red-600
const COLOR_SECONDARY = "#f59e0b";  // Tailwind amber-500
const COLOR_BASE = "#e5e7eb";       // Tailwind neutral-200 (light) — 다크모드도 충분 식별 가능
```

---

## 4. API Specification

해당 없음 (외부 API 호출 0).

### 4.1 Internal Function Contract

```typescript
// src/lib/muscle-map.ts
export function toLibraryMuscles(muscles: readonly MuscleGroup[]): LibraryMuscle[];
```

**Pre**: dataset 17 muscle 중 하나 이상
**Post**: deduplicated LibraryMuscle 배열, 항상 length ≥ 0
**Pure**: 사이드 이펙트 0

### 4.2 Library Component Contract (`Model` from `react-body-highlighter`)

> **불확실**: 라이브러리 v2.0.5는 4년 전 릴리스, 정확한 prop 시그니처는 README 외 확실하지 않음.
> **Do 단계 검증 절차**:
> 1. `npm install react-body-highlighter` 후 `node_modules/react-body-highlighter/dist/*.d.ts` 확인
> 2. `Model` 컴포넌트의 정확한 props 추출
> 3. 타입에 없는 prop은 사용 금지
>
> **확신하는 부분**:
> - default export `Model`
> - `data: { name: string; muscles: LibraryMuscle[]; frequency?: number }[]` 필수
> - `onClick?: (muscle: IMuscleStats) => void` 선택
>
> **불확실 (추정)**:
> - `type?: "anterior" | "posterior"` — 보통 두 종류의 모델 분리
> - `bodyColor?: string` — 비활성 근육 기본 색
> - `highlightedColors?: string[]` — frequency 기반 색상 (frequency=1→[0], =2→[1])
> - `style?: CSSProperties` — 컨테이너 스타일

**Do 단계에 따라 prop 조정**. 일부 prop이 없으면 라이브러리 default 색상 사용 + 폴백 텍스트로 보완.

---

## 5. UI/UX Design

### 5.1 Screen Layout (운동 상세 갱신)

```
┌────────────────────────────────────┐
│  ← 뒤로                             │
│                                    │
│  스미스머신 벤치 프레스 (h1)         │
│  Smith Machine Bench Press         │
│  [근력]                            │
├────────────────────────────────────┤
│  자극 근육                          │
│  ┌──────────┐ ┌──────────┐         │  ◀ 신규 다이어그램 영역
│  │ 정면 SVG │ │ 후면 SVG │         │
│  │ (anterior)│ │(posterior)│        │
│  │  red+amber│ │  red+amber│        │
│  └──────────┘ └──────────┘         │
│  [가슴(주)] [어깨(보)] [삼두(보)]   │  ◀ M3 텍스트 배지 (유지)
│                                    │
│  (매핑 안 된 muscle 폴백 — 해당 시) │
│  추가 자극: middle back              │
├────────────────────────────────────┤
│  시연 이미지 (M3)                    │
├────────────────────────────────────┤
│  단계별 설명 (M3)                    │
├────────────────────────────────────┤
│  ▶ YouTube 시연 검색      ◀ 신규    │
├────────────────────────────────────┤
│  메타 정보 (M3)                      │
├────────────────────────────────────┤
│  🔄 다른 기구로 대체 (M4)           │
└────────────────────────────────────┘
```

### 5.2 User Flow

```
운동 상세 진입
  ├─ 다이어그램 chunk fetch (lazy) → 정면/후면 SVG 렌더
  ├─ ▶ YouTube 클릭 → 새 탭, 영문명 + " form" 검색
  ├─ 🔄 클릭 → 추천 모달 (M4)
  └─ ← 뒤로 → 이전 페이지 (M3)
```

### 5.3 Component List

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `BodyDiagram` | Client (lazy) | `src/components/body-diagram.tsx` | 라이브러리 wrap + 매핑 + 정면+후면 |
| `YoutubeLinkButton` | RSC OK | `src/components/youtube-link-button.tsx` | 외부 링크 버튼 |
| `ExerciseDetail` (M3) | RSC | `src/components/exercise-detail.tsx` | 위 두 개 통합 |

### 5.4 Page UI Checklist (운동 상세 갱신)

#### Updated for M5
- [ ] 자극 근육 섹션에 다이어그램 (정면+후면 grid-cols-2) 추가
- [ ] 다이어그램은 hydration 후 lazy 렌더 (mount 전 placeholder space 또는 invisible)
- [ ] primary muscle은 빨강(`#dc2626`), secondary는 주황(`#f59e0b`) 강조
- [ ] 다이어그램 SVG에 `<title>` 또는 `aria-label` 한국어 muscle 이름
- [ ] M3 텍스트 배지(`MuscleBadgeList`) 유지 — 다이어그램과 같이
- [ ] 매핑 안 된 muscle 폴백 텍스트 (`추가 자극: ...`) — 해당 케이스만
- [ ] ▶ YouTube 시연 검색 버튼 (instructions 다음 + 메타 위)
- [ ] 버튼 `target="_blank"` + `rel="noopener noreferrer"`
- [ ] 큰 탭 영역 ≥ 44px

---

## 6. Error Handling

| Scenario | Handling |
|----------|----------|
| `react-body-highlighter` 라이브러리 import 실패 | dynamic import의 fallback 컴포넌트 → "다이어그램 로드 실패" 메시지 |
| 매핑 안 된 muscle (현재 분석상 없음) | `MUSCLE_TO_LIBRARY[m]`가 빈 배열이면 폴백 텍스트로 출력 |
| primary + secondary 모두 빈 경우 | BodyDiagram 자체 렌더 안 함 (early return null) |
| YouTube URL 비어 있음 | 버튼 자체 미표시 (defensive — 실제로는 모든 운동에 URL 보장) |
| 라이브러리 prop 시그니처 타입 에러 | Do 단계에서 `.d.ts` 확인 후 정확한 prop만 사용. 타입 에러 시 build 실패로 즉시 catch |

---

## 7. Security Considerations

| Item | Status | Note |
|------|:------:|------|
| 외부 링크 보안 | ✅ | `rel="noopener noreferrer"` |
| 외부 라이브러리 SBOM | ⚠️ | `react-body-highlighter` 간접 deps Do 단계 검토 (npm audit) |
| XSS | ✅ | 사용자 입력 0 |

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L0: Build Verification | typecheck + build (마지막 1회) | tsc + next | Check |
| L1: TV-3 시각 검증 | 17 muscle 각 대표 운동 | Browser | Check |
| L2: Manual UI | 다이어그램 + YouTube 시나리오 | Browser | Check |

### 8.2 TV-3 시각 검증 시나리오 (사용자 수행)

각 muscle을 primary로 가지는 운동 1개씩 골라 다이어그램이 해당 부위를 highlight 하는지 확인.

| # | Dataset Muscle | 대표 운동 (예시 ID) | 기대 highlight 영역 |
|---|--------------|------|----------|
| 1 | chest | Barbell_Bench_Press | 가슴 (chest) |
| 2 | abdominals | 3_4_Sit-Up | 복부 (abs) |
| 3 | biceps | Barbell_Curl | 이두 (biceps) |
| 4 | triceps | Tricep_Dips | 삼두 (triceps) |
| 5 | quadriceps | Barbell_Squat | 대퇴사두 (quadriceps) |
| 6 | hamstrings | Romanian_Deadlift | 햄스트링 (hamstring) |
| 7 | glutes | Barbell_Hip_Thrust | 둔근 (gluteal) |
| 8 | calves | Calf_Press | 종아리 (calves) |
| 9 | shoulders | Standing_Military_Press | 어깨 — front + back deltoid |
| 10 | lats | Pull-up | 광배근 (upper-back 근사) |
| 11 | middle back | Bent_Over_Row | 등 중부 (upper-back 근사) |
| 12 | lower back | Hyperextension | 허리 (lower-back) |
| 13 | traps | Shrug_Barbell | 승모근 (trapezius) |
| 14 | forearms | Wrist_Curl | 전완 (forearm) |
| 15 | abductors | Hip_Abductor | 외전근 (abductors) |
| 16 | adductors | Hip_Adductor | 내전근 (adductor) |
| 17 | neck | Neck_Side_Flexion | 목 (neck) |

> 실제 운동 ID는 다를 수 있음 — 사용자가 부위 페이지에서 임의 1개 선택하여 검증.

### 8.3 L2: Manual UI

| # | Scenario | Expected |
|---|----------|----------|
| 1 | 운동 상세 진입 | 다이어그램 정면+후면 표시, 빨강·주황 색상 구분 |
| 2 | ▶ YouTube 클릭 | 새 탭에서 운동명 검색 결과 페이지 |
| 3 | 다크모드 전환 | 다이어그램 색상 식별 가능 (배경 대비) |
| 4 | iPhone SE 375px | 다이어그램 작아도 가로 스크롤 0 |
| 5 | 매핑 안 된 muscle 운동 | 폴백 텍스트 노출 (해당 케이스 발견 시) |
| 6 | 네트워크 차단 (DevTools) | 다이어그램 chunk 로드 실패 → fallback 텍스트 |

---

## 9. Clean Architecture

(M3-M4 동일 layer 매핑)

| Layer | M5 Files |
|-------|----------|
| Presentation | `src/components/body-diagram.tsx`, `src/components/youtube-link-button.tsx`, 수정된 `exercise-detail.tsx` |
| Domain | `src/lib/muscle-map.ts` |
| Infrastructure | (없음 — 외부 라이브러리는 Presentation에서 직접 사용) |

---

## 10. Coding Convention Reference

(M1-M4 그대로 + 신규 컨벤션)

### 10.1 외부 SVG 색상

- Tailwind class 대신 hex 직접 지정
- 컴포넌트 내 `const`로 추출: `COLOR_PRIMARY`, `COLOR_SECONDARY`, `COLOR_BASE`

### 10.2 외부 링크

- `target="_blank"` + `rel="noopener noreferrer"` 항상

### 10.3 Lazy Client Component

- M4 alternatives-modal과 동일 패턴: `dynamic(() => import('...'), { ssr: false })`

---

## 11. Implementation Guide

### 11.1 File Structure (M5 추가)

```
src/
├── lib/
│   └── muscle-map.ts                  🆕
├── components/
│   ├── body-diagram.tsx               🆕 ("use client")
│   ├── youtube-link-button.tsx        🆕 (RSC OK)
│   └── exercise-detail.tsx            🔄 통합 수정
package.json                            🔄 react-body-highlighter 추가
```

**총 신규 3개 + 수정 2개 = 5개 변경**.

### 11.2 Implementation Order

**Phase A — 패키지 설치 + lib**
1. [ ] `npm install react-body-highlighter` (사용자 직접 수행 — dev 중 build 자제 노트와 무관, install은 안전)
2. [ ] `node_modules/react-body-highlighter/dist/*.d.ts` 확인 → 정확한 Model props 추출
3. [ ] `src/lib/muscle-map.ts` 작성 (LibraryMuscle 타입 + MUSCLE_TO_LIBRARY + toLibraryMuscles)

**Phase B — components**
4. [ ] `src/components/youtube-link-button.tsx` (단순, 의존 없음)
5. [ ] `src/components/body-diagram.tsx` ("use client", 라이브러리 wrap, 정면+후면)

**Phase C — 통합**
6. [ ] `src/components/exercise-detail.tsx` 수정 — 다이어그램 lazy + YouTube 버튼 추가

**Phase D — 검증**
7. [ ] dev 서버 hot reload — 운동 상세 시각 확인
8. [ ] TV-3 시각 검증 (사용자 17 muscle)
9. [ ] (마지막에만) `npm run typecheck` + `npm run build`

### 11.3 Session Guide

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| (current) | Plan + Design | 전체 | 작성 완료 |
| (current) | Do | A → B → C 순 | 15-20 |
| (current) | Check | TV-3 + 자체 검토 | 5 |
| (current) | Report | 사용자 요약 | 2 |

### 11.4 핵심 코드 — `body-diagram.tsx` (Defensive)

```typescript
"use client";
// 라이브러리 prop 시그니처 불확실 — Do 단계에 .d.ts 확인 후 prop 조정.
// 우선 default export Model + data prop만으로 구현.
import Model from "react-body-highlighter";
import type { MuscleGroup } from "@/lib/types";
import { MUSCLE_KO } from "@/lib/i18n";
import { MUSCLE_TO_LIBRARY, toLibraryMuscles } from "@/lib/muscle-map";

interface Props {
  primary: readonly MuscleGroup[];
  secondary: readonly MuscleGroup[];
  exerciseName: string;
}

const COLOR_PRIMARY = "#dc2626";
const COLOR_SECONDARY = "#f59e0b";
const COLOR_BASE = "#e5e7eb";

export default function BodyDiagram({ primary, secondary, exerciseName }: Props) {
  // primary는 frequency 2, secondary는 frequency 1 — 라이브러리가 frequency로 색 강도 조절
  const data = [
    { name: exerciseName, muscles: toLibraryMuscles(primary), frequency: 2 },
    { name: exerciseName, muscles: toLibraryMuscles(secondary), frequency: 1 },
  ];

  // 매핑 안 된 muscle 폴백 (현재 매핑상 발생 X, defensive)
  const unmapped = [...primary, ...secondary].filter(
    (m) => MUSCLE_TO_LIBRARY[m].length === 0,
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {/* TODO Do phase: type/highlightedColors/bodyColor prop 적용 — .d.ts 확인 후 */}
        <Model data={data} />
        <Model data={data} />
      </div>
      {unmapped.length > 0 && (
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          추가 자극: {unmapped.map((m) => MUSCLE_KO[m]).join(", ")}
        </p>
      )}
    </div>
  );
}
```

> **Do 단계**: 라이브러리 정확 prop을 `.d.ts`에서 확인 후 type prop으로 정면/후면 분리 + highlightedColors 색상 지정.

### 11.5 핵심 코드 — `youtube-link-button.tsx`

```typescript
// RSC OK — 외부 a 링크. Client interaction 없음.
interface Props {
  url: string;
  exerciseName: string;
}

export function YoutubeLinkButton({ url, exerciseName }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${exerciseName} YouTube 시연 검색 (새 탭)`}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 active:bg-red-800 dark:bg-red-500 dark:hover:bg-red-400"
    >
      <span aria-hidden="true">▶</span>
      <span>YouTube 시연 검색</span>
    </a>
  );
}
```

### 11.6 핵심 코드 — `exercise-detail.tsx` 변경 영역

```typescript
// 신규 import
import dynamic from "next/dynamic";
import { YoutubeLinkButton } from "./youtube-link-button";

const BodyDiagram = dynamic(() => import("./body-diagram"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-2 gap-2">
      <div className="aspect-[1/2] rounded-lg bg-neutral-100 dark:bg-neutral-900" />
      <div className="aspect-[1/2] rounded-lg bg-neutral-100 dark:bg-neutral-900" />
    </div>
  ),
});

// JSX 변경 (자극 근육 영역):
<MuscleBadgeList primary={...} secondary={...} />
{(primary.length > 0 || secondary.length > 0) && (
  <BodyDiagram primary={primary} secondary={secondary} exerciseName={nameKo} />
)}

// JSX 변경 (instructions 다음):
{youtubeSearchUrl && (
  <YoutubeLinkButton url={youtubeSearchUrl} exerciseName={nameKo} />
)}
```

> 주의: `MuscleBadgeList`가 이미 `<section>`이라 다이어그램은 그 외부 또는 같은 section 내부에 둘지 결정 — Do 단계 파일 변경 시 적절히 조립.

### 11.7 라이브러리 prop 검증 체크리스트 (Do)

- [ ] `node_modules/react-body-highlighter/dist/index.d.ts` (또는 유사 경로) 존재 확인
- [ ] `Model` default export 확인
- [ ] Props interface에서 `type`, `bodyColor`, `highlightedColors`, `style`, `data`, `onClick` 각각 존재 여부 확인
- [ ] 시그니처에 없는 prop 사용 X — TypeScript 에러로 catch
- [ ] iOS Safari 16+ 동작 확인 (사용자 시각 검증)

---

## 12. Open Questions for Do Phase

| ID | Question | 즉시 결정 |
|----|----------|----------|
| D-1 | 라이브러리 정확 prop 시그니처 | Do 단계 `.d.ts` 확인 후 결정. fallback: data prop만 사용 |
| D-2 | 다이어그램 컨테이너 사이즈 | 라이브러리 default 사이즈 우선, 너무 크면 `style={{ width: '100%' }}` 또는 wrapper에 max-width 적용 |
| D-3 | dark mode SVG 가독성 | hex 색상이 다크 배경에서도 충분 식별 가능 (red-600/amber-500). 부족 시 wrapper에 light bg 적용 |
| D-4 | YouTube 버튼 색상 | red-600 (라이브러리 색상과 비슷하지만 의도적 — YouTube 브랜드 색에 가까움) |

---

## 13. Plan에서 Design으로의 변경 사항

| Plan | Design 변경 | 사유 |
|------|------------|------|
| `body-diagram.tsx`에 라이브러리 prop 모두 명시 | **`.d.ts` 확인 후 결정**으로 후속 위임 | 라이브러리 4년 전 릴리스, 정확 prop 미확정. 안전한 default 우선 |
| TV-3 시나리오 17개 muscle | **Design §8.2에 대표 운동 ID 매핑 추가** | 사용자 검증 시간 단축 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-30 | M5 Design — Option C (Wrapped + Lazy) 채택, defensive lib API | jiinbae |
