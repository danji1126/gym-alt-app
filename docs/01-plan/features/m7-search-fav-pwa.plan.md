# M7 Search + Favorites + PWA Manifest Planning Document

> **Summary**: F-7 검색 + F-8 즐겨찾기 + F-9 PWA(manifest only). KISS — Service Worker는 후순위 처리, 정적 export + Next.js 15 Turbopack 호환성 문제 회피.
>
> **Project**: gym-alt-app
> **Author**: jiinbae (CTO)
> **Date**: 2026-04-30
> **Status**: Draft (옵션 A — KISS, M7 + /simplify 연속 진행)
> **Planning Doc**: [m6-mobile-ux-polish.plan.md](./m6-mobile-ux-polish.plan.md)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | M6까지 모든 핵심 기능 + UX 다듬기 완료. 단 (1) 873 운동 중 특정 운동을 빠르게 찾는 검색 부재, (2) 자주 쓰는 운동의 빠른 진입(즐겨찾기) 부재, (3) 모바일 "홈 화면에 추가" 미지원. |
| **Solution** | Home 인라인 검색 input(클라이언트 메모리 필터, 디바운스) + 운동 상세에 ☆/★ 토글(LocalStorage hook) + Home에 즐겨찾기 섹션 + manifest.json + SVG/PNG 아이콘. **Service Worker 풀 구현은 후순위 처리** — 정적 export + Next 15 Turbopack 호환성 + KISS. |
| **Function/UX Effect** | 한국어/영문 운동명 검색 가능 + 즐겨찾기 빠른 진입 + 모바일 브라우저에서 "홈 추가" 가능. |
| **Core Value** | MVP 마지막 기능 마일스톤. 외부 의존성 0 추가 (manifest는 정적 JSON, icon은 SVG). LocalStorage 패턴은 M4 preset-store 재사용 (DRY 후보 → /simplify에서 통합 검토). |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | PRD §3.1 F-7/F-8/F-9 — 검색·즐겨찾기는 사용 빈도 높은 운동 빠른 진입. PWA는 모바일 첫 화면 진입 단축 |
| **WHO** | 단일 사용자. 모바일 우선. 설치 후엔 브라우저 UI 없이 앱처럼 사용 |
| **RISK** | (1) Service Worker가 정적 export + Turbopack과 호환 어려움 → SW 제외 결정 (2) 즐겨찾기·preset-store LS hook 중복 → /simplify에서 통합 (3) 검색 디바운스 unmount race condition |
| **SUCCESS** | 검색 한국어/영문 매칭 + 즐겨찾기 토글·표시 + manifest.json 노출(`<link rel="manifest">`) + 아이콘 192/512 + typecheck 0 + build 회귀 ≤ +1 페이지 + First Load JS 회귀 ≤ +30 kB |
| **SCOPE** | F-7 (검색), F-8 (즐겨찾기), F-9 (manifest only — SW 후순위) |

---

## 1. Overview

### 1.1 Purpose

PRD §10 M7 (1.5일). PRD F-7/F-8/F-9 충족. **MVP 마지막 마일스톤**. 본 단계 후 /simplify(코드 정리) → MVP 완료 보고.

### 1.2 Background

**현재 (M6 완료)**: 882 정적 HTML, 5 라우트(/, /muscles/[7], /exercises/[873], /settings/), Pretendard 폰트, 다크모드 일관, First Load JS 105-109 kB.

**왜 지금**: F-7 검색은 873개 운동 늘어날수록 가치 큼. F-8 즐겨찾기는 사용 패턴 파악 후 자동화 가능. F-9 PWA는 모바일 첫 진입 단축 (브라우저 주소창 없이 풀스크린).

### 1.3 PWA 도입 결정 (Service Worker 제외)

- **next-pwa**: 2년 미유지보수 + Next 15 Turbopack 비호환
- **Serwist (`@serwist/next`)**: Turbopack 호환 + next-pwa 후계자, 그러나 신규 의존성 + 정적 export에서 cache strategy 복잡 + 외부 GitHub 이미지 cache는 별도 설정 필요
- **본 결정**: **manifest.json + 아이콘만**. `<link rel="manifest">` 추가로 모바일 "홈 화면에 추가" 가능. SW 풀 구현은 향후 별도 마일스톤 또는 Cloudflare Pages SW와 통합 검토. KISS.

