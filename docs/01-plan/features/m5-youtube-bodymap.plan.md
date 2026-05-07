# M5 YouTube + Body Diagram Planning Document

> **Summary**: F-6 YouTube 시연 검색 딥링크 + 근육 다이어그램(`react-body-highlighter`) 도입. PRD §6.4 운동 상세 핵심 화면을 시각적으로 완성. TV-3 17 muscle 매핑 검증 포함.
>
> **Project**: gym-alt-app
> **Version**: 0.1.0
> **Author**: jiinbae (CTO)
> **Date**: 2026-04-30
> **Status**: Draft (옵션 A — KISS, M4 검증 통과 후)
> **Planning Doc**: [m4-recommend-filter.plan.md](./m4-recommend-filter.plan.md)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | M4까지 운동 상세는 텍스트·이미지·메타·추천만 있어 자극 근육의 **시각적 위치**를 직관적으로 파악할 수 없다. PRD §6.4가 요구하는 "자극 근육 다이어그램(인체 정면/후면, primary 빨강·secondary 주황)"이 미구현. 또한 PRD F-6 YouTube 시연 검색 진입점 없음. |
| **Solution** | `react-body-highlighter` 도입 + 17 dataset muscle → 19 library muscle 매핑 표 + primary/secondary 색상 강조. 운동 상세에 ▶ YouTube 검색 링크 버튼 추가 (`youtubeSearchUrl` 필드 그대로 사용). |
| **Function/UX Effect** | 운동 상세 첫 fold에 다이어그램 시각화로 사용자가 자극 부위를 즉시 파악. YouTube 1탭으로 시연·호흡 영상 도달 (PRD §6.4 5번). |
| **Core Value** | PRD §6.4 화면 명세 완성 + PRD G2(시각적 확인) 첫 충족. 외부 의존성 1개 추가하되 KISS·정적 export 유지. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | PRD §6.4 운동 상세는 "헬스장에서 보는 핵심 화면" — 시각적 근육 위치 파악과 시연 영상 진입은 가장 자주 쓰일 인터랙션. |
| **WHO** | 단일 사용자(jiinbae). 모바일, 한 손, iOS Safari 16+/Android Chrome. |
| **RISK** | (1) `react-body-highlighter` 번들 크기·정적 export 호환성 미검증 (2) TV-3 17 muscle ↔ 19 library muscle 매핑 정확도 (lats, shoulders가 1:N) (3) Client Component 추가로 운동 상세 First Load JS 회귀 |
| **SUCCESS** | F-6 YouTube 노출 + 다이어그램 17 muscle 모두 매핑 (또는 명시적 폴백) + typecheck 0 + build 884+1=886 페이지 회귀 0 + First Load JS 회귀 ≤ +50 kB + TV-3 샘플 검증 통과 |
| **SCOPE** | M5 = F-5 강화(다이어그램) + F-6 YouTube 딥링크. 추천 카드 미니어처는 가산(시간 남으면). M6는 모바일 UX 다듬기. |

---

## 1. Overview

### 1.1 Purpose

PRD §10 마일스톤 M5 (1일 예상). PRD §6.4 운동 상세 화면의 다음 요소 구현:
- §6.4.2 자극 근육 다이어그램 — 인체 정면/후면 강조
- §6.4.5 ▶ YouTube 시연 검색 버튼

PRD TV-3 (`react-body-highlighter` 한국어 라벨 표시 가능 여부, 17개 muscle 매핑 정확도) 검증 동시 수행.

### 1.2 Background

**현재 상태 (M4 완료)**:
- 라우트 885 페이지, First Load JS 103-108 kB
- 운동 상세에 헤더·근육 배지(텍스트)·이미지·instructions·메타·🔄 추천 모달 모두 노출
- `EnrichedExercise.youtubeSearchUrl` 필드 이미 자동 생성됨 (M1 산출)
- M4 알고리즘이 muscle 매칭을 사용하므로 dataset 17 muscle은 이미 정확히 정립됨

