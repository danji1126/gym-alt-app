# M3 Screens Planning Document

> **Summary**: 부위 선택 → 운동 목록 → 운동 상세 3-스크린 흐름을 정적 export 호환 라우팅으로 구현. PRD §6.2/6.3/6.4 기준 핵심 화면 + Doumont 정보 위계 적용.
>
> **Project**: gym-alt-app
> **Version**: 0.1.0
> **Author**: jiinbae (CTO)
> **Date**: 2026-04-30
> **Status**: Draft (옵션 A — KISS, M2 빌드 검증 완료 후 진행)
> **Planning Doc**: [m1-m2-foundation.plan.md](./m1-m2-foundation.plan.md)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | M2 골격은 placeholder Home만 있어 873개 운동 데이터를 사용자가 탐색·확인할 수단이 없다. 헬스장 현장에서 30초 안에 운동을 찾는 PRD §1.1 핵심 가치를 전혀 제공하지 못한다. |
| **Solution** | App Router 정적 export + `generateStaticParams`로 (1) 부위 선택 그리드 Home, (2) `/muscles/[muscle]` 부위별 목록, (3) `/exercises/[id]` 운동 상세 3개 화면 구현. 데이터는 빌드 타임 `import` 단일 패턴, 클라이언트 fetch 없음. |
| **Function/UX Effect** | 사용자가 홈 → 부위 카드 → 운동 목록 → 운동 상세까지 한국어로 완주 가능. 모든 페이지 정적 사전 렌더링되어 LCP 빠름. |
| **Core Value** | PRD §1.3 G1 (현장에서 30초 도달) 첫 도달 가능. 추천(F-2)과 가용 기구 필터(F-4)는 M4에서 추가, M3는 탐색 흐름의 뼈대. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | PRD §1.1 — 헬스장에서 점유·부재로 인한 대체 운동 30초 탐색. M3는 그 도달 흐름의 첫 동선. |
| **WHO** | 단일 사용자(jiinbae). iOS Safari 16+, Android Chrome. 한 손 조작, 모바일 우선. |
| **RISK** | (1) `generateStaticParams`로 873 exercise + 17 muscle 라우트 사전 생성 시 빌드 시간·`out/` 크기 폭증 (2) 외부 GitHub raw 이미지 핫링크 차단 가능성 (PRD TV-1) (3) 한국어 폰트 가독성 — 시스템 폰트 의존 |
| **SUCCESS** | 873 exercise + 17 muscle 정적 페이지 모두 생성 + 한국어 텍스트 정상 표시 + LCP < 1.5s (3G 추정) + typecheck 0 errors + 번들 회귀 없음 |
| **SCOPE** | M3 = F-1 부위별 검색 + F-3 운동 상세 + F-5 시연 이미지 표시. F-2 추천·F-4 필터·F-6 YouTube·F-7 검색은 M4-M5에서 |

---

## 1. Overview

### 1.1 Purpose

PRD §6.1 Information Architecture의 4개 라우트 중 3개(`/`, `/muscles/[muscle]`, `/exercises/[id]`) 구현. `/settings`(F-4 헬스장 프리셋 관리)는 M4에서 도입.

### 1.2 Background

**현재 상태 (M1-M2 완료)**:
- 873 운동 정적 JSON `public/data/exercises-ko.json` 빌드 OK
- `out/` 정적 export 자동 복사 검증 완료
- next-dev 서버 가동 중 (port 3000) — 핫리로드로 즉시 확인 가능
- `src/lib/i18n.ts` MUSCLE_KO·EQUIPMENT_KO·LEVEL_KO·FORCE_KO·MECHANIC_KO·CATEGORY_KO 6종 매핑 완료
- placeholder Home 한국어 정상 렌더링

**왜 지금**: M3는 모든 후속 마일스톤(M4 추천·필터, M5 YouTube·다이어그램, M6 UX 다듬기)의 기반 흐름. 라우팅·데이터 패턴이 여기서 굳어진다.

### 1.3 Related Documents

- PRD: [docs/PRD.md](../../PRD.md) v0.4 (§6.1~§6.7 핵심)
- M1-M2 Plan/Design: [m1-m2-foundation.plan.md](./m1-m2-foundation.plan.md), [../02-design/features/m1-m2-foundation.design.md](../../02-design/features/m1-m2-foundation.design.md)

---

## 2. Scope

### 2.1 In Scope