---

## 2. Scope

### 2.1 In Scope

**F-7 검색 (Home 인라인)**
- [ ] `src/lib/search-index.ts` — 정규화(공백/하이픈/언더스코어 제거, lowercase) + nameKo/nameEn 모두 매칭
- [ ] `src/components/search-input.tsx` — Client. controlled input + 디바운스 150ms
- [ ] `src/components/search-results.tsx` — Client. 검색어에 따라 ExerciseListItem 재사용 표시
- [ ] Home에 검색 input + 결과 영역 (placeholder M6 자리 활용)
- [ ] 빈 검색어 → 결과 영역 hidden, 검색어 있으면 부위 그리드 hidden, 결과만 표시 (UX 단순화)

**F-8 즐겨찾기**
- [ ] `src/lib/favorite-store.ts` — SSR-safe LocalStorage hook (preset-store와 같은 패턴, /simplify에서 generic화 검토)
- [ ] `src/components/favorite-button.tsx` — Client. ☆/★ 토글
- [ ] `src/components/favorites-section.tsx` — Client. Home에서 LS 읽어 즐겨찾기 운동 카드 표시
- [ ] 운동 상세 페이지에 favorite-button 통합 (alternatives-button 옆 또는 헤더 근처)
- [ ] Home의 placeholder "최근 본 운동"을 "즐겨찾기"로 대체
- [ ] 즐겨찾기 0개 빈 상태 안내

**F-9 PWA Manifest (SW 제외)**
- [ ] `public/manifest.json` — 한국어 name, short_name, theme_color, background_color, icons
- [ ] `public/icon.svg` 또는 `public/icon-192.png` + `public/icon-512.png` — 단순 텍스트 기반 (예: 다크 배경 + "💪" 또는 흰 글자 "g")
- [ ] `layout.tsx` metadata.manifest 추가 + theme-color meta
- [ ] **Service Worker는 도입 X** (이유는 Background §1.3)

### 2.2 Out of Scope

- ❌ Service Worker (offline cache) — 별도 마일스톤
- ❌ Push notification — 단일 사용자, 가치 적음
- ❌ App icon 디자인 (전문 디자인) — 단순 SVG/텍스트로 충분
- ❌ Universal favorite (운동·부위 동시) — 운동만 즐겨찾기
- ❌ 검색 결과 정렬 옵션 (level/이름순 등) — 매칭 점수 기본 정렬만
- ❌ 검색어 자동완성 — KISS

### 2.3 Open Items

| ID | 질문 | 권장 | 결정 |
|----|------|------|:----:|
| O-1 | 검색 라우트 vs Home 인라인 | **Home 인라인** — 라우트 추가 X, max-w-md 안에서 placeholder 자리 활용. 검색어 있으면 부위 그리드 숨김 | 권장 채택 |
| O-2 | 디바운스 라이브러리 | **자체 구현** — `setTimeout` + cleanup으로 충분. lodash 등 의존성 추가 X | 권장 채택 |
| O-3 | 검색 정규화 범위 | 공백/하이픈/언더스코어/대소문자 정규화 후 substring match. Levenshtein 등 fuzzy는 YAGNI | 권장 채택 |
| O-4 | 즐겨찾기 LS 키 | `gym-alt-app:favorites:v1` (preset-store와 다른 namespace) | 권장 채택 |
| O-5 | favorite-button 위치 | 운동 상세 페이지 헤더(h1 옆) — 가시성 우선 | 권장 채택 |
| O-6 | 아이콘 형식 | SVG 단일 + PNG fallback. PWA 표준은 PNG 권장이라 SVG는 보조. 단순화 위해 **PNG 192/512만 작성**. SVG 단순 도형 코드로 작성 후 PNG 변환은 사용자 수동(또는 inline data URI) | 권장 — PNG 2개 작성, 단순 도형 |
| O-7 | manifest theme_color | M6 적용한 light 모드 기준 `#ffffff` (background) + theme `#dc2626`(red-600, action color) 또는 `#171717`(neutral-900) | 권장: theme `#171717`, bg `#ffffff` (다크/라이트 자동 대응) |
| O-8 | 즐겨찾기 빈 상태 메시지 | "운동 상세에서 ☆를 눌러 즐겨찾기에 추가하세요" 친절 안내 | 권장 채택 |

