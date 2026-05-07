# M4 Recommend + Filter Planning Document

> **Summary**: Jaccard 가중 추천 알고리즘 (PRD §5.2/§5.3) + 가용 기구 필터 + 헬스장 프리셋 LocalStorage 관리. 운동 상세에 "🔄 다른 기구로 대체" 진입점 추가. 단일 사용자, KISS.
>
> **Project**: gym-alt-app
> **Version**: 0.1.0
> **Author**: jiinbae (CTO)
> **Date**: 2026-04-30
> **Status**: Draft (옵션 A — KISS, M3 검증 통과 후)
> **Planning Doc**: [m3-screens.plan.md](./m3-screens.plan.md)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | M3 완료 후 운동 탐색은 가능하나, PRD §1.1 핵심 가치인 "사용 불가 운동 → 대체 30초"가 미구현. 헬스장에서 점유·부재 시 즉시 대안을 얻을 수 없다. |
| **Solution** | PRD §5.2 Jaccard 가중 추천 함수 + §5.3 hard constraint(primary 교집합 필수) + 가용 기구 GymPreset 필터를 결합. 운동 상세에서 1탭으로 추천 모달 호출, 설정 페이지에서 LocalStorage로 프리셋 관리. |
| **Function/UX Effect** | 사용자가 운동 상세 → 🔄 버튼 → 추천 5-10개를 한국어로 즉시 확인. 가용 기구 토글 시 추천 목록 즉시 갱신. |
| **Core Value** | PRD G1(30초 도달) + G4(가용 기구만 필터링) 동시 달성. 외부 의존성 0 추가, 정적 export·KISS 유지. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | PRD §1.1 — 헬스장 점유·부재로 인한 대체 운동 30초 탐색. M3 탐색 동선 위에 핵심 가치 결제. |
| **WHO** | 단일 사용자(jiinbae). iOS Safari 16+, Android Chrome. 한 손 조작, 모바일 우선. |
| **RISK** | (1) LocalStorage SSR hydration mismatch — Next.js 15 App Router 표준 패턴 위반 시 console error / UI 깜빡임 (2) 추천 알고리즘이 일부 운동에서 후보 0건 — 사용자 신뢰 저하 (3) 모달 vs 페이지 라우트 결정에 따라 정적 export 호환성 영향 |
| **SUCCESS** | 추천 함수 PRD §5.2/§5.3 정확히 준수 (primary 교집합 필수, 자기 자신 제외, 상위 N개) + LocalStorage hydration 깔끔 + 정적 export 빌드 회귀 없음 + typecheck 0 errors + 추천/필터 시나리오 한국어 완주 |
| **SCOPE** | M4 = F-2 추천 + F-4 가용 기구 필터 + 헬스장 프리셋 관리(/settings). F-6 YouTube 딥링크 / F-7 검색 / F-8 즐겨찾기 / 다이어그램은 후속 |

---

## 1. Overview

### 1.1 Purpose

PRD §10 마일스톤 M4. PRD §6.5(대체 운동 추천 모달) + §6.6(설정 화면) 구현. M3가 탐색 흐름을 만들었다면 M4는 **선택을 가능하게 함**.

### 1.2 Background

**현재 상태 (M3 완료)**:
- 라우팅 3개 정상 (`/`, `/muscles/[muscle]`, `/exercises/[id]`)
- 884 정적 페이지 빌드 OK, First Load JS 106 kB
- 이미지 외부 hotlink 동작, fallback 검증
- `data/gym-presets.json` (M1 산출) — `default-full` 1개 시드 이미 존재

**왜 지금**: 추천 알고리즘 없이는 PRD §1.1 핵심 시나리오 US-1·US-2(점유·부재 대체)가 충족 불가. 또한 M5(YouTube 딥링크 + 다이어그램)는 추천 결과 카드 위에 추가될 UI라, 추천이 먼저.

### 1.3 Related Documents

- PRD §5 (추천 알고리즘), §6.5 (추천 모달), §6.6 (설정 화면), §4.5 (GymPreset 스키마)
- M1-M2 산출물: `data/gym-presets.json`, `src/lib/types.ts` `GymPreset`
- M3 산출물: `src/lib/data.ts`, `src/lib/i18n.ts`, `src/app/exercises/[id]/page.tsx`