**라우팅 (3개)**
- [ ] `/` — Home: 부위 선택 그리드 + (M3 한정 placeholder) 영역으로 검색·최근 본 운동
- [ ] `/muscles/[muscle]/` — 부위별 운동 목록 (level 오름차순, 카드 형태)
- [ ] `/exercises/[id]/` — 운동 상세 (한국어명·영문명·근육 표시·시연 이미지·단계별 설명)

**정적 사전 생성**
- [ ] `/muscles/[muscle]`: 17개 muscle slug 사전 생성 (`generateStaticParams`)
- [ ] `/exercises/[id]`: 873개 exercise ID 사전 생성 (`generateStaticParams`)

**공용 컴포넌트 (Server Component 우선)**
- [ ] `MuscleGrid` — Home의 부위 선택 그리드 (8개 + 추가 부위 expansion 가능)
- [ ] `ExerciseListItem` — 부위별 목록의 운동 카드 (이름·기구·level)
- [ ] `ExerciseDetail` — 운동 상세 본문 (영역 5개: 헤더·근육·이미지·단계·메타)
- [ ] `MuscleBadgeList` — 운동 상세의 자극 근육 배지 (primary 빨강, secondary 주황)
- [ ] `ExerciseImage` — 외부 이미지 lazy + 에러 fallback
- [ ] `BackLink` — 상단 좌측 뒤로 가기 (브라우저 이력 사용)

**데이터 액세스**
- [ ] `src/lib/data.ts` — 빌드 타임 JSON `import`, 도우미 함수 (`getAllExercises`, `getExerciseById`, `getExercisesByMuscle`, `getMuscleSlugs`)
- [ ] tsconfig path alias로 `@/data/exercises-ko` 형태 사용 가능하도록 설정 (혹은 직접 상대경로)

**i18n / 표시 매핑 확장**
- [ ] (필요 시) MUSCLE_KO에 미사용 항목 정렬 헬퍼 추가
- [ ] 운동명 대표 부위 그룹 (가슴/등/어깨/하체/팔/복근 등 PRD §6.2 8버킷) 정의 — Home 그리드용

**스타일**
- [ ] Tailwind 모바일 우선 (max-w-md), 다크모드 지원 유지
- [ ] 큰 탭 영역 ≥ 44×44px (PRD §6.7)
- [ ] 시스템 폰트 + Apple SD Gothic Neo 우선 (M2 globals.css 유지)

### 2.2 Out of Scope

- ❌ F-2 추천 (`/exercises/[id]` 내 "🔄 다른 기구로 대체" 버튼 → M4)
- ❌ F-4 가용 기구 필터 + 헬스장 프리셋 (`/settings` → M4)
- ❌ F-5 일부: 시연 이미지 시작↔종료 자동 토글 GIF 효과 (M3는 정적 2장, 탭 토글 정도만)
- ❌ F-6 YouTube 딥링크 버튼 (M5)
- ❌ F-7 검색 (운동명 한국어/영문) (M7 옵션)
- ❌ F-8 즐겨찾기, 최근 본 운동 LocalStorage (M3는 placeholder 영역만, M4-M7 옵션)
- ❌ react-body-highlighter 다이어그램 (M5 — 본 단계는 텍스트 배지만)
- ❌ 추천 알고리즘 `src/lib/recommend.ts` (M4)
- ❌ E2E 테스트 셋업

### 2.3 Open Items (Plan에서 사용자 확정 필요)

| ID | 질문 | 권장 | 결정 |
|----|------|------|:----:|
| O-1 | Home 부위 그리드 8개 분류 방식 | PRD §6.2 8버킷 (가슴/등/어깨/팔(이두)/팔(삼두)/하체/복근/코어). 단 코어=abdominals 중복 → 7개 권장 (가슴/등/어깨/이두/삼두/하체/복근) + 하단 "전체 부위 보기" 링크로 17 머슬 액세스 | 권장 채택 |
| O-2 | "하체" → primaryMuscles 매핑 (quadriceps만? hamstrings·glutes·calves·adductors·abductors 포함?) | 하체 그룹 = quadriceps + hamstrings + glutes + calves + adductors + abductors (다중 muscle OR 매칭) | 권장 채택 |
| O-3 | "등" → lats만? lats+middle back+lower back+traps? | 등 = lats + middle back + traps. lower back은 별도 (코어/허리 그룹) | 권장 채택 |
| O-4 | Home에 placeholder로 들어갈 미구현 영역(검색·최근 본 운동) 표기 | "🔍 검색 (M7)", "최근 본 운동 (예정)" disabled 카드 — UI 자리만 잡고 클릭 비활성 | 권장 채택 |
| O-5 | `/muscles/[muscle]` 정렬 키 | level 오름차순 (PRD §6.3) → tie-breaker: nameKo 가나다 | 권장 채택 |
| O-6 | 운동 상세 시연 이미지 갯수 | imageUrls.length가 1~다수 가능. PRD §6.4는 2장(시작·종료) 가정. M3는 **있는 만큼 모두 표시**, 첫 2장은 가로 정렬, 나머지는 세로 스크롤 | 권장 채택 |
| O-7 | 외부 이미지 로드 실패 시 fallback | `<Image>` 대신 `<img>` 사용 (`output: 'export'` + `unoptimized`라 `next/image` 차이 미미). `onError` 시 회색 박스 + 운동명만 표시 | 권장 채택 |