> **본 Plan은 위 8개 권장안 채택 전제**.

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `searchExercises(query, exercises)` — 정규화 후 nameKo + nameEn substring 매칭 | High | Pending |
| FR-02 | 매칭 점수: nameKo 정확 > nameEn 정확 > nameKo 부분 > nameEn 부분 (간단 가중치) | Medium | Pending |
| FR-03 | Home에 검색 input — 디바운스 150ms, 검색어 입력 시 부위 그리드 숨김 + 결과 영역 노출 | High | Pending |
| FR-04 | 검색 결과 0건 안내 메시지 | Low | Pending |
| FR-05 | 검색 결과 카드 클릭 → 운동 상세 이동 (ExerciseListItem 재사용) | High | Pending |
| FR-06 | `useFavorites()` SSR-safe LocalStorage hook (toggle, has, list) | High | Pending |
| FR-07 | `<FavoriteButton exerciseId>` ☆ ↔ ★ 토글 | High | Pending |
| FR-08 | 운동 상세 페이지 헤더 옆에 favorite-button 배치 | High | Pending |
| FR-09 | Home에 "즐겨찾기" 섹션 — 즐겨찾기 운동 카드 N개 표시 | High | Pending |
| FR-10 | 즐겨찾기 0개 빈 상태 안내 | Medium | Pending |
| FR-11 | `public/manifest.json` 생성 — name, short_name, icons, theme_color, display:standalone | High | Pending |
| FR-12 | `public/icon-192.png`, `public/icon-512.png` 생성 (단순 도형) | High | Pending |
| FR-13 | `layout.tsx` metadata.manifest + theme-color meta 추가 | High | Pending |
| FR-14 | Service Worker는 본 마일스톤 제외 — 향후 별도 마일스톤 예고 | - | (Out of scope) |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement |
|----------|----------|-------------|
| Build success | 정적 페이지 882 → 882 (Home 인라인이라 +0) | `npm run build` |
| Bundle size | First Load JS 회귀 ≤ +30 kB (검색·즐겨찾기 hook + 컴포넌트) | Next.js summary |
| Type safety | 0 errors | `tsc --noEmit` |
| 검색 응답 시간 | < 50ms (873 in-memory filter) | DevTools Performance |
| Hydration | mismatch 0 | DevTools console |
| Manifest 유효성 | `<link rel="manifest">` 노출, manifest.json fetch 200 | DevTools Application 패널 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] Home에 검색 input — 한국어 "벤치" / 영문 "bench" 입력 시 결과 노출
- [ ] 검색 0건 시 안내 메시지
- [ ] 운동 상세에 ☆/★ 토글 — 클릭 후 새로고침해도 유지
- [ ] Home "즐겨찾기" 섹션에 즐겨찾기 추가한 운동 카드 표시
- [ ] 즐겨찾기 0개 시 빈 상태 안내
- [ ] `public/manifest.json` 접근 가능 (200), 모바일 브라우저 "홈 화면에 추가" 동작
- [ ] `npm run typecheck` 0 errors
- [ ] `npm run build` 정적 페이지 882 → 882 (회귀 0)
- [ ] First Load JS 회귀 ≤ +30 kB

### 4.2 Quality Criteria

