# M7 Search + Favorites + PWA Manifest Design Document

> **Summary**: 검색 lib + favorite hook(preset-store 패턴) + Home 통합 + manifest.json + SVG icon. Service Worker 제외. /simplify에서 LS hook generic화 검토.
>
> **Author**: jiinbae | **Date**: 2026-04-30 | **Status**: Draft
> **Planning Doc**: [m7-search-fav-pwa.plan.md](../../01-plan/features/m7-search-fav-pwa.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | F-7 검색 + F-8 즐겨찾기 + F-9 PWA 첫 단계 (manifest only) |
| **WHO** | 단일 사용자, 모바일, 한국어/영문 검색 |
| **RISK** | LS hook 중복 (preset-store ↔ favorite-store) → /simplify에서 통합 |
| **SUCCESS** | 검색·즐겨찾기 동작 + manifest 노출 + typecheck 0 + build 882 → 882 + JS ≤ +30 kB |
| **SCOPE** | F-7 + F-8 + F-9 manifest only |

---

## 1. Goals & Principles

1. KISS — 신규 의존성 0 (PWA SW 제외, 검색 디바운스 자체 구현)
2. preset-store 패턴 재사용 (favorite-store는 같은 골격)
3. Home placeholder 영역 활용 — 라우트 추가 X
4. 정적 export 호환성 유지 — manifest.json은 정적 파일

---

## 2. Architecture (Option C — Pragmatic 채택)

### 2.1 Component Diagram

```
Home / page.tsx (RSC)
 ├─ <SearchInputAndResults/> (Client island) — search-input + search-results
 │   ├─ uses lib/search-index (pure)
 │   └─ data: getAllExercises() build-time import
 ├─ <MuscleGrid/> (RSC, M3) — 검색어 빈 경우만 표시
 ├─ <FavoritesSection/> (Client) — uses favorite-store
 └─ <Link href="/settings/"> (M4)

/exercises/[id]/ page.tsx (RSC, M5)
 ├─ <BackLink/>
 ├─ <ExerciseDetail/> + <FavoriteButton id={...} /> (Client, 헤더)
 └─ <AlternativesButton/> (M4)
```

### 2.2 Search Architecture

검색은 **클라이언트 사이드 메모리 필터** — 873 운동을 import해 매 keystroke마다 필터. 디바운스 150ms로 과도한 재렌더 방지.

성능: 873 × ~50 글자 매칭 = 마이크로초 단위. memo 불필요.

### 2.3 Favorite Architecture

`useFavorites()` hook이 LocalStorage에서 ID 배열 read/write. `<FavoriteButton id>`은 hook 사용. `<FavoritesSection>`은 hook으로 ids 가져온 뒤 `getExerciseById`로 운동 찾아 카드 표시.

---

## 3. Data Model

신규 타입 1종 (Plan §9.2):
```typescript
interface SearchHit { exercise: EnrichedExercise; score: number; }
```

LocalStorage:
```typescript
// favorite-store
interface FavoriteState { version: 1; ids: string[]; }
// key: "gym-alt-app:favorites:v1"
```

---

## 4. API

해당 없음 (백엔드 0).

### 4.1 Internal Contracts

- `searchExercises(query, exercises, topN=20): SearchHit[]` — pure
- `useFavorites(): { ids, has, toggle }` — Client hook, SSR-safe

---

## 5. UI/UX

### 5.1 Home Layout (M7 통합)

```
┌────────────────────────────────────┐
│ gym-alt-app                        │
│ 헬스장 대체 운동 추천              │
├────────────────────────────────────┤
│ [🔍 운동 검색 ...]               │  ◀ 신규 search-input
│  (검색어 있을 때 결과 표시)        │
├────────────────────────────────────┤
│ ★ 즐겨찾기 (N)                     │  ◀ 신규 favorites-section
│  (즐겨찾기 카드 N개 또는 빈 상태)   │
├────────────────────────────────────┤
│ 부위 선택                           │  ◀ M3 (검색어 빈 경우만 표시)
│ [💪 가슴] [🦾 등] [🏋️ 어깨] ...    │
├────────────────────────────────────┤
│ ⚙️ 헬스장 설정 → /settings/        │  ◀ M4
└────────────────────────────────────┘
```

### 5.2 Exercise Detail (M7 추가)

```
┌────────────────────────────────────┐
│ ← 뒤로                              │
│                                    │
│ 스미스머신 벤치 프레스    [☆/★]    │  ◀ favorite-button (h1 옆)
│ Smith Machine Bench Press          │
│ ... (M5 그대로)                    │
└────────────────────────────────────┘
```

### 5.3 Component List

| Component | Type | Location |
|-----------|------|----------|
| `SearchInputAndResults` | Client (compose) | `src/components/search-input-and-results.tsx` (또는 split) |
| `SearchInput` | Client | `src/components/search-input.tsx` |
| `SearchResults` | Client | `src/components/search-results.tsx` |
| `FavoriteButton` | Client | `src/components/favorite-button.tsx` |
| `FavoritesSection` | Client | `src/components/favorites-section.tsx` |

> **단순화**: SearchInput/SearchResults를 합쳐 `<SearchSection>` 단일 Client component로 작성 가능. 본 Design은 **단일 컴포넌트 `<HomeSearch>`** 패턴 채택 — search query state를 부모-자식 분리할 가치 적음.

### 5.4 Page UI Checklist

#### Home
- [ ] 검색 input (`type="search"`, placeholder "운동 검색...")
- [ ] 검색어 있을 때: 결과 카드 리스트 + 부위 그리드 hidden
- [ ] 검색어 빈: 결과 hidden + 부위 그리드 표시
- [ ] 즐겨찾기 섹션 — 항상 표시 (빈 상태 안내 또는 카드 N개)
- [ ] ⚙️ 헬스장 설정 link

#### Exercise Detail
- [ ] M5 본문 그대로
- [ ] h1 옆에 ☆/★ favorite-button (44×44)

---

## 6. Error Handling

- 검색 디바운스 race: useEffect cleanup으로 timeout clear
- LocalStorage parse 실패: try/catch + fallback empty array
- 즐겨찾기에 있는 ID가 데이터에서 사라진 경우(이론적): `getExerciseById === undefined` → 그 ID는 표시 안 함 (filter)

---

## 7. Security

해당 없음 (사용자 입력은 검색어 — React 자동 escape).

---

## 8. Test Plan

### 8.1 Manual

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Home에서 "벤치" 입력 | 벤치 프레스 관련 운동 결과 |
| 2 | "bench" 입력 | 동일 결과 |
| 3 | "bench press" (공백 포함) | 정규화로 매칭됨 |
| 4 | "xxxxxx" 입력 | "검색 결과 없음" |
| 5 | 검색어 비우기 | 부위 그리드 다시 보임 |
| 6 | 운동 상세 ☆ 클릭 → ★ | 새로고침 후에도 ★ 유지 |
| 7 | Home 즐겨찾기 섹션 | 추가한 운동 카드 표시 |
| 8 | 즐겨찾기 모두 해제 | "운동 상세에서 ☆를 눌러..." 빈 안내 |
| 9 | 모바일 브라우저 manifest | "홈 화면에 추가" 메뉴 노출 |
| 10 | DevTools Application → Manifest | name, icons, theme_color OK |

### 8.2 정적

- typecheck 0 errors
- build 882 → 882
- First Load JS / 105 → ≤ 135 kB

---

## 9-10. Architecture & Convention

(M1-M6 그대로 + Plan §8)

---

## 11. Implementation Guide

### 11.1 File Structure (M7 추가)

```
public/
├── manifest.json                       🆕
├── icon.svg                            🆕 (단순 도형)
├── icon-192.png                        🆕 (사용자 변환 필요)
└── icon-512.png                        🆕 (사용자 변환 필요)
src/
├── app/
│   ├── layout.tsx                      🔄
│   ├── page.tsx                        🔄
│   └── exercises/[id]/page.tsx         🔄
├── components/
│   ├── home-search.tsx                 🆕 (Client, search 통합)
│   ├── favorite-button.tsx             🆕 (Client)
│   └── favorites-section.tsx           🆕 (Client)
└── lib/
    ├── search-index.ts                 🆕 (pure)
    └── favorite-store.ts               🆕 ("use client")
```

**총 신규 7 + 수정 3 = 10개**.

### 11.2 Implementation Order

**Phase A — lib (의존 없음)**
1. [ ] `src/lib/search-index.ts` (Plan §9.2 골격)
2. [ ] `src/lib/favorite-store.ts` (Plan §9.3 골격)

**Phase B — components**
3. [ ] `src/components/favorite-button.tsx`
4. [ ] `src/components/favorites-section.tsx`
5. [ ] `src/components/home-search.tsx`

**Phase C — pages 통합**
6. [ ] `src/app/page.tsx` — HomeSearch + FavoritesSection 통합
7. [ ] `src/app/exercises/[id]/page.tsx` — FavoriteButton 추가
8. [ ] `src/app/layout.tsx` — metadata.manifest

**Phase D — PWA assets**
9. [ ] `public/manifest.json`
10. [ ] `public/icon.svg`

**Phase E — 검증 + /simplify 자동 진입**
11. [ ] dev 서버 시나리오 검증
12. [ ] typecheck + build (마지막 1회)
13. [ ] code-analyzer 호출 → /simplify

### 11.3 핵심 코드 — `<HomeSearch>` 단일 컴포넌트

```typescript
"use client";
import { useEffect, useState, useDeferredValue } from "react";
import { getAllExercises } from "@/lib/data";
import { searchExercises } from "@/lib/search-index";
import { ExerciseListItem } from "./exercise-list-item";

export function HomeSearch({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  // 디바운스 150ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const hits = debounced ? searchExercises(debounced, getAllExercises(), 20) : [];
  const isSearching = debounced.length > 0;

  return (
    <>
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="운동 검색..."
          className="w-full min-h-11 rounded-xl border border-neutral-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-800 dark:bg-neutral-950"
        />
      </div>

      {isSearching ? (
        <div className="mt-4 space-y-2.5">
          {hits.length === 0 ? (
            <p className="text-sm text-neutral-500">검색 결과가 없습니다.</p>
          ) : (
            <ul className="space-y-2.5">
              {hits.map((h) => (
                <li key={h.exercise.id}>
                  <ExerciseListItem exercise={h.exercise} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        // 검색 안 할 때 children(부위 그리드 + 즐겨찾기 등) 표시
        <>{children}</>
      )}
    </>
  );
}
```

### 11.4 layout.tsx metadata.manifest

```typescript
export const metadata: Metadata = {
  title: "gym-alt-app — 헬스장 대체 운동",
  description: "...",
  manifest: "/manifest.json",
  themeColor: "#171717",
};
```

(Next.js 15 metadata.themeColor는 deprecated → `viewport` export로 분리 권장)

```typescript
import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};
```

---

## 12. Open Questions for Do

| ID | Q | 즉시 결정 |
|----|---|-----------|
| D-1 | search-index에서 873 데이터를 어떻게 사용할지 | `lib/data.ts:getAllExercises` import — 정적 import로 빌드 타임 포함 |
| D-2 | HomeSearch가 RSC children을 wrap할 때 server pass-through OK? | Next.js 15 RSC → Client → RSC slot 패턴 OK (children을 prop으로 받음) |
| D-3 | favorite-button은 운동 상세 RSC 페이지에서 어떻게 mount? | M4 alternatives-button 패턴 — RSC가 Client component import |
| D-4 | manifest.json 한국어 string은 UTF-8 OK | manifest.json 자체 UTF-8 — Next.js 정적 hosting OK |
| D-5 | PNG icon 생성 — 사용자에게 SVG → PNG 변환 가이드 | DEPLOY.md 또는 README에 절차. 임시로 SVG만 사용 가능 (모바일 일부 미지원이나 대부분 OK) |

---

## 13. Plan→Design 변경

| Plan | Design | 사유 |
|------|--------|------|
| SearchInput + SearchResults 분리 | **단일 `<HomeSearch>` 컴포넌트** | query state 부모-자식 분리 가치 적음. KISS |
| PNG 192/512 작성 | **SVG + 사용자 PNG 변환 가이드** | CTO 환경에서 PNG raw bytes 작성 어려움 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-04-30 | M7 Design 초안 |
