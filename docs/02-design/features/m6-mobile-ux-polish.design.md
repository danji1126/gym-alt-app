# M6 Mobile UX Polish Design Document

> **Summary**: Pretendard `next/font/local` 도입 + 다크모드 시각 일관 fix + 메시지 톤 정리. 신규 기능 0, refactor·polish only.
>
> **Project**: gym-alt-app
> **Author**: jiinbae (CTO)
> **Date**: 2026-04-30
> **Status**: Draft (옵션 A — KISS)
> **Planning Doc**: [m6-mobile-ux-polish.plan.md](../../01-plan/features/m6-mobile-ux-polish.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | PRD §6.7 — 모바일 일관성·44pt 탭·시각 우선. M1-M5 누적 산출물의 첫 종합 검증 |
| **WHO** | 단일 사용자, 모바일, 한 손, iOS Safari 16+/Android Chrome |
| **RISK** | Pretendard 도입 시 First Load JS 회귀 / 다크모드 변경 시각 회귀 / Tailwind class 변경 회귀 |
| **SUCCESS** | 4 viewport 가로 스크롤 0 + ≥ 44×44 + 다크모드 일관 + 폰트 적용 + 톤 통일 + typecheck 0 + build 회귀 0 + JS ≤ +30 kB |
| **SCOPE** | refactor·polish only |

---

## 1. Overview

### 1.1 Goals

1. Pretendard 도입으로 한국어 가독성 향상 (헬스장 현장 흔들림·작은 글씨 대비)
2. 다크모드 어색한 부분 fix (BodyDiagram wrapper, hydrated 안내 메시지)
3. settings 빈 상태 안내 추가
4. 시각 회귀 0 — M3-M5 누적 산출물 보존

### 1.2 Principles

- **변경 최소화**: 명백히 어색하거나 누락된 것만. 임의 디자인 변경 X
- **검증 가능**: 각 변경에 대한 시각 검증 시나리오 명시 (Section 8)
- **회귀 안전**: dev hot reload로 즉시 확인, 문제 시 즉시 되돌림

---

## 2. Architecture Options

| Criteria | Option A: Minimal | Option B: Full Polish | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | font 도입만, 다크모드 그대로 | font + 다크모드 + 모든 컴포넌트 detail 다듬기 | font + 명백한 다크모드 fix + 메시지 정리 |
| **Files Modified** | 3 | 12+ | 6-8 |
| **Risk** | 한국어 가독성 미해결 | 회귀 위험 큼 | Low |
| **Recommendation** | 시간 압박 시 | 디자인 완벽주의 | **default 채택** |

**Selected**: **Option C — Pragmatic Polish**
**Rationale**: PRD G1(현장 30초 도달)에 직접 영향 주는 변경만 수행. 임의 디자인 변경 회귀 회피.

---

## 3. Data Model / 4. API

해당 없음 (UI polish).

---

## 5. UI/UX Design

### 5.1 변경 항목

#### 5.1.1 Pretendard 폰트 적용

**Before**: `globals.css`의 system font stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", system-ui, sans-serif;
```

**After**: `next/font/local`로 Pretendard self-host, Tailwind `font-sans` 토큰 갱신

```typescript
// src/app/layout.tsx
import localFont from "next/font/local";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

// <html className={pretendard.variable}>
// <body className="font-sans ...">
```

```typescript
// tailwind.config.ts
fontFamily: {
  sans: [
    "var(--font-pretendard)",
    "-apple-system",
    "BlinkMacSystemFont",
    "Apple SD Gothic Neo",
    "system-ui",
    "sans-serif",
  ],
},
```

`globals.css`에서는 `body { font-family }` 제거 (Tailwind가 담당).

#### 5.1.2 BodyDiagram 다크모드 wrapper

**Before**:
```tsx
<div className="grid grid-cols-2 gap-2 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-100">
```

**After**:
```tsx
<div className="grid grid-cols-2 gap-2 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-200">
```

이유: 다크모드 페이지 본문 배경은 `dark:bg-neutral-950`. 그 위에 `dark:bg-neutral-100`은 너무 밝아 부조화. `neutral-200`은 약간 어둡지만 SVG 식별성 유지.

#### 5.1.3 hydrated 안내 메시지 제거

`alternatives-modal.tsx` line ~95, `settings/page.tsx` line ~44 두 곳에서 제거:
```tsx
- {!hydrated && (<p className="...">설정 동기화 중...</p>)}
```

이유: mount 즉시 LS 동기화 — 사용자가 인지하기 전 끝남. 노이즈.

#### 5.1.4 settings 빈 상태 안내

`settings/page.tsx` 카운터 영역 옆에 조건부 메시지:
```tsx
{count === 0 && (
  <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
    최소 1개 이상 기구 선택을 권장합니다
  </p>
)}
```

#### 5.1.5 미세 보강 (선택)

- **운동 상세 이미지 grid**: 모바일 375px에서 각 이미지 ~165px. 작지만 식별 가능 — **유지** (변경 X). 단 이미지 비율(`aspect-video`)이 가로로 길어 작아도 동작 식별 가능
- **카드 active state**: 이미 M3에서 `active:bg-neutral-100` 적용 — 유지
- **focus-visible**: 추가 변경 없이 Tailwind 기본 `focus-visible:outline-none` 만 일부 적용됨. 키보드 접근성은 단일 사용자 후순위 — 변경 0

### 5.2 변경 항목 표

| Category | File | Line(s) | Change |
|----------|------|---------|--------|
| Font | `package.json` | deps | `pretendard` 추가 |
| Font | `src/app/layout.tsx` | top | `next/font/local` import + variable + html className |
| Font | `tailwind.config.ts` | theme.extend | fontFamily.sans = [pretendard, ...] |
| Font | `src/app/globals.css` | body | font-family 제거 |
| Dark | `src/components/body-diagram.tsx` | wrapper | `dark:bg-neutral-100` → `dark:bg-neutral-200` |
| Tone | `src/components/alternatives-modal.tsx` | hydrated msg | 제거 |
| Tone | `src/app/settings/page.tsx` | hydrated msg + 빈 상태 | 제거 + 추가 |

**총 7개 파일 수정, 신규 0개, 삭제 0개**.

### 5.3 변경 안 되는 항목 (회귀 방지)

- 모든 컴포넌트의 layout/spacing class
- 모든 페이지의 `max-w-md px-4 py-*` 일관 패턴
- 색상 토큰 (red-600/amber-500/blue-600)
- 인터랙션 active state
- 이미지 grid (M3)
- 모달 backdrop opacity
- Loading skeleton 패턴

---

## 6. Error Handling

| Scenario | Handling |
|----------|----------|
| Pretendard woff2 경로 오류 → 빌드 실패 | dev hot reload에서 즉시 catch. fallback: system font stack이 있어 무도음 시각엔 무해 |
| `pretendard` npm 패키지 미설치 → import 실패 | `npm install pretendard` 사용자 수행. 실패 시 woff2 경로 변경 또는 미도입 결정 |
| 다크모드 `neutral-200` 시각 회귀 | dev hot reload 즉시 시각 평가, 부족 시 `neutral-300` 등 인접 토큰 시도 |

---

## 7. Security

해당 없음. 폰트는 self-host로 외부 CDN 의존 0.

---

## 8. Test Plan

### 8.1 Manual Verification (사용자 수행)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | dev server hot reload `/` | Pretendard 폰트 적용, 한국어 글자 둥근 형태 |
| 2 | DevTools → Toggle device → 375px (iPhone SE) | 모든 페이지 가로 스크롤 0 |
| 3 | DevTools → 390 / 430 / 768px | 동일 |
| 4 | 운동 상세 다크모드 | BodyDiagram wrapper가 `neutral-950` 배경과 자연스럽게 분리 (이전 `neutral-100` 대비) |
| 5 | 모달 첫 클릭 (lazy chunk) | 빈 상태 또는 placeholder 출현 — "설정 동기화 중..." 메시지 X |
| 6 | settings 모든 토글 끔 | "최소 1개 이상..." amber 메시지 노출 |
| 7 | settings 토글 1개 켬 | 메시지 사라짐 |
| 8 | iOS Safari 다크모드 (system) | 모든 화면 다크모드 적용 |
| 9 | 한국어 본문 라인 높이 | 16px 본문 + leading-relaxed 적정 |

### 8.2 정적 검증

| # | Target | Expected |
|---|--------|----------|
| 1 | `npm run typecheck` | 0 errors |
| 2 | `npm run build` (Check 단계 마지막에만) | 정적 페이지 883 → 883 |
| 3 | Build summary First Load JS | / 106 → 106-130 kB (폰트 +20-30 kB 가능) |

---

## 9-10. Clean Architecture / Convention

(M1-M5 그대로 유지. 신규 컨벤션은 폰트 변수 `--font-pretendard`만)

---

## 11. Implementation Guide

### 11.1 Implementation Order

**Phase A — 폰트 설치 + 적용**
1. [ ] `npm install pretendard` (사용자 수행)
2. [ ] `src/app/layout.tsx` — next/font/local import
3. [ ] `tailwind.config.ts` — fontFamily.sans 갱신
4. [ ] `src/app/globals.css` — body font-family 제거

**Phase B — 다크모드 + 메시지 정리**
5. [ ] `src/components/body-diagram.tsx` — wrapper dark bg
6. [ ] `src/components/alternatives-modal.tsx` — hydrated msg 제거
7. [ ] `src/app/settings/page.tsx` — hydrated msg 제거 + 빈 상태 안내 추가

**Phase C — 검증**
8. [ ] dev hot reload 시각 점검
9. [ ] 사용자 viewport 매트릭스 검증
10. [ ] 마지막에만 `npm run typecheck` + `npm run build`

### 11.2 Session Guide

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| (current) | Plan + Design | 전체 | 작성 완료 |
| (current) | Do | A → B → C | 8-12 |
| (current) | Check | 정적 + 시각 가이드 | 3 |
| (current) | Report | 사용자 요약 | 2 |

---

## 12. Open Questions for Do Phase

| ID | Question | 즉시 결정 |
|----|----------|----------|
| D-1 | next/font/local src 경로 — `node_modules/`에서 직접 import OK? | Next.js 15 OK 확인. 단 `../../node_modules/...` 또는 절대 경로 시도 |
| D-2 | Pretendard variable font weight 범위 `45 920`이 정확한가 | 공식 문서 권장값 — 그대로 사용 |
| D-3 | `display: "swap"` vs "block" | "swap" — FOIT 방지, 빠른 첫 페인트 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-30 | M6 Design — Option C, 7개 파일 수정 | jiinbae |
