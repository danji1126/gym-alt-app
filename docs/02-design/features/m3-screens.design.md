# M3 Screens Design Document

> **Summary**: 부위 → 목록 → 상세 3-스크린을 정적 export + `generateStaticParams`로 구현. Server Component 기본, 인터랙션만 Client. 데이터는 빌드 타임 단일 import.
>
> **Project**: gym-alt-app
> **Version**: 0.1.0
> **Author**: jiinbae (CTO)
> **Date**: 2026-04-30
> **Status**: Draft (옵션 A — KISS, CTO 직접 설계)
> **Planning Doc**: [m3-screens.plan.md](../../01-plan/features/m3-screens.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | PRD §1.1 — 헬스장에서 점유·부재로 인한 대체 운동 30초 탐색. M3는 그 도달 흐름의 첫 동선. |
| **WHO** | 단일 사용자(jiinbae). iOS Safari 16+, Android Chrome. 한 손 조작, 모바일 우선. |
| **RISK** | (1) `generateStaticParams` 873+17 라우트 빌드 시간 폭증 (2) GitHub raw 이미지 핫링크 차단 (3) 한국어 폰트 가독성 |
| **SUCCESS** | 873 exercise + 17 muscle 정적 페이지 모두 생성 + 한국어 정상 표시 + LCP < 1.5s + typecheck 0 errors + 번들 회귀 없음 |
| **SCOPE** | M3 = F-1 부위 검색 + F-3 운동 상세 + F-5 시연 이미지. F-2/F-4/F-6/F-7은 후속 |

---

## 1. Overview

### 1.1 Design Goals

1. **정적 export 호환성**: 모든 라우트가 빌드 타임 사전 생성. 런타임 라우팅 의존 0.
2. **Server Component 우선**: 데이터 페치·렌더링은 RSC. Client는 onError·router.back처럼 브라우저 API가 필요한 곳만.
3. **DRY 데이터 액세스**: `src/lib/data.ts` 단일 진입점. 모든 페이지·컴포넌트가 여기서 가져감.
4. **Doumont 정보 위계**: 한 화면 한 결정. 운동 상세 첫 fold에 핵심(이름·근육·이미지) 모두 표시.
5. **타입 안전**: `noUncheckedIndexedAccess`와 호환. 배열 인덱싱 모두 가드.

### 1.2 Design Principles

- **KISS**: 추상화 레이어 추가 금지. 페이지 → 컴포넌트 → data.ts 단일 흐름.
- **YAGNI**: 즐겨찾기·검색·추천은 M4-M7. Hook·Context·전역 store 도입 금지.
- **SRP**: 컴포넌트 1개 = 1 책임 (그리드, 카드, 배지 리스트, 이미지, 뒤로가기 각각 분리).
- **Static-First**: 모든 데이터 빌드 타임 import. fetch / API 호출 0.

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: Inline | Option B: Layered | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | 페이지에 모든 JSX 인라인, 컴포넌트 분리 X | 컨테이너/프레젠테이셔널 분리 + custom hook | 의미 단위 컴포넌트 분리, 페이지는 조립 |
| **New Files** | 5개 (페이지 3 + lib 2) | 18개 | 11개 |
| **Modified Files** | 1 (page.tsx 교체) | 1 | 1 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Low (JSX 비대) | High | High |
| **Reusability** | Low | High | High |
| **Effort** | Low | High | Medium |
| **Risk** | Medium (변경 시 큰 diff) | Low | Low |
| **Recommendation** | 빠른 prototype | 다인 협업 | **default 채택** |

**Selected**: **Option C — Pragmatic Balance**
**Rationale**: M3 페이지 3개 모두 Doumont 정보 위계가 명확 — 헤더, 본문, 카드 등 의미 단위 분리가 자연스럽다. Hook·Context는 YAGNI. 단순한 함수와 RSC props 전달로 충분.

### 2.1 Component Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                       Build Time                                   │
│                                                                    │
│  public/data/exercises-ko.json (873)                               │
│         │                                                          │
│         ▼                                                          │
│  src/lib/data.ts ◀─── src/lib/types.ts                            │
│         │                                                          │
│         ├──▶ getAllExercises()                                     │
│         ├──▶ getExerciseById(id)                                   │
│         ├──▶ getExercisesByGroup(groupKey)                         │
│         ├──▶ getMuscleSlugs()      → generateStaticParams          │
│         └──▶ getExerciseIds()      → generateStaticParams          │
│                                                                    │
│  src/lib/muscle-groups.ts (7 그룹 + 17 단일)                      │
│         │                                                          │
│  src/lib/i18n.ts (M2 기존)                                         │
│                                                                    │
│ ────────────────────────────────────────────────────────────────  │
│                       Runtime (정적 페이지)                        │
│                                                                    │
│  /                                                                 │
│   └─▶ page.tsx (RSC) ──▶ <MuscleGrid groups={...} />              │
│                                                                    │
│  /muscles/[muscle]/                                                │
│   └─▶ page.tsx (RSC) ──▶ <ExerciseListItem ... /> × N             │
│                                                                    │
│  /exercises/[id]/                                                  │
│   └─▶ page.tsx (RSC) ──▶ <BackLink/> (Client)                     │
│                       ──▶ <ExerciseDetail ...>                     │
│                            ├─▶ <MuscleBadgeList ... />            │
│                            └─▶ <ExerciseImage ... /> (Client)     │
└────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

**빌드 타임**:
```
exercises-ko.json (import)
   ↓
data.ts module-load 시점에 한 번 캐스팅
   ↓
generateStaticParams (각 dynamic route)
   ├─ /muscles/[muscle]: getMuscleSlugs() → 17개 + 7 그룹 = 24개 slug
   └─ /exercises/[id]: getExerciseIds() → 873개
   ↓
RSC 페이지 함수가 await params 후 data 도우미 호출
   ↓
JSX 렌더링 → 정적 HTML 출력
   ↓
out/ 디렉토리
```

**런타임 (브라우저)**:
```
사용자 / 진입
   ↓ Link click (Next.js prefetch)
/muscles/chest/  (정적 HTML, 즉시 렌더)
   ↓ Link click
/exercises/{id}/  (정적 HTML, 즉시 렌더)
   ↓ <img loading="lazy"> → GitHub raw 이미지 fetch
   ↓ onError → fallback (Client Component)
   ↓ BackLink click → router.back() (Client Component)
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `app/page.tsx` (RSC) | `lib/muscle-groups`, `components/muscle-grid` | Home 부위 그리드 렌더 |
| `app/muscles/[muscle]/page.tsx` (RSC) | `lib/data`, `lib/muscle-groups`, `lib/i18n`, `components/exercise-list-item`, `components/back-link` | 부위 목록 |
| `app/exercises/[id]/page.tsx` (RSC) | `lib/data`, `lib/i18n`, `components/exercise-detail`, `components/back-link` | 운동 상세 |
| `components/muscle-grid` (RSC) | `next/link` | 부위 카드 그리드 |
| `components/exercise-list-item` (RSC) | `lib/i18n`, `next/link` | 운동 카드 |
| `components/exercise-detail` (RSC) | `lib/i18n`, `components/muscle-badge-list`, `components/exercise-image` | 상세 본문 조립 |
| `components/muscle-badge-list` (RSC) | `lib/i18n` | primary/secondary 배지 |
| `components/exercise-image` (Client) | `react` (useState) | onError fallback |
| `components/back-link` (Client) | `next/navigation` (useRouter) | router.back |
| `lib/data.ts` | `lib/types`, `public/data/exercises-ko.json` | 단일 데이터 접근점 |
| `lib/muscle-groups.ts` | `lib/types`, `lib/i18n` | 7 그룹 + 17 단일 매핑 |

**의존성 그래프 (사이클 없음)**:
```
                  types.ts (root)
                     ▲
                     │
            ┌────────┼────────┐
            │        │        │
         data.ts  i18n.ts  muscle-groups.ts
            ▲        ▲        ▲
            │        │        │
            └────────┼────────┘
                     │
              components/* + app/**
```

---

## 3. Data Model

M1-M2에서 정의한 `EnrichedExercise`, `MuscleGroup`, `DetailedEquipment` 등 그대로 사용. **신규 타입 0개**.

### 3.1 추가되는 도메인 개념: MuscleGroupBucket (UI 한정)

```typescript
// src/lib/muscle-groups.ts

import type { MuscleGroup } from "./types";

/** Home 부위 그리드의 7 버킷.
 *  복수 muscle을 OR로 묶어 사용자에게 친숙한 그룹 제공. */
export interface MuscleBucket {
  /** URL slug (lowercase, hyphenated) */
  slug: string;
  /** 한국어 표시명 */
  labelKo: string;
  /** 매칭되는 MuscleGroup 배열 (primary OR 매칭) */
  muscles: MuscleGroup[];
  /** Home 그리드 아이콘 이모지 (외부 의존 0, MVP) */
  emoji: string;
}

export const MUSCLE_BUCKETS: MuscleBucket[] = [
  { slug: "chest",     labelKo: "가슴",      muscles: ["chest"],                                emoji: "💪" },
  { slug: "back",      labelKo: "등",        muscles: ["lats", "middle back", "traps"],         emoji: "🦾" },
  { slug: "shoulders", labelKo: "어깨",      muscles: ["shoulders"],                            emoji: "🏋️" },
  { slug: "biceps",    labelKo: "이두",      muscles: ["biceps"],                               emoji: "💪" },
  { slug: "triceps",   labelKo: "삼두",      muscles: ["triceps"],                              emoji: "🦾" },
  { slug: "legs",      labelKo: "하체",
    muscles: ["quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors"],        emoji: "🦵" },
  { slug: "abs",       labelKo: "복근",      muscles: ["abdominals"],                           emoji: "🔥" },
];
```

### 3.2 URL Slug 정책

| 사례 | URL slug | 디코딩 후 |
|------|---------|-----------|
| 7 그룹 (bucket) | `chest`, `back`, `legs` 등 | MUSCLE_BUCKETS에서 lookup |
| 17 단일 muscle (보조 링크용) | `lats`, `lower-back`, `middle-back` | replace('-', ' ') → MuscleGroup |
| Exercise ID | `Smith_Machine_Bench_Press` (원본 유지) | 그대로 — Free Exercise DB 표준 |

**핵심 결정**: `/muscles/[muscle]` 라우트가 두 종류 slug(bucket + 단일)를 받음. 매칭 우선순위:
1. MUSCLE_BUCKETS에서 slug 매치 → bucket의 muscles 배열을 OR로 필터
2. 단일 muscle slug (`lats`, `lower-back` 등) → 단일 muscle 매칭
3. 매칭 안 되면 → Next.js 404 (`notFound()` 호출)

`generateStaticParams` 출력: bucket 7개 + 단일 muscle 17개 = **24개 slug** (중복 OK — `chest`는 bucket에도 단일에도 존재 → bucket 우선).

> 사실 `chest`, `shoulders` 등은 bucket과 단일이 같은 muscle 1개라 결과 동일. `back`(3 muscle), `legs`(6 muscle), `abs`(1 muscle ≈ abdominals)만 차이. 단순화를 위해 **bucket slug만 정적 생성** + 단일 muscle 보조 링크는 별도 페이지 또는 Home 하단 expand로.

**최종 결정**: `/muscles/[muscle]`는 **MUSCLE_BUCKETS 7개 slug만 정적 생성**. 단일 muscle 17개 보조 액세스는 Home 하단 보조 링크 영역에서 동일 라우트 내 cover 검증 (예: lats는 back bucket에 포함됨). 단일 muscle 17개 모두 unique 페이지가 필요하면 추후 별도 라우트 도입 — YAGNI.

→ Plan FR-04 "17개 슬러그 모두 정적 사전 생성" 수정: **bucket 7개로 축소**. Plan FR-03 "전체 부위 보기 보조 링크"는 Home 하단에 17 muscle 칩 표시(클릭 시 가장 잘 매칭되는 bucket으로 redirect)로 대체.

> Design 단계에서 더 합리적 결정으로 바꿈. Plan 변경 사항은 Section 13 변경 로그에 기록.

---

## 4. API Specification

해당 없음 — 백엔드 0. M1-M2와 동일.

### 4.1 Internal Function Contract — `src/lib/data.ts`

```typescript
import exercisesData from "../../public/data/exercises-ko.json";
import type { EnrichedExercise, MuscleGroup } from "./types";

const EXERCISES = exercisesData as EnrichedExercise[];

/** 전체 운동 — readonly view 권장. 호출자 변경 금지. */
export function getAllExercises(): readonly EnrichedExercise[] {
  return EXERCISES;
}

/** ID 조회. 없으면 undefined. */
export function getExerciseById(id: string): EnrichedExercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

/** muscle 배열 OR 매칭. primaryMuscles 우선. */
export function getExercisesByMuscles(
  muscles: readonly MuscleGroup[],
): EnrichedExercise[] {
  const set = new Set(muscles);
  return EXERCISES.filter((e) =>
    e.primaryMuscles.some((m) => set.has(m)),
  );
}

/** generateStaticParams 헬퍼. */
export function getAllExerciseIds(): string[] {
  return EXERCISES.map((e) => e.id);
}
```

**Plan SC**: 모든 도우미는 deterministic. 사이드 이펙트 없음. 빌드 타임 evaluable.

---

## 5. UI/UX Design

### 5.1 Screen Layout

#### Screen 1: Home `/`

```
┌────────────────────────────────────┐
│  gym-alt-app  (h1, 작게)           │
│  헬스장 대체 운동                  │
├────────────────────────────────────┤
│                                    │
│  [부위 선택]                        │
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │ 가슴  │  │  등  │  │ 어깨 │      │
│  └──────┘  └──────┘  └──────┘      │
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │ 이두  │  │ 삼두 │  │ 하체 │      │
│  └──────┘  └──────┘  └──────┘      │
│  ┌──────┐                          │
│  │ 복근  │                          │
│  └──────┘                          │
│                                    │
│  ─────────────────────             │
│  검색 (M7 예정)         disabled    │
│  최근 본 운동 (예정)    disabled    │
└────────────────────────────────────┘
```

#### Screen 2: `/muscles/[muscle]/` (예: chest)

```
┌────────────────────────────────────┐
│  ← 뒤로                            │
│  가슴                              │
│  운동 N개                          │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │ 바벨 벤치 프레스             │  │
│  │ 바벨 · 초급                  │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 덤벨 벤치 프레스             │  │
│  │ 덤벨 · 초급                  │  │
│  └──────────────────────────────┘  │
│  ...                               │
└────────────────────────────────────┘
```

#### Screen 3: `/exercises/[id]/` (예: Smith_Machine_Bench_Press)

```
┌────────────────────────────────────┐
│  ← 뒤로                            │
│                                    │
│  스미스머신 벤치 프레스 (h1)       │
│  Smith Machine Bench Press         │
│  [근력]                            │
├────────────────────────────────────┤
│  자극 근육                          │
│  [가슴(주)] [어깨(보)] [삼두(보)]   │
├────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐        │
│  │ image 0  │  │ image 1  │        │
│  └──────────┘  └──────────┘        │
├────────────────────────────────────┤
│  단계별 설명                        │
│  1. 벤치에 누워 ...                │
│  2. 손잡이를 ...                   │
│  3. ...                            │
├────────────────────────────────────┤
│  메타 정보                          │
│  난이도: 초급                       │
│  방향: 밀기                         │
│  형태: 복합                         │
│  기구: 스미스머신                   │
└────────────────────────────────────┘
```

### 5.2 User Flow

```
/  (Home)
 ├─ [가슴 카드] → /muscles/chest/
 │                 └─ [운동 카드] → /exercises/{id}/
 │                                    └─ [← 뒤로] → 이전 페이지
 ├─ [등 카드] → /muscles/back/
 ├─ ... (7 카드)
 └─ (보조 영역, M3는 placeholder)
```

### 5.3 Component List

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `RootLayout` | RSC | `src/app/layout.tsx` | M2 그대로 |
| `HomePage` | RSC | `src/app/page.tsx` | 부위 그리드 + placeholder 영역 (M2 placeholder 교체) |
| `MusclePage` | RSC | `src/app/muscles/[muscle]/page.tsx` | bucket 운동 목록 |
| `ExercisePage` | RSC | `src/app/exercises/[id]/page.tsx` | 운동 상세 |
| `MuscleGrid` | RSC | `src/components/muscle-grid.tsx` | 7 bucket 카드 그리드 |
| `ExerciseListItem` | RSC | `src/components/exercise-list-item.tsx` | 목록의 단일 운동 카드 |
| `ExerciseDetail` | RSC | `src/components/exercise-detail.tsx` | 상세 본문 조립자 |
| `MuscleBadgeList` | RSC | `src/components/muscle-badge-list.tsx` | primary/secondary 근육 배지 |
| `ExerciseImage` | Client | `src/components/exercise-image.tsx` | onError fallback |
| `BackLink` | Client | `src/components/back-link.tsx` | router.back |

### 5.4 Page UI Checklist

#### Home (/)
- [ ] Heading: `gym-alt-app` (h1) + 부제 "헬스장 대체 운동"
- [ ] Section heading: "부위 선택"
- [ ] Grid: 7개 카드 (가슴/등/어깨/이두/삼두/하체/복근), 각 emoji + labelKo
- [ ] 카드 탭 영역 ≥ 44×44px, Link로 `/muscles/{slug}/` 이동
- [ ] Placeholder 영역: "검색 (M7 예정)", "최근 본 운동 (예정)" — disabled UI
- [ ] 모바일 max-w-md, 다크모드 지원

#### MusclePage (/muscles/[muscle]/)
- [ ] BackLink (← 뒤로) 상단 좌측
- [ ] Heading: bucket labelKo (h1)
- [ ] Subheading: `운동 N개`
- [ ] 카드 리스트 (level 오름차순, tie-break: nameKo 가나다)
- [ ] 카드: nameKo (제목), 기구 + level (서브) — EQUIPMENT_KO + LEVEL_KO 매핑 사용
- [ ] 카드 탭 영역 ≥ 44px
- [ ] 빈 결과 (theoretically 0건이면) "해당 부위 운동 없음" 메시지
- [ ] 정의되지 않은 slug → `notFound()` (Next.js 기본 404)

#### ExercisePage (/exercises/[id]/)
- [ ] BackLink 상단 좌측
- [ ] Heading: nameKo (h1, 큰 글자) + nameEn (small, muted)
- [ ] Category 태그 (CATEGORY_KO 매핑)
- [ ] MuscleBadgeList: primary (red bg) + secondary (orange bg), MUSCLE_KO 한국어
- [ ] 시연 이미지: imageUrls 모두 — 첫 2장 grid-cols-2, 나머지 세로 stack
- [ ] 첫 이미지만 `loading="eager"`, 나머지 `loading="lazy"`
- [ ] onError 시 회색 box + 운동명 표시
- [ ] instructionsKo: ol 리스트, 번호 부여
- [ ] 메타 정보 섹션: 난이도(LEVEL_KO), 방향(FORCE_KO|"-"), 형태(MECHANIC_KO|"-"), 기구 (detailedEquipment[0] EQUIPMENT_KO)
- [ ] 정의되지 않은 ID → `notFound()`

---

## 6. Error Handling

### 6.1 Build-time Errors

| Code | Cause | Handling |
|------|-------|----------|
| `MISSING_GENERATE_STATIC_PARAMS` | dynamic route + `output: 'export'`인데 함수 미정의 | Next.js가 빌드 실패 — fix는 함수 추가 |
| `EMPTY_PARAMS` | `getAllExerciseIds()`가 빈 배열 반환 | 데이터 무결성 문제. preprocess 단계에서 캐치되어야 함 |

### 6.2 Runtime Errors

| Scenario | Handling |
|----------|----------|
| 외부 이미지 fetch 실패 | `<ExerciseImage>` Client Component의 `onError` → state 변경 → fallback UI |
| 정의되지 않은 muscle slug | `notFound()` → Next.js 기본 404 페이지 |
| 정의되지 않은 exercise ID | `notFound()` → Next.js 기본 404 페이지 |

### 6.3 Edge Cases

- **빈 instructions**: PRD에서 보장 — preprocess가 fail-fast. 그래도 RSC에서 length 체크하여 0이면 "설명 없음" 표시 (방어적).
- **imageUrls 빈 경우**: 마찬가지. 0이면 이미지 섹션 자체 미표시.
- **secondaryMuscles 빈 경우**: 정상 케이스. badge list에서 빈 배열은 섹션 헤더만 표시하지 않음.

---

## 7. Security Considerations

| Item | Status | Note |
|------|:------:|------|
| XSS | ✅ | 사용자 입력 0. 모든 텍스트는 정적 데이터에서 출처. React 자동 escape. |
| 외부 이미지 SSRF | N/A | `<img src>`로 브라우저가 직접 fetch — 서버 미경유 |
| HTTPS | ✅ | Cloudflare Pages 기본 + GitHub raw도 HTTPS |
| CSP | (선택) | M3 단계 미도입. 추후 외부 이미지 도메인 화이트리스트 시 도입 가능 |

---

## 8. Test Plan

> M3는 전체적 UI 시연이라 Playwright 없이도 시각적 검증 가능. Check 단계에서 **수동 시나리오 + gap-detector + code-analyzer** 조합.

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L0: Build Verification | typecheck + next build | tsc + next | Do |
| L1: Static Page Existence | `out/` 디렉토리에 891개 HTML 존재 | shell `find out -name '*.html'` 카운트 | Check |
| L2: Manual UI Verification | next-dev에서 시나리오 완주 | Browser | Check |
| L3: E2E (Playwright) | (도입 검토만, M3 미실행) | - | M6+ |

### 8.2 L0: Build Verification

| # | Target | Test | Expected |
|---|--------|------|----------|
| 1 | `tsc --noEmit` | 전체 타입 체크 | 0 errors |
| 2 | `next build` | 정적 빌드 | exit 0, 880+ 정적 페이지 |
| 3 | First Load JS | 번들 크기 회귀 | M2 102 kB → ≤ 130 kB |
| 4 | `out/` 크기 | 합리적 | < 30 MB |

### 8.3 L1: Static Page Existence

| # | Target | Expected |
|---|--------|----------|
| 1 | `out/index.html` | 존재 |
| 2 | `out/muscles/chest/index.html` 등 7개 bucket | 모두 존재 |
| 3 | `out/exercises/{id}/index.html` 873개 | 모두 존재 |
| 4 | 빌드 로그 | dynamic route 1개도 SSR로 남지 않음 |

### 8.4 L2: Manual UI Verification

| # | Scenario | Expected |
|---|----------|----------|
| 1 | `/` 진입 | 7 부위 카드 표시, 한국어 정상 |
| 2 | "가슴" 카드 클릭 | `/muscles/chest/` 이동, 가슴 운동 N개 표시 |
| 3 | 첫 운동 카드 클릭 | `/exercises/{id}/` 이동, 한국어 nameKo·근육 배지·이미지·instructions 모두 표시 |
| 4 | BackLink 클릭 | 이전 페이지로 복귀 |
| 5 | 외부 이미지 차단 시뮬레이션 (DevTools 네트워크 차단) | 회색 fallback 표시, 페이지 깨지지 않음 |
| 6 | 다크모드 전환 (시스템 설정) | 모든 화면 가독성 유지 |
| 7 | iPhone SE 사이즈 (375px) | 가로 스크롤 없음, 카드 그리드 적절 |

### 8.5 Seed Data

기존 데이터(873 exercise) 그대로 사용. 별도 시드 없음.

---

## 9. Clean Architecture

### 9.1 Layer Mapping

| Layer | Responsibility | M3 Files |
|-------|---------------|----------|
| Presentation | UI 컴포넌트 + 페이지 | `src/app/**`, `src/components/**` |
| Application | (M3 부재 — 단순 페이지) | - |
| Domain | 도메인 타입 + 한국어 매핑 + bucket 정의 | `src/lib/types.ts` (M1-M2), `src/lib/i18n.ts` (M1-M2), `src/lib/muscle-groups.ts` (M3) |
| Infrastructure | 정적 데이터 + 데이터 액세스 | `public/data/exercises-ko.json`, `src/lib/data.ts` |

### 9.2 Import Rules

| From | Can Import | Cannot Import |
|------|-----------|---------------|
| `src/app/**` | `src/components/**`, `src/lib/**` | `scripts/**` |
| `src/components/**` | `src/lib/**`, `next/*`, `react` | `src/app/**` (역방향) |
| `src/lib/data.ts` | `src/lib/types`, `public/data/exercises-ko.json` | 그 외 |
| `src/lib/muscle-groups.ts` | `src/lib/types`, `src/lib/i18n` | 그 외 |
| `src/lib/i18n.ts` | `src/lib/types` | 그 외 (M1-M2 그대로) |
| `src/lib/types.ts` | (없음) | 모두 (M1-M2 그대로) |

### 9.3 Server vs Client Component 분리 원칙

| 컴포넌트 | RSC/Client | 사유 |
|----------|:----------:|------|
| 모든 페이지 (`page.tsx`) | RSC | 데이터는 빌드 타임 import, 인터랙션 없음 |
| `MuscleGrid`, `ExerciseListItem`, `ExerciseDetail`, `MuscleBadgeList` | RSC | 순수 렌더링, props만 받음 |
| `ExerciseImage` | **Client** | `onError` 이벤트 핸들러 + useState |
| `BackLink` | **Client** | `useRouter()` (useNavigation) |

---

## 10. Coding Convention Reference

### 10.1 Naming

| Target | Rule | Example |
|--------|------|---------|
| 페이지 파일 | Next.js 표준 (`page.tsx`, `layout.tsx`) | `src/app/exercises/[id]/page.tsx` |
| 컴포넌트 파일 | kebab-case.tsx | `exercise-list-item.tsx` |
| 컴포넌트 export | default + 함수명은 PascalCase | `export default function ExerciseListItem(...)` |
| 라이브러리 파일 | kebab-case.ts | `muscle-groups.ts` |
| 함수 | camelCase | `getExercisesByMuscles` |
| 상수 | UPPER_SNAKE_CASE | `MUSCLE_BUCKETS` |
| URL slug | lowercase + hyphenated | `chest`, `back`, `legs` |

### 10.2 Import Order

```typescript
// 1. External
import Link from "next/link";

// 2. Internal absolute (@/...)
import type { EnrichedExercise } from "@/lib/types";
import { MUSCLE_KO, EQUIPMENT_KO } from "@/lib/i18n";
import { getExercisesByMuscles } from "@/lib/data";

// 3. Internal components
import { ExerciseListItem } from "@/components/exercise-list-item";
```

### 10.3 Code Style

- Tailwind utility만 사용. `@apply` 금지.
- 모든 Tailwind 클래스는 의미 단위로 그룹: layout → spacing → typography → color → state.
- Server Component는 `async function`, Client Component는 일반 `function`.
- `"use client"` 지시어는 파일 최상단.
- 배열 인덱싱은 `.find()`, `.filter()`, `.map()` 패턴 우선. `arr[0]`은 `arr[0] ?? defaultValue`로 가드.

---

## 11. Implementation Guide

### 11.1 File Structure (M3 추가분만)

```
gym-alt-app/
├── src/
│   ├── app/
│   │   ├── page.tsx                           🔄 교체
│   │   ├── muscles/
│   │   │   └── [muscle]/
│   │   │       └── page.tsx                   🆕
│   │   └── exercises/
│   │       └── [id]/
│   │           └── page.tsx                   🆕
│   ├── components/
│   │   ├── muscle-grid.tsx                    🆕
│   │   ├── exercise-list-item.tsx             🆕
│   │   ├── exercise-detail.tsx                🆕
│   │   ├── muscle-badge-list.tsx              🆕
│   │   ├── exercise-image.tsx                 🆕 ("use client")
│   │   └── back-link.tsx                      🆕 ("use client")
│   └── lib/
│       ├── data.ts                            🆕
│       └── muscle-groups.ts                   🆕
```

**총 신규 11개 파일 + 1개 교체 = 12개 변경**.

### 11.2 Implementation Order

**Phase A — 데이터·도메인 레이어 (다른 파일 의존 없음)**
1. [ ] `src/lib/muscle-groups.ts` — MUSCLE_BUCKETS 7개 정의
2. [ ] `src/lib/data.ts` — JSON import + 4개 헬퍼 함수
   - 검증: typecheck 통과 (이 시점에는 sanity 체크만)

**Phase B — 컴포넌트 (Phase A 완료 후, 서로 일부 의존)**
3. [ ] `src/components/back-link.tsx` (Client) — 가장 단순, 의존 0
4. [ ] `src/components/exercise-image.tsx` (Client) — 단순, 의존 0
5. [ ] `src/components/muscle-badge-list.tsx` (RSC) — i18n 의존
6. [ ] `src/components/exercise-list-item.tsx` (RSC) — i18n + types 의존
7. [ ] `src/components/muscle-grid.tsx` (RSC) — muscle-groups 의존
8. [ ] `src/components/exercise-detail.tsx` (RSC) — badge-list, exercise-image, i18n 의존

**Phase C — 페이지 (Phase A+B 완료 후)**
9. [ ] `src/app/page.tsx` 교체 — Home with MuscleGrid
10. [ ] `src/app/muscles/[muscle]/page.tsx` — generateStaticParams + getExercisesByMuscles
11. [ ] `src/app/exercises/[id]/page.tsx` — generateStaticParams + getExerciseById

**Phase D — 검증**
12. [ ] `npm run typecheck` 0 errors
13. [ ] `npm run build` 성공, 880+ 페이지 생성 확인
14. [ ] next-dev에서 시나리오 완주 (L2 위 7개)

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| Data Access | `module-1` | `lib/data.ts`, `lib/muscle-groups.ts` | 5 |
| Components | `module-2` | `components/*` 6개 | 15-20 |
| Pages | `module-3` | `app/**` 페이지 3개 | 10-15 |

#### Recommended Session Plan

옵션 A (KISS) — 단일 세션에 전체 진행. CTO 직접 구현으로 turn 비용 낮음.

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| (current) | Plan + Design | 전체 | 작성 완료 |
| (current) | Do | A → B → C 순차, Write 병렬 | 30-40 |
| (current) | Check | gap-detector + code-analyzer 또는 CTO 검토 | 5-10 |
| (current) | Report | 사용자 요약 | 2-3 |

### 11.4 핵심 코드 — `src/lib/data.ts`

```typescript
// Design Ref: §4.1 — Build-time data access. No I/O at runtime.

import exercisesData from "../../public/data/exercises-ko.json";
import type { EnrichedExercise, MuscleGroup } from "./types";

const EXERCISES = exercisesData as EnrichedExercise[];

export function getAllExercises(): readonly EnrichedExercise[] {
  return EXERCISES;
}

export function getExerciseById(id: string): EnrichedExercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export function getExercisesByMuscles(
  muscles: readonly MuscleGroup[],
): EnrichedExercise[] {
  if (muscles.length === 0) return [];
  const set = new Set<MuscleGroup>(muscles);
  return EXERCISES.filter((e) => e.primaryMuscles.some((m) => set.has(m)));
}

export function getAllExerciseIds(): string[] {
  return EXERCISES.map((e) => e.id);
}

/** 카드 정렬: level 오름차순 → nameKo 가나다 tie-break. */
const LEVEL_ORDER: Record<EnrichedExercise["level"], number> = {
  beginner: 0,
  intermediate: 1,
  expert: 2,
};

export function sortForList(
  exercises: readonly EnrichedExercise[],
): EnrichedExercise[] {
  return [...exercises].sort((a, b) => {
    const lvl = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
    if (lvl !== 0) return lvl;
    return a.nameKo.localeCompare(b.nameKo, "ko");
  });
}
```

### 11.5 핵심 코드 — `/muscles/[muscle]/page.tsx`

```typescript
// Design Ref: §5.1 Screen 2 + §11.1 — Bucket-based muscle list page.

import { notFound } from "next/navigation";
import { MUSCLE_BUCKETS } from "@/lib/muscle-groups";
import { getExercisesByMuscles, sortForList } from "@/lib/data";
import { ExerciseListItem } from "@/components/exercise-list-item";
import { BackLink } from "@/components/back-link";

// Plan SC: 7 bucket slugs all statically generated.
export async function generateStaticParams() {
  return MUSCLE_BUCKETS.map((b) => ({ muscle: b.slug }));
}

// output: 'export'에서 정의되지 않은 param은 빌드 시 제외 + 런타임 404.
export const dynamicParams = false;

interface Props {
  params: Promise<{ muscle: string }>;
}

export default async function MusclePage({ params }: Props) {
  const { muscle } = await params;
  const bucket = MUSCLE_BUCKETS.find((b) => b.slug === muscle);
  if (!bucket) notFound();

  const exercises = sortForList(getExercisesByMuscles(bucket.muscles));

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <BackLink />
      <header className="mt-4">
        <h1 className="text-2xl font-bold">
          {bucket.emoji} {bucket.labelKo}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          운동 {exercises.length}개
        </p>
      </header>
      <ul className="mt-6 space-y-3">
        {exercises.map((e) => (
          <li key={e.id}>
            <ExerciseListItem exercise={e} />
          </li>
        ))}
      </ul>
    </main>
  );
}
```

### 11.6 핵심 코드 — `/exercises/[id]/page.tsx`

```typescript
// Design Ref: §5.1 Screen 3 + §11.1 — Exercise detail page.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllExerciseIds, getExerciseById } from "@/lib/data";
import { ExerciseDetail } from "@/components/exercise-detail";
import { BackLink } from "@/components/back-link";