**왜 지금**: 다이어그램은 PRD §6.4 정보 위계의 2번째 fold(헤더 다음). 텍스트 배지만으로는 "어디 근육인가"를 빠르게 파악하기 어려움. M6 UX 다듬기에 들어가기 전에 시각 자산을 확보해야 다듬기 대상이 분명해짐.

### 1.3 Related Documents

- PRD: [docs/PRD.md](../../PRD.md) §6.4, §9.1 Q-5, §9.3 TV-3
- M4 산출물: `src/components/exercise-detail.tsx` (다이어그램 삽입 대상)
- 라이브러리: `react-body-highlighter` (giavinh79/react-body-highlighter, MIT)

---

## 2. Scope

### 2.1 In Scope

**라이브러리 도입**
- [ ] `npm install react-body-highlighter` (단일 의존성 추가)
- [ ] package.json `dependencies` 등록 + lockfile 커밋
- [ ] 라이선스(MIT) 및 deps 검토 (간접 의존성 확인)

**Muscle 매핑 (TV-3)**
- [ ] `src/lib/muscle-map.ts` — 17 dataset muscle → 19 library muscle 매핑 표
- [ ] 1:N 매핑 처리: shoulders → front-deltoids + back-deltoids
- [ ] 매핑 어긋나는 키 명시적 폴백 (현재 분석상 모두 매핑 가능)

**다이어그램 컴포넌트**
- [ ] `src/components/body-diagram.tsx` — primary/secondary 색상 강조
- [ ] Client Component (라이브러리가 React component이고 SVG 렌더 — RSC에서도 가능하나 안정성 위해 Client)
- [ ] 정면(anterior) + 후면(posterior) 2장 표시 (라이브러리 `data` prop + `type` prop)
- [ ] Tailwind dark mode 호환 — SVG fill을 hex 토큰으로 (Tailwind 클래스로 SVG 색상 제어 어려움)
- [ ] 폴백: 매핑 안 된 muscle은 다이어그램 하단 "추가 자극: {한국어명}" 텍스트로 표시

**YouTube 링크 버튼**
- [ ] `src/components/youtube-link-button.tsx` — `<a>` 외부 링크
- [ ] `target="_blank"`, `rel="noopener noreferrer"`
- [ ] PRD §6.4 위계에 맞춰 instructions 다음 + 메타 위에 배치

**상세 페이지 통합**
- [ ] `src/components/exercise-detail.tsx` 수정 — 다이어그램 + YouTube 버튼 추가
- [ ] 다이어그램은 헤더 직후 (자극 근육 배지 위 또는 대체) 또는 배지 옆
- [ ] YouTube 버튼은 instructions 다음, 메타 정보 전

**번들 크기 보호**
- [ ] 다이어그램 컴포넌트는 `next/dynamic({ ssr: false })`로 lazy load — RSC 페이지의 First Load JS에 영향 최소화 (M4 모달과 동일 패턴)

**한국어 i18n**
- [ ] M1-M2 MUSCLE_KO 매핑 그대로 사용 (확장 X)
- [ ] 폴백 텍스트만 한국어로 출력

### 2.2 Out of Scope

- ❌ react-body-highlighter `onClick` 인터랙션 (M5 단순 표시만)
- ❌ 추천 카드 미니어처 다이어그램 (가산 — 시간 남으면 별도 PR로)
- ❌ Hover 상세 정보 표시 (모바일 우선이라 호버 가치 적음)
- ❌ 영문 instructions 토글 (M3에서 미구현, 본 단계에서도 X — Low priority)
- ❌ 즐겨찾기, 검색, PWA (M7 옵션)
- ❌ 다른 다이어그램 라이브러리 비교 검토 (KISS — react-body-highlighter 1차 채택, 부족 시 M6에서 SVG 직접 작성으로 fallback — PRD §9.1 Q-5에 따른 결정)