> **본 Plan은 위 7개 권장안 전부를 채택**한 전제로 작성. 사용자가 다른 답변을 원하면 Design/Do 단계에서 수정.

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Home `/` — 부위 카드 7개 그리드 표시 (가슴/등/어깨/이두/삼두/하체/복근), 클릭 시 `/muscles/{muscle}` 이동 | High | Pending |
| FR-02 | Home — placeholder 영역 (검색 비활성, 최근 본 운동 자리만) | Medium | Pending |
| FR-03 | Home — "전체 부위 보기" 보조 링크 (17 머슬 모두 노출 — 단순 list) | Low | Pending |
| FR-04 | `/muscles/[muscle]/` — 17 머슬 슬러그 모두 정적 사전 생성 | High | Pending |
| FR-05 | `/muscles/[muscle]/` — 해당 부위(7 그룹 OR 단일 머슬)에 매칭되는 운동 목록 카드 형태로 표시, level 오름차순 + nameKo 가나다 tie-breaker | High | Pending |
| FR-06 | `/muscles/[muscle]/` — 카드: nameKo, 기구(EQUIPMENT_KO), level 배지 | High | Pending |
| FR-07 | `/muscles/[muscle]/` — 카드 클릭 시 `/exercises/{id}/` 이동 | High | Pending |
| FR-08 | `/exercises/[id]/` — 873 ID 모두 정적 사전 생성 | High | Pending |
| FR-09 | `/exercises/[id]/` — 헤더: nameKo (큰 글자) + nameEn (작게 부기) + category 태그 | High | Pending |
| FR-10 | `/exercises/[id]/` — 자극 근육 표시: primary (빨강 배지) + secondary (주황 배지), MUSCLE_KO 한국어 | High | Pending |
| FR-11 | `/exercises/[id]/` — 시연 이미지: imageUrls 모두 표시, 첫 2장 가로 grid, 나머지 세로 스택, lazy loading | High | Pending |
| FR-12 | `/exercises/[id]/` — instructionsKo 단계별 번호 매겨 표시 (ol) | High | Pending |
| FR-13 | `/exercises/[id]/` — 메타 정보: level, force, mechanic, equipment (한국어 매핑) | Medium | Pending |
| FR-14 | `/exercises/[id]/` — 영문 instructions 토글 표시 (선택사항) | Low | Pending |
| FR-15 | 모든 화면 — 상단 좌측 BackLink (router.back / 또는 부모 경로 링크) | Medium | Pending |
| FR-16 | 외부 이미지 로드 실패 → 회색 fallback + 운동명 표시 | Medium | Pending |
| FR-17 | 페이지 메타 — 각 운동 상세 페이지 `<title>` = "{nameKo} | gym-alt-app" | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Build success | `npm run build` exit 0, 873 + 17 + 1 = 891 정적 페이지 생성 | `npm run build` 출력 |
| Build time | M2 대비 회귀 없이 합리적 (예: < 60s 로컬) | `time npm run build` |
| Bundle size | First Load JS 102 kB → 회귀 ≤ +30 kB | Next.js build summary |
| `out/` size | 합리적 (예: < 30MB) — 정적 HTML 891개 | `du -sh out/` |
| Type safety | 0 errors | `npm run typecheck` |
| LCP | < 1.5s (모바일 3G 가정, 외부 이미지는 lazy로 LCP에 영향 적게) | Chrome DevTools Lighthouse 수동 |
| Accessibility | 큰 탭 영역, 의미적 HTML(`<main>`, `<nav>`, `<ol>`) | 수동 점검 |
| Korean rendering | 모든 텍스트 한국어, 폰트 깨짐 없음 | next-dev 시각 확인 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] Home `/` 렌더링: 부위 카드 7개 + placeholder 영역 + 17 머슬 보조 링크
- [ ] `/muscles/{muscle}` 17개 슬러그 모두 접근 가능 (브라우저 직접 입력 또는 Home 카드 클릭)
- [ ] `/exercises/{id}` 873개 ID 모두 접근 가능, 외부 이미지 로드 정상
- [ ] 사용자 시나리오: `/` 가슴 카드 클릭 → 가슴 운동 목록 → 첫 카드 클릭 → 상세 페이지에서 nameKo·근육 배지·이미지·instructionsKo 모두 표시 (한국어)
- [ ] `npm run build` 0 errors, 891 정적 페이지 생성 로그 확인
- [ ] `npm run typecheck` 0 errors
- [ ] gap-detector + code-analyzer 병렬 Check 결과 Critical 0건
- [ ] Visit M3 빌드 후 Cloudflare Pages 빌드 명령 (`npm run build`) 회귀 없음