// Plan SC: 873 exercise IDs all statically generated.
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
  return { title: `${exercise.nameKo} | gym-alt-app` };
}

export default async function ExercisePage({ params }: Props) {
  const { id } = await params;
  const exercise = getExerciseById(id);
  if (!exercise) notFound();

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <BackLink />
      <ExerciseDetail exercise={exercise} />
    </main>
  );
}
```

### 11.7 핵심 코드 — `<ExerciseImage>` (Client Component)

```typescript
// Design Ref: §6.2 — onError fallback for external GitHub raw images.
"use client";

import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  eager?: boolean;
}

export function ExerciseImage({ src, alt, eager = false }: Props) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-neutral-200 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        이미지 로드 실패
        <br />
        {alt}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      onError={() => setErrored(true)}
      className="aspect-video w-full rounded-lg bg-neutral-100 object-cover dark:bg-neutral-900"
    />
  );
}
```

### 11.8 Build Verification 명령

```bash
# Phase A 끝나면
npm run typecheck

# Phase C 끝나면
npm run typecheck && npm run build

# 정적 페이지 카운트 검증
find out -name "index.html" | wc -l   # 기대: 880+ (Home 1 + muscles 7 + exercises 873 = 881)

# next-dev 시나리오 검증 (이미 기동 중)
# 브라우저로 http://localhost:3000 시나리오 완주
```

---

## 12. Open Questions for Do Phase

| ID | Question | 즉시 결정 |
|----|----------|----------|
| D-1 | `MUSCLE_BUCKETS`에 emoji 사용은 OS별 표시 차이가 있는데 OK? | ✅ MVP — 외부 의존 없는 단순 시각 보조. M6 UX 다듬기에서 SVG 아이콘 검토 가능 |
| D-2 | `next/link` prefetch 자동인데 873 페이지 prefetch 비용? | Next.js Link는 viewport 진입 시 prefetch — 부위 목록 화면에서만 동작. 페이지 N개 이내라 부담 적음 |
| D-3 | TypeScript path alias `@/*` 이미 M2 tsconfig.json에 정의됨 | ✅ 재사용. 추가 설정 불필요 |
| D-4 | 정렬 시 `localeCompare(a, b, "ko")` 사용 — 한국어 자모 정렬 정확성 | ✅ 표준 패턴. ICU collation 사용. node 22 OK |

---

## 13. Plan에서 Design으로의 변경 사항

| Plan | Design 변경 | 사유 |
|------|------------|------|
| FR-04 "17개 muscle slug 모두 정적 생성" | **bucket 7개로 축소** | 17개 단일 muscle 페이지의 UX 가치 낮음. bucket이 사용자 친화. 단일 muscle 보조 액세스는 추후 expand 검토 |
| FR-03 "전체 부위 보기" 보조 링크 | **M3에서 미구현** | bucket 7개로 17 muscle 모두 cover 가능 (lats→back, abs→abs 등). YAGNI. Plan FR-03는 Low priority라 skip 가능 |
| Plan 9.4 "URL slug 정책: lower-back" | **단일 muscle slug 정적 생성 안 함** | 7 bucket만 생성. 단일 muscle 페이지 필요 시 별도 라우트(`/single-muscles/[m]`) 도입 |

→ 이로 인해 Plan **FR-03을 Out of Scope로 이동**, FR-04를 "7 bucket slug 정적 생성"으로 변경.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-30 | M3 초안 — Option C 채택, bucket 7로 단순화 | jiinbae |