### 2.3 Open Items (Plan에서 사용자 확정 필요)

| ID | 질문 | 권장 | 결정 |
|----|------|------|:----:|
| O-1 | 다이어그램 위치 (헤더 직후 vs 자극 근육 배지 자리) | **자극 근육 배지를 다이어그램이 대체** + 폴백 텍스트로 매핑 안 된 muscle 명기. 텍스트 배지를 완전히 없애지 말고 다이어그램 + 배지 둘 다 (시각 + 한국어 명시) | 권장 채택 |
| O-2 | 정면/후면 동시 vs 토글 | **동시 표시** (가로 grid-cols-2) — 모바일 fold 안에 다 들어감. 토글은 부담 추가 | 권장 채택 |
| O-3 | 색상 — primary/secondary 구분 | primary `#dc2626` (red-600), secondary `#f59e0b` (amber-500). 다크모드는 SVG 강조 색만이라 단일 색상 유지 (충분히 대비) | 권장 채택 |
| O-4 | YouTube 버튼 텍스트 | "▶ YouTube 시연 검색" (PRD §6.4 그대로) | 권장 채택 |
| O-5 | 다이어그램 미지원 muscle (forearm 등 매핑 가능하지만 라이브러리 위치가 다를 수 있음)에 대한 검증 방식 | TV-3 샘플 검증 — 17 muscle 각각 대표 운동 1개 골라 dev 서버에서 시각 확인 (Check 단계 수행) | 권장 채택 |
| O-6 | 라이브러리가 SSR 호환되지 않을 경우 | `next/dynamic({ ssr: false })` 사용 → SSR HTML에는 다이어그램 자리 placeholder, 클라이언트 hydration 후 렌더 | 권장 채택 |
| O-7 | 추천 카드 미니어처 다이어그램 (alternatives-list.tsx) | **M5에서 미구현** — DoD 외 가산. 다이어그램 N개를 모달 안에 띄우면 번들·렌더 비용 큼. M6 또는 M7에서 검토 | 권장 채택 |

> **본 Plan은 위 7개 권장안 채택 전제**.

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `react-body-highlighter` 의존성 추가 + lockfile 커밋 | High | Pending |
| FR-02 | `src/lib/muscle-map.ts` — 17 dataset muscle → library muscle 배열 매핑 | High | Pending |
| FR-03 | shoulders → [front-deltoids, back-deltoids] 1:N 매핑 처리 | High | Pending |
| FR-04 | `src/components/body-diagram.tsx` — primary/secondary 색상 강조, 정면/후면 2장 | High | Pending |
| FR-05 | 라이브러리 SSR 호환성 — Client Component + (필요 시) `next/dynamic({ssr:false})` | High | Pending |
| FR-06 | 매핑 안 된 muscle은 다이어그램 하단에 "추가 자극: {한국어}" 폴백 텍스트 | Medium | Pending |
| FR-07 | `src/components/youtube-link-button.tsx` — 외부 링크, target=_blank, rel=noopener | High | Pending |
| FR-08 | `exercise-detail.tsx` 수정 — 다이어그램(배지 위 또는 옆) + YouTube 버튼 (instructions 다음) | High | Pending |
| FR-09 | 다이어그램은 lazy load (`next/dynamic`) — First Load JS 회귀 ≤ +50 kB | High | Pending |
| FR-10 | TV-3: 17 muscle 각 대표 운동 1개에서 다이어그램 highlight 시각 확인 | High | Pending |
| FR-11 | 다크모드에서도 다이어그램 색상 식별 가능 | Medium | Pending |
| FR-12 | 다이어그램 SVG에 `<title>` 접근성 라벨 (한국어 muscle 이름 나열) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Build success | exit 0, 885 → 886 페이지 (1개 추가 X — 라우트 추가 X, 그러나 모든 운동 상세 page 빌드 산출 늘어날 수 있음 — 실제로는 동일 873 + 7 + 1 + 5 = 886) | `npm run build` |
| Bundle size | First Load JS 회귀 ≤ +50 kB (라이브러리 SVG 부피) | Next.js summary |
| Type safety | 0 errors | `tsc --noEmit` |
| 라이브러리 호환 | iOS Safari 16+, Android Chrome 최신 | 시각 확인 |
| 다이어그램 렌더 | < 100ms (마운트 후) | DevTools Performance |
| TV-3 매핑 정확 | 17/17 muscle 시각 확인 통과 | 수동 검증 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `react-body-highlighter` 설치, package.json + lockfile 커밋 가능 상태
- [ ] 운동 상세에 다이어그램(정면+후면) + ▶ YouTube 버튼 노출 (한국어)
- [ ] 17 muscle 각 대표 운동에서 다이어그램이 해당 부위 highlight (TV-3 통과)
- [ ] YouTube 버튼 클릭 시 새 탭에서 영문명 + " form" 검색 결과 페이지 열림
- [ ] `npm run typecheck` 0 errors
- [ ] `npm run build` 성공, 정적 페이지 회귀 0
- [ ] First Load JS 회귀 ≤ +50 kB
- [ ] dev 서버 hydration mismatch warning 0
- [ ] 매핑 안 된 muscle 폴백 텍스트 동작 (해당 케이스 발생 시)