### 4.2 Quality Criteria

- [ ] 모든 페이지가 모바일 화면(375px)에서 가로 스크롤 발생하지 않음
- [ ] 큰 탭 영역 ≥ 44×44px 적용 (Tailwind `min-h-11 min-w-11` 또는 padding으로)
- [ ] 다크모드에서도 가독성 유지
- [ ] `noUncheckedIndexedAccess: true`와 호환 — 배열 인덱싱 시 명시적 가드
- [ ] M1-M2 산출물(타입, i18n) **재사용**, 중복 정의 금지 (DRY)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| `generateStaticParams` 873 + 17 라우트 빌드 시간 폭증 | Medium | Medium | M2 placeholder Home 단일 페이지 빌드 4 페이지 102KB 기준선과 비교. 60s 초과 시 Plan 재검토. 데이터 페이지 자체는 정적 HTML이라 라우트 수가 늘어도 페이지당 비용은 작음. |
| 외부 GitHub raw 이미지 핫링크 차단 (PRD TV-1) | High | Low | M3는 첫 검증 시점. 차단 시 즉시 fallback UI(회색 박스 + 운동명) 동작 — UX 영향 최소화. P2로 R2 미러링은 PRD §9.1 Q-2 결정 따름. |
| `out/` 디렉토리 크기 폭증 | Medium | Medium | 873 HTML × 평균 5KB ≈ 4.4MB + 머슬 17 페이지 + Home + chunk = 합리적. Cloudflare Pages 무료 플랜 제한(파일 수 20,000 / 파일당 25MB)도 여유. |
| 이미지 lazy loading + LCP 영향 | Medium | Low | 운동 상세 첫 화면의 핵심은 텍스트(이름·근육)이고 이미지는 fold 아래일 가능성. 첫 이미지만 `loading="eager"`, 나머지는 lazy. |
| 한국어 폰트 가독성(시스템 폰트 의존) | Low | Medium | M2 globals.css 폰트 스택 유지 (Apple SD Gothic Neo + Pretendard fallback). 별도 웹폰트 도입 시 LCP·번들 영향 — M6 UX 다듬기에서 결정. |
| 머슬 그룹 매핑(O-2, O-3) 결정 결과로 일부 운동이 어디에도 안 잡힘 | Medium | Medium | 빌드 후 카운트 검증 — 각 머슬 그룹 운동 수를 콘솔 출력하는 dev 스크립트 (1회용)로 확인 가능. M3 Check 단계에 포함. |
| `noUncheckedIndexedAccess` + 배열 인덱싱 시 TS 에러 | Low | High | 모든 인덱싱은 `.map()`, `.filter()`, `.find()` 패턴으로. `arr[0]` 직접 접근은 nullish 체크 후 사용. |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `src/app/page.tsx` | Existing (M2 placeholder) | M3에서 부위 그리드 + 보조 링크로 교체 (placeholder 제거) |
| `src/app/muscles/[muscle]/page.tsx` | New | 부위별 목록 페이지 |
| `src/app/exercises/[id]/page.tsx` | New | 운동 상세 페이지 |
| `src/lib/data.ts` | New | 정적 JSON `import` + 도우미 함수 |
| `src/lib/muscle-groups.ts` | New | 7 부위 그룹 → MuscleGroup[] 매핑 |
| `src/components/**` | New | 공용 컴포넌트 6개 |

### 6.2 Current Consumers

신규 화면이라 기존 consumer 없음. 향후 의존:

