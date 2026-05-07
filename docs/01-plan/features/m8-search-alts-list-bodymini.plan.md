# M8 Search→Alternatives + List Body Mini Planning Document

> **Summary**: 검색 결과 카드에서 즉시 대체 운동 진입 + 모든 운동 리스트 카드에 "어느 부위가 자극되는지" 미니 시각화 추가. 새 화면 0, 라이브러리 0 추가. 기존 M4 추천 모달 + M5 muscle-map 재사용. M7 검색 결과·즐겨찾기·muscle bucket 목록 모두 일관 적용.
>
> **Project**: gym-alt-app
> **Author**: jiinbae (CTO)
> **Date**: 2026-05-01
> **Status**: Draft (옵션 A — KISS, 단일 마일스톤)
> **Predecessor**: [m7-search-fav-pwa.plan.md](./m7-search-fav-pwa.plan.md)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | (1) 검색은 운동 매칭만 표시 — 사용자가 "이 운동 대신 무엇을 할까?"를 보려면 카드 클릭 → 상세 진입 → "🔄 다른 기구로 대체" 버튼 클릭의 3단계가 필요. (2) 운동 리스트(검색·muscle bucket·즐겨찾기·추천)에서 부위 정보가 한국어 텍스트 배지뿐이라 한눈에 자극 부위를 파악하기 어렵다. |
| **Solution** | (1) **검색 결과 카드 인라인 "🔄" 버튼**: M4 alternatives-modal 재사용. 카드에서 한 클릭으로 대체 모달. (2) **List Body Mini**: 모든 운동 리스트 카드에 자체 작성 인라인 SVG 미니 다이어그램. 17 muscle 중 primary만 강조. react-body-highlighter는 상세 페이지 전용으로 유지 (성능 격리). |
| **Function/UX Effect** | 검색 흐름 단축 (3단계 → 2단계). 모든 리스트 카드에서 자극 부위가 즉시 시각화 (스캔 가능성 향상). 다국어 부담 감소 (한국어 부위명을 모르는 사용자도 시각적 매칭). |
| **Core Value** | 외부 의존성 0 추가. 자체 SVG 미니어처는 인라인이라 페이지 번들 영향 ≤ +5 kB. M4·M5 자산 재사용으로 신규 기능 비율 낮음. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | (1) 사용자 요청 — 검색 후 즉시 대체 운동 진입. (2) 사용자 요청 — 리스트에서 자극 부위 시각화. 한국어 운동명을 잘 모르는 일반인 사용자에게 시각 보조는 결정 시간 단축에 직결. |
| **WHO** | 단일 사용자 (jiinbae). 모바일 우선. 헬스장 현장에서 운동 결정 ~10초 안. |
| **RISK** | (1) **873 카드 동시 SVG 렌더 부담** — muscle bucket 페이지는 한 부위 max ~250개 운동 카드. (2) **모달 안에서 모달 트리거 시 z-index 충돌**. (3) **AlternativesButton이 카드 클릭 영역과 겹쳐 의도치 않은 동작**. |
| **SUCCESS** | 검색 결과 카드에서 🔄 1클릭 → 모달 열림 + 추천 5개. 모든 리스트 카드 좌측에 미니 다이어그램. typecheck 0 + build 회귀 ≤ 0 페이지, First Load JS 회귀 ≤ +10 kB. |
| **SCOPE** | F-A 검색 카드에 alternatives 인라인 버튼 + F-B List body mini SVG. 새 라우트 0, 새 라이브러리 0. |

---

## 1. Overview

### 1.1 Purpose

PRD §6.5(대체 추천) + §6.3(부위별 운동 목록) UX 다듬기. M4·M5 자산 재사용 위주의 작은 마일스톤. 사용자 직접 요청에 응답.

### 1.2 Background

**현재 (M0-M7 + /simplify 완료)**:
- 검색 결과 카드: `ExerciseListItem` — 한국어/영문 운동명 + level 배지 + 부위 텍스트 배지 + 화살표.
- 대체 추천: 운동 상세 페이지의 `AlternativesButton` → `AlternativesModal`. M4에서 구현. 모달 안에 `AlternativesList` (5개 추천 카드).
- 자극 부위 시각화: 상세 페이지의 `BodyDiagram` (react-body-highlighter, lazy load).

**왜 지금**: M7 검색 도입 후 첫 사용 피드백에서 "검색 결과에서 바로 대체 보고 싶다" + "리스트에서 부위가 한눈에 안 들어온다" 문제 식별. MVP 후 즉각 follow-up 요청.