### 4.2 Quality Criteria

- [ ] 다이어그램이 모바일 (375px)에서 정면+후면 가로 표시 (작아도 식별 가능)
- [ ] primary 빨강·secondary 주황 시각 구분
- [ ] 다크모드에서 다이어그램 SVG 가독성
- [ ] M4까지 산출물 회귀 없음 (운동 상세 본문 + 추천 모달 + 설정 페이지 모두 정상)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| `react-body-highlighter` SSR 미호환 (window 접근 등) | Medium | Medium | `next/dynamic({ ssr: false })`로 lazy load. M4 모달 dynamic import 패턴 재사용. SSR HTML에 다이어그램 자리 placeholder만 출력 |
| 라이브러리 번들 크기 50 kB 초과 | Medium | Medium | dynamic import로 운동 상세 First Load에서 분리. 별도 chunk로 가니 First Load JS는 영향 최소 |
| TV-3 일부 muscle 매핑 어긋남 (lats, middle back 등 근사 매핑) | Medium | Medium | 폴백 텍스트로 보완. 이상하면 PRD §9.1 Q-5에 따라 SVG 직접 작성으로 마이그레이션 — M6 결정 |
| 1:N 매핑 (shoulders) 시각적 표현 복잡 | Low | Low | 라이브러리는 muscle 배열 받아 모두 동일 색상 highlight — 자연스러움 |
| 라이브러리 deprecated / 유지보수 중단 | Low | Low | M5에서 도입, 문제 시 M6에서 대체. 첫 PoC 단계 |
| dark mode SVG fill 하드코딩 — 토큰 못 씀 | Low | Medium | hex 직접 지정. dark mode에서도 충분히 식별 가능한 색상 (red-500, amber-500 — 채도 높음) |
| dev 서버 + dynamic import + Tailwind JIT 충돌 | Low | Low | M4에서 동일 패턴 검증됨 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `package.json` | Existing | `react-body-highlighter` 의존성 추가 |
| `src/lib/muscle-map.ts` | New | 매핑 표 |
| `src/components/body-diagram.tsx` | New | 다이어그램 컴포넌트 |
| `src/components/youtube-link-button.tsx` | New | YouTube 버튼 |
| `src/components/exercise-detail.tsx` | Existing (M3) | 다이어그램 + YouTube 버튼 통합 |

**총 신규 3개 + 수정 2개 = 5개 변경** (package.json 포함).

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `exercise-detail.tsx` | RENDER | M3에서 정의, M4에서 변경 없이 사용 | Section 추가만, 기존 컨텐츠 유지 |
| `lib/types.ts` | TYPE | `EnrichedExercise.youtubeSearchUrl` 필드 (M1 산출) | 그대로 사용 |
| `lib/i18n.ts` | READ | `MUSCLE_KO` (M1 산출) | 그대로 사용 |