---

## 2. Scope

### 2.1 In Scope

**추천 알고리즘 (lib)**
- [ ] `src/lib/recommend.ts` — Jaccard + 가중 점수 + hard constraint + tie-breaker
- [ ] 단위 검증 가능한 pure 함수 (No I/O, deterministic)

**프리셋 LocalStorage 관리 (lib + hook)**
- [ ] `src/lib/preset-store.ts` — SSR-safe LocalStorage 훅 + 시드 파일 import
- [ ] 시드 데이터(`data/gym-presets.json`)를 빌드 타임 import → 첫 진입 시 LocalStorage에 자동 시드
- [ ] 활성 프리셋 ID + 사용자 정의 프리셋 배열 모두 LocalStorage 저장

**설정 페이지 (`/settings/`)**
- [ ] `src/app/settings/page.tsx` — Client Component (LocalStorage 의존)
- [ ] 활성 프리셋 표시 + DetailedEquipment 토글 체크박스 그리드 (PRD §6.6)
- [ ] 변경 즉시 LocalStorage 반영
- [ ] M4는 단일 프리셋 편집만 (다중 프리셋 추가/삭제는 M7 옵션)

**추천 진입점 + 모달 (운동 상세)**
- [ ] `src/components/alternatives-button.tsx` — Client. 상세 페이지 하단의 "🔄 다른 기구로 대체" 버튼
- [ ] `src/components/alternatives-modal.tsx` — Client. 모달 컨테이너 + 가용 기구 즉석 토글 + 추천 카드 리스트
- [ ] `src/components/alternatives-list.tsx` — 추천 결과 카드 리스트 (Server-pure, props만 받음)
- [ ] `src/app/exercises/[id]/page.tsx` 수정 — 정적 RSC 페이지에 Client island로 버튼 삽입

**Home 보조 영역 업데이트**
- [ ] M3에서 disabled placeholder였던 검색·최근 본 운동 영역 옆 또는 자리에 **"⚙️ 헬스장 설정"** 링크 추가 (Settings 진입점)

**한국어 i18n 확장 (필요 시)**
- [ ] EQUIPMENT_KO 매핑 이미 충분 (M1 산출). 추가 매핑 X 예상

### 2.2 Out of Scope

- ❌ F-6 YouTube 딥링크 버튼 (M5)
- ❌ F-7 검색 (M7 옵션)
- ❌ F-8 즐겨찾기 (M7 옵션)
- ❌ react-body-highlighter 다이어그램 (M5)
- ❌ 다중 프리셋 추가/편집/삭제 (M4는 default-full 1개 편집만 — KISS, YAGNI)
- ❌ 추천 결과를 별도 라우트로 분리 (`/exercises/[id]/alternatives/`) — 모달로 충분, 정적 export 부담 감소
- ❌ Zustand / Jotai / Context API — useState + custom hook으로 단일 사용자 충분 (KISS)
- ❌ E2E 테스트 셋업

### 2.3 Open Items (Plan에서 사용자 확정 필요)

| ID | 질문 | 권장 | 결정 |
|----|------|------|:----:|
| O-1 | 추천 결과 갯수 | 사용자 지시 "5-10개" + PRD "상위 3개" 조정 → **상위 5개 (`.slice(0, 5)`)**. 모바일 fold 2개 + 스크롤로 5개가 자연스러움. | 권장 채택 |
| O-2 | level 차이 ≤1 hard filter 적용 여부 | 사용자 지시. 단, **검색 후 후보 0건이면 hard filter 완화 (모든 level 허용)** — 빈 결과 방지 | 권장 채택 |
| O-3 | 모달 vs 페이지 | **모달** — 정적 export 라우트 1개 추가 안 함. M3 build 884 → M4 build 885 (`/settings/`만 추가) | 권장 채택 |
| O-4 | 추천에 매칭 점수 표시 | 사용자 지시 "한국어 운동명·매칭 점수 노출" + PRD §6.5 "주근육 100% / 보조 67%" 배지 → **primary jaccard %, secondary jaccard % 두 개 배지로 표시** (점수 자체는 비표시 — PRD §6.5 "점수 표시 안 함") | 권장 채택 |
| O-5 | 시드 적용 시점 | 첫 LocalStorage 읽기 때 keys 없으면 `default-full` 자동 시드. 이후엔 사용자 편집 우선 | 권장 채택 |
| O-6 | "리셋" 버튼 (시드로 복원) 필요 여부 | M4에서 추가. 사용자가 토글로 다 끄거나 했다가 후회할 수 있음. 1줄 코드. | 권장 채택 |
| O-7 | 가용 기구 0개 상태 처리 | 추천 결과 0건 → "가용 기구를 1개 이상 선택해 주세요" 메시지 + 설정 페이지 링크 | 권장 채택 |