### 1.3 핵심 결정

#### 1.3.1 검색→대체 트리거 방식 (3 옵션 비교)

| 옵션 | 설명 | 장점 | 단점 |
|---|---|---|---|
| A | 카드에 🔄 버튼 추가 (M4 모달 트리거) | 1클릭, 일관 UX | 카드 영역에 버튼 1개 추가 → 모바일 터치 경합 |
| B | 검색 모드 토글 ("매칭" vs "대체 매칭") | 검색 의도 명확 | 모드 추가 학습 비용, "대체"가 검색 input 의미와 약간 어긋남 |
| C | 단일 매칭 시 자동 대체 표시 | 매끄러움 | 매칭 0/2+ 시 동작 모호, 매칭 운동 자체를 보고 싶은 경우 방해 |

**채택**: **옵션 A** — KISS, 기존 M4 모달 100% 재사용. 모바일 터치 경합은 카드 우측 끝에 큰(min 44×44) 버튼 + 카드 본체 클릭 영역 분리로 해결.

#### 1.3.2 List body mini 시각화 방식 (4 옵션 비교)

| 옵션 | 설명 | 번들 영향 | 정확도 | 성능 (리스트 250개) |
|---|---|---|---|---|
| A | react-body-highlighter 미니어처 | 다이어그램 SVG는 dynamic chunk라 +0 kB이나 컴포넌트 mount 비용 | 17 muscle 정확 | 250개 mount 무거움 |
| B | **자체 작성 인라인 SVG** (단순 인체 실루엣 + primaryMuscle path 색칠) | +3-5 kB (SVG 마크업 + 경량 컴포넌트) | 17 muscle 매핑 가능 | 인라인 SVG는 빠름 |
| C | 7 부위 이모지/아이콘 | +1 kB | bucket 단위만 | 매우 가벼움 |
| D | 단순 컬러 도트 (부위별 색상 코드) | +0.5 kB | 컬러 학습 필요 | 매우 가벼움 |

**채택**: **옵션 B** — 정확도와 성능 균형. SVG path는 react-body-highlighter 라이브러리에서 추출/단순화 가능 (라이선스: MIT). primary 17 muscle 직접 fill 적용. 미니 사이즈(48×64 px 가량)에 anterior(앞면) only — 가독성 + 카드 폭 절약.

#### 1.3.3 적용 범위

- 검색 결과 카드 (Home의 HomeSearch): ✅ 🔄 + body mini
- muscle bucket 목록 (`/muscles/[muscle]/`): ✅ body mini만 (대체는 카드 들어가서)
- 즐겨찾기 섹션 (Home FavoritesSection): ✅ body mini만
- AlternativesList (모달 내 추천 카드): ✅ body mini만 (모달 안 모달 회피)

🔄 버튼은 **HomeSearch + muscle bucket + 즐겨찾기**에 적용. AlternativesList(모달 내)는 적용 X — 모달 in 모달 UX 혼동 회피.

---

## 2. Scope

### 2.1 In Scope

- **F-A**: 운동 리스트 카드에 인라인 alternatives 트리거 버튼 (Home 검색·muscle bucket·즐겨찾기에 노출, 모달 내부 추천 카드는 제외)
- **F-B**: 운동 리스트 카드에 미니 body diagram (모든 리스트에 일관 적용)
- 자체 작성 인라인 SVG 미니어처 (anterior 1장)
- 17 muscle path 매핑 (M5 muscle-map.ts 재사용)
- 미니 다이어그램 컬러: primary muscle 빨강, 나머지는 회색 (secondary 표시 X — 시각 단순화)
- accessibility: SVG `role="img"` + `aria-label`로 한국어 부위 나열
- 다크모드: 미니 다이어그램 베이스 컬러 다크모드 분기

### 2.2 Out of Scope

- AlternativesList(모달 내) 카드 🔄 추가 — 모달 in 모달 회피
- secondary muscle 색상 분리 (시각 단순화 우선, 추후 옵션)
- posterior(후면) 표시 (가독성 우선, 후면 한정 운동에서 정확도 손실 일부 허용)
- 운동 상세 페이지의 BodyDiagram (M5 그대로 유지)
- 새 라우트 추가
- 새 라이브러리 추가

### 2.3 Open Items