### 6.3 Verification

- [ ] M4 운동 상세의 헤더·이미지·instructions·메타·🔄 모두 그대로 동작
- [ ] 추천 모달 영향 0
- [ ] 설정 페이지 영향 0

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Selected |
|-------|:--------:|
| Starter | ✅ (M1-M4 동일) |

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 다이어그램 라이브러리 | react-body-highlighter / 자체 SVG / 다른 라이브러리 | **react-body-highlighter** | PRD §9.1 Q-5 결정: 1차 시도. MIT, 기능 충분 |
| 컴포넌트 타입 | RSC / Client | **Client** (`"use client"`) | 라이브러리 SSR 호환 미보장. dynamic import + ssr:false로 안전 |
| Lazy load | static / dynamic | **dynamic ssr:false** | First Load JS 회귀 방지. M4 모달과 동일 패턴 |
| muscle 매핑 위치 | 컴포넌트 내 / 별도 lib | **별도 `lib/muscle-map.ts`** | SRP. 매핑은 도메인 지식이라 lib 레이어 |
| 색상 정의 | Tailwind class / hex | **hex** | SVG fill에 Tailwind class 적용 어려움. 직접 hex |

### 7.3 Folder Structure (M5 추가)

```
src/
├── lib/
│   └── muscle-map.ts                  🆕
├── components/
│   ├── body-diagram.tsx               🆕 ("use client")
│   ├── youtube-link-button.tsx        🆕 (RSC OK)
│   └── exercise-detail.tsx            🔄 (다이어그램 + YouTube 버튼 통합)
└── (그 외 변경 없음)
```

---

## 8. Convention Prerequisites

### 8.1 Existing Conventions (M1-M4)

(그대로 유지)

### 8.2 신규 Conventions

| Category | Define |
|----------|--------|
| 외부 SVG 색상 | hex 직접 지정 (Tailwind 토큰을 string으로 변환 어려움) — 단, 컴포넌트 내 const로 추출하여 일관성 보장 |
| Lazy Client Component | `next/dynamic({ ssr: false })` 패턴 — M4와 동일 |
| 외부 링크 보안 | `target="_blank"` + `rel="noopener noreferrer"` 항상 |

### 8.3 Environment Variables

M5 단계 환경변수 0개.

---

## 9. Implementation Strategy

### 9.1 단계 구성 (옵션 A — KISS)

| 단계 | 산출물 | 담당 |
|------|--------|------|
| **Plan** | 본 문서 | CTO 직접 ✅ |
| **Design** | `m5-youtube-bodymap.design.md` | CTO 직접 |
| **Do** | npm install + lib + components 2 + 수정 1 | CTO 직접 |
| **Check** | TV-3 시각 검증 (사용자) + gap-detector + code-analyzer | 본 세션 |
| **Report** | 사용자 요약 + M6 진입 | 본 세션 |

### 9.2 핵심 매핑 골격 (Design에서 정제)

