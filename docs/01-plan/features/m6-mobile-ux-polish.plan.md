# M6 Mobile UX Polish Planning Document

> **Summary**: 신규 기능 0. M1-M5 산출물의 모바일 반응형·터치 타깃·다크모드 일관성·한국어 폰트·로딩/에러 상태·인터랙션 피드백을 점검·다듬기. PRD §6.7 Doumont 원칙 점검.
>
> **Project**: gym-alt-app
> **Author**: jiinbae (CTO)
> **Date**: 2026-04-30
> **Status**: Draft (옵션 A — KISS)
> **Planning Doc**: [m5-youtube-bodymap.plan.md](./m5-youtube-bodymap.plan.md)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | M5까지 기능은 모두 구현되었으나, 다양한 모바일 viewport(375-430px)에서 일관성·터치 타깃 ≥ 44px·다크모드·한국어 폰트 가독성·로딩/에러 톤을 한 번에 점검한 적이 없다. PRD §6.7 Doumont 원칙(한 화면 한 결정)도 미검증. |
| **Solution** | 신규 기능 0, refactor·polish only. 4개 viewport 매트릭스 점검 + 모든 인터랙티브 요소 min-h-11 보강 + 다크모드 누락 fix + 한국어 폰트 결정(Pretendard or Noto Sans KR via next/font) + 로딩 skeleton·에러 메시지 톤 통일. |
| **Function/UX Effect** | 시각적 일관성 + 한 손 조작 정확도 향상 + 다크모드에서도 모든 상태 식별 가능. PRD §6.7 시각/언어 결정점 단일화. |
| **Core Value** | MVP 완료 직전 단계 — 단일 사용자가 헬스장 현장에서 30초 안에 답을 얻는 경험의 최종 다듬기. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | PRD §6.7 — 모바일 우선·한 손·44pt 탭·시각 우선. M1-M5 누적 산출물의 일관성 점검은 본 단계가 첫 번째 종합 검증. |
| **WHO** | 단일 사용자, 모바일, 한 손, iOS Safari 16+/Android Chrome. 현장(헬스장) 사용 환경 — 한 손, 흔들림, 글씨 작아도 식별 가능 필요. |
| **RISK** | (1) 한국어 폰트 도입 시 First Load JS 회귀 (2) 모든 컴포넌트 다크모드 일관성 — 중복 검토 누락 가능 (3) Tailwind 클래스 변경 시 회귀(M3-M5 시각 깨짐) |
| **SUCCESS** | 4 viewport 가로 스크롤 0 + 모든 인터랙티브 ≥ 44×44 + 다크모드 시각 일관성 + 한국어 폰트 결정·적용 + 로딩/에러 톤 통일 + typecheck 0 + build 회귀 0 + First Load JS 회귀 ≤ +30 kB |
| **SCOPE** | refactor·polish only. 신규 라우트/기능 0. |

---

## 1. Overview

### 1.1 Purpose

PRD §10 마일스톤 M6 (1일). PRD §6.7 Doumont 원칙 적용 + 모바일 일관성. 본 단계 후 M7(옵션) 또는 MVP 완료.

### 1.2 Background