- [ ] 검색 디바운스 unmount race condition 없음 (cleanup 함수)
- [ ] 즐겨찾기 hydration mismatch 0
- [ ] 모든 신규 컴포넌트 다크모드 대응
- [ ] 인터랙티브 ≥ 44×44 px (M6 컨벤션 유지)
- [ ] LocalStorage 키 충돌 0 (`preset:v1` ↔ `favorites:v1` namespace 분리)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 검색 디바운스 race (unmount 후 setState) | Medium | Low | useEffect cleanup으로 timeout clear |
| favorite-store가 preset-store와 코드 중복 | Medium | High | **/simplify 단계에서 generic createStorageHook 추출** |
| manifest.json fetch 실패 (Cloudflare Pages 정적) | Low | Low | `output: 'export'` + `public/`에 두면 자동 정적 호스팅 |
| icon PNG 생성 (CTO가 직접 그릴 수 없음) | Medium | High | **단순한 SVG 코드로 작성 후 사용자에게 PNG 변환 가이드 제공** 또는 inline-encoded PNG 사용 |
| Home 검색어 입력 시 부위 그리드 숨김 — UX 어색 | Low | Low | 사용자 검증, 필요 시 검색 결과를 그리드 위에 추가만 |
| Next.js 15 + manifest.json 표준 metadata API | Low | Low | `metadata.manifest` 표준 — Next 15 OK |
| dev 중 build → cache 충돌 (운영 노트) | Medium | Medium | Check 마지막 1회 build, 그 후 정리 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change |
|----------|------|--------|
| `src/app/page.tsx` | Existing | 검색 input + 결과 영역 + 즐겨찾기 섹션 통합 |
| `src/app/exercises/[id]/page.tsx` | Existing | favorite-button 추가 (헤더 영역) |
| `src/app/layout.tsx` | Existing | metadata.manifest + theme-color |
| `src/components/exercise-detail.tsx` | Existing | favorite-button 슬롯 (또는 page.tsx에서 직접 mount) |
| `src/lib/search-index.ts` | New | 검색 함수 |
| `src/lib/favorite-store.ts` | New | LS hook |
| `src/components/search-input.tsx` | New | Client |
| `src/components/search-results.tsx` | New | Client |
| `src/components/favorite-button.tsx` | New | Client |
| `src/components/favorites-section.tsx` | New | Client |
| `public/manifest.json` | New | PWA manifest |
| `public/icon-192.png`, `public/icon-512.png` | New | PWA 아이콘 |

**총 신규 6 lib/component + 3 public/asset = 9개 + 수정 4개**.

### 6.2 Current Consumers

- M3 ExerciseListItem — 검색 결과에 재사용 (변경 없음)
- M4 preset-store hook — 즐겨찾기 hook과 동일 패턴 (/simplify에서 통합 검토)

---

## 7. Architecture Considerations

### 7.1 Project Level

Starter 유지.

### 7.2 Key Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| 검색 위치 | Home 인라인 | 라우트 추가 X, 단일 페이지 빠른 진입 |
| 디바운스 | 자체 구현 (useEffect setTimeout) | 의존성 추가 X |
| 즐겨찾기 store | preset-store와 동일 패턴 (별도 파일) | 일관성, 중복은 /simplify에서 통합 |
| PWA | manifest only (SW 제외) | KISS, Turbopack 호환성 회피 |
| 아이콘 | 단순 SVG → PNG 변환 또는 직접 PNG bytes 작성 | 외부 도구 의존 X |
| favorite 위치 | 상세 헤더 옆 | 가시성 |

### 7.3 Folder Structure (M7 추가)

```
public/
├── manifest.json                       🆕
├── icon-192.png                        🆕
└── icon-512.png                        🆕
src/
├── app/
│   ├── layout.tsx                      🔄 metadata.manifest
│   ├── page.tsx                        🔄 검색 + 즐겨찾기 통합
│   └── exercises/[id]/page.tsx         🔄 favorite-button
├── components/
│   ├── search-input.tsx                🆕 Client
│   ├── search-results.tsx              🆕 Client
│   ├── favorite-button.tsx             🆕 Client
│   └── favorites-section.tsx           🆕 Client
└── lib/
    ├── search-index.ts                 🆕 (pure)
    └── favorite-store.ts               🆕 ("use client")
```

---

## 8. Convention Prerequisites

(M1-M6 그대로 + 신규)

| Category | Define |
|----------|--------|
| LocalStorage 키 | `gym-alt-app:favorites:v1` (preset과 namespace 분리) |
| 검색 디바운스 시간 | 150ms (모바일 입력 자연스러움 + 즉각성 균형) |
| PWA manifest 위치 | `public/manifest.json` (Next.js 자동 정적 hosting) |

---

## 9. Implementation Strategy

### 9.1 단계 (옵션 A — KISS)

| 단계 | 산출물 | 담당 |
|------|--------|------|
| Plan | 본 문서 | CTO ✅ |
| Design | `m7-search-fav-pwa.design.md` | CTO 직접 |
| Do | lib + components + 페이지 수정 + manifest + icons | CTO 직접 |
| Check | 자체 검토 + 사용자 시나리오 | 본 세션 |
| Report | M7 완료 요약 | 본 세션 |
| **/simplify** | code-analyzer 자동 호출 후 안전한 정리 | **자동 진입** |
| **MVP 완료 보고** | `docs/04-reports/mvp-completion.md` | 본 세션 |