> **본 Plan은 위 7개 권장안 채택 전제**.

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `recommend(target, available)` 함수 — PRD §5.2 Jaccard 가중 점수 (primary 0.6 + secondary 0.2 + force 0.1 + mechanic 0.1) | High | Pending |
| FR-02 | Hard constraint: candidate.primaryMuscles ∩ target.primaryMuscles ≠ ∅ — 위반 후보 제외 | High | Pending |
| FR-03 | candidate.detailedEquipment 중 하나라도 availableEquipment에 포함되어야 함 | High | Pending |
| FR-04 | 자기 자신 제외 (`e.id !== target.id`) | High | Pending |
| FR-05 | 추가 제약: candidate level과 target level 차이 ≤ 1 단계 (beginner↔intermediate, intermediate↔expert) — hard filter, 단 결과 0건 시 자동 완화 | High | Pending |
| FR-06 | Tie-breaker: level 같음 우선 → mechanic 같음 우선 (PRD §5.3) | High | Pending |
| FR-07 | 상위 5개 반환 (PRD 3개 → 사용자 지시 5-10개 → 모바일 UX 고려 5개) | High | Pending |
| FR-08 | LocalStorage hook `usePreset()` — SSR-safe (mount 전 default, mount 후 LS 동기화) | High | Pending |
| FR-09 | LocalStorage 첫 진입 시 `default-full` 자동 시드 (`data/gym-presets.json`에서 import) | High | Pending |
| FR-10 | 운동 상세 페이지에 "🔄 다른 기구로 대체" 버튼 (Client island) | High | Pending |
| FR-11 | 버튼 클릭 시 모달 표시 — 가용 기구 즉석 토글 + 추천 5개 카드 | High | Pending |
| FR-12 | 추천 카드: nameKo, 기구, level, primary 매칭 % 배지, secondary 매칭 % 배지 (PRD §6.5) | High | Pending |
| FR-13 | 추천 카드 클릭 시 해당 운동 상세로 이동 (`/exercises/{id}/`) | High | Pending |
| FR-14 | 모달의 가용 기구 토글 변경 시 추천 결과 즉시 재계산 (useMemo) | High | Pending |
| FR-15 | 가용 기구 0개일 때 안내 메시지 + 설정 링크 | Medium | Pending |
| FR-16 | `/settings/` 페이지 — DetailedEquipment 20종 체크박스 그리드 (한국어 EQUIPMENT_KO) | High | Pending |
| FR-17 | 설정에서 토글 변경 시 LocalStorage 즉시 반영 (debounce 불필요 — 단일 사용자) | High | Pending |
| FR-18 | 설정 페이지에 "리셋 (기본값으로)" 버튼 | Medium | Pending |
| FR-19 | Home에 "⚙️ 헬스장 설정" 진입점 링크 추가 | Medium | Pending |
| FR-20 | 모달은 ESC / backdrop 클릭으로 닫힘. 닫힐 때 가용 기구 즉석 변경은 LocalStorage에 반영 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Build success | `npm run build` exit 0, 884 → 885 페이지 (settings 1개 추가) | `npm run build` 출력 |
| Bundle size | First Load JS 106 → ≤ 126 kB (회귀 ≤ +20 kB) | Next.js build summary |
| Type safety | 0 errors | `npm run typecheck` |
| Hydration | 콘솔 에러 0 (Hydration mismatch 없음) | DevTools 콘솔 |
| 추천 응답 시간 | 873 운동 대상 < 50ms (메모이즈 후) | DevTools Performance |
| LocalStorage SSR | dev 첫 진입에 hydration warning 0 | next-dev 콘솔 |
| Modal a11y | ESC 닫힘, focus trap, role="dialog", aria-labelledby | 수동 점검 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `recommend()` 함수가 PRD §5.2 가중치, §5.3 hard constraint 정확히 구현
- [ ] 운동 상세에서 "🔄 다른 기구로 대체" 클릭 → 모달 → 추천 5개 카드 표시 (한국어, 매칭 % 배지)
- [ ] 모달 내 가용 기구 토글 변경 시 추천 결과 즉시 갱신
- [ ] `/settings/`에서 가용 기구 토글 → LocalStorage 저장 → 다른 페이지 이동 후 다시 추천 호출 시 반영
- [ ] LocalStorage 미설정 첫 진입에 `default-full` 자동 시드, 모달 정상 동작
- [ ] Home → "⚙️ 헬스장 설정" 링크 → settings 페이지 이동
- [ ] `npm run typecheck` 0 errors
- [ ] `npm run build` 성공, 정적 페이지 884 → 885 (회귀 없음)
- [ ] `gap-detector` + `code-analyzer` 병렬 Check 결과 Critical 0건
- [ ] dev 시나리오 수동 검증 완료 (next-dev 콘솔에 hydration warning 0)