- **OI-1**: 미니 다이어그램 SVG path를 react-body-highlighter에서 추출 vs 자체 작성. 추출 시 경량화 가능, 자체 작성은 라이선스/유지보수 0. → Design 단계 결정.
- **OI-2**: 🔄 버튼이 카드 본체 Link와 겹칠 때 stopPropagation 패턴. → Design 결정.
- **OI-3**: 즐겨찾기 1개 / 검색 1개 매칭 시 미니 다이어그램이 카드 폭의 1/4를 차지 — 정보 과다 우려. → 디바이스 375px 시뮬에서 결정.

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Source |
|---|---|---|
| FR-01 | `ExerciseListItem`에 props로 `showAlternatives?: boolean` 추가. true면 카드 우측 🔄 버튼 노출 | F-A |
| FR-02 | 🔄 버튼 클릭 시 `AlternativesModal` 열림 (M4 모달 100% 재사용) | F-A |
| FR-03 | 🔄 버튼은 카드 본체 Link 클릭 영역과 분리 (event bubbling 차단) | F-A |
| FR-04 | 🔄 버튼 터치 타깃 ≥ 44×44 px (M6 기준 유지) | F-A |
| FR-05 | `BodyMini` 신규 컴포넌트 — props `primaryMuscles: MuscleGroup[]`, 단일 anterior SVG 인라인 | F-B |
| FR-06 | 17 dataset muscle → 17 SVG path id 매핑 (M5 muscle-map.ts 패턴 차용) | F-B |
| FR-07 | primary muscle은 빨강 fill, 나머지는 베이스(라이트 회색/다크 어두운 회색) | F-B |
| FR-08 | `BodyMini`는 RSC 컴포넌트 (정적 SVG, 클라이언트 상태 0) | F-B |
| FR-09 | `ExerciseListItem`이 `BodyMini`를 좌측 또는 우측에 렌더 (모바일 폭 충돌 회피) | F-B |
| FR-10 | accessibility: SVG `role="img"` + `aria-label="자극 근육: [한국어]"` | F-B |
| FR-11 | HomeSearch·muscle bucket·즐겨찾기 페이지 모두 동일 ExerciseListItem 사용 → 일관 적용 | F-A + F-B |
| FR-12 | AlternativesList 카드는 mini만 추가, 🔄 버튼 X | F-A boundary |
| FR-13 | 다크모드: 미니 다이어그램 베이스 컬러 분기 (`dark:fill-neutral-700` 등) | UX |

### 3.2 Non-Functional Requirements

- **성능**: First Load JS Home 회귀 ≤ +10 kB, exercises/muscles 회귀 ≤ +5 kB
- **빌드**: 정적 페이지 ±0 (라우트 추가 X)
- **타입 안전성**: TS strict, 17 muscle path id는 union 타입으로 컴파일 타임 검증
- **DRY**: 미니 SVG path 정의는 1곳 (`src/lib/body-mini-paths.ts`)에서 export
- **a11y**: SVG `role="img"` + 한국어 aria-label
- **모바일**: 375px 폭에서 카드 가로 스크롤 0
- **다크모드**: M6 일관성 유지

---

## 4. Success Criteria

### 4.1 Definition of Done

- 검색 결과 카드 🔄 클릭 → AlternativesModal 정상 열림
- HomeSearch·muscle bucket·즐겨찾기 모든 카드에 미니 다이어그램 표시
- primary muscle만 강조, 17 muscle 매핑 정확
- AlternativesList 카드는 미니 표시 + 🔄 X
- typecheck 0, build 성공, 정적 페이지 ±0
- First Load JS 회귀 Home ≤ +10 kB / exercises ≤ +5 kB / muscles ≤ +5 kB
- 모바일 375px 시뮬 시 가로 스크롤 0
- 다크모드 일관

### 4.2 Quality Criteria

- 미니 SVG는 인라인 (별도 fetch 0)
- AlternativesModal·useExercises·muscle-map 패턴 재사용
- 새 라이브러리 0
- 코드 추가 ≤ 250 LOC (mini paths 100 + BodyMini 컴포넌트 50 + 통합 100)

---