**현재 상태 (M5 완료)**:
- 883 정적 페이지, First Load JS 105-109 kB
- 모든 핵심 화면(/ → /muscles/* → /exercises/* → /settings/) + 추천 모달 + 다이어그램 + YouTube 동작
- M5 검증에서 `body-diagram-loader.tsx` Client wrapper 패턴 확립 (RSC + dynamic ssr:false 충돌 해결)

**왜 지금**: 신규 기능 추가 전 일관성 점검. PRD §1.5 Time-to-Answer < 15초 목표는 시각·인지 부담 최소화에 의존.

### 1.3 Related Documents

- PRD: [docs/PRD.md](../../PRD.md) §6.7 Doumont, §3.2 NFR-1~5
- M1-M5 산출물 전체

---

## 2. Scope

### 2.1 In Scope (8개 영역)

**A. 반응형 검증** (4 viewport)
- [ ] 375px (iPhone SE) — 가로 스크롤 0, 카드 그리드·다이어그램 표시
- [ ] 390px (iPhone 14) — 동일
- [ ] 430px (iPhone 15 Pro Max) — 빈 공간 활용
- [ ] 768px (iPad mini portrait) — `max-w-md`(=448px)로 좌우 여백 자연스럽게 유지

**B. 터치 타깃 크기** (PRD §6.7)
- [ ] 모든 `<button>`/`<a role="button">`에 `min-h-11` (44px) 또는 충분한 padding
- [ ] 체크박스·토글: 클릭 영역 ≥ 44px (현재 `EquipmentToggleGrid` 점검)
- [ ] 카드 (`ExerciseListItem`, recommendation card): 카드 자체가 클릭 영역, ≥ 44px
- [ ] BackLink: M3에서 `h-11` 적용 — 점검만
- [ ] AlternativesButton/YoutubeLinkButton: M4-M5에서 `min-h-11` 적용 — 점검만
- [ ] AlternativesModal 닫기 버튼: ✕ 11×11 — 보강 필요할 가능성

**C. 다크모드 일관성**
- [ ] BodyDiagram wrapper `dark:bg-neutral-100` 어색 — 다크모드에서도 자연스러운 배경
- [ ] 모든 카드 `dark:bg-neutral-950 + dark:border-neutral-800` 일관성 검토
- [ ] 모달 backdrop `bg-black/40` — 다크모드에서도 OK
- [ ] 추천 카드 매칭 % 배지 다크모드 텍스트 대비
- [ ] 토글 그리드 활성/비활성 다크모드 색상

**D. 한국어 폰트 도입 결정**
- [ ] 시스템 폰트 (현재) 가독성 평가
- [ ] Pretendard (한국어 최적화 무료) 또는 Noto Sans KR via `next/font/google` 도입 검토
- [ ] First Load JS 영향 측정 (next/font는 self-host + woff2 subset)
- [ ] **결정**: 도입 vs 미도입 — Plan 단계에 권장안 명시 (아래 Open Items O-1)

**E. 로딩 상태 일관성**
- [ ] BodyDiagramLoader의 `animate-pulse` 2개 — 현재 적절
- [ ] AlternativesModal lazy chunk 로딩 — 첫 클릭 시 chunk fetch 동안 빈 상태? 사용자 검증
- [ ] usePreset hydrated=false 동안 표시되는 "설정 동기화 중..." — 삭제 또는 재구성 (대부분 사용자가 인지하기 전 끝남)
- [ ] ExerciseImage 로드 중 `bg-neutral-100` 빈 박스 — placeholder 명확화

**F. 에러/빈 상태 메시지 톤 통일**
- [ ] `/muscles/wrong/` 404 — Next.js 기본 vs 커스텀 `not-found.tsx` 도입 (KISS — 도입 X 권장, 기본 유지)
- [ ] 추천 모달 "가용 기구를 1개 이상 선택해 주세요" (M4) — OK
- [ ] 추천 모달 "조건에 맞는 운동이 없습니다" (M4) — OK
- [ ] settings 모든 토글 끄면 안내? — 현재 없음. 추가 검토
- [ ] ExerciseImage 로드 실패 fallback — M3에서 OK
- [ ] 톤 통일: 모두 친절·중립 한국어 (반말/존댓말 통일 — 현재 존댓말)

**G. 간격·여백·타이포그래피 위계**
- [ ] 모든 페이지 `max-w-md px-4` 일관 (현재 OK 추정)
- [ ] h1 `text-2xl font-bold` 일관 (M3-M5 OK)
- [ ] h2/h3 `text-sm font-semibold` 또는 `text-xs uppercase` 일관성 점검
- [ ] 한국어 line-height 적정 (`leading-relaxed` for instructions)
- [ ] 운동 상세 섹션 간 `space-y-6` — 모바일에서 너무 넓지 않은지 점검

**H. 인터랙션 피드백**
- [ ] hover state는 모바일에선 의미 적음. focus-visible 우선
- [ ] active state (`active:bg-*`, `active:scale-*`) 일관성 — M3-M5에서 일부 적용
- [ ] 토글 전환 transition 일관 (현재 `transition`만 적용)
- [ ] focus-visible ring (Tailwind) — 키보드 접근성 (선택, 단일 사용자라 후순위)

**I. PRD §6.7 Doumont 원칙 점검**
- [ ] 한 화면 결정점 ≤ 1개 — 각 화면 점검:
  - `/`: 부위 카드 클릭 또는 ⚙️ 설정 — 결정점 2개 (허용 — Home은 hub)
  - `/muscles/*`: 운동 카드 클릭만 (결정점 1) — OK
  - `/exercises/*`: 다이어그램 보기 + 이미지 + 설명 + YouTube + 추천 — 정보 위계는 명확하나 결정점 다수. **결정점은 "다음 행동" 기준 — YouTube 클릭 / 🔄 클릭 / 뒤로가기 3개**. fold 안에 들어가는지 점검
  - `/settings/`: 토글 + 리셋 — 결정점 다수이지만 모두 같은 종류 (가용 기구 편집)

### 2.2 Out of Scope

- ❌ 새 기능 추가 (검색·즐겨찾기 등은 M7)
- ❌ E2E 테스트 셋업 (Playwright 등)
- ❌ accessibility 풀 감사 (WCAG AA 등 — M7 옵션)
- ❌ 성능 최적화 (이미 충분 — First Load 105 kB)
- ❌ 디자인 시스템 도큐먼트 (단일 사용자라 YAGNI)
- ❌ 컬러 팔레트 변경 (M5까지 사용한 neutral/red/amber/blue 유지)

### 2.3 Open Items (Plan에서 사용자 확정 필요)

| ID | 질문 | 권장 | 결정 |
|----|------|------|:----:|
| O-1 | 한국어 폰트 도입 | **Pretendard via `next/font/local`** 도입 권장. 이유: (1) 헬스장 현장에서 흔들리는 글자 읽기 — 가독성 중요, (2) `next/font` self-host로 외부 CDN 의존 0, (3) subset(latin + korean)으로 First Load 영향 ≈ 20-30 kB 예상. 미도입 시 시스템 폰트(애플 SD고딕 + Noto)로 충분하다는 평가도 가능 — **본 Plan은 Pretendard 도입 채택** | 권장 채택 |
| O-2 | Pretendard 패키지 | npm `pretendard` 패키지(폰트 파일 포함, MIT) 또는 GitHub release woff2 직접 다운로드 → `public/fonts/`. **권장**: npm 패키지 (`@fontsource-variable/pretendard` 또는 `pretendard`) — lock 가능, `next/font/local` import 가능 | 권장 채택 |
| O-3 | BodyDiagram 다크모드 배경 | `dark:bg-neutral-100`(현재) 어색 → **`dark:bg-neutral-200` 유지**(SVG 식별성 보존) 또는 wrapper 자체 배경 제거 + SVG bodyColor만 darker tone. **권장**: light bg는 SVG 자체 식별성에 필요. wrapper만 `dark:bg-neutral-200`로 약간 어둡게 (변화 거의 없음, 콘텐츠 영역과 부조화 줄임) | 권장 채택 |
| O-4 | 추천 모달 닫기 버튼 (✕) 크기 | M4에서 `h-11 w-11` 이미 적용됨 — 점검만 | 점검 |
| O-5 | settings 모든 토글 끄기 안내 메시지 | 현재 없음 → **추가**: 카운터 0/20일 때 "최소 1개 이상 선택을 권장합니다" 작은 메시지 | 권장 채택 |
| O-6 | hydrated=false 안내 메시지 ("설정 동기화 중...") | 현재 표시 → **삭제**. 첫 페인트와 mount 사이가 거의 즉시라 노이즈 | 권장 채택 (제거) |
| O-7 | usePreset에서 LocalStorage write 실패 시 사용자 안내 | 현재 silent fail (Design 결정) — KISS 유지 | 유지 |
| O-8 | iPad portrait(768px) 추가 대응 | 현재 `max-w-md`(=448px)로 자연스러운 좌우 여백 — 추가 작업 X | 유지 |

> **본 Plan은 위 8개 권장안 채택 전제**.

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Pretendard 폰트 도입 (npm + `next/font/local`), `layout.tsx`에서 `body className` 또는 `<html>` font 적용 | High | Pending |
| FR-02 | `globals.css` font-family 스택을 Pretendard 우선으로 변경 | High | Pending |
| FR-03 | 모든 페이지 375px viewport에서 가로 스크롤 0 (시각 검증) | High | Pending |
| FR-04 | 모든 인터랙티브 요소(버튼·링크·체크박스·카드) ≥ 44×44 px | High | Pending |
| FR-05 | BodyDiagram wrapper 다크모드 배경 자연스럽게 (`dark:bg-neutral-200`) | Medium | Pending |
| FR-06 | hydrated=false "설정 동기화 중..." 메시지 제거 (preset-store, alternatives-modal) | Low | Pending |
| FR-07 | settings 페이지 카운터 0/20일 때 안내 메시지 추가 | Low | Pending |
| FR-08 | 모든 페이지 다크모드 색상 검토 — 누락된 `dark:*` variant 보강 | Medium | Pending |
| FR-09 | 인터랙션 피드백 일관성 — `active:scale-[0.98]` 또는 `active:bg-*` 누락된 곳 보강 | Low | Pending |
| FR-10 | 운동 상세 이미지 grid: 모바일에서 가독성 — 현재 `grid-cols-2` 유지 OR 단일 column 변경 결정 | Low | Pending |
| FR-11 | h1/h2/h3 위계 일관 — 모든 화면 동일 패턴 사용 | Low | Pending |
| FR-12 | focus-visible ring 일관 (Tailwind `focus-visible:ring-2`) — 인터랙티브 요소 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Build success | exit 0, 정적 페이지 회귀 0 | `npm run build` |
| Bundle size | First Load JS 회귀 ≤ +30 kB (Pretendard 도입분) | Next.js summary |
| Type safety | 0 errors | `tsc --noEmit` |
| Viewport 호환 | 375 / 390 / 430 / 768 px 가로 스크롤 0 | DevTools 시각 |
| 다크모드 | 모든 페이지/컴포넌트 다크모드 시각 일관 | DevTools 시각 |
| 폰트 가독성 | 한국어 본문 16px 기본, 헤더 정보 위계 명확 | 사용자 평가 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] Pretendard 도입 완료, `npm run build` 성공
- [ ] 4 viewport (375/390/430/768) 가로 스크롤 0
- [ ] 모든 버튼/토글/카드 ≥ 44×44 px
- [ ] 다크모드 누락 fix 적용
- [ ] hydrated 안내 메시지 제거, settings 0/20 안내 추가
- [ ] `npm run typecheck` 0 errors
- [ ] `npm run build` 정적 페이지 883 → 883 (회귀 0)
- [ ] First Load JS 회귀 ≤ +30 kB
- [ ] gap-detector + code-analyzer 검토 결과 Critical 0건

### 4.2 Quality Criteria

- [ ] 다크/라이트 모드 전환 시 깜빡임·시각 회귀 0
- [ ] 한국어 폰트 적용 후 모든 텍스트 정상 표시 (글자 깨짐 0)
- [ ] M3-M5 시각 회귀 0 (운동 목록·상세·추천 모달·설정)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Pretendard subset 누락으로 한자/특수문자 깨짐 | Medium | Low | `next/font/local` + woff2 subset 권장 fallback (system 폰트 chain) 보강 |
| `next/font/local` 설정 오류 → 빌드 실패 | High | Low | M5 dynamic 패턴처럼 단계적 적용 — Plan/Design에 정확 코드 명시 |
| 다크모드 변경 시 일부 페이지 시각 회귀 | Medium | Medium | 변경은 최소 — 명확히 어색한 부분(BodyDiagram wrapper)만 fix |
| 폰트 도입으로 First Load JS 30 kB 초과 | Medium | Medium | 측정 후 초과 시 폰트 weight 축소 (Bold만) 또는 미도입으로 회귀 |
| Tailwind class 변경 → JIT 미스 → 시각 미적용 | Low | Low | Tailwind config의 content path는 M2부터 적절. 추가 변경 X |
| dev 중 build 실행 → cache 충돌 (운영 노트) | Medium | Medium | Check 마지막에만 build, 그 후 .next 정리 + dev 재시작 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `package.json` | Existing | `pretendard` 또는 `@fontsource-variable/pretendard` 추가 |
| `src/app/layout.tsx` | Existing | `next/font/local` 또는 `next/font/google` 적용 |
| `src/app/globals.css` | Existing | font-family 스택 갱신 |
| `src/components/body-diagram.tsx` | Existing | `dark:bg-neutral-100` → `dark:bg-neutral-200` |
| `src/components/alternatives-modal.tsx` | Existing | "설정 동기화 중..." 제거 |
| `src/app/settings/page.tsx` | Existing | "설정 동기화 중..." 제거 + 0/20 안내 추가 |
| (그 외 컴포넌트) | Existing | 다크모드 누락 / min-h-11 / active state 미세 보강 |

**총 수정 약 6-8개 파일, 신규 0개**.

### 6.2 Current Consumers

본 단계는 모든 화면의 consumer. 각 화면은 변경 영향 받음 — 시각 회귀 점검 필요.

### 6.3 Verification

- [ ] M3 부위 그리드, 운동 목록 시각 회귀 0
- [ ] M4 추천 모달, settings 시각 회귀 0
- [ ] M5 다이어그램, YouTube 버튼 시각 회귀 0

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Selected |
|-------|:--------:|
| Starter | ✅ (M1-M5 동일) |

### 7.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| 폰트 도입 방식 | `next/font/local` + `pretendard` npm | self-host, CDN 의존 0, woff2 자동 최적화 |
| 폰트 weight | 400/600/700 (regular/semibold/bold) | KISS — 사용 weight만 |
| variable font | Yes (Pretendard Variable) | weight 분리 시 파일 N개. variable이 단순 |
| 다크모드 SVG 처리 | wrapper bg만 어둡게 | SVG는 light bg에서 식별성 우선 |
| focus-visible | 보강 | 키보드 단일 사용자라도 a11y 기본 가치 |

### 7.3 Folder Structure (M6 신규 폴더)

```
public/
└── fonts/                              🆕 (npm 패키지 사용 시 미사용)
src/
├── app/
│   ├── layout.tsx                      🔄
│   └── globals.css                     🔄
├── components/
│   ├── body-diagram.tsx                🔄
│   ├── alternatives-modal.tsx          🔄
│   └── (그 외 미세 수정)
└── (lib 변경 없음)
```

---

## 8. Convention Prerequisites

### 8.1 Existing (M1-M5)

(그대로 유지)

### 8.2 신규 Conventions

| Category | Define |
|----------|--------|
| 폰트 변수 | `--font-pretendard` CSS variable (next/font 기본 패턴) |
| 폰트 적용 위치 | `<html className={pretendard.variable}>` 또는 `<body className={pretendard.className}>` |
| 폰트 fallback | system-ui → Apple SD Gothic Neo → Pretendard (Pretendard가 fallback에 있어야 fontsource 미로드 시 대비) |

---

## 9. Implementation Strategy

### 9.1 단계 구성 (옵션 A — KISS)

| 단계 | 산출물 | 담당 |
|------|--------|------|
| **Plan** | 본 문서 | CTO ✅ |
| **Design** | `m6-mobile-ux-polish.design.md` | CTO 직접 |
| **Do** | font + 다크모드 + min-h + 메시지 정리 + active state | CTO 직접 |
| **Check** | 정적 자체 검토 + 사용자 viewport 검증 | 본 세션 |
| **Report** | 사용자 요약 + M7 또는 MVP 완료 | 본 세션 |

### 9.2 핵심 코드 — Pretendard 도입

```typescript
// src/app/layout.tsx (요지)
import localFont from "next/font/local";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920", // variable font range
  variable: "--font-pretendard",
});

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="font-sans ...">{children}</body>
    </html>
  );
}
```

```js
// tailwind.config.ts 신규 fontFamily
theme: {
  extend: {
    fontFamily: {
      sans: ["var(--font-pretendard)", "system-ui", "Apple SD Gothic Neo", ...defaultFontFamilyStack],
    },
  },
},
```

> **검증 필요**: `pretendard` npm 패키지의 정확 woff2 경로. Do 단계에서 `npm install pretendard` 후 `node_modules/pretendard/dist/web/variable/woff2/` 확인.

### 9.3 핵심 변경 — 다크모드 / 메시지 정리

```tsx
// body-diagram.tsx
- className="grid grid-cols-2 gap-2 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-100"
+ className="grid grid-cols-2 gap-2 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-200"

// alternatives-modal.tsx — 제거
- {!hydrated && (<p className="...">설정 동기화 중...</p>)}

// settings/page.tsx — 제거 + 추가
- {!hydrated && (<p className="...">설정 동기화 중...</p>)}
+ {count === 0 && (<p className="text-xs text-amber-700 dark:text-amber-400">최소 1개 이상 기구 선택을 권장합니다</p>)}
```

---

## 10. Next Steps

1. [x] Plan 작성
2. [ ] Design 작성 (CTO)
3. [ ] `npm install pretendard` (사용자 직접) + Do 단계 코드 변경
4. [ ] Check — 사용자 viewport + dark mode 시각 검증
5. [ ] M7 옵션 또는 MVP 완료 보고

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-30 | M6 초안 — Pretendard 도입, 다크모드 fix, 다듬기 only | jiinbae |