### 4.2 Quality Criteria

- [ ] 모든 한국어 텍스트 정상 표시
- [ ] 모달 모바일 (375px) 가로 스크롤 0
- [ ] 가용 기구 0개 / 추천 결과 0건 edge case 메시지 표시
- [ ] level 차이 ≤1 hard filter 동작 + 0건 시 자동 완화 동작
- [ ] LocalStorage hook이 SSR 시점에 `window` 접근 시도하지 않음

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| LocalStorage SSR `window is not defined` 에러 | High | Medium | `usePreset()` hook 내부 `useState` 초기값은 시드 default, `useEffect`에서 mount 후 LS 동기화. SSR 단계에 `localStorage` 직접 접근 0. 표준 패턴 준수. |
| Hydration mismatch (서버 placeholder ↔ 클라이언트 mount 후 LS 값 차이) | Medium | Medium | mount 전엔 default 시드 사용 → mount 후에도 LS에 default가 있으면 동일 → mismatch 없음. LS에 사용자 편집이 있으면 mount 후 한 번 깜빡임 가능 → `useEffect` 한 번 실행 후 동기화로 충분. UI 영향 미미. |
| 추천 결과 0건 (특정 운동 + 좁은 가용 기구) | High | Medium | (1) hard filter level≤1 위반 시 자동 완화, (2) 가용 기구 0건일 때 메시지, (3) primary 교집합 0건이면 "추천 없음" 메시지 + 가용 기구 확장 권유 |
| 모달 정적 export 호환성 | Low | Low | 모달은 Client Component, RSC 페이지 안에 island로 들어감. 정적 export와 무관 (라우트 추가 X). |
| 추천 함수 873 × 873 = 높은 비용 | Low | Low | 사용자 1명, 한 번 호출당 873 candidate scan = O(N). N=873은 마이크로초 단위. memo 없이도 충분. |
| LocalStorage JSON 파싱 실패 (수동 편집·구버전) | Medium | Low | try/catch + 실패 시 default 시드로 폴백. 구버전 호환은 단일 사용자라 불필요. |
| dev 중 build 후 cache 충돌 (M3 이슈 재발) | Medium | Medium | 사용자 운영 노트 — Check 단계 마지막에만 build 실행, dev 중에는 typecheck만. |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `src/app/exercises/[id]/page.tsx` | Existing (M3) | "🔄 다른 기구로 대체" 버튼 (Client island) 추가 |
| `src/app/page.tsx` | Existing (M3) | 보조 영역에 "⚙️ 헬스장 설정" 링크 추가 |
| `src/app/settings/page.tsx` | New | 프리셋 편집 페이지 |
| `src/lib/recommend.ts` | New | 추천 알고리즘 |
| `src/lib/preset-store.ts` | New | LocalStorage hook |
| `src/components/alternatives-button.tsx` | New | 모달 trigger |
| `src/components/alternatives-modal.tsx` | New | 모달 컨테이너 |
| `src/components/alternatives-list.tsx` | New | 추천 카드 리스트 |
| `data/gym-presets.json` | Existing (M1) | (수정 없음) — import만 |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `src/app/exercises/[id]/page.tsx` | RENDER | M3 운동 상세 | Client island 1개 추가 — RSC 본체는 변경 최소 |
| `src/lib/data.ts` `getAllExercises` | READ | recommend.ts (신규 사용) | M3에서 이미 export, 변경 없음 |
| `src/lib/data.ts` `getExerciseById` | READ | recommend.ts (신규 사용) | 동일 |
| `data/gym-presets.json` | IMPORT | preset-store.ts (신규 사용) | M1 산출 그대로 |