| Resource | Future Operation | Future Code Path | Impact |
|----------|------------------|------------------|--------|
| `src/lib/data.ts` `getAllExercises` | READ | M4 `src/lib/recommend.ts` 추천 알고리즘 | 신규 작성 시점 |
| `src/lib/data.ts` `getExerciseById` | READ | M4 `/exercises/[id]` 추천 모달 | 동일 함수 재사용 |
| `src/lib/muscle-groups.ts` | READ | M5/M6에서 다이어그램·UX 다듬기에 재사용 | 추가 사용처만 |

### 6.3 Verification

- [ ] `src/app/page.tsx` 교체로 인한 M2 placeholder 동작 회귀 — 새 Home도 빌드·렌더 OK 확인
- [ ] `src/lib/types.ts`, `src/lib/i18n.ts` 변경 없음 (오직 import만)
- [ ] `scripts/preprocess.ts` 무관

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Selected |
|-------|:--------:|
| Starter | ✅ (M1-M2와 동일 — 정적 사이트, 백엔드 0) |
| Dynamic | ☐ |
| Enterprise | ☐ |

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Routing | Pages Router / App Router | **App Router** | M2 결정 유지. `generateStaticParams` 정적 export 호환 |
| Server vs Client Component | RSC default / "use client" | **RSC 우선, 필요 시 Client** | 데이터는 빌드 타임 import → RSC가 자연스러움. 인터랙션(이미지 onError 등) 만 Client |
| 데이터 fetch | runtime fetch / build-time import / generateStaticParams + props | **build-time import** | 정적 export 호환 + 단일 패턴. fetch 불필요 |
| 상태 관리 | useState / Zustand / Context | **useState만 (필요 시)** | M3는 navigation 외 상태 거의 없음. 즐겨찾기·LocalStorage는 M4-M7 |
| 이미지 컴포넌트 | next/image / 일반 img | **일반 `<img>`** | `output: 'export'` + `unoptimized`라 next/image 효익 적고, `onError` 처리 자유로움 |
| 라우트 prefetching | Link prefetch on/off | **기본 (on)** | Next.js Link가 자동 prefetch — 정적 페이지라 빠른 이동 |

### 7.3 Folder Structure

```
src/
├── app/
│   ├── layout.tsx                     ✅ M2 (변경 없음)
│   ├── globals.css                    ✅ M2 (변경 없음)
│   ├── page.tsx                       🔄 교체 (Home 부위 그리드)
│   ├── muscles/
│   │   └── [muscle]/
│   │       └── page.tsx               🆕
│   └── exercises/
│       └── [id]/
│           └── page.tsx               🆕
├── components/
│   ├── muscle-grid.tsx                🆕 (Server Component)
│   ├── exercise-list-item.tsx         🆕 (Server Component)
│   ├── exercise-detail.tsx            🆕 (Server Component)
│   ├── muscle-badge-list.tsx          🆕 (Server Component)
│   ├── exercise-image.tsx             🆕 (Client Component — onError)
│   └── back-link.tsx                  🆕 (Client Component — router.back)
└── lib/
    ├── types.ts                       ✅ M1-M2 (변경 없음)
    ├── i18n.ts                        ✅ M1-M2 (변경 없음)
    ├── data.ts                        🆕 정적 JSON import + helpers
    └── muscle-groups.ts               🆕 7 그룹 매핑
```

---

## 8. Convention Prerequisites

### 8.1 Existing Conventions (M1-M2에서 정립)

- ✅ TypeScript strict + `noUncheckedIndexedAccess`
- ✅ kebab-case 파일명 (utility/component)
- ✅ Tailwind 모바일 우선
- ✅ 단일 source-of-truth 타입 (`src/lib/types.ts`)
- ✅ Design Ref 주석 (`// Design Ref: §X`)

### 8.2 Conventions to Define

| Category | To Define |
|----------|-----------|
| 컴포넌트 파일명 | kebab-case.tsx (예: `muscle-grid.tsx`) — Next.js convention 일치 |
| 컴포넌트 export | default export 1개 + 보조 named export 허용 |
| 페이지 props | App Router 표준 (`{ params }: { params: Promise<{ muscle: string }> }` — Next.js 15는 Promise) |
| 한국어 string 위치 | UI 표시 한국어는 `src/lib/i18n.ts` 매핑 우선 사용. 페이지별 고유 카피는 직접 JSX 내. |
| 클래스명 정책 | Tailwind utility만 사용. `@apply` 금지 (KISS). |

