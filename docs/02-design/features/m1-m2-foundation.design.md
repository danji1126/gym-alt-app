# M1-M2 Foundation Design Document

> **Summary**: 데이터 전처리 파이프라인(M1) + Next.js 정적 사이트 골격(M2) 통합 설계. 단일 source-of-truth 타입 시스템 + 빌드 타임 fail-fast 검증 + 최소 의존성 원칙.
>
> **Project**: gym-alt-app
> **Version**: 0.1.0 (pre-init)
> **Author**: jiinbae (CTO)
> **Date**: 2026-04-30
> **Status**: Draft (옵션 A — KISS, CTO 직접 설계)
> **Planning Doc**: [m1-m2-foundation.plan.md](../../01-plan/features/m1-m2-foundation.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 헬스장 현장에서 30초 안에 대체 운동을 찾기 위한 데이터·앱 골격이 필요. M0 번역만으로는 UI 소비 불가. |
| **WHO** | 단일 사용자(jiinbae). 모바일 웹앱(iOS Safari 16+, Android Chrome). |
| **RISK** | (1) 한국어 추가 후 JSON 크기 팽창 → First Load JS 초과 (TV-2), (2) DetailedEquipment 정규식이 일부 운동에서 분류 누락 → 추천 후보군 0건. |
| **SUCCESS** | `npm run build` 성공 + `out/` 생성 + 873/873 ID 머지 + 분류 누락 0건 + JSON ≤ 500KB(gzip) |
| **SCOPE** | M1 (데이터 파이프라인) + M2 (Next.js + Tailwind 골격) — UI 로직·라우팅 구현은 M3 이후 |

---

## 1. Overview

### 1.1 Design Goals

1. **단일 source-of-truth 타입**: `EnrichedExercise`, `MuscleGroup`, `DetailedEquipment` 등은 `src/lib/types.ts`에서만 정의. scripts는 이를 import. 타입 중복 0.
2. **빌드 타임 fail-fast**: 런타임 검증 라이브러리(zod 등) 없이도 데이터 무결성 보장. 검증 실패 시 즉시 `process.exit(1)`.
3. **최소 의존성**: production deps는 `next`, `react`, `react-dom` 3개만. dev deps도 Tailwind + tsx + Next.js 기본 lint 외 추가 금지.
4. **재현 가능 빌드**: `scripts/preprocess.ts`는 deterministic — 동일 입력 → 동일 출력. 정렬·키 순서 고정.
5. **M3 진입 준비**: M3 화면은 `import data from '@/public/data/exercises-ko.json'` 패턴으로 데이터 사용 가능해야 함.

### 1.2 Design Principles

- **KISS**: 모듈 간 단순한 의존 그래프. 추상화 레이어 추가 금지.
- **YAGNI**: 미래에 필요할 수도 있는 기능(스키마 검증, 에러 클래스 계층, DI) 도입 금지.
- **Single Responsibility**: `preprocess.ts`는 머지·검증만, `detailed-equipment.ts`는 분류만, `types.ts`는 타입 선언만.
- **Fail-Fast**: 데이터 이상은 빌드 시점에 멈춘다. 사용자에게 도달하지 않는다.
- **Static-First**: 모든 데이터는 빌드 산출물. 런타임 fetch / API / DB 호출 없음.

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | scripts/와 src/ 각각 독립, 타입 중복 허용 | scripts/lib에 도메인 레이어 분리, 양쪽에서 import | 단일 source-of-truth (src/lib/types.ts), scripts에서 path import |
| **New Files** | 9개 | 13개 | 11개 |
| **Modified Files** | 0 | 0 | 0 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Low (타입 sync 불일치 위험) | High | High |
| **Effort** | Low | High | Medium |
| **Risk** | Medium (drift) | Low | Low |
| **Recommendation** | 매우 빠른 prototype | 다인 협업 / 테스트 풍부 | **본 단계 default** |

**Selected**: **Option C — Pragmatic Balance**
**Rationale**: 단일 source-of-truth로 타입 drift를 방지하되, Clean Architecture 4-layer 강제는 1인 프로젝트에 과함. PRD §1.4 Non-Goals와 일치.

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Build Time                                 │
│                                                                     │
│  data/exercises.json ─┐                                             │
│  data/translations.json ─┼─▶ scripts/preprocess.ts ──┐              │
│                          │       ▲                   │              │
│                          │       │ imports           ▼              │
│                          │   src/lib/types.ts   public/data/        │
│                          │   scripts/lib/         exercises-ko.json │
│                          │   detailed-equipment.ts                  │
│                          │                                          │
│                          └─▶ data/gym-presets.json (manual seed)   │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                          Run Time (M3+에서 활용)                    │
│                                                                     │
│  src/app/page.tsx ──▶ import exercises from                         │
│                       '../../public/data/exercises-ko.json'         │
│                                                                     │
│                       import { MUSCLE_KO } from '@/lib/i18n'        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

**빌드 타임 (preprocess)**:
```
exercises.json (873개 원본)
   +
translations.json (873개 한국어)
   ↓
[ID 매칭 검증] — 미스매칭 → exit(1)
   ↓
[운동별 머지 + DetailedEquipment 분류 + 절대 URL + YouTube URL]
   ↓
[분류 누락 검증] — detailedEquipment.length === 0 발견 → exit(1)
   ↓
[ID 알파벳 정렬]  ← 재현 가능 출력
   ↓
public/data/exercises-ko.json
```

**빌드 타임 (Next.js)**:
```
next build (output: 'export')
   ↓
[Tailwind 스캔] → globals.css 생성
   ↓
[정적 페이지 생성] — placeholder Home
   ↓
out/ 디렉토리 (Cloudflare Pages 업로드 대상)
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `scripts/preprocess.ts` | `src/lib/types.ts`, `scripts/lib/detailed-equipment.ts`, `data/exercises.json`, `data/translations.json` | 머지·검증 진입점 |
| `scripts/lib/detailed-equipment.ts` | `src/lib/types.ts` (`DetailedEquipment` 타입) | 정규식 분류 |
| `src/lib/types.ts` | (외부 의존성 없음) | 도메인 타입 단일 source |
| `src/lib/i18n.ts` | `src/lib/types.ts` (`MuscleGroup`) | UI용 한국어 매핑 |
| `src/app/layout.tsx` | `src/app/globals.css` | 루트 레이아웃 |
| `src/app/page.tsx` | (없음 — placeholder) | M3 자리잡기 |

**의존성 그래프 (단방향, 사이클 없음)**:
```
src/lib/types.ts (root, 0 deps)
    ▲
    ├── src/lib/i18n.ts
    ├── scripts/lib/detailed-equipment.ts
    │       ▲
    │       └── scripts/preprocess.ts
    └── (M3+: src/app/**, src/lib/recommend.ts)
```

---

## 3. Data Model

### 3.1 Entity Definition

```typescript
// src/lib/types.ts

/** Free Exercise DB의 17개 근육군 */
export type MuscleGroup =
  | "abdominals" | "abductors" | "adductors"
  | "biceps" | "calves" | "chest"
  | "forearms" | "glutes" | "hamstrings"
  | "lats" | "lower back" | "middle back"
  | "neck" | "quadriceps" | "shoulders"
  | "traps" | "triceps";

/** Free Exercise DB의 13개 원본 equipment 버킷 */
export type EquipmentRaw =
  | "body only" | "machine" | "other"
  | "foam roll" | "kettlebells" | "dumbbell"
  | "cable" | "barbell" | "bands"
  | "medicine ball" | "exercise ball"
  | "e-z curl bar" | "none";

/** PRD §4.4 운동명 정규식 기반 세분화 분류 */
export type DetailedEquipment =
  // 머신류 (운동명 기반)
  | "smith-machine"
  | "leg-press-machine"
  | "lat-pulldown-machine"
  | "chest-press-machine"
  | "leg-extension-machine"
  | "leg-curl-machine"
  | "pec-deck-machine"
  | "hack-squat-machine"
  | "generic-machine"
  // 자유 중량
  | "barbell" | "dumbbell" | "e-z curl bar" | "kettlebells"
  // 케이블
  | "cable"
  // 보조 도구
  | "bands" | "exercise ball" | "medicine ball" | "foam roll"
  // 맨몸
  | "body only"
  // fallback
  | "other";

export type ExerciseLevel = "beginner" | "intermediate" | "expert";
export type ExerciseForce = "static" | "pull" | "push" | null;
export type ExerciseMechanic = "isolation" | "compound" | null;
export type ExerciseCategory =
  | "strength" | "cardio" | "stretching" | "powerlifting"
  | "strongman" | "plyometrics" | "olympic weightlifting";

/** 빌드 산출물 — public/data/exercises-ko.json의 원소 */
export interface EnrichedExercise {
  id: string;
  // 영어 원본 (검색·YouTube 쿼리용)
  nameEn: string;
  instructionsEn: string[];
  // 한국어 (UI 표시용)
  nameKo: string;
  instructionsKo: string[];
  // 근육
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  // 메타
  force: ExerciseForce;
  level: ExerciseLevel;
  mechanic: ExerciseMechanic;
  category: ExerciseCategory;
  // 기구
  equipmentRaw: EquipmentRaw | null;
  detailedEquipment: DetailedEquipment[];
  // 미디어
  imageUrls: string[];
  youtubeSearchUrl: string;
}

/** 헬스장 프리셋 — data/gym-presets.json + LocalStorage */
export interface GymPreset {
  id: string;
  name: string;
  availableEquipment: DetailedEquipment[];
}
```

### 3.2 Entity Relationships

```
[EnrichedExercise] N ──── M [DetailedEquipment]
       │                           │
       │ uses                      │ filters
       │                           │
[MuscleGroup]                [GymPreset]
                                   │
                              LocalStorage
```

### 3.3 Database Schema

해당 없음 — 정적 JSON 사용. PRD §1.4에 따라 DB·서버 0.

---

## 4. API Specification

해당 없음 — 백엔드 0. 모든 데이터는 빌드 타임 정적 산출. 런타임은 `import()` 또는 `fetch('/data/exercises-ko.json')`.

### 4.1 빌드 산출물 스키마 계약

`public/data/exercises-ko.json` = `EnrichedExercise[]` (873개, ID 알파벳 오름차순)

**불변 조건 (M3+에서 의존)**:
- 길이는 873
- 모든 원소의 `detailedEquipment.length >= 1`
- 모든 원소의 `nameKo`, `instructionsKo` 비어있지 않음
- 모든 원소의 `imageUrls.length >= 1` (원본 데이터셋 보장)
- ID 중복 없음

`data/gym-presets.json` = `GymPreset[]` (M1-M2 단계 1개: `default-full`)

---

## 5. UI/UX Design

### 5.1 Screen Layout (placeholder)

```
┌────────────────────────────────────┐
│  gym-alt-app (placeholder)         │
├────────────────────────────────────┤
│                                    │
│  M1-M2 골격 완료                   │
│  데이터: 873개 운동 머지 완료      │
│                                    │
│  → M3에서 부위 선택·검색 구현      │
│                                    │
└────────────────────────────────────┘
```

### 5.2 User Flow

해당 없음 — placeholder 단일 페이지. M3에서 정의.

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `RootLayout` | `src/app/layout.tsx` | HTML 골격 + globals.css 로드 + 한국어 lang |
| `HomePage` (placeholder) | `src/app/page.tsx` | 빌드 검증용 placeholder |

### 5.4 Page UI Checklist

#### Home (placeholder)

- [ ] Heading: 프로젝트명 ("gym-alt-app")
- [ ] Text: 현재 단계 안내 ("M1-M2 골격 완료", "M3에서 화면 구현 예정")
- [ ] Tailwind 스타일 적용 확인 (텍스트가 기본 브라우저 스타일이 아니어야 함)

> M3 이후 본격 화면이 추가되면 PRD §6 기준으로 이 체크리스트 확장.

---

## 6. Error Handling

### 6.1 빌드 타임 에러 코드 (preprocess.ts)

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| `ERR_MISSING_TRANSLATION` | `Missing Korean translation for ID: {id}` | translations.json에 없는 ID | `process.exit(1)` |
| `ERR_ORPHAN_TRANSLATION` | `Translation has no matching exercise: {id}` | translations.json에만 존재 | `process.exit(1)` |
| `ERR_NO_EQUIPMENT_CLASS` | `No detailedEquipment classified for: {name}` | 정규식 fallback도 실패 | `process.exit(1)` |
| `ERR_EMPTY_TRANSLATION` | `Empty nameKo or instructionsKo for: {id}` | 빈 번역 발견 | `process.exit(1)` |
| `ERR_DUPLICATE_ID` | `Duplicate ID in source: {id}` | exercises.json 무결성 위반 | `process.exit(1)` |

### 6.2 런타임 에러

해당 없음 — M1-M2는 빌드 타임 작업. Next.js placeholder 페이지는 에러 핸들러 불필요.

### 6.3 에러 출력 포맷

```
[preprocess] FATAL ERR_NO_EQUIPMENT_CLASS
  Exercise: "Some Exercise Name"
  ID: Some_Exercise_Name
  equipmentRaw: machine
  Hint: Add a regex rule in scripts/lib/detailed-equipment.ts
```

---

## 7. Security Considerations

| Item | Status | Note |
|------|:------:|------|
| Input validation (XSS) | N/A | 사용자 입력 없음 |
| Auth/Authorization | N/A | 인증 없음 (PRD §1.4) |
| Sensitive data | N/A | 민감 데이터 0 |
| HTTPS | ✅ | Cloudflare Pages 기본 적용 |
| Rate Limiting | N/A | 정적 사이트 |
| Dependency vulnerabilities | ⚠️ | `npm audit` Check 단계에서 1회 실행 |

---

## 8. Test Plan

> M1-M2는 인프라 단계. E2E·UI 테스트 부재. **빌드 산출물 검증**과 **타입 체크**만 수행.

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L0: Build Verification | preprocess.ts assert + tsc + next build | node + tsc + next | Do |
| L1: API Tests | N/A | - | - |
| L2: UI Action Tests | N/A | - | - |
| L3: E2E Scenario Tests | N/A | - | - |

### 8.2 L0: Build Verification Scenarios

| # | Target | Test Description | Expected Result |
|---|--------|-----------------|----------------|
| 1 | `preprocess.ts` | 정상 입력으로 실행 | exit 0, `public/data/exercises-ko.json` 생성, 873 entries |
| 2 | `preprocess.ts` | translations.json에서 1개 ID 누락 시뮬레이션 | exit 1, `ERR_MISSING_TRANSLATION` 출력 |
| 3 | `preprocess.ts` | DetailedEquipment 분류 누락 운동 발견 시뮬레이션 | exit 1, `ERR_NO_EQUIPMENT_CLASS` 출력 |
| 4 | `tsc --noEmit` | 전체 타입 체크 | 0 errors |
| 5 | `next build` | 정적 빌드 | exit 0, `out/index.html` 존재 |
| 6 | gzip 측정 | `exercises-ko.json` 압축 크기 | ≤ 500KB |

> 시나리오 2-3은 자동화하지 않음. 정상 빌드 1회로 검증 충분 (KISS). 향후 회귀 발생 시 추가.

### 8.3 Seed Data Requirements

기존 데이터 그대로 사용:
- `data/exercises.json` (873)
- `data/translations.json` (873)

별도 시드 없음.

---

## 9. Clean Architecture

### 9.1 Layer Structure (Starter 적용)

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | UI placeholder | `src/app/` |
| **Application** | (M1-M2 부재) | M3+에서 `src/lib/recommend.ts` 등 |
| **Domain** | 도메인 타입, 한국어 매핑 | `src/lib/types.ts`, `src/lib/i18n.ts` |
| **Infrastructure** | 빌드 스크립트, 정적 데이터 | `scripts/`, `data/`, `public/data/` |

### 9.2 Dependency Rules

```
Presentation (M3+) ──→ Domain ←── Infrastructure (scripts)
                          ▲
                          │
                       (no external)
```

- `src/lib/types.ts`는 어떤 외부 모듈도 import하지 않음
- `scripts/*`는 `src/lib/types.ts`만 import 가능 (역방향 금지)
- `src/app/*`는 `src/lib/*`와 `public/data/*.json` import 가능

### 9.3 File Import Rules

| From | Can Import | Cannot Import |
|------|-----------|---------------|
| `src/app/**` | `src/lib/**`, `public/data/**.json` | `scripts/**` |
| `src/lib/i18n.ts` | `src/lib/types.ts` | 그 외 |
| `src/lib/types.ts` | (없음 — pure types) | 모두 |
| `scripts/preprocess.ts` | `src/lib/types.ts`, `scripts/lib/**`, `data/**.json` | `src/app/**` |
| `scripts/lib/**` | `src/lib/types.ts` | `src/app/**`, `src/lib/i18n.ts` |

### 9.4 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| `EnrichedExercise`, `MuscleGroup` 등 타입 | Domain | `src/lib/types.ts` |
| `MUSCLE_KO` 매핑 | Domain | `src/lib/i18n.ts` |
| `classifyDetailedEquipment()` | Infrastructure | `scripts/lib/detailed-equipment.ts` |
| `preprocess()` 메인 | Infrastructure | `scripts/preprocess.ts` |
| `RootLayout`, placeholder Home | Presentation | `src/app/` |

---

## 10. Coding Convention Reference

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `RootLayout` |
| Functions | camelCase | `classifyDetailedEquipment()`, `preprocess()` |
| Constants | UPPER_SNAKE_CASE | `MUSCLE_KO`, `IMAGE_BASE_URL`, `EQUIPMENT_RULES` |
| Types/Interfaces | PascalCase | `EnrichedExercise`, `GymPreset` |
| Files (component) | PascalCase or `page.tsx`/`layout.tsx` | Next.js 컨벤션 따름 |
| Files (utility) | kebab-case.ts | `detailed-equipment.ts` |
| Folders | kebab-case | `01-plan/`, `02-design/` |

### 10.2 Import Order

```typescript
// 1. External
import { readFile, writeFile } from 'node:fs/promises';

// 2. Internal absolute (@/...)
import type { EnrichedExercise } from '@/lib/types';

// 3. Internal relative
import { classifyDetailedEquipment } from './lib/detailed-equipment';
```

### 10.3 Environment Variables

M1-M2 단계 환경변수 0개.

### 10.4 This Feature's Conventions

| Item | Convention Applied |
|------|-------------------|
| Component naming | Next.js App Router 기본 (`page.tsx`, `layout.tsx`) |
| File organization | `src/app/` 라우팅, `src/lib/` 도메인, `scripts/` 빌드 |
| State management | 없음 (RSC + 정적 import) |
| Error handling | 빌드 타임 fail-fast (`process.exit(1)` + console.error) |
| Path alias | `@/*` → `src/*` (tsconfig.json `paths`) |

---

## 11. Implementation Guide

### 11.1 File Structure

```
gym-alt-app/
├── data/
│   ├── exercises.json              ✅ 기존
│   ├── translations.json           ✅ 기존
│   ├── instructions-batch-*.json   ✅ 기존 (touch X)
│   └── gym-presets.json            🆕 신규
├── public/
│   └── data/
│       └── exercises-ko.json       🆕 빌드 산출물 (gitignore 후보)
├── scripts/
│   ├── preprocess.ts               🆕
│   └── lib/
│       └── detailed-equipment.ts   🆕
├── src/
│   ├── app/
│   │   ├── layout.tsx              🆕
│   │   ├── page.tsx                🆕 (placeholder)
│   │   └── globals.css             🆕
│   └── lib/
│       ├── types.ts                🆕
│       └── i18n.ts                 🆕
├── docs/
│   ├── PRD.md                      ✅
│   ├── DEPLOY.md                   🆕
│   ├── 01-plan/features/
│   │   └── m1-m2-foundation.plan.md ✅
│   └── 02-design/features/
│       └── m1-m2-foundation.design.md ✅ (본 문서)
├── package.json                    🆕
├── next.config.ts                  🆕
├── tsconfig.json                   🆕
├── tailwind.config.ts              🆕
├── postcss.config.mjs              🆕
├── .gitignore                      🆕
├── .eslintrc.json                  🆕 (또는 eslint.config.mjs)
└── README.md                       🆕
```

**총 신규 파일**: 17개 (Module 1: 9개 데이터+타입, Module 2: 8개 Next.js 골격)

### 11.2 Implementation Order

**Module 1 — 데이터 파이프라인 (먼저)**
1. [ ] `package.json` 초기화 (devDependencies: tsx, typescript) → `npm install`
2. [ ] `tsconfig.json` 작성 (strict, paths)
3. [ ] `src/lib/types.ts` 작성 (모든 도메인 타입)
4. [ ] `src/lib/i18n.ts` 작성 (`MUSCLE_KO` 매핑)
5. [ ] `scripts/lib/detailed-equipment.ts` 작성 (PRD §4.4 정규식 우선순위)
6. [ ] `data/gym-presets.json` 작성 (PRD §4.5.1 기본 풀 헬스장)
7. [ ] `scripts/preprocess.ts` 작성 (머지 + 검증 + 정렬 + 출력)
8. [ ] `npm run preprocess` 실행 → `public/data/exercises-ko.json` 생성 검증
9. [ ] gzip 크기 측정 → 500KB 이하 확인

**Module 2 — Next.js 골격 (다음)**
10. [ ] `package.json`에 next, react, react-dom, tailwindcss 추가 → `npm install`
11. [ ] `next.config.ts` 작성 (`output: 'export'`, `images.unoptimized: true`)
12. [ ] `tailwind.config.ts`, `postcss.config.mjs` 작성
13. [ ] `src/app/globals.css` (Tailwind directives)
14. [ ] `src/app/layout.tsx` (한국어 lang, globals.css 로드)
15. [ ] `src/app/page.tsx` (placeholder Home)
16. [ ] `.gitignore` (node_modules, .next, out, public/data — 빌드 산출물 정책 결정)
17. [ ] ESLint 기본 설정 (`eslint-config-next`)
18. [ ] `README.md` (프로젝트 개요 + 빌드 명령어)
19. [ ] `docs/DEPLOY.md` (Cloudflare Pages 가이드)
20. [ ] `npm run build` 검증 → `out/index.html` 확인

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| Data Pipeline | `module-1` | scripts/, src/lib/, data/gym-presets.json | 15-20 |
| Next.js Skeleton | `module-2` | src/app/, next config, package.json, README/DEPLOY | 15-20 |

#### Recommended Session Plan

본 옵션 A (KISS)에서는 **단일 세션에 두 모듈 모두 진행 가능**. CTO 직접 구현이라 turn 비용이 낮음.

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| (current) | Plan + Design | 전체 | 작성 완료 |
| (current) | Do | module-1 → module-2 순차 | 30-40 |
| (current) | Check | gap-detector + code-analyzer 병렬 | 5-10 |
| (current) | Report | 사용자 요약 | 2-3 |

### 11.4 핵심 알고리즘 — DetailedEquipment 분류

```typescript
// scripts/lib/detailed-equipment.ts

import type { DetailedEquipment, EquipmentRaw } from '@/lib/types';

interface Rule {
  pattern: RegExp;
  result: DetailedEquipment;
}

// PRD §4.4 우선순위 1-10 (운동명 기반 정규식)
const NAME_RULES: Rule[] = [
  { pattern: /\bsmith\b/i,                    result: 'smith-machine' },
  { pattern: /\bcable\b/i,                    result: 'cable' },
  { pattern: /\bleg press\b/i,                result: 'leg-press-machine' },
  { pattern: /\blat pulldown\b/i,             result: 'lat-pulldown-machine' },
  { pattern: /\bchest press\b/i,              result: 'chest-press-machine' },
  { pattern: /\bleg extension\b/i,            result: 'leg-extension-machine' },
  { pattern: /\bleg curl\b/i,                 result: 'leg-curl-machine' },
  { pattern: /\b(pec deck|butterfly)\b/i,     result: 'pec-deck-machine' },
  { pattern: /\bhack squat\b/i,               result: 'hack-squat-machine' },
];

// 우선순위 11: equipment === "machine" → generic-machine
// 우선순위 그 외: equipmentRaw 그대로 매핑

export function classifyDetailedEquipment(
  name: string,
  equipmentRaw: EquipmentRaw | null
): DetailedEquipment[] {
  // 1) 운동명 정규식 매칭 (우선순위 1-10)
  for (const rule of NAME_RULES) {
    if (rule.pattern.test(name)) return [rule.result];
  }

  // 2) equipment === "machine" → generic-machine
  if (equipmentRaw === 'machine') return ['generic-machine'];

  // 3) equipmentRaw를 DetailedEquipment로 직접 매핑
  if (equipmentRaw === null || equipmentRaw === 'none' || equipmentRaw === 'other') {
    return ['other'];
  }

  // body only / barbell / dumbbell / e-z curl bar / kettlebells /
  // bands / exercise ball / medicine ball / foam roll / cable
  return [equipmentRaw as DetailedEquipment];
}
```

### 11.5 핵심 알고리즘 — preprocess 검증

```typescript
// scripts/preprocess.ts (요지)

const exercises: RawExercise[] = JSON.parse(await readFile('data/exercises.json', 'utf-8'));
const translations: Record<string, { nameKo: string; instructionsKo: string[] }> =
  JSON.parse(await readFile('data/translations.json', 'utf-8'));

// 검증 1: ID 중복
const ids = new Set<string>();
for (const ex of exercises) {
  if (ids.has(ex.id)) fail('ERR_DUPLICATE_ID', ex.id);
  ids.add(ex.id);
}

// 검증 2: 양방향 ID 매칭
for (const ex of exercises) {
  if (!translations[ex.id]) fail('ERR_MISSING_TRANSLATION', ex.id);
}
for (const id of Object.keys(translations)) {
  if (!ids.has(id)) fail('ERR_ORPHAN_TRANSLATION', id);
}

// 머지 + 분류
const enriched: EnrichedExercise[] = exercises.map((ex) => {
  const t = translations[ex.id];
  if (!t.nameKo || t.instructionsKo.length === 0) fail('ERR_EMPTY_TRANSLATION', ex.id);

  const detailedEquipment = classifyDetailedEquipment(ex.name, ex.equipment);
  if (detailedEquipment.length === 0) fail('ERR_NO_EQUIPMENT_CLASS', ex.name);

  return {
    id: ex.id,
    nameEn: ex.name,
    instructionsEn: ex.instructions,
    nameKo: t.nameKo,
    instructionsKo: t.instructionsKo,
    primaryMuscles: ex.primaryMuscles,
    secondaryMuscles: ex.secondaryMuscles,
    force: ex.force,
    level: ex.level,
    mechanic: ex.mechanic,
    category: ex.category,
    equipmentRaw: ex.equipment,
    detailedEquipment,
    imageUrls: ex.images.map((p) => `${IMAGE_BASE_URL}${p}`),
    youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' form')}`,
  };
});

// 정렬 (재현성 보장)
enriched.sort((a, b) => a.id.localeCompare(b.id));

// 분포 출력 (수동 검증 도움)
const dist = new Map<string, number>();
for (const e of enriched) {
  for (const eq of e.detailedEquipment) {
    dist.set(eq, (dist.get(eq) ?? 0) + 1);
  }
}
console.log('[preprocess] DetailedEquipment distribution:');
for (const [k, v] of [...dist.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(28)} ${v}`);
}

// 출력
await mkdir('public/data', { recursive: true });
await writeFile('public/data/exercises-ko.json', JSON.stringify(enriched, null, 0));
console.log(`[preprocess] OK — ${enriched.length} exercises written`);
```

### 11.6 package.json 골격

```json
{
  "name": "gym-alt-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "preprocess": "tsx scripts/preprocess.ts",
    "dev": "next dev",
    "build": "npm run preprocess && next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x"
  },
  "devDependencies": {
    "@types/node": "^22.x",
    "@types/react": "^19.x",
    "@types/react-dom": "^19.x",
    "typescript": "^5.x",
    "tsx": "^4.x",
    "tailwindcss": "^4.x",
    "@tailwindcss/postcss": "^4.x",
    "postcss": "^8.x",
    "eslint": "^9.x",
    "eslint-config-next": "^15.x"
  }
}
```

> 정확한 minor·patch 버전은 Do 단계에서 `npm install` 시 lock-file로 고정. Tailwind 4.x는 PostCSS 플러그인 구성이 3.x와 다름 — Do 단계에서 공식 문서 확인 필요.

### 11.7 Cloudflare Pages 배포 가이드 (DEPLOY.md 요지)

1. GitHub repo 생성 (`gym-alt-app`)
2. `git init && git add . && git commit -m "init"` 후 push
3. Cloudflare Pages → "Create application" → "Connect to Git" → repo 선택
4. Build settings:
   - Framework preset: Next.js (Static HTML Export)
   - Build command: `npm run build`
   - Build output directory: `out`
   - Root directory: (empty)
   - Node version: 20 또는 22
5. Save and Deploy → `<project>.pages.dev` 자동 발급

> 환경 변수, 커스텀 도메인은 PRD §9.1 Q-7 결정에 따라 미사용.

---

## 12. Open Questions for Do Phase

| ID | Question | Decision Owner |
|----|----------|----------------|
| D-1 | `public/data/exercises-ko.json`을 git에 커밋할지 (.gitignore 여부) | CTO 즉시 결정: **gitignore에 포함, 빌드 시 재생성** (재현 가능성 보장 + repo 크기 절감). 단, Cloudflare Pages 빌드에서 `npm run build` 실행되므로 문제 없음. |
| D-2 | Tailwind 4.x vs 3.x | 안정성 우선 → **3.x로 시작**, 향후 4.x로 마이그레이션. PostCSS 구성 단순. |
| D-3 | ESLint 9 (flat config) vs 8 | Next.js 15가 권장하는 버전 채택. Do 단계 `npm create next-app` 또는 수동 설정 시 결정. |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-30 | Option C (Pragmatic) 선정, M1-M2 통합 설계 | jiinbae |