### 6.3 Verification

- [ ] M3 운동 상세 페이지의 기존 콘텐츠(헤더·근육 배지·이미지·instructions·메타) 변경 없음
- [ ] `src/lib/types.ts`, `src/lib/i18n.ts`, `src/lib/data.ts` 변경 없음 (오직 import만)
- [ ] M3 라우팅 884 페이지 모두 그대로 유지

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Selected |
|-------|:--------:|
| Starter | ✅ (M1-M3 동일) |

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 상태 관리 | useState / Context / Zustand | **useState + custom hook + LocalStorage** | 단일 사용자, 단일 활성 프리셋. 글로벌 상태가 필요한 곳은 사실상 없음. 모달 ↔ 설정 페이지 간 동기화는 LocalStorage event 또는 페이지 이동 시 재 mount로 충분 |
| 추천 페이지 형식 | 모달 / 별도 라우트 | **모달 (Client component island)** | 정적 export 라우트 추가 0, 사용자 흐름이 매끄러움 (PRD §6.5도 "모달 또는 페이지"라 모달 허용) |
| LocalStorage Read 시점 | SSR + revalidate / Client only | **Client only (mount 후 useEffect)** | SSR 단계는 LS 접근 불가. mount 전 default → mount 후 동기화 표준 패턴 |
| 모달 라이브러리 | Radix / Headless UI / native dialog / 직접 구현 | **HTML `<dialog>` + 직접 구현** | iOS Safari 16+ `<dialog>` 지원. 의존성 0 추가. 본인 사용자 1명, focus trap·a11y 기본 수준만 필요 |
| 추천 함수 위치 | data.ts / 별도 lib | **별도 `src/lib/recommend.ts`** | SRP — data 액세스 vs 추천 알고리즘 책임 분리 |
| 시드 import | runtime fetch / build-time import | **build-time import** | `data/gym-presets.json`을 직접 `import` — M3 패턴 일치 |

### 7.3 Folder Structure (M4 추가분만)

```
src/
├── app/
│   ├── page.tsx                       🔄 보조 영역에 설정 링크 추가
│   ├── exercises/[id]/page.tsx        🔄 Client island 1개 추가
│   └── settings/
│       └── page.tsx                   🆕
├── components/
│   ├── alternatives-button.tsx        🆕 ("use client")
│   ├── alternatives-modal.tsx         🆕 ("use client")
│   └── alternatives-list.tsx          🆕 (RSC-safe pure)
└── lib/
    ├── recommend.ts                   🆕
    └── preset-store.ts                🆕 ("use client" 마크 — hook export)
```

**총 신규 6개 + 수정 2개 = 8개 변경**.

---

## 8. Convention Prerequisites

### 8.1 Existing Conventions (M1-M3에서 정립)

- ✅ TypeScript strict + `noUncheckedIndexedAccess`
- ✅ kebab-case 파일명
- ✅ Tailwind 모바일 우선
- ✅ 단일 source-of-truth 타입
- ✅ Design Ref 주석
- ✅ Server Component 기본, Client는 인터랙션 한정

### 8.2 Conventions to Define (M4 신규)

| Category | Define |
|----------|--------|
| LocalStorage 키 prefix | `gym-alt-app:` (충돌 방지 — 같은 도메인의 다른 앱과) |
| LocalStorage 스키마 버전 | `version: 1` 필드 포함 — 향후 마이그레이션 대비 |
| Hook naming | `use*` (React 컨벤션) |
| Client Component 마킹 | `"use client"` 최상단 + 파일명 컨벤션 변경 없음 |

### 8.3 Environment Variables