### 8.3 Environment Variables

M3 단계 환경변수 0개 (M1-M2와 동일).

---

## 9. Implementation Strategy (옵션 A — KISS 패턴 유지)

### 9.1 단계 구성

| 단계 | 산출물 | 담당 |
|------|--------|------|
| **Plan** | 본 문서 | CTO 직접 ✅ |
| **Design** | `docs/02-design/features/m3-screens.design.md` (컴포넌트 트리, 라우팅, 데이터 흐름) | frontend-architect Task() 1회 (가능 시) / CTO 직접 (Task 미가용 시 fallback) |
| **Do** | 페이지 3개 + 컴포넌트 6개 + lib 2개 | CTO 직접 |
| **Check** | gap-detector + code-analyzer 병렬 | Task() 2회 병렬 (가능 시) / CTO 직접 검토 (fallback) |
| **Act** | (조건부) Match Rate < 90% 시 수정 | 필요 시 |
| **Report** | 사용자에게 한국어 요약 + M4 진입 준비 보고 | CTO 직접 |

### 9.2 병렬화 분석

- **순차 의존**: Plan → Design → Do
- **Do 내부 병렬**:
  - Phase A: `src/lib/data.ts`, `src/lib/muscle-groups.ts` (컴포넌트 의존 없음 — 먼저)
  - Phase B: 컴포넌트 6개 (서로 독립적이지만 Detail이 BadgeList·Image 사용 → 부분 의존)
  - Phase C: 페이지 3개 (컴포넌트 사용)
  - Write 도구 병렬 호출로 시간 절감 (이미 검증된 패턴)
- **Check 병렬**: gap-detector + code-analyzer 동시 호출

**예상 효율**: M1-M2 대비 작업량 30-50% 증가 추정. Write 병렬화로 시간 절감.

### 9.3 데이터 fetch 패턴 (정적 export 호환)

```typescript
// src/lib/data.ts (Design 단계에서 확정)
import exercisesData from "../../public/data/exercises-ko.json";
import type { EnrichedExercise, MuscleGroup } from "./types";

const exercises = exercisesData as EnrichedExercise[];

export function getAllExercises(): EnrichedExercise[] {
  return exercises;
}

export function getExerciseById(id: string): EnrichedExercise | undefined {
  return exercises.find((e) => e.id === id);
}

export function getMuscleSlugs(): string[] {
  // 17 muscle slug for generateStaticParams. URL-safe (lower back → "lower-back")
  return [...new Set(exercises.flatMap((e) => e.primaryMuscles))]
    .map((m) => m.replace(/\s+/g, "-"));
}

export function getExercisesByMuscle(slug: string): EnrichedExercise[] {
  const muscleKey = slug.replace(/-/g, " ") as MuscleGroup;
  // 단일 muscle 매칭 + (7 그룹의 경우) muscle-groups.ts에서 확장
  return exercises.filter((e) => e.primaryMuscles.includes(muscleKey));
}
```

**generateStaticParams 호환성 검증 포인트**:
- Next.js 15 App Router에서 `params`는 `Promise<{...}>` 타입 (v15부터 변경)
- `generateStaticParams`는 동기/비동기 모두 OK
- `output: 'export'` 시 `dynamicParams`는 기본 `false` 동작 (Next 15에서 명시적 `export const dynamicParams = false` 권장)

> Context7 MCP가 있으므로 Design 단계에서 Next 15 정적 export + generateStaticParams 최신 패턴을 한 번 확인 후 코드 작성.

### 9.4 사용자 추가 확인 메모 (Design/Do 단계 진입 시)

- O-1 ~ O-7 권장안 채택 (본 Plan에 명시)
- URL slug 정책: `lower back` → `lower-back` (공백 → 하이픈, lowercase). decode 시 reverse 매핑.
- 7 부위 그룹의 한국어 라벨 + 매칭 muscle 배열은 `src/lib/muscle-groups.ts`에 단일 정의

---

## 10. Next Steps

1. [x] Plan 작성 (본 문서)
2. [ ] frontend-architect Task() 1회 (가능 시) 또는 CTO 직접 Design 작성
3. [ ] Do — Write 병렬화로 11개 파일 작성
4. [ ] Check — gap-detector + code-analyzer 병렬 (가능 시) 또는 CTO 직접 검증
5. [ ] 사용자에게 결과 요약 보고 + M4 진입 준비 안내

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-30 | M3 초안 작성 (옵션 A KISS, O-1~O-7 권장안 채택) | jiinbae |
