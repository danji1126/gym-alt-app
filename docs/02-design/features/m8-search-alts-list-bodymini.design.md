# M8 Search→Alternatives + List Body Mini Design Document

> **Summary**: 신규 라이브러리 0 + 새 라우트 0. 자체 작성 인라인 SVG `BodyMini` (RSC, anterior+posterior 24×56 병치) + `ExerciseListItem`에 `showAlternatives` opt-in prop으로 인라인 🔄 트리거. M4 `AlternativesModal` 100% 재사용 (lazy chunk 그대로). `RecommendationCard`는 `ExerciseListItem`과 합치지 않고 `BodyMini`만 직접 흡수.
>
> **Project**: gym-alt-app
> **Author**: jiinbae (CTO)
> **Date**: 2026-05-01
> **Status**: Draft (옵션 A — KISS, 단일 마일스톤)
> **Planning Doc**: [m8-search-alts-list-bodymini.plan.md](../../01-plan/features/m8-search-alts-list-bodymini.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | (1) 검색 카드 → 상세 → 모달 3-tap 흐름 단축. (2) 리스트에서 자극 부위가 한국어 텍스트로만 표현되어 인지 비용 큼. |
| **WHO** | 단일 사용자, 모바일, 한 손, iOS Safari 16+/Android Chrome. 헬스장 현장 ~10초 결정. |
| **RISK** | (1) 250+ 카드 동시 인라인 SVG 렌더 부담. (2) 🔄 버튼-카드 Link 클릭 영역 충돌. (3) 모달 in 모달. |
| **SUCCESS** | 🔄 1-tap → AlternativesModal. 모든 리스트 카드에 미니 SVG (anterior+posterior). FR-01..13 100%. typecheck 0 + 빌드 회귀 0. First Load JS Home ≤ +10 kB / 다른 페이지 ≤ +5 kB. |
| **SCOPE** | F-A 인라인 alternatives 트리거 + F-B body mini SVG. AlternativesList 카드는 mini만, 🔄 X. |

---

## 1. Overview

### 1.1 Design Goals

1. **재사용 우선**: M4 `AlternativesModal` + M5 `MUSCLE_TO_LIBRARY` 그대로 가져다 쓴다. 신규 코드는 `BodyMini` + 17 path 정의에 한정.
2. **상세 페이지와 격리**: react-body-highlighter는 운동 상세에만 유지. 리스트 미니어처는 자체 작성 인라인 SVG로 번들 영향 최소.
3. **opt-in 호출**: `ExerciseListItem`이 `showAlternatives?: boolean` 명시 prop으로 동작 변경. 호출처가 결정 → 모달 in 모달 차단 + AlternativesList 비대화 차단.
4. **모바일 폭 안정성**: 미니어처 폭 고정 + 카드 본체 `flex-1 min-w-0` truncate로 375px viewport 가로 스크롤 0.

### 1.2 Design Principles

- **단일 source-of-truth path**: `src/lib/body-mini-paths.ts` 하나가 17 muscle SVG path data + 베이스 실루엣 path의 진실.
- **Compile-time 매핑 안전성**: `Record<MuscleGroup, BodyMiniRegion>` — 17 muscle 누락 시 TS 에러로 즉시 catch.
- **RSC 우선**: `BodyMini`는 RSC. 정적 SVG, 클라이언트 상태 0. 호출하는 카드가 Client인 경우(검색·즐겨찾기 등) RSC가 자식으로 들어가도 문제 없음.
- **Defensive on event bubbling**: 🔄 버튼은 `<Link>` 내부에 두지 않고 외부 wrapper에서 형제로 배치 + `e.preventDefault`/`e.stopPropagation` 둘 다 — Next.js Link가 capture phase에서도 안전.

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option α: ExerciseListItem 일원화 | Option β: 카드별 독립 흡수 (default) | Option γ: HOC 패턴 |
|---|:-:|:-:|:-:|
| **Approach** | RecommendationCard → ExerciseListItem로 통합 후 분기 | RecommendationCard에 BodyMini만 직접 import, ExerciseListItem은 별도 진화 | withBodyMini(Card)·withAlternatives(Card) HOC |
| **Lines changed** | ~150 (RecommendationCard 제거 + ExerciseListItem에 추천 정보 분기) | ~80 (각 카드에 BodyMini 1줄 + ExerciseListItem만 🔄 prop) | ~120 (HOC 2개 + 호출처 wrap) |
| **타입 안전성** | Recommendation·EnrichedExercise 두 모델 분기 prop 폭증 | 각자 자기 props만 — 명료 | HOC 타입 체이닝 복잡 |
| **재사용 사이트** | 5곳 → 5곳 동일 카드 | 5곳 — 4곳 ExerciseListItem + 1곳 RecommendationCard | 5곳 wrap |
| **모달 in 모달 방어** | showAlternatives prop 전달 | 카드별 컨트롤 (RecommendationCard 자체에 🔄 없음) | HOC 스킵 |
| **Risk** | High (M4 검증 끝난 카드 회귀 위험) | Low | Medium |
| **Recommendation** | 통합 미신화 | **default 채택** | 추가 추상화 — YAGNI |

**Selected**: **Option β — 카드별 독립 흡수**
**Rationale**: M4 `RecommendationCard`는 추천 overlap 배지(주근육 %·보조근육 %)를 가진 특수 카드. ExerciseListItem과 동등화하면 props 폭증 + M4 회귀 위험. `BodyMini`만 import하여 양쪽에 독립적으로 흡수가 KISS. Plan FR-12 "AlternativesList 카드는 mini만 추가, 🔄 버튼 X"의 의도와도 부합.

### 2.1 Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                       Build Time (RSC)                          │
│                                                                  │
│  src/lib/body-mini-paths.ts                                      │
│   ├─ SILHOUETTE_PATH_ANTERIOR  (단일 path d)                     │
│   ├─ SILHOUETTE_PATH_POSTERIOR (단일 path d)                     │
│   └─ MUSCLE_REGIONS: Record<MuscleGroup, BodyMiniRegion>          │
│         │                                                        │
│         ▼                                                        │
│  src/components/body-mini.tsx (RSC)                              │
│   ├─ <svg viewBox="0 0 56 56" role="img" aria-label="...">       │
│   ├─ <g> anterior (x=0..24)                                      │
│   ├─ <g> posterior (x=32..56)                                    │
│   └─ primary muscle만 fill="red-600"                             │
│                                                                  │
│  src/components/exercise-list-item.tsx (RSC)                     │
│   ├─ <Link> ── 카드 본체 (이름·기구·level)                       │
│   ├─ <BodyMini primaryMuscles={...} />                           │
│   └─ {showAlternatives && <AlternativesButton target={ex} />}    │
│         │                                                        │
│         ▼                                                        │
│  Server-rendered HTML (Home·muscle bucket·즐겨찾기)              │
│                                                                  │
│ ────────────────────────────────────────────────────────────────│
│                       Client Runtime                            │
│                                                                  │
│  🔄 클릭 → AlternativesButton (M4 그대로) → lazy modal chunk     │
│  카드 본체 클릭 → /exercises/[id]/ 이동 (Link 그대로)            │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
EnrichedExercise.primaryMuscles (build-time, type-safe)
        │
        ▼
   <BodyMini primaryMuscles={...} />
        │
        ▼ MUSCLE_REGIONS[m] 조회 (compile-time 17/17 보장)
        │
        ├─ region: "anterior" → anterior <g> 안에 fill 적용
        ├─ region: "posterior" → posterior <g> 안에 fill 적용
        └─ region: "both" (shoulders/forearms 등) → 양쪽 모두 적용
        │
        ▼
   완성 SVG (정적 markup)
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `lib/body-mini-paths.ts` | `lib/types` (MuscleGroup) | path data + 17 매핑 |
| `components/body-mini.tsx` | `lib/body-mini-paths`, `lib/i18n` (MUSCLE_KO) | 인라인 SVG 렌더 |
| `components/exercise-list-item.tsx` | `body-mini`, `alternatives-button` (조건부) | 통합 카드 |
| `components/alternatives-list.tsx` (M4) | `body-mini` | RecommendationCard 내부 흡수 |

---

## 3. Data Model

### 3.1 BodyMiniRegion 타입

```typescript
// src/lib/body-mini-paths.ts
export type BodyMiniRegion = "anterior" | "posterior" | "both";

export interface BodyMiniMuscleEntry {
  /** SVG <path d="..."> — 24×56 viewBox 내부 좌표. */
  readonly d: string;
  /** anterior 패널 / posterior 패널 / 양쪽 모두 (어깨·팔·종아리 등). */
  readonly region: BodyMiniRegion;
  /** SVG <title> 및 외부 aria-label에 사용할 짧은 한국어 부위명. */
  readonly labelKo: string;
}
```

### 3.2 17 Muscle → SVG Path 매핑

**24 × 56 px viewBox**: 인체 실루엣 단순 비례 (머리 6, 몸통 26, 다리 24).

| MuscleGroup | region | 위치 (anterior 24×56 내부) | labelKo |
|-------------|:------:|--------------------------|---------|
| chest | anterior | 가슴 (y 14-22) | 가슴 |
| abdominals | anterior | 복부 (y 22-34) | 복근 |
| biceps | both | 상완 전·후면 (y 14-22) | 이두 |
| triceps | both | 상완 후·외측 (y 14-22) | 삼두 |
| forearms | both | 전완 (y 22-30) | 전완 |
| shoulders | both | 양 어깨 (y 12-16) | 어깨 |
| traps | posterior | 목·승모근 상부 (y 8-14) | 승모근 |
| lats | posterior | 등 광배 (y 16-26) | 광배 |
| middle back | posterior | 등 중부 (y 14-20) | 등 중부 |
| lower back | posterior | 허리 (y 26-32) | 허리 |
| glutes | posterior | 엉덩이 (y 32-38) | 둔근 |
| quadriceps | anterior | 대퇴 전면 (y 34-46) | 대퇴사두 |
| hamstrings | posterior | 대퇴 후면 (y 34-46) | 햄스트링 |
| calves | both | 종아리 (y 46-54) | 종아리 |
| abductors | anterior | 외전근 (y 32-38, 측면) | 외전근 |
| adductors | anterior | 내전근 (y 32-40, 내측) | 내전근 |
| neck | both | 목 (y 6-12) | 목 |

**완성도 17/17**: anterior-only 케이스 0, posterior-only 6, both 5, anterior 6 (lats·hamstrings·glutes·lower back·middle back·traps의 6개 후면 전용 muscle을 위해 posterior 패널 필수 — Plan→Design 변경, §13 참조).

### 3.3 Color Constants

```typescript
const COLOR_PRIMARY = "#dc2626";       // Tailwind red-600
const COLOR_BASE_LIGHT = "#e5e7eb";    // Tailwind neutral-200 (light mode)
const COLOR_BASE_DARK = "#404040";     // Tailwind neutral-700 (dark mode)
const COLOR_SILHOUETTE = "#9ca3af";    // Tailwind neutral-400 (실루엣 stroke)
```

라이트/다크 분기는 SVG 안의 `<style>` 태그 + Tailwind dark variant 조합. fill 자체는 inline `fill={...}`로 적용하되 베이스는 `currentColor`/CSS 변수로 처리.

### 3.4 ExerciseListItem prop 확장

```typescript
interface Props {
  exercise: EnrichedExercise;
  /**
   * true 시 카드 우측에 인라인 🔄 트리거 노출 (AlternativesModal).
   * 호출처가 모달 in 모달을 회피하도록 명시 — AlternativesList는 false.
   * @default false
   */
  showAlternatives?: boolean;
}
```

---

## 4. API Specification

해당 없음 (외부 API 호출 0).

### 4.1 Internal Function Contract

```typescript
// src/components/body-mini.tsx
interface BodyMiniProps {
  /** 강조할 primary muscle 집합. secondary는 시각 단순화로 표시 X. */
  primaryMuscles: readonly MuscleGroup[];
  /** "운동명 + 자극 근육: ..." aria-label에 사용 (생략 시 "자극 근육: ..." 만). */
  exerciseName?: string;
  /** Tailwind 추가 클래스 (보통 width/height tweak). */
  className?: string;
}

export function BodyMini(props: BodyMiniProps): JSX.Element;
```

**Pre**: primaryMuscles는 17 MuscleGroup 중 하나 이상 또는 빈 배열.
**Post**:
- 빈 배열이면 베이스 실루엣만 렌더 (정보 손실 0, 카드 폭 일관성 확보).
- 비어 있지 않으면 해당 muscle path만 `COLOR_PRIMARY` fill.
- aria-label은 한국어 부위명 콤마 join.

**Pure**: 사이드 이펙트 0. RSC.

### 4.2 ExerciseListItem 행동 계약

| `showAlternatives` | 카드 본체 클릭 | 우측 영역 |
|:-:|---|---|
| `false` (default) | `/exercises/[id]/` 이동 | BodyMini 또는 화살표 |
| `true` | `/exercises/[id]/` 이동 | BodyMini + 🔄 버튼 (탭 분리) |

🔄 버튼은 `AlternativesButton`(M4) 그대로 import하여 카드 우측 끝에 배치. `<Link>` 외부에 형제로 두어 클릭 충돌 0.

---

## 5. UI/UX Design

### 5.1 Screen Layout — 카드 (showAlternatives=true)

```
┌─────────────────────────────────────────────────────┐
│  ┌────┬────┐  스미스머신 벤치 프레스          🔄  │
│  │ 앞 │ 뒤 │  스미스머신 · 중급                   │
│  │ ❤  │    │                                       │
│  └────┴────┘                                       │
│  56×56 BodyMini  flex-1 min-w-0 truncate    44×44 │
└─────────────────────────────────────────────────────┘
        │                  │                    │
        ▼                  ▼                    ▼
   <BodyMini/>        <Link href=상세>     <AlternativesButton/>
   (RSC, 정적)        (Link 단일 클릭 영역) (Client, lazy modal)
```

### 5.2 Screen Layout — 카드 (showAlternatives=false)

```
┌─────────────────────────────────────────────────────┐
│  ┌────┬────┐  덤벨 컬                                │
│  │ 앞 │ 뒤 │  덤벨 · 초급                            │
│  │    │    │                                          │
│  └────┴────┘                                          │
└─────────────────────────────────────────────────────┘
```

🔄 버튼 없음. 카드 전체가 하나의 `<Link>` 클릭 영역.

### 5.3 Screen Layout — RecommendationCard (M4 + BodyMini)

```
┌─────────────────────────────────────────────────────┐
│  ┌────┬────┐  바벨 벤치 프레스                       │
│  │ 앞 │ 뒤 │  바벨 · 중급                            │
│  │ ❤  │    │  [주근육 100%] [보조근육 67%]           │
│  └────┴────┘                                          │
└─────────────────────────────────────────────────────┘
```

🔄 버튼 없음 (모달 in 모달 회피). BodyMini만 추가.

### 5.4 User Flow

```
Home·muscle bucket·즐겨찾기 카드
  ├─ 🔄 클릭 → AlternativesButton 동작 (M4)
  │   └─ 첫 클릭 시 modal chunk lazy fetch → 모달 open
  │       └─ 모달 안 RecommendationCard 클릭 → 모달 onClose + /exercises/[id]/ 이동
  ├─ 카드 본체 클릭 → /exercises/[id]/ 이동
  └─ BodyMini hover/focus → SVG <title> 한국어 muscle 노출 (보조)
```

### 5.5 Component List

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `BodyMini` | RSC | `src/components/body-mini.tsx` | 인라인 SVG 24+24×56 정적 렌더 |
| `ExerciseListItem` (수정) | RSC | `src/components/exercise-list-item.tsx` | 카드 + showAlternatives prop |
| `RecommendationCard` (M4 수정) | Client(자동) | `src/components/alternatives-list.tsx` | overlap 배지 + BodyMini 흡수 |
| `AlternativesButton` (M4 그대로) | Client | `src/components/alternatives-button.tsx` | 🔄 버튼 + lazy modal |

### 5.6 Page UI Checklist

#### ExerciseListItem (Home·muscle bucket·즐겨찾기)
- [ ] 카드는 `flex items-center gap-3` — BodyMini · 본체 · 🔄 가로 정렬
- [ ] BodyMini 폭 고정 56px, 본체 `flex-1 min-w-0`, 🔄 버튼 폭 44px
- [ ] 본체 `<Link>` 내부 텍스트는 `truncate` 또는 `line-clamp-2`
- [ ] 🔄 버튼은 `<Link>` 외부 형제로 배치 — Link 클릭 영역 충돌 0
- [ ] 🔄 버튼은 모바일 터치 ≥ 44×44
- [ ] showAlternatives=false 시 🔄 영역 자체 미렌더 (DOM 비대화 차단)
- [ ] 다크모드: BodyMini 베이스 컬러 분기 (`dark:fill-neutral-700`)

#### BodyMini SVG
- [ ] `viewBox="0 0 56 56"` (anterior 0-24, gap 24-32, posterior 32-56)
- [ ] `role="img"` + `aria-label="자극 근육: 가슴, 어깨, 삼두"` 포맷
- [ ] `<title>` 자식 1개 (스크린리더 지원 보강)
- [ ] primary muscle path만 `fill={COLOR_PRIMARY}`, 나머지는 베이스
- [ ] 빈 배열일 때 베이스 실루엣만 표시 (디자인 일관)

#### RecommendationCard (alternatives-list.tsx 수정)
- [ ] 좌측 BodyMini 추가 (ExerciseListItem과 같은 56×56)
- [ ] 🔄 버튼 추가 X (모달 in 모달 회피)
- [ ] 기존 overlap 배지(주근육 %·보조근육 %) 유지

---

## 6. Error Handling

| Scenario | Handling |
|----------|----------|
| `MUSCLE_REGIONS[m]` 누락 (이론상 불가, TS strict로 차단) | `MuscleGroup` union이 17개 — 누락 시 컴파일 에러 |
| primaryMuscles 빈 배열 | 베이스 실루엣만 렌더, aria-label="자극 근육: -" |
| BodyMini path 범위 외 좌표 (Do 단계 디자인 실수) | viewBox로 클립 — overflow 0 |
| `showAlternatives=true`이지만 모달 chunk fetch 실패 | M4 AlternativesButton의 `everOpened` 패턴 그대로 — fetch 재시도는 다음 클릭 |
| 🔄 버튼 클릭이 카드 Link로 bubble | `e.preventDefault()` + `e.stopPropagation()` 둘 다 |
| iOS Safari에서 SVG `<title>` 미인식 | aria-label fallback 우선, title은 보조 |

---

## 7. Performance & Security

### 7.1 Performance

| Item | 측정 | 목표 | 전략 |
|------|------|------|------|
| First Load JS Home | dev: 109 → ? | ≤ 119 kB | BodyMini RSC + path data lib는 RSC chunk만, AlternativesButton lazy 그대로 |
| First Load JS muscles/[muscle] | dev: 106 → ? | ≤ 111 kB | BodyMini RSC + AlternativesButton lazy, page 본체 prerendered SVG markup 그대로 |
| 250개 카드 동시 SVG 렌더 | iPhone SE FCP | ≤ +50ms | 인라인 SVG는 정적 markup — DOM cost는 low. measurement 후 필요 시 IntersectionObserver lazy mount (BodyMini wrapper) |
| Hydration 비용 | Home | ≤ 현재 +10ms | RSC SVG는 hydration 불필요 |

### 7.2 Security

| Item | Status | Note |
|------|:------:|------|
| XSS via SVG attribute | ✅ | path d 값은 hardcoded const, 사용자 입력 0 |
| 외부 자원 fetch | ✅ | inline SVG, 외부 fetch 0 |
| Click-jacking via 🔄 | ✅ | button type="button" + 자체 event handler. iframe 임베드 시나리오 없음 |
| react-body-highlighter SVG path 차용 | ⚠️ | MIT 라이선스 — 차용 시 `body-mini-paths.ts` 헤더에 출처·라이선스 명시. 자체 작성 시 무관 |

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L0: Build Verification | typecheck + build | tsc + next | Check |
| L1: 매핑 완성도 | 17 muscle path 정의 + region 분류 | code review | Check |
| L2: Manual UI | 🔄 클릭 + BodyMini 렌더 | Browser | Check |
| L3: 모바일 폭 | 375px 가로 스크롤 | DevTools device toolbar | Check |
| L4: 다크모드 | BodyMini 베이스 컬러 식별 | Browser | Check |

### 8.2 L1: 17 Muscle 정의 체크리스트

`MUSCLE_REGIONS`가 17 muscle 모두 포함하는지 컴파일 타임 (TS Record) + 런타임 단위 확인.

| # | MuscleGroup | region | path d 길이 | OK |
|---|------------|:------:|:----------:|:--:|
| 1 | abdominals | anterior | ≥ 30 chars | [ ] |
| 2 | abductors | anterior | ≥ 30 | [ ] |
| 3 | adductors | anterior | ≥ 30 | [ ] |
| 4 | biceps | both | ≥ 30 | [ ] |
| 5 | calves | both | ≥ 30 | [ ] |
| 6 | chest | anterior | ≥ 30 | [ ] |
| 7 | forearms | both | ≥ 30 | [ ] |
| 8 | glutes | posterior | ≥ 30 | [ ] |
| 9 | hamstrings | posterior | ≥ 30 | [ ] |
| 10 | lats | posterior | ≥ 30 | [ ] |
| 11 | lower back | posterior | ≥ 30 | [ ] |
| 12 | middle back | posterior | ≥ 30 | [ ] |
| 13 | neck | both | ≥ 30 | [ ] |
| 14 | quadriceps | anterior | ≥ 30 | [ ] |
| 15 | shoulders | both | ≥ 30 | [ ] |
| 16 | traps | posterior | ≥ 30 | [ ] |
| 17 | triceps | both | ≥ 30 | [ ] |

### 8.3 L2: Manual UI 시나리오

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Home에서 운동 검색 → 결과 카드 좌측 BodyMini 노출 | anterior+posterior 24+24×56, primary muscle 빨강 |
| 2 | 검색 결과 카드 우측 🔄 클릭 | AlternativesModal 열림, 추천 5개 표시 |
| 3 | 🔄 클릭 시 카드 본체 navigate 0 | URL 변경 X (preventDefault 확인) |
| 4 | 카드 본체(이름·기구) 클릭 | `/exercises/[id]/` 이동 |
| 5 | muscle bucket "/muscles/chest/" 진입 | 모든 카드 동일 BodyMini + 🔄 노출 |
| 6 | 즐겨찾기 섹션 카드 | 동일 BodyMini + 🔄 노출 |
| 7 | AlternativesModal 안 RecommendationCard | BodyMini 노출, 🔄 버튼 X (모달 in 모달 차단) |
| 8 | iPhone SE 375px | 가로 스크롤 0, 본체 텍스트 truncate |
| 9 | 다크모드 토글 | BodyMini 베이스 회색이 다크 배경에서도 대비 충분 |
| 10 | 빈 primary (이론상 0건이지만) | 베이스 실루엣만, aria-label 확인 |

### 8.4 L3 + L4: Build & Bundle 회귀

```bash
npm run build
# 비교: docs/04-reports/mvp-completion.md §5 baseline
# Home First Load JS: 109 kB → ≤ 119 kB
# muscles First Load JS: 106 kB → ≤ 111 kB
# 정적 페이지: 882 → 882 (라우트 추가 0)
```

---

## 9. Clean Architecture

(M3-M7 동일 layer 매핑 + 신규)

| Layer | M8 Files |
|-------|----------|
| Presentation | `src/components/body-mini.tsx`, 수정된 `exercise-list-item.tsx`, 수정된 `alternatives-list.tsx`, 수정된 `home-search.tsx`/`favorites-section.tsx`/`muscles/[muscle]/page.tsx` |
| Domain | `src/lib/body-mini-paths.ts` |
| Infrastructure | (없음) |

---

## 10. Coding Convention Reference

(M1-M7 그대로 + 신규)

### 10.1 SVG path data
- `body-mini-paths.ts` 안에 `as const` 객체로 export
- path d 문자열은 한 줄 (가독성 < grep 가능성)
- viewBox 상수로 고정 (`SVG_VIEWBOX = "0 0 56 56"`)

### 10.2 Inline event handler
- 🔄 버튼은 함수 내부 `const handleClick = (e) => { e.preventDefault(); e.stopPropagation(); ... }` — bubble 방어 명시
- M4 `AlternativesButton`을 그대로 import하면 이미 button type="button" — Link 내부에 두지 않으면 자동 안전 (이중 방어로 prevent/stop 모두 적용 권장)

### 10.3 Conditional rendering with default false
- `showAlternatives` opt-in. 호출처에서 명시 → 이력 추적 명료
- AlternativesList의 RecommendationCard는 BodyMini만 — 별도 분기 없이 흡수

---

## 11. Implementation Guide

### 11.1 File Structure (M8 추가)

```
src/
├── lib/
│   └── body-mini-paths.ts                  🆕 17 muscle SVG path data
├── components/
│   ├── body-mini.tsx                       🆕 RSC 인라인 SVG
│   ├── exercise-list-item.tsx              🔄 BodyMini + 🔄 button + showAlternatives prop
│   ├── alternatives-list.tsx               🔄 RecommendationCard에 BodyMini 흡수
│   ├── home-search.tsx                     🔄 showAlternatives={true}
│   └── favorites-section.tsx               🔄 showAlternatives={true}
└── app/
    └── muscles/[muscle]/page.tsx           🔄 showAlternatives={true}
```

**총 신규 2 + 수정 5 = 7개 변경**.

### 11.2 Implementation Order

**Phase A — lib + 정적 path data**
1. [ ] `src/lib/body-mini-paths.ts` 작성
   - `BodyMiniRegion`·`BodyMiniMuscleEntry` 타입
   - `SILHOUETTE_PATH_ANTERIOR`·`SILHOUETTE_PATH_POSTERIOR` const
   - `MUSCLE_REGIONS: Record<MuscleGroup, BodyMiniMuscleEntry>` — 17 entries
   - 색상 const 4개

**Phase B — BodyMini 컴포넌트**
2. [ ] `src/components/body-mini.tsx` 작성 (RSC)
   - props: `primaryMuscles`, `exerciseName?`, `className?`
   - 56×56 viewBox, anterior(0-24) + 4 gap + posterior(32-56)
   - primary muscle만 fill 적용
   - aria-label + `<title>` 자식

**Phase C — 카드 통합**
3. [ ] `src/components/exercise-list-item.tsx` 수정
   - `showAlternatives?: boolean` prop 추가 (default false)
   - flex layout: BodyMini · Link 본체 · (조건부) AlternativesButton
   - `<Link>` 클릭 영역과 🔄 버튼 분리 (형제로 배치)
4. [ ] `src/components/alternatives-list.tsx` 수정
   - `RecommendationCard` 내부에 `<BodyMini primaryMuscles={r.exercise.primaryMuscles} />` 좌측 추가
   - 🔄 버튼 추가 X

**Phase D — 호출처 prop 명시**
5. [ ] `src/components/home-search.tsx` 검색 결과 카드: `<ExerciseListItem ... showAlternatives />`
6. [ ] `src/components/favorites-section.tsx` 카드: `<ExerciseListItem ... showAlternatives />`
7. [ ] `src/app/muscles/[muscle]/page.tsx` 카드: `<ExerciseListItem ... showAlternatives />`

**Phase E — 검증**
8. [ ] dev 서버 hot reload — 카드 시각 확인 (Home + muscle bucket + 즐겨찾기 + 모달 안)
9. [ ] L2 시나리오 10개 직접 실행
10. [ ] (마지막에만) `npm run typecheck` + `npm run build` + First Load JS 회귀 측정

### 11.3 Session Guide

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| (current) | Plan + Design | 전체 | 작성 완료 |
| (next) | Do A | body-mini-paths.ts | 5-7 |
| (next) | Do B | body-mini.tsx | 3-5 |
| (next) | Do C | exercise-list-item + alternatives-list | 5-8 |
| (next) | Do D | 호출처 3곳 | 3-5 |
| (next) | Check | typecheck/build/시나리오 | 5 |
| (next) | Report | 사용자 요약 | 2 |

### 11.4 핵심 코드 스켈레톤 — `body-mini-paths.ts`

```typescript
// Design Ref: §3.1, §3.2 — 17 muscle SVG path data + region 분류.
// SVG viewBox: 56x56. anterior x=0..24, gap=24..32, posterior x=32..56.
// 자체 작성 (라이브러리 차용 시 헤더에 MIT 출처 명시).

import type { MuscleGroup } from "./types";

export const SVG_VIEWBOX = "0 0 56 56" as const;
export const ANTERIOR_X = 0;
export const POSTERIOR_X = 32;
export const PANEL_WIDTH = 24;

export type BodyMiniRegion = "anterior" | "posterior" | "both";

export interface BodyMiniMuscleEntry {
  readonly d: string;
  readonly region: BodyMiniRegion;
  readonly labelKo: string;
}

export const SILHOUETTE_PATH_ANTERIOR = "M12 2 ..." as const;   // Do 단계 작성
export const SILHOUETTE_PATH_POSTERIOR = "M44 2 ..." as const;  // Do 단계 작성

export const MUSCLE_REGIONS: Record<MuscleGroup, BodyMiniMuscleEntry> = {
  abdominals: { d: "M ...", region: "anterior", labelKo: "복근" },
  abductors:  { d: "M ...", region: "anterior", labelKo: "외전근" },
  adductors:  { d: "M ...", region: "anterior", labelKo: "내전근" },
  biceps:     { d: "M ...", region: "both",     labelKo: "이두" },
  calves:     { d: "M ...", region: "both",     labelKo: "종아리" },
  chest:      { d: "M ...", region: "anterior", labelKo: "가슴" },
  forearms:   { d: "M ...", region: "both",     labelKo: "전완" },
  glutes:     { d: "M ...", region: "posterior", labelKo: "둔근" },
  hamstrings: { d: "M ...", region: "posterior", labelKo: "햄스트링" },
  lats:       { d: "M ...", region: "posterior", labelKo: "광배" },
  "lower back":  { d: "M ...", region: "posterior", labelKo: "허리" },
  "middle back": { d: "M ...", region: "posterior", labelKo: "등 중부" },
  neck:       { d: "M ...", region: "both",     labelKo: "목" },
  quadriceps: { d: "M ...", region: "anterior", labelKo: "대퇴사두" },
  shoulders:  { d: "M ...", region: "both",     labelKo: "어깨" },
  traps:      { d: "M ...", region: "posterior", labelKo: "승모근" },
  triceps:    { d: "M ...", region: "both",     labelKo: "삼두" },
};

export const COLOR_PRIMARY = "#dc2626";
export const COLOR_BASE_LIGHT = "#e5e7eb";
export const COLOR_BASE_DARK = "#404040";
export const COLOR_SILHOUETTE = "#9ca3af";
```

> **Do 단계**: 실제 path d 값을 작성. anterior 패널은 좌상단 (0,0)부터 (24,56)까지 24×56 영역. posterior는 (32,0)~(56,56). 좌우 동일 viewBox 안에 두 그림.

### 11.5 핵심 코드 스켈레톤 — `body-mini.tsx`

```typescript
// Design Ref: §4.1, §5.1 — RSC 인라인 SVG 미니 다이어그램.
// 외부 의존 0. 17 muscle path는 lib/body-mini-paths에서 lookup.

import type { MuscleGroup } from "@/lib/types";
import {
  SVG_VIEWBOX,
  SILHOUETTE_PATH_ANTERIOR,
  SILHOUETTE_PATH_POSTERIOR,
  MUSCLE_REGIONS,
  COLOR_PRIMARY,
} from "@/lib/body-mini-paths";

interface Props {
  primaryMuscles: readonly MuscleGroup[];
  exerciseName?: string;
  className?: string;
}

export function BodyMini({ primaryMuscles, exerciseName, className }: Props) {
  const labels = primaryMuscles
    .map((m) => MUSCLE_REGIONS[m].labelKo)
    .join(", ");
  const ariaLabel = exerciseName
    ? `${exerciseName} 자극 근육: ${labels || "-"}`
    : `자극 근육: ${labels || "-"}`;

  // 활성 muscle을 region별로 분류
  const activeAnterior = primaryMuscles.filter(
    (m) => MUSCLE_REGIONS[m].region !== "posterior",
  );
  const activePosterior = primaryMuscles.filter(
    (m) => MUSCLE_REGIONS[m].region !== "anterior",
  );

  return (
    <svg
      viewBox={SVG_VIEWBOX}
      role="img"
      aria-label={ariaLabel}
      className={className ?? "h-14 w-14 shrink-0"}
    >
      <title>{ariaLabel}</title>
      {/* 베이스 실루엣 — 라이트·다크 자동 분기 */}
      <g className="fill-neutral-200 dark:fill-neutral-700">
        <path d={SILHOUETTE_PATH_ANTERIOR} />
        <path d={SILHOUETTE_PATH_POSTERIOR} />
      </g>
      {/* anterior 활성 */}
      <g fill={COLOR_PRIMARY}>
        {activeAnterior.map((m) => (
          <path key={`a-${m}`} d={MUSCLE_REGIONS[m].d} />
        ))}
      </g>
      {/* posterior 활성 — 같은 lib 안의 d 값이 posterior 좌표 (x≥32) */}
      <g fill={COLOR_PRIMARY}>
        {activePosterior.map((m) => (
          <path key={`p-${m}`} d={MUSCLE_REGIONS[m].d} />
        ))}
      </g>
    </svg>
  );
}
```

> **주의**: `region: "both"`인 muscle (biceps 등)은 `MUSCLE_REGIONS[m].d`가 anterior+posterior 두 path를 모두 포함하는 단일 d 문자열로 작성. 또는 두 entry로 분리 (`biceps-front`/`biceps-back`)하되 외부 type은 통합. Do 단계 결정.

### 11.6 핵심 코드 스켈레톤 — `exercise-list-item.tsx` 수정

```typescript
import Link from "next/link";
import type { EnrichedExercise } from "@/lib/types";
import { EQUIPMENT_KO, LEVEL_KO } from "@/lib/i18n";
import { BodyMini } from "./body-mini";
import { AlternativesButton } from "./alternatives-button";

interface Props {
  exercise: EnrichedExercise;
  showAlternatives?: boolean;
}

export function ExerciseListItem({ exercise, showAlternatives = false }: Props) {
  const firstEquipment = exercise.detailedEquipment[0];
  const equipmentLabel = firstEquipment ? EQUIPMENT_KO[firstEquipment] : "-";

  return (
    <div className="flex min-h-11 items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700 dark:hover:bg-neutral-900">
      <BodyMini
        primaryMuscles={exercise.primaryMuscles}
        exerciseName={exercise.nameKo}
        className="h-14 w-14 shrink-0"
      />
      <Link
        href={`/exercises/${exercise.id}/`}
        className="block min-w-0 flex-1"
      >
        <h3 className="truncate text-base font-semibold leading-tight">
          {exercise.nameKo}
        </h3>
        <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {equipmentLabel} · {LEVEL_KO[exercise.level]}
        </p>
      </Link>
      {showAlternatives && (
        <div className="shrink-0">
          <AlternativesButton target={exercise} variant="icon" />
        </div>
      )}
    </div>
  );
}
```

> **주의**: 현재 `AlternativesButton`은 큰 `min-h-11 w-full ... 다른 기구로 대체` full-width 버튼 — 카드 우측에 들어가려면 `variant: "icon" | "full"` prop을 추가해 icon-only 44×44 모드를 지원하도록 함께 수정. 또는 카드 전용 별도 컴포넌트로 분리 (Do 단계 결정).

### 11.7 핵심 코드 스켈레톤 — `alternatives-list.tsx` 수정

```typescript
// 기존 RecommendationCard 함수 안 Link 자식 첫 줄에 BodyMini 추가
// (전체 카드를 flex로 래핑하여 좌측 BodyMini · 우측 텍스트 영역 분리)

function RecommendationCard({ rec, onNavigate }: { ... }) {
  const { exercise, primaryOverlap, secondaryOverlap } = rec;
  // ... 기존 그대로

  return (
    <Link
      href={`/exercises/${exercise.id}/`}
      onClick={onNavigate}
      className="flex min-h-11 items-start gap-3 rounded-xl border ..."
    >
      <BodyMini
        primaryMuscles={exercise.primaryMuscles}
        exerciseName={exercise.nameKo}
        className="h-14 w-14 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold ...">{exercise.nameKo}</h3>
        <p className="mt-0.5 truncate text-xs ...">
          {equipmentLabel} · {LEVEL_KO[exercise.level]}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <Badge tone="primary" label={`주근육 ${primaryPct}%`} />
          {secondaryPct > 0 && (
            <Badge tone="secondary" label={`보조근육 ${secondaryPct}%`} />
          )}
        </div>
      </div>
    </Link>
  );
}
```

🔄 버튼 추가 X — 모달 in 모달 회피 (Plan FR-12).

---

## 12. Open Questions for Do Phase

| ID | Question | 즉시 결정 |
|----|----------|----------|
| D-1 | path d 데이터를 자체 작성 vs react-body-highlighter MIT 차용 | 자체 작성 default. 24×56 단순 실루엣 + 17 muscle 사각/타원으로 충분. 정확 해부도 불필요 — 인지 보조 목적 |
| D-2 | `region: "both"` muscle은 단일 d 합치기 vs 두 d 분리 | 단일 d로 합치는 쪽이 인덱스/렌더 단순. d 문자열 안에 `M{anterior_x}...M{posterior_x}...` 로 두 경로 합집합 |
| D-3 | AlternativesButton variant 추가 vs 신규 IconAlternativesButton | M4 회귀 위험 < variant prop 추가. AlternativesButton에 `variant?: "full" \| "icon"` 추가, default "full" |
| D-4 | 다크모드 배경 대비 부족 시 stroke 추가 | Do 단계 시각 확인 후. 필요 시 SILHOUETTE에 `stroke="currentColor" stroke-width="0.5"` 추가 |
| D-5 | 250+ 카드 동시 렌더가 실측 느린 경우 | IntersectionObserver lazy mount wrapper. Do 단계 측정 후 결정 |
| D-6 | iOS Safari 16의 SVG aria-label 인식 호환성 | aria-label 우선 + `<title>` fallback. 두 모두 적용 |

---

## 13. Plan에서 Design으로의 변경 사항

| Plan | Design 변경 | 사유 |
|------|------------|------|
| 미니어처 anterior(앞면) only — 가독성·카드 폭 절약 | **anterior + posterior 24+24 병치 (총 56×56)** | 17 muscle 중 lats·hamstrings·glutes·lower back·middle back·traps의 6개가 후면 전용 — anterior-only는 6/17 muscle을 시각적으로 표현 불가. 카드 폭 +8px 증가는 truncate로 흡수 가능. 더 큰 정보 가치 vs 미미한 폭 비용으로 정당화 |
| RecommendationCard도 ExerciseListItem 사용 (Plan §6.1) | **RecommendationCard는 그대로 두고 BodyMini만 import** | RecommendationCard의 overlap 배지(주근육 %·보조근육 %) prop이 ExerciseListItem과 다른 도메인. 통합하면 prop 폭증·M4 회귀 위험 큼. KISS 채택 (Option β) |
| AlternativesButton 그대로 호출 | **AlternativesButton에 `variant?: "full" \| "icon"` prop 추가** | 운동 상세 페이지의 full-width 버튼은 그대로, 카드 우측에는 icon-only 44×44 모드 필요. M4 호출처는 default "full"로 무회귀 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-01 | M8 Design — Option β (카드별 흡수) 채택, anterior+posterior 56×56 병치, AlternativesButton variant 확장 | jiinbae |