```typescript
// src/lib/muscle-map.ts (요지)
import type { MuscleGroup } from "./types";

/** react-body-highlighter가 인식하는 muscle 키. */
export type LibraryMuscle =
  | "trapezius" | "upper-back" | "lower-back" | "chest"
  | "biceps" | "triceps" | "forearm"
  | "back-deltoids" | "front-deltoids"
  | "abs" | "obliques" | "adductor"
  | "hamstring" | "quadriceps" | "abductors"
  | "calves" | "gluteal" | "head" | "neck";

/** Dataset 17 muscle → library muscle (배열 — 1:N 매핑 가능). */
export const MUSCLE_TO_LIBRARY: Record<MuscleGroup, LibraryMuscle[]> = {
  abdominals: ["abs"],
  abductors: ["abductors"],
  adductors: ["adductor"],
  biceps: ["biceps"],
  calves: ["calves"],
  chest: ["chest"],
  forearms: ["forearm"],
  glutes: ["gluteal"],
  hamstrings: ["hamstring"],
  lats: ["upper-back"],          // 근사 — lats는 upper-back과 일부 겹침
  "lower back": ["lower-back"],
  "middle back": ["upper-back"], // 근사
  neck: ["neck"],
  quadriceps: ["quadriceps"],
  shoulders: ["front-deltoids", "back-deltoids"], // 1:N
  traps: ["trapezius"],
  triceps: ["triceps"],
};

export function toLibraryMuscles(muscles: readonly MuscleGroup[]): LibraryMuscle[] {
  const out: LibraryMuscle[] = [];
  for (const m of muscles) {
    out.push(...MUSCLE_TO_LIBRARY[m]);
  }
  // 중복 제거
  return [...new Set(out)];
}
```

### 9.3 핵심 컴포넌트 골격 (Design에서 정제)

```typescript
// src/components/body-diagram.tsx (요지)
"use client";
import Model from "react-body-highlighter";
import type { MuscleGroup } from "@/lib/types";
import { toLibraryMuscles } from "@/lib/muscle-map";
import { MUSCLE_KO } from "@/lib/i18n";

interface Props {
  primary: readonly MuscleGroup[];
  secondary: readonly MuscleGroup[];
  exerciseName: string;
}

const COLOR_PRIMARY = "#dc2626";     // red-600
const COLOR_SECONDARY = "#f59e0b";   // amber-500
const COLOR_BASE = "#e5e7eb";        // neutral-200

export function BodyDiagram({ primary, secondary, exerciseName }: Props) {
  // react-body-highlighter는 frequency 기반 색상 그라데이션을 지원.
  // primary는 frequency 2, secondary는 frequency 1로 설정 → highlightedColors로 분기 색상.
  const data = [
    { name: exerciseName, muscles: toLibraryMuscles(primary), frequency: 2 },
    { name: exerciseName, muscles: toLibraryMuscles(secondary), frequency: 1 },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      <Model data={data} type="anterior" highlightedColors={[COLOR_SECONDARY, COLOR_PRIMARY]} bodyColor={COLOR_BASE} />
      <Model data={data} type="posterior" highlightedColors={[COLOR_SECONDARY, COLOR_PRIMARY]} bodyColor={COLOR_BASE} />
    </div>
  );
}
```

> **검증 필요**: react-body-highlighter `highlightedColors` prop 시그니처 — frequency 1 → colors[0], frequency 2 → colors[1] 순서일 것. Design 단계에서 Context7로 정확 시그니처 확인.

### 9.4 통합 위치 (exercise-detail.tsx)

```
운동명 헤더
├── BodyDiagram (정면+후면)        ◀ 신규 (배지 위)
├── MuscleBadgeList (M3 그대로)
├── 시연 이미지 (M3)
├── instructions (M3)
├── ▶ YouTube 시연 검색 버튼       ◀ 신규
└── 메타 정보 (M3)
```

### 9.5 사용자 추가 확인 메모

- 라이브러리 시그니처 정확 — Design 단계에서 Context7 한 번 더 조회
- 만약 라이브러리가 default export이면 `import Model from`. named export이면 `import { Model } from`. 패키지 README 확인 후 결정
- 17 muscle 매핑 중 lats/middle back 근사 매핑은 M5 PoC 수준. M6 UX 다듬기에서 정확도 부족 시 SVG 직접 작성 검토

---

## 10. Next Steps

1. [x] Plan 작성 (본 문서)
2. [ ] Design 작성 — Context7로 라이브러리 정확 API 재검증
3. [ ] npm install + Do
4. [ ] Check — TV-3 시각 검증 + gap/code analyzer
5. [ ] M6 진입 준비

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-30 | M5 초안 — react-body-highlighter 도입, 17→19 muscle 매핑, dynamic lazy load | jiinbae |
