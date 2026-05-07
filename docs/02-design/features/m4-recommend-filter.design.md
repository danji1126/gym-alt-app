# M4 Recommend + Filter Design Document

> **Summary**: PRD §5.2/§5.3 추천 함수를 pure module로 + LocalStorage SSR-safe hook + native `<dialog>` 모달. Client island 패턴으로 정적 export 호환 유지.
>
> **Project**: gym-alt-app
> **Version**: 0.1.0
> **Author**: jiinbae (CTO)
> **Date**: 2026-04-30
> **Status**: Draft (옵션 A — KISS)
> **Planning Doc**: [m4-recommend-filter.plan.md](../../01-plan/features/m4-recommend-filter.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | PRD §1.1 — 헬스장 점유·부재로 인한 대체 운동 30초 탐색. M3 탐색 동선 위에 핵심 가치 결제. |
| **WHO** | 단일 사용자. iOS Safari 16+, Android Chrome. 한 손, 모바일 우선. |
| **RISK** | LocalStorage SSR hydration mismatch / 추천 0건 / 정적 export 호환성 |
| **SUCCESS** | PRD §5.2/§5.3 정확 준수 + LS hydration 깔끔 + build 회귀 0 + typecheck 0 + 시나리오 한국어 완주 |
| **SCOPE** | F-2 추천 + F-4 가용 기구 필터 + /settings 프리셋 관리 |

---

## 1. Overview

### 1.1 Design Goals

1. **PRD §5.2 본문 정확 매핑**: 가중치 0.6/0.2/0.1/0.1 + Jaccard. 임의 변경 0.
2. **PRD §5.3 hard constraint**: primary 교집합 ≠ ∅ + 자기 자신 제외 + tie-breaker 정확.
3. **사용자 지시 추가 제약**: level 차이 ≤ 1 (자동 완화 포함).
4. **SSR-safe LocalStorage**: hydration mismatch 0. mount 전 default → mount 후 LS 동기화.
5. **정적 export 호환**: 신규 라우트 1개 (`/settings/`)만 추가. RSC 페이지에 Client island 삽입.
6. **KISS**: 모달은 native `<dialog>`, 의존성 0 추가.

### 1.2 Design Principles

- **Pure recommend()**: 입력→출력 결정론적. `getAllExercises()`를 인자로 받음 (테스트·재사용성).
- **Client island**: RSC 페이지 변경 최소화. 새 인터랙션은 별도 Client component로 격리.
- **Single source of state**: 활성 프리셋의 availableEquipment는 LocalStorage가 진실. 모달의 즉석 토글도 LS에 즉시 반영.

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: All-in-Modal | Option B: Separate Route | Option C: Pragmatic Island |
|----------|:-:|:-:|:-:|
| **Approach** | 추천 모달에 가용 기구 토글까지 다 넣음, /settings 없음 | `/exercises/[id]/alternatives/` 별도 페이지 + /settings | 모달 (즉석 토글 + 추천) + /settings (프리셋 편집), 두 진입점 동기화 |
| **New Routes** | 0 (settings 없음 — UX 한계) | 2 (`alternatives` + `settings`) | 1 (`settings`) |
| **Static Export** | OK | OK (873 alternatives 페이지 추가? — 아니면 단일) | OK |
| **Static Pages 회귀** | +0 | +873 ~ +1 (단일이면) | +1 |
| **UX** | 좁은 모달에 모든 기구 토글 부담 | 페이지 이동 비용 | 모달은 빠른 토글, /settings는 정밀 편집 |
| **Risk** | 사용자 토글 후 영구화 의지 모호 | 라우트 추가, 정적 export 비용 | Low |
| **Recommendation** | 빠른 prototype | 다인 협업, 깊은 설정 | **default 채택** |

**Selected**: **Option C — Pragmatic Island**
**Rationale**: 모달은 "즉석 토글 + 추천 결과 즉시 확인" UX의 강점, /settings는 "여러 기구를 한 번에 정리" UX의 강점. 두 진입점이 같은 LocalStorage state를 공유하므로 정합성 보장. 정적 export 라우트 +1만 추가.

### 2.1 Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                       Build Time                                 │
│                                                                  │
│  data/gym-presets.json (시드)                                    │
│         │ import                                                 │
│         ▼                                                        │
│  src/lib/preset-store.ts (Client hook + helpers)                 │
│         │                                                        │
│  src/lib/recommend.ts (Pure module — server/client 모두 사용)    │
│         │ uses                                                   │
│         ▼                                                        │
│  src/lib/types.ts (M1-M2 그대로)                                 │
│  src/lib/i18n.ts (M1-M2 그대로)                                  │
│  src/lib/data.ts (M3 그대로 — getAllExercises 재사용)            │
│                                                                  │
│ ────────────────────────────────────────────────────────────────│
│                       Runtime                                    │
│                                                                  │
│  /exercises/[id]/ (RSC, M3)                                      │
│   └─▶ <BackLink/>                                                │
│   └─▶ <ExerciseDetail .../>                                      │
│   └─▶ <AlternativesButton                ◀ 신규 Client island    │
│         exercise={...}                                           │
│         allExercises={...} />                                    │
│         │ click                                                  │
│         ▼                                                        │
│        <AlternativesModal>                                       │
│         │ (uses usePreset, recommend)                            │
│         ├─▶ Equipment toggles (즉석)                             │
│         └─▶ <AlternativesList recs={...} />                      │
│              └─▶ <Link href={/exercises/{id}/}>                  │
│                                                                  │
│  /settings/ (Client RSC + Client comp 혼합)                      │
│   └─▶ <PresetEditor> (uses usePreset)                            │
│        ├─ DetailedEquipment 20개 토글 그리드                     │
│        └─ Reset 버튼                                             │
│                                                                  │
│  / (Home, RSC)                                                   │
│   └─ M3 그대로 + "⚙️ 헬스장 설정" Link 추가                      │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

**LocalStorage 단방향 동기화**:
```
LS ─읽기─▶ usePreset() state
            ▲           │
            │           ▼
            │       UI 표시
            │           │
            └──쓰기─── 사용자 토글 (모달 또는 settings)
```

**추천 계산 흐름**:
```
target exercise (운동 상세에서 알려짐) + preset.availableEquipment (LS)
                            │
                            ▼
              recommend(target, available, allExercises, 5)
                            │
                            ▼
                   Recommendation[5]
                            │
                            ▼
                  <AlternativesList>
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `lib/recommend.ts` | `lib/types` | Pure 추천 함수 |
| `lib/preset-store.ts` | `lib/types`, `data/gym-presets.json` | LS hook + 시드 |
| `components/alternatives-button.tsx` | React, Modal 컴포넌트 | 모달 trigger |
| `components/alternatives-modal.tsx` | React, `lib/recommend`, `lib/preset-store`, `lib/i18n`, `components/alternatives-list` | 모달 컨테이너 |
| `components/alternatives-list.tsx` | `lib/i18n`, `lib/types`, `next/link` | 추천 카드 리스트 |
| `app/settings/page.tsx` | `lib/preset-store`, `lib/i18n`, `lib/types` | 프리셋 편집 |
| `app/exercises/[id]/page.tsx` | (M3 그대로) + `lib/data.ts` getAllExercises + `<AlternativesButton>` | 추천 진입점 추가 |
| `app/page.tsx` | (M3 그대로) + `next/link` | 설정 링크 추가 |

**의존성 그래프 (사이클 없음)**:
```
       types.ts
          ▲
   ┌──────┼─────────────┐
   │      │             │
recommend.ts  preset-store.ts  i18n.ts (M1-M2)
   │           │           │
   └─────┬─────┴───────────┘
         ▼
   components/* (modal, list, button)
         │
         ▼
   app/exercises/[id], app/settings, app/page
```

---

## 3. Data Model

신규 도메인 타입 1종만 추가.

### 3.1 Recommendation (추천 결과)

```typescript
// src/lib/recommend.ts

export interface Recommendation {
  exercise: EnrichedExercise;
  score: number;            // 0..1
  primaryOverlap: number;   // 0..1, Jaccard
  secondaryOverlap: number; // 0..1, Jaccard
}
```

### 3.2 StoredState (LocalStorage 스키마)

```typescript
// src/lib/preset-store.ts
interface StoredState {
  version: 1;             // 마이그레이션 마커
  activeId: string;       // 현재 활성 프리셋 ID
  presets: GymPreset[];   // 보유 프리셋 (M4는 1개)
}
```

LocalStorage 키: `gym-alt-app:preset:v1`
fallback: `data/gym-presets.json` 첫 번째 시드 (default-full)

---

## 4. API Specification

해당 없음 (백엔드 0). 모든 데이터는 빌드 타임 import 또는 LocalStorage.

### 4.1 Internal Function Contract — `recommend()`

```typescript
function recommend(
  target: EnrichedExercise,
  availableEquipment: readonly DetailedEquipment[],
  allExercises: readonly EnrichedExercise[],
  topN?: number, // default 5
): Recommendation[]
```

**Pre-conditions**:
- `target ∈ allExercises` (호출자 책임)
- `availableEquipment` 길이 0 가능 — 이 경우 빈 배열 반환

**Post-conditions (Plan SC, PRD §5.2/§5.3 준수)**:
- 결과 배열 길이 ≤ topN
- 모든 r에 대해: `r.exercise.id !== target.id` (자기 자신 제외)
- 모든 r에 대해: `r.exercise.detailedEquipment ∩ availableEquipment ≠ ∅`
- 모든 r에 대해: `r.exercise.primaryMuscles ∩ target.primaryMuscles ≠ ∅` (PRD §5.3 hard)
- (1차 시도) 모든 r에 대해: `|levelRank(r.exercise.level) - levelRank(target.level)| ≤ 1` (사용자 지시)
  - 단 1차에서 0건이면 이 제약 완화
- 정렬: score 내림차순, tie-break: level 같음 우선 → mechanic 같음 우선 → nameKo 가나다

**Pure**: 사이드 이펙트 0, 동일 입력 → 동일 출력.

### 4.2 Internal Function Contract — `usePreset()`

```typescript
interface UsePresetReturn {
  preset: GymPreset;                                   // 현재 활성 프리셋 (시드 fallback)
  toggleEquipment: (eq: DetailedEquipment) => void;    // 토글 1개
  setEquipment: (eqs: DetailedEquipment[]) => void;    // 전체 교체
  reset: () => void;                                   // 시드로 복원
  hydrated: boolean;                                   // mount 후 true
}
```

**SSR-safe**:
- 첫 렌더(SSR + 첫 client render) → `preset = SEED[0]`, `hydrated = false`
- mount 후 useEffect → LS 읽고 state 업데이트, `hydrated = true`
- LS 사용자 편집이 SEED와 동일하면 mismatch 없음
- LS에 사용자 편집이 다르면 mount 후 한 번 깜빡임 (정상)

---

## 5. UI/UX Design

### 5.1 Screen Layouts

#### Screen: 운동 상세 (`/exercises/[id]/`) — M3 위에 추가

```
┌────────────────────────────────────┐
│  ← 뒤로                             │
│  스미스머신 벤치 프레스 (h1)         │
│  ... (M3 본문 그대로)               │
│  메타 정보                          │
│  ─────────────────                 │
│  [🔄 다른 기구로 대체]   ◀ 신규     │
└────────────────────────────────────┘
```

#### Screen: 추천 모달 (운동 상세 위에 over-lay)

```
┌────────────────────────────────────┐
│  ✕  대체 운동                        │
│  스미스머신 벤치 프레스 대체         │
├────────────────────────────────────┤
│  가용 기구 (탭으로 토글)            │
│  [✓바벨] [✓덤벨] [ 케이블] ...       │
│  → 즉시 추천 갱신                    │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │ 바벨 벤치 프레스             │  │
│  │ 바벨 · 초급                  │  │
│  │ [주근육 100%] [보조근육 67%]  │  │
│  └──────────────────────────────┘  │
│  ... (5개)                          │
│                                    │
│  (가용 기구 0개 / 추천 0건 시 메시지)│
└────────────────────────────────────┘
```

#### Screen: 설정 (`/settings/`)

```
┌────────────────────────────────────┐
│  ← 뒤로                             │
│  ⚙️ 헬스장 설정                     │
│  현재 프리셋: 기본 풀 헬스장         │
├────────────────────────────────────┤
│  자유 중량                          │
│  [✓] 바벨    [✓] 덤벨               │
│  [✓] 이지컬바  [✓] 케틀벨            │
│                                    │
│  케이블·스미스                      │
│  [✓] 케이블  [✓] 스미스머신         │
│                                    │
│  머신류                             │
│  [✓] 레그프레스  [✓] 랫풀다운       │
│  [✓] 체스트프레스 [✓] 레그익스텐션 ...│
│                                    │
│  보조 도구                          │
│  [✓] 밴드    [✓] 짐볼               │
│  [✓] 메디신볼 [✓] 폼롤러             │
│                                    │
│  맨몸                               │
│  [✓] 맨몸                           │
│                                    │
│  ─────────────────                 │
│  활성 기구: N / 20                   │
│  [기본값으로 리셋]                   │
└────────────────────────────────────┘
```

#### Screen: Home (`/`) — M3 위에 추가

M3 그리드 + Placeholder 영역 옆에 "⚙️ 헬스장 설정" 링크 1줄 추가 (PlaceholderRow와 동일 스타일이지만 활성).

### 5.2 User Flow

```
/
 ├─ 부위 카드 → /muscles/* → /exercises/[id]
 │                              └─ 🔄 대체 → 모달 (즉석 토글)
 │                                             └─ 추천 카드 → /exercises/{id}
 └─ ⚙️ 헬스장 설정 → /settings  (전역 토글)
```

### 5.3 Component List

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `AlternativesButton` | Client | `src/components/alternatives-button.tsx` | 운동 상세 하단 trigger 버튼 + 모달 mount/unmount 상태 |
| `AlternativesModal` | Client | `src/components/alternatives-modal.tsx` | native `<dialog>` 컨테이너 + 가용 기구 즉석 토글 + recommend 호출 |
| `AlternativesList` | Client* | `src/components/alternatives-list.tsx` | Recommendation[] 받아 카드 렌더링 (Modal 안에서만 사용 → "use client" 불필요하지만 호출자가 Client라 자동 boundary) |
| `EquipmentToggleGrid` | Client | (인라인 또는 `src/components/equipment-toggle-grid.tsx`) | DetailedEquipment 토글 그리드. settings + modal에서 재사용 |
| `SettingsPage` | Client | `src/app/settings/page.tsx` | 프리셋 편집. 위 EquipmentToggleGrid 사용 |
| `RootLayout`, `HomePage`, `MusclePage`, `ExercisePage`, `BackLink` | (M2-M3 그대로) | - | - |

\* `AlternativesList`는 RSC-safe(순수 props 받아 렌더). 호출이 Client component 안에서 일어나므로 자동으로 Client side에 포함됨. `"use client"` 마크 생략 가능.

### 5.4 Page UI Checklist

#### Modal (`AlternativesModal`)

- [ ] `<dialog>` 사용, `dialog.showModal()` / `dialog.close()`
- [ ] 헤더: ✕ 닫기 버튼 (44×44px) + "{nameKo} 대체" 제목
- [ ] 가용 기구 토글 그리드 (chip 형태, 활성/비활성 시각 구분)
- [ ] 추천 카드 리스트 (5개 max)
- [ ] 카드: nameKo, 기구·level, 매칭 % 배지 2개 (primary, secondary)
- [ ] 빈 상태 메시지: "가용 기구를 선택해 주세요" / "조건에 맞는 운동이 없습니다"
- [ ] backdrop 클릭 시 닫힘 (CSS `::backdrop` + JS click 핸들러)
- [ ] ESC 닫힘 (native `<dialog>` 기본)
- [ ] 모바일 max-w-md, 세로 스크롤 가능

#### Settings (`/settings/`)

- [ ] BackLink 상단
- [ ] 제목 "⚙️ 헬스장 설정" + 현재 프리셋명
- [ ] DetailedEquipment 20개 카테고리 그룹별 (자유 중량 / 케이블·스미스 / 머신 / 보조 / 맨몸)
- [ ] 체크박스 + 라벨 (한국어), 활성 기구 N개 카운터
- [ ] 리셋 버튼 (시드로 복원)
- [ ] hydrated=false 동안에는 시드 default 표시 (mismatch 0)

#### Exercise Detail (`/exercises/[id]/`) 변경

- [ ] M3 본문 모두 유지
- [ ] 메타 정보 아래에 `<AlternativesButton>` Client island 1개 추가

#### Home (`/`) 변경

- [ ] M3 그리드 유지
- [ ] Placeholder 영역 옆 또는 아래에 "⚙️ 헬스장 설정" Link (활성)

---

## 6. Error Handling

| Scenario | Handling |
|----------|----------|
| 가용 기구 0개 | 모달: "가용 기구를 선택해 주세요" + ⚙️ 설정 링크 |
| 1차 후보 0건 (level 차이 ≤1 + primary 교집합 + equipment) | level 제약 완화 후 재시도 |
| 2차도 0건 | "조건에 맞는 운동이 없습니다" + 가용 기구 확장 권유 |
| LocalStorage parse 실패 | try/catch → fallback (시드) |
| LocalStorage write 실패 (quota / private mode) | catch + 무시. UI는 정상 표시 (state는 메모리에 유지, 새로고침 시 시드로 복귀) |
| `<dialog>` 미지원 브라우저 (드물게 구버전) | iOS Safari 16+ 보장 — fallback 없음. 추후 polyfill 검토 |

---

## 7. Security Considerations

| Item | Status | Note |
|------|:------:|------|
| LocalStorage XSS | ✅ | JSON.parse + version check + try/catch. 문자열 외 직접 eval 0 |
| 외부 입력 | N/A | 사용자 입력은 토글 boolean만. URL slug는 M3에서 검증 |
| HTTPS | ✅ | M2 |

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L0: Build Verification | typecheck + build | tsc + next | Check (마지막 1회) |
| L1: Module Unit (manual) | recommend.ts 함수 호출 결과 검사 | console.log + dev server | Do |
| L2: Manual UI | 시나리오 4종 (모달 / 토글 / 설정 / hydration) | Browser | Check |

### 8.2 L1: recommend.ts 검증 시나리오 (수동)

| # | Target | Available | Expected |
|---|--------|-----------|----------|
| 1 | Smith Machine Bench Press | [smith-machine, barbell, dumbbell] | 가슴 운동 5개, 상위는 같은 chest primary |
| 2 | Smith Machine Bench Press | [body only] | 1차 0건 → level 완화 → push-up 등 chest body-only 운동 |
| 3 | Smith Machine Bench Press | [] | 빈 배열 |
| 4 | Smith Machine Bench Press | [smith-machine] | 자기 자신 제외, 다른 smith-machine 가슴 운동 |

### 8.3 L2: Manual UI

| # | Scenario | Expected |
|---|----------|----------|
| 1 | 운동 상세 → 🔄 클릭 | 모달 열림, 추천 5개 표시 |
| 2 | 모달 안에서 가용 기구 토글 | 추천 즉시 갱신 |
| 3 | 모달 닫고 /settings 진입 | 토글 변경 사항 반영됨 (LS 동기) |
| 4 | /settings에서 토글 변경 → /exercises/{id} 이동 → 🔄 | 변경 반영된 추천 |
| 5 | LocalStorage 비우고 첫 진입 | 시드 default-full 자동 적용, hydration warning 0 |
| 6 | 가용 기구 0개로 모두 끄고 🔄 | 빈 상태 메시지 + 설정 링크 |
| 7 | 추천 카드 클릭 | 해당 운동 상세로 이동 |

---

## 9. Clean Architecture

### 9.1 Layer Mapping

| Layer | M4 Files |
|-------|----------|
| Presentation | `src/app/settings/`, `src/components/alternatives-*` |
| Application | (recommend가 application 비슷하지만 pure module) |
| Domain | `src/lib/types.ts` (M1-M2), `src/lib/i18n.ts` (M1-M2) |
| Infrastructure | `src/lib/recommend.ts`, `src/lib/preset-store.ts`, `data/gym-presets.json` |

### 9.2 Import Rules

| From | Can Import | Cannot Import |
|------|-----------|---------------|
| `app/**` | `components/**`, `lib/**` | `scripts/**` |
| `components/**` | `lib/**`, `next/*`, `react` | `app/**` |
| `lib/recommend.ts` | `lib/types` | `lib/preset-store` (역의존 금지 — recommend는 pure) |
| `lib/preset-store.ts` | `lib/types`, `data/gym-presets.json`, `react` | `lib/recommend` (사용은 호출자 컴포넌트에서) |

---

## 10. Coding Convention Reference

### 10.1 Naming

(M1-M3 컨벤션 그대로)

| Target | Rule | M4 Example |
|--------|------|------------|
| 컴포넌트 파일 | kebab-case.tsx | `alternatives-button.tsx` |
| Hook | `use*` | `usePreset` |
| Pure function | camelCase | `recommend`, `jaccard` |
| 상수 | UPPER_SNAKE_CASE | `STORAGE_KEY`, `DEFAULT_PRESET`, `LEVEL_RANK` |

### 10.2 Client/Server 마킹

- `"use client"` 최상단
- Hook export 파일은 모두 Client (`"use client"` 마크 필수)
- 모달·버튼·설정 페이지 모두 Client

### 10.3 LocalStorage 컨벤션

- 키 prefix: `gym-alt-app:`
- 버전 마커: `version: 1` (마이그레이션 대비)
- 모든 read/write `try/catch` 가드

---

## 11. Implementation Guide

### 11.1 File Structure (M4 추가)

```
src/
├── app/
│   ├── page.tsx                       🔄 (Home 보조 영역)
│   ├── exercises/[id]/page.tsx        🔄 (Client island 1개 추가)
│   └── settings/
│       └── page.tsx                   🆕
├── components/
│   ├── alternatives-button.tsx        🆕 ("use client")
│   ├── alternatives-modal.tsx         🆕 ("use client")
│   ├── alternatives-list.tsx          🆕 (자동 client boundary)
│   └── equipment-toggle-grid.tsx      🆕 ("use client")
└── lib/
    ├── recommend.ts                   🆕 (pure)
    └── preset-store.ts                🆕 ("use client")
```

**총 신규 7개 + 수정 2개 = 9개 변경**.

### 11.2 Implementation Order

**Phase A — lib (의존 없음)**
1. [ ] `src/lib/recommend.ts` — Plan §9.3 기반
2. [ ] `src/lib/preset-store.ts` — Plan §9.4 기반

**Phase B — components**
3. [ ] `src/components/equipment-toggle-grid.tsx` — settings + modal 공통 사용
4. [ ] `src/components/alternatives-list.tsx` — 카드 렌더 (pure)
5. [ ] `src/components/alternatives-modal.tsx` — `<dialog>` + recommend + EquipmentToggleGrid + AlternativesList
6. [ ] `src/components/alternatives-button.tsx` — trigger + modal mount

**Phase C — app**
7. [ ] `src/app/settings/page.tsx` — Client. usePreset + EquipmentToggleGrid + reset
8. [ ] `src/app/exercises/[id]/page.tsx` 수정 — `<AlternativesButton>` Client island 추가, getAllExercises를 prop으로 전달
9. [ ] `src/app/page.tsx` 수정 — "⚙️ 헬스장 설정" Link 추가

**Phase D — 검증 (Check)**
10. [ ] 콘솔에서 recommend() 수동 호출 검증 (dev server 가동 중)
11. [ ] L2 시나리오 7종 수동 진행
12. [ ] 마지막에만 `npm run typecheck` + `npm run build` (사용자 운영 노트 — dev 중 build 자제)

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| Lib | `module-1` | recommend.ts + preset-store.ts | 5 |
| Components | `module-2` | 4개 컴포넌트 | 10-15 |
| Pages | `module-3` | settings + 2개 수정 | 5-10 |

#### Recommended Session Plan

옵션 A — 단일 세션. CTO 직접.

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| (current) | Plan + Design | 전체 | 작성 완료 |
| (current) | Do | A → B → C 순, Write 병렬 | 25-35 |
| (current) | Check | 정적 자체 검토 + 사용자 검증 가이드 | 5 |
| (current) | Report | 사용자 요약 | 2 |

### 11.4 핵심 설계 — `<dialog>` 모달 + LocalStorage 동기화

```typescript
// alternatives-modal.tsx (요지)
"use client";
import { useEffect, useMemo, useRef } from "react";
import { recommend } from "@/lib/recommend";
import { usePreset } from "@/lib/preset-store";
import { EquipmentToggleGrid } from "./equipment-toggle-grid";
import { AlternativesList } from "./alternatives-list";
import type { EnrichedExercise } from "@/lib/types";

export function AlternativesModal({
  open,
  onClose,
  target,
  allExercises,
}: {
  open: boolean;
  onClose: () => void;
  target: EnrichedExercise;
  allExercises: readonly EnrichedExercise[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { preset, toggleEquipment } = usePreset();

  // open 상태 동기화 with native dialog
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // 추천 결과 (preset 변경에 반응)
  const recs = useMemo(
    () => recommend(target, preset.availableEquipment, allExercises, 5),
    [target, preset.availableEquipment, allExercises],
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // backdrop click 닫기
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto w-full max-w-md rounded-2xl bg-white p-0 backdrop:bg-black/40 dark:bg-neutral-950"
    >
      {/* header / toggles / list */}
    </dialog>
  );
}
```

### 11.5 정적 export 호환성 검증 포인트

- `/settings/page.tsx`는 Client component이지만 `"use client"` 마크된 페이지도 정적 export 가능 (Next.js 15)
- `generateStaticParams` 불필요 (dynamic route 아님)
- M3에서 `output: 'export'` + `dynamicParams = false` 패턴 검증 완료 — M4는 그 위에 1개 라우트 추가만

---

## 12. Open Questions for Do Phase

| ID | Question | 즉시 결정 |
|----|----------|----------|
| D-1 | EquipmentToggleGrid에서 Equipment 그룹핑 방식 | PRD §4.5.1 시드의 자연스러운 4-5 그룹 사용 (자유 중량 / 케이블·스미스 / 머신류 / 보조 도구 / 맨몸) |
| D-2 | recommend()를 모달에서 호출 시 allExercises를 어떻게 전달? | 운동 상세 RSC 페이지에서 `getAllExercises()` 호출 → JSON serializable이라 props로 Client island에 전달 가능. 단 873개 직렬화 비용 — 대안: AlternativesButton 내부에서 dynamic import? **결정**: 873 × ~ 600B = 약 500KB serialized — 운동 상세 SSR 페이로드에 포함되면 부담. **대안 채택**: `recommend.ts`가 `lib/data.ts`의 `getAllExercises()`를 직접 import → Client component에서도 정적 JSON import 가능 (Next 15 OK) |
| D-3 | iOS Safari `<dialog>` aria 호환성 | 16+ 보장. `aria-labelledby`, `aria-modal` 자동 |
| D-4 | hydrated=false 동안 모달 안의 추천 결과 표시? | 시드 default-full 사용해 그대로 계산. mount 후 LS와 시드가 같으면 동일 결과 → mismatch 0 |
| D-5 | 모달 close 후 토글 상태 보존? | LS에 즉시 반영되므로 자동 보존 (state 따로 관리 안 함) |

---

## 13. Plan에서 Design으로의 변경 사항

| Plan | Design 변경 | 사유 |
|------|------------|------|
| EquipmentToggleGrid 컴포넌트 명시 X | **새로 추가** (settings + modal 재사용) | DRY — 두 곳에서 동일 토글 그리드 필요 |
| `recommend()`에 allExercises 전달 방식 | **`recommend.ts`가 `lib/data.ts` 직접 import** | Client island에 props로 873개 serialize 부담 회피 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-30 | M4 초안 — Option C 채택, native `<dialog>` + EquipmentToggleGrid 공유 | jiinbae |