## 5. Risks and Mitigation

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| muscle bucket "기타" 250+ 카드 동시 인라인 SVG 렌더 부담 | Medium | Low | 인라인 SVG는 정적 마크업이라 빠름. 측정 후 필요 시 Intersection Observer lazy mount |
| 🔄 버튼이 카드 Link와 겹쳐 의도치 않은 navigate | High | Medium | 버튼 onClick에서 e.stopPropagation + e.preventDefault. Link wrap 안에서 별도 z-index |
| 미니 SVG path가 17 muscle 모두 cover 못 함 | Medium | Low | path 미정의 muscle은 베이스 컬러 유지. aria-label에 명시 |
| 카드 폭 부족 (375px viewport) | Medium | Medium | mini 폭 48px 고정, 카드 본체 flex-1로 텍스트 수축. 폭 부족 시 mini 숨김 옵션 (클래스 토글) |
| 모달 안에서 또 모달 (AlternativesList의 🔄) | High | High | AlternativesList는 `showAlternatives={false}` 명시 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| 파일 | 종류 | 변경 |
|---|---|---|
| `src/lib/body-mini-paths.ts` | 🆕 lib | 17 muscle SVG path data |
| `src/components/body-mini.tsx` | 🆕 RSC | 인라인 SVG 미니 다이어그램 |
| `src/components/exercise-list-item.tsx` | 🔄 prop 추가 | `showAlternatives` + BodyMini 통합 |
| `src/components/alternatives-list.tsx` | 🔄 호출 | `<ExerciseListItem showAlternatives={false} />` 명시 |
| `src/components/home-search.tsx` | 🔄 호출 | `showAlternatives={true}` |
| `src/components/favorites-section.tsx` | 🔄 호출 | `showAlternatives={true}` |
| `src/app/muscles/[muscle]/page.tsx` | 🔄 호출 | `showAlternatives={true}` |

총 신규 2 + 수정 5 = 7개 파일.

### 6.2 Current Consumers

`ExerciseListItem`은 5곳에서 사용 (위 표). 모든 호출 명시적 prop 전달로 동작 변경 0 보장.

`AlternativesModal`·`useExercises`·`MUSCLE_KO`·`MUSCLE_TO_LIBRARY`는 import 추가만, 시그니처 변경 0.

---

## 7. Architecture Considerations

### 7.1 Project Level

여전히 **Starter** (1 사용자, 정적 export, 백엔드 0). 본 마일스톤은 새 라이브러리 0 + 라우트 0 + 라인 수 ≤ 250 — Starter 범위 유지.

### 7.2 Key Decisions

- 자체 SVG path: react-body-highlighter는 상세에 격리, 리스트는 자체 작성 (성능·번들 격리)
- 🔄 버튼 stopPropagation 패턴
- AlternativesList는 mini만 (모달 in 모달 회피)
- BodyMini는 RSC (props 정적, 클라이언트 상태 0)

### 7.3 Folder Structure (M8 추가)

```
src/
├── lib/
│   ├── body-mini-paths.ts      🆕 SVG path data
│   └── ... (기존 동일)
├── components/
│   ├── body-mini.tsx           🆕 인라인 SVG 미니
│   ├── exercise-list-item.tsx  🔄 BodyMini + 🔄 button
│   ├── alternatives-list.tsx   🔄 showAlternatives={false}
│   ├── home-search.tsx         🔄 showAlternatives={true}
│   ├── favorites-section.tsx   🔄 showAlternatives={true}
│   └── ... (기존 동일)
└── app/
    └── muscles/[muscle]/page.tsx  🔄 showAlternatives={true}
```

---

## 8. Implementation Phases

| Phase | Task | 산출물 |
|---|---|---|
| 1 | `body-mini-paths.ts` 작성 (17 muscle path data) | path 정의 + TS 타입 |
| 2 | `body-mini.tsx` 컴포넌트 작성 (RSC, 인라인 SVG) | 미니 다이어그램 |
| 3 | `exercise-list-item.tsx` 확장 (BodyMini + 🔄 버튼 + showAlternatives prop) | 카드 신버전 |
| 4 | 호출처 4곳(home-search/favorites/muscle bucket/AlternativesList) 명시 prop 전달 | 일관 적용 |
| 5 | typecheck + dev 시나리오 검증 (375px / 다크모드 / 🔄 모달 동작) | OK |
| 6 | build 검증 + First Load JS 회귀 측정 | DoD 충족 |

---

## 9. References

- [m4-recommend-filter.plan.md](./m4-recommend-filter.plan.md) — AlternativesModal 원본
- [m5-youtube-bodymap.plan.md](./m5-youtube-bodymap.plan.md) — muscle-map 17 매핑
- [m7-search-fav-pwa.plan.md](./m7-search-fav-pwa.plan.md) — HomeSearch·FavoritesSection 호출처
- [PRD.md](../../PRD.md) §6.3 부위별 운동 목록 / §6.5 대체 추천
- [react-body-highlighter SVG path 정의](https://github.com/giavinh79/react-body-highlighter/tree/master/src/assets) — path 차용 참고 (MIT)