M4 단계 환경변수 0개.

---

## 9. Implementation Strategy (옵션 A — KISS)

### 9.1 단계 구성

| 단계 | 산출물 | 담당 |
|------|--------|------|
| **Plan** | 본 문서 | CTO 직접 ✅ |
| **Design** | `m4-recommend-filter.design.md` | CTO 직접 (M3와 동일 — Task 미가용) |
| **Do** | lib 2 + components 3 + page 1 + 수정 2 | CTO 직접 |
| **Check** | gap-detector + code-analyzer 병렬 (가용 시) 또는 CTO 직접 검증 | 본 세션 |
| **Act** | (조건부) Match Rate < 90% 시 | 필요 시 |
| **Report** | 사용자 요약 + M5 진입 준비 | CTO 직접 |

### 9.2 병렬화

- **순차 의존**: Plan → Design → Do
- **Do 내부 병렬**:
  - Phase A (lib): `recommend.ts`, `preset-store.ts` (서로 독립)
  - Phase B (components): `alternatives-list.tsx` (재고 의존 없음), `alternatives-modal.tsx` (list 의존), `alternatives-button.tsx` (modal 의존)
  - Phase C (pages): `settings/page.tsx`, `exercises/[id]/page.tsx` 수정, `page.tsx` 수정
  - Write 도구 병렬 호출로 시간 절감
- **Check 병렬**: gap-detector + code-analyzer 동시

### 9.3 핵심 알고리즘 — recommend.ts (PRD §5.2/§5.3 본문 정확히)

```typescript
// 기본 골격 (Design에서 정제)
import type { EnrichedExercise, MuscleGroup, DetailedEquipment } from "./types";

function jaccard<T>(a: readonly T[], b: readonly T[]): number {
  if (a.length === 0 && b.length === 0) return 0; // 둘 다 비어있으면 0 (관습)
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter += 1;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

const LEVEL_RANK = { beginner: 0, intermediate: 1, expert: 2 };

export interface Recommendation {
  exercise: EnrichedExercise;
  score: number;
  primaryOverlap: number;   // 0..1
  secondaryOverlap: number; // 0..1
}

export function recommend(
  target: EnrichedExercise,
  availableEquipment: readonly DetailedEquipment[],
  allExercises: readonly EnrichedExercise[],
  topN = 5,
): Recommendation[] {
  if (availableEquipment.length === 0) return []; // FR-15

  const availableSet = new Set(availableEquipment);
  const targetLevelRank = LEVEL_RANK[target.level];

  // 1차 필터
  const filterStrict = (e: EnrichedExercise) =>
    e.id !== target.id &&
    e.detailedEquipment.some((eq) => availableSet.has(eq)) &&
    e.primaryMuscles.some((m) => target.primaryMuscles.includes(m)) && // hard
    Math.abs(LEVEL_RANK[e.level] - targetLevelRank) <= 1; // FR-05

  let candidates = allExercises.filter(filterStrict);

  // 0건이면 level 제약 완화 (FR-05)
  if (candidates.length === 0) {
    candidates = allExercises.filter(
      (e) =>
        e.id !== target.id &&
        e.detailedEquipment.some((eq) => availableSet.has(eq)) &&
        e.primaryMuscles.some((m) => target.primaryMuscles.includes(m)),
    );
  }

  // 점수 계산 + 정렬 + tie-breaker
  const scored: Recommendation[] = candidates.map((c) => {
    const primaryOverlap = jaccard(c.primaryMuscles, target.primaryMuscles);
    const secondaryOverlap = jaccard(c.secondaryMuscles, target.secondaryMuscles);
    const forceMatch = c.force !== null && c.force === target.force ? 1 : 0;
    const mechanicMatch =
      c.mechanic !== null && c.mechanic === target.mechanic ? 1 : 0;
    return {
      exercise: c,
      score:
        0.6 * primaryOverlap +
        0.2 * secondaryOverlap +
        0.1 * forceMatch +
        0.1 * mechanicMatch,
      primaryOverlap,
      secondaryOverlap,
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-breaker 1: level 같음 우선
    const aSameLvl = a.exercise.level === target.level ? 1 : 0;
    const bSameLvl = b.exercise.level === target.level ? 1 : 0;
    if (aSameLvl !== bSameLvl) return bSameLvl - aSameLvl;
    // Tie-breaker 2: mechanic 같음 우선
    const aSameMech = a.exercise.mechanic === target.mechanic ? 1 : 0;
    const bSameMech = b.exercise.mechanic === target.mechanic ? 1 : 0;
    if (aSameMech !== bSameMech) return bSameMech - aSameMech;
    return a.exercise.nameKo.localeCompare(b.exercise.nameKo, "ko");
  });

  return scored.slice(0, topN);
}
```