### 9.2 핵심 알고리즘 — 검색 (Plan §9.3 골격)

```typescript
// src/lib/search-index.ts (요지)
import type { EnrichedExercise } from "./types";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]/g, "");
}

export interface SearchHit {
  exercise: EnrichedExercise;
  score: number; // higher = better
}

export function searchExercises(
  query: string,
  exercises: readonly EnrichedExercise[],
  topN = 20,
): SearchHit[] {
  const q = normalize(query);
  if (q.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const e of exercises) {
    const ko = normalize(e.nameKo);
    const en = normalize(e.nameEn);
    let score = 0;
    if (ko === q) score = 100;
    else if (en === q) score = 90;
    else if (ko.startsWith(q)) score = 80;
    else if (en.startsWith(q)) score = 70;
    else if (ko.includes(q)) score = 60;
    else if (en.includes(q)) score = 50;
    if (score > 0) hits.push({ exercise: e, score });
  }

  hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.exercise.nameKo.localeCompare(b.exercise.nameKo, "ko");
  });
  return hits.slice(0, topN);
}
```

### 9.3 핵심 — favorite-store (preset-store 패턴 재사용)

```typescript
// src/lib/favorite-store.ts (요지)
"use client";
import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "gym-alt-app:favorites:v1";

interface StoredState {
  version: 1;
  ids: string[];
}

const FALLBACK: StoredState = { version: 1, ids: [] };

function read(): StoredState {
  if (typeof window === "undefined") return FALLBACK;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return FALLBACK;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    if (parsed.version !== 1 || !Array.isArray(parsed.ids)) return FALLBACK;
    return parsed as StoredState;
  } catch { return FALLBACK; }
}

function write(s: StoredState): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
  catch {}
}

export function useFavorites() {
  const [state, setState] = useState<StoredState>(FALLBACK);
  useEffect(() => { setState(read()); }, []);

  const has = useCallback((id: string) => state.ids.includes(id), [state]);
  const toggle = useCallback((id: string) => {
    setState((prev) => {
      const next: StoredState = {
        version: 1,
        ids: prev.ids.includes(id)
          ? prev.ids.filter((x) => x !== id)
          : [...prev.ids, id],
      };
      write(next);
      return next;
    });
  }, []);

  return { ids: state.ids, has, toggle };
}
```

> **/simplify 후보**: preset-store와 favorite-store 패턴 동일 → `createStorageHook<T>(key, fallback)` generic 추출 검토.

### 9.4 PWA Manifest

```json
// public/manifest.json
{
  "name": "gym-alt-app — 헬스장 대체 운동",
  "short_name": "gym-alt-app",
  "description": "헬스장에서 사용하려던 기구가 점유되었거나 없을 때, 30초 안에 대체 운동을 찾는 모바일 웹앱.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#171717",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "lang": "ko"
}
```

### 9.5 PWA 아이콘 — 단순 PNG (CTO 코드 작성)

PNG 파일을 코드로 직접 작성은 어려움. **대안**: SVG 파일을 작성 → 사용자가 imagemagick 또는 온라인 변환 도구로 PNG 변환. 또는 본 환경에서 가능한 한 단순한 PNG를 base64 또는 raw bytes로 작성.

**선택**: SVG 1개 작성 + manifest에 PNG 경로 명시 + Do 단계에서 사용자에게 PNG 변환 가이드 제공. 만약 시간 압박이면 SVG도 manifest icon으로 사용 가능 (대부분 모바일 브라우저 지원).

**결정**: **SVG `public/icon.svg` + `<link rel="icon" type="image/svg+xml" href="/icon.svg">`** 추가. manifest의 PNG는 사용자가 SVG에서 변환 후 추가 (Do 단계 가이드).

```xml
<!-- public/icon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#171717" rx="80"/>
  <text x="256" y="320" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="280" font-weight="800">G</text>
</svg>
```

---

## 10. Next Steps

1. [x] Plan 작성
2. [ ] Design 작성
3. [ ] Do — Phase 별 Write 병렬화
4. [ ] Check — typecheck + dev 시나리오
5. [ ] /simplify 자동 진입
6. [ ] MVP 완료 보고

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-30 | M7 초안 — 검색·즐겨찾기·manifest. SW 제외 | jiinbae |