### 9.4 핵심 알고리즘 — preset-store.ts (SSR-safe)

```typescript
// 기본 골격 (Design에서 정제)
"use client";
import { useEffect, useState, useCallback } from "react";
import seedPresets from "../../data/gym-presets.json";
import type { GymPreset, DetailedEquipment } from "./types";

const STORAGE_KEY = "gym-alt-app:preset:v1";
const SEED: GymPreset[] = seedPresets as GymPreset[];
const DEFAULT_PRESET = SEED[0]!;

interface StoredState {
  version: 1;
  activeId: string;
  presets: GymPreset[];
}

const FALLBACK: StoredState = {
  version: 1,
  activeId: DEFAULT_PRESET.id,
  presets: SEED,
};

function readLS(): StoredState {
  if (typeof window === "undefined") return FALLBACK;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return FALLBACK;
    const parsed = JSON.parse(raw) as StoredState;
    if (parsed.version !== 1) return FALLBACK;
    return parsed;
  } catch {
    return FALLBACK;
  }
}

function writeLS(state: StoredState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota / private mode — 무시
  }
}

/** SSR-safe 활성 프리셋 hook. */
export function usePreset(): {
  preset: GymPreset;
  toggleEquipment: (eq: DetailedEquipment) => void;
  setEquipment: (eqs: DetailedEquipment[]) => void;
  reset: () => void;
  hydrated: boolean;
} {
  const [state, setState] = useState<StoredState>(FALLBACK); // SSR-safe initial
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readLS());
    setHydrated(true);
  }, []);

  const update = useCallback((next: StoredState) => {
    setState(next);
    writeLS(next);
  }, []);

  const preset =
    state.presets.find((p) => p.id === state.activeId) ?? DEFAULT_PRESET;

  const toggleEquipment = useCallback(
    (eq: DetailedEquipment) => {
      const current = preset.availableEquipment;
      const has = current.includes(eq);
      const updated: GymPreset = {
        ...preset,
        availableEquipment: has
          ? current.filter((e) => e !== eq)
          : [...current, eq],
      };
      update({
        ...state,
        presets: state.presets.map((p) => (p.id === preset.id ? updated : p)),
      });
    },
    [preset, state, update],
  );

  const setEquipment = useCallback(
    (eqs: DetailedEquipment[]) => {
      const updated: GymPreset = { ...preset, availableEquipment: eqs };
      update({
        ...state,
        presets: state.presets.map((p) => (p.id === preset.id ? updated : p)),
      });
    },
    [preset, state, update],
  );

  const reset = useCallback(() => {
    update(FALLBACK);
  }, [update]);

  return { preset, toggleEquipment, setEquipment, reset, hydrated };
}
```

### 9.5 사용자 추가 확인 메모 (Design에서 변경 가능)

- 모달 컴포넌트는 native `<dialog>` 사용 — focus trap, ESC 닫기, backdrop 클릭 닫기 모두 무료. iOS Safari 16+ 지원 확인됨
- 매칭 % 표시: `Math.round(primaryOverlap * 100)`% — 소수점 없이 정수만
- 추천 모달은 운동 상세 페이지에서 mount되는 Client island. RSC 페이지 자체는 변경 최소

---

## 10. Next Steps

1. [x] Plan 작성 (본 문서)
2. [ ] Design 작성 (CTO 직접)
3. [ ] Do — Phase A → B → C 순, Write 병렬화
4. [ ] Check — gap-detector + code-analyzer 또는 CTO 직접 검증
5. [ ] 사용자 결과 보고 + M5 진입 준비

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-30 | M4 초안 (옵션 A KISS, O-1~O-7 권장안 채택) | jiinbae |
