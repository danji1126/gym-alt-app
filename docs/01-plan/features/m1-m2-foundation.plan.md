# M1-M2 Foundation Planning Document

> **Summary**: 데이터 전처리 파이프라인(M1) + Next.js 정적 사이트 골격(M2)을 통합 구축. M3 이상의 화면 구현이 시작될 수 있는 토대 마련.
>
> **Project**: gym-alt-app
> **Version**: 0.1.0 (pre-init)
> **Author**: jiinbae (CTO)
> **Date**: 2026-04-30
> **Status**: Draft (옵션 A — KISS 진행)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | M0 번역 산출물(`translations.json`)과 원본 데이터(`exercises.json`)는 있으나, UI에서 소비할 단일 머지 JSON·DetailedEquipment 분류·Next.js 골격이 부재해 M3 화면 구현을 시작할 수 없다. |
| **Solution** | 빌드 타임 1회 실행되는 `scripts/preprocess.ts`로 한국어 머지 + 정규식 분류 + 절대 URL 변환을 수행해 `public/data/exercises-ko.json` 산출, 이후 Next.js 15 + TS strict + Tailwind 정적 export 골격을 세팅한다. |
| **Function/UX Effect** | 데이터 계층 단일 진입점 확보, 빌드 산출물 검증 자동화, M3 화면 개발자가 `import` 한 번으로 enriched exercise 데이터 사용 가능. |
| **Core Value** | KISS/YAGNI 준수 — 런타임 검증 라이브러리 없음, 의존성 최소화, 정적 JSON + LocalStorage 외 어떠한 백엔드/auth/DB도 도입하지 않음. |

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

### 1.1 Purpose

PRD §10에 정의된 M1·M2 두 마일스톤을 단일 Plan으로 통합 진행. 두 단계 모두 **인프라성 작업**으로 의존 관계가 직선적이며, 화면 구현이 없어 분리 시 오버헤드만 증가하기 때문.

산출물은 다음 두 가지로 단순화:
1. `public/data/exercises-ko.json` — UI가 소비할 단일 정규화 데이터
2. Next.js 정적 export 골격 — `npm run build` 성공 가능 상태

### 1.2 Background

**현재 상태**:
- `data/exercises.json` (873개 원본, Free Exercise DB, Unlicense)
- `data/translations.json` (한국어 번역, 873/873 매칭 완료)
- `data/instructions-batch-{01..09}.json` (배치 산출물, 머지 완료)
- `src/`, `scripts/` 비어있음 → 모든 골격을 새로 만들어야 함

**왜 지금**: M3(부위 → 목록 → 상세 화면) 진입 전제 조건이며, M2 Next.js 세팅까지 끝나야 화면 구현 시 `import data from '@/public/data/exercises-ko.json'` 패턴이 가능.

### 1.3 Related Documents

- PRD: [docs/PRD.md](../../PRD.md) v0.4
- 원본 데이터 라이선스: Unlicense (Public Domain)
- M0 번역 산출물: [data/translations.json](../../../data/translations.json)

---

## 2. Scope

### 2.1 In Scope

**M1 — 데이터 파이프라인**
- [ ] `scripts/preprocess.ts` — 머지 + 분류 + 절대 URL + 빌드 타임 검증
- [ ] `scripts/lib/types.ts` — `EnrichedExercise`, `MuscleGroup`, `DetailedEquipment` 타입
- [ ] `scripts/lib/detailed-equipment.ts` — PRD §4.4 정규식 분류기
- [ ] `data/gym-presets.json` — 기본 풀 헬스장 시드 (PRD §4.5.1)
- [ ] `public/data/exercises-ko.json` — 빌드 산출물 (873개 한국어 머지 완료)
- [ ] 검증 출력: 873/873 매칭, equipment 분류 분포, 누락 0건 assert

**M2 — Next.js + Tailwind 골격**
- [ ] `package.json` — Next.js 15, React 19, TypeScript 5.x, Tailwind 4.x
- [ ] `next.config.ts` — `output: 'export'`, `images.unoptimized: true`
- [ ] `tsconfig.json` — strict 모드
- [ ] `tailwind.config.ts`, `postcss.config.mjs`
- [ ] `src/app/layout.tsx`, `src/app/page.tsx` (placeholder)
- [ ] `src/app/globals.css` (Tailwind directives)
- [ ] `src/lib/types.ts`, `src/lib/i18n.ts` (MUSCLE_KO 매핑 등 — scripts/lib에서 복사 또는 재사용)
- [ ] `.gitignore`, `README.md`
- [ ] `docs/DEPLOY.md` — Cloudflare Pages 수동 연결 가이드

### 2.2 Out of Scope

- ❌ 화면 구현 (M3+)
- ❌ 추천 알고리즘 구현 (`src/lib/recommend.ts` — M4)
- ❌ `react-body-highlighter` 의존성 추가 (M5)
- ❌ PWA / next-pwa (M7 옵션)
- ❌ zod 등 런타임 스키마 검증 라이브러리 (KISS — 빌드 타임 assert로 충분)
- ❌ Cloudflare Pages 실제 배포 연결 (가이드 작성만)
- ❌ GitHub repo 초기화 / git 커밋 자동화 (사용자 직접 수행)
- ❌ E2E 테스트 셋업 (Playwright 등 — Check 단계에서 필요 시 결정)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `scripts/preprocess.ts` 실행 시 873개 운동을 한국어 번역과 머지하여 `public/data/exercises-ko.json` 생성 | High | Pending |
| FR-02 | 각 운동에 PRD §4.4 정규식 우선순위에 따라 `detailedEquipment[]` 부여 | High | Pending |
| FR-03 | `images[]`를 `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{id}/{n}.jpg` 절대 URL로 변환 | High | Pending |
| FR-04 | 각 운동에 영문명 기반 `youtubeSearchUrl` 생성 (검색 쿼리: 영문명 + " form") | High | Pending |
| FR-05 | 빌드 타임 assert: ID 매칭 873/873, equipment 분류 누락 0건 — 실패 시 `process.exit(1)` | High | Pending |
| FR-06 | `data/gym-presets.json`에 PRD §4.5.1 "기본 풀 헬스장" 프리셋 시드 작성 | High | Pending |
| FR-07 | Next.js 15 App Router + `output: 'export'` 설정으로 `npm run build` 성공 | High | Pending |
| FR-08 | Tailwind CSS 적용된 placeholder Home 페이지 1개 렌더링 가능 | Medium | Pending |
| FR-09 | TypeScript strict 모드, lint·typecheck 무경고 | Medium | Pending |
| FR-10 | Cloudflare Pages 배포 가이드 문서 (`docs/DEPLOY.md`) 작성 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Build performance | `preprocess.ts` 실행 ≤ 5초 | `time node scripts/preprocess.ts` |
| Bundle size | `exercises-ko.json` ≤ 500KB (gzip) | `ls -lh public/data/exercises-ko.json` + gzip 측정 |
| Build success | `next build` exit code 0 | CI/CD 검증 가능 (지금은 수동) |
| Type safety | TypeScript strict, 0 errors | `tsc --noEmit` |
| Dependency surface | Production deps ≤ 4개 (next, react, react-dom 포함) | `package.json` 검토 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `node scripts/preprocess.ts` 또는 `npm run preprocess` 무경고 실행, 산출물 생성
- [ ] `public/data/exercises-ko.json`이 873개 운동을 포함하고 모든 운동이 `nameKo`, `instructionsKo`, `detailedEquipment` 필드 보유
- [ ] `npm run build` 성공, `out/` 디렉토리 생성
- [ ] `out/index.html` 존재, Tailwind 스타일이 인라인 또는 별도 CSS로 포함됨
- [ ] `tsc --noEmit` 0 errors
- [ ] `docs/DEPLOY.md` 단계별 절차(저장소 연결 → 빌드 명령어 → 출력 디렉토리) 명시
- [ ] gap-detector + code-analyzer 병렬 실행 결과 Critical 이슈 0건

### 4.2 Quality Criteria

- [ ] `scripts/preprocess.ts`에서 누락 ID·미분류 equipment 발견 시 명확한 에러 메시지 + non-zero exit
- [ ] 모든 운동의 `detailedEquipment.length >= 1` (PRD §4.4 priority 11 fallback 보장)
- [ ] `MUSCLE_KO` 매핑이 PRD §4.3 17개 항목 모두 포함
- [ ] Next.js 골격이 placeholder 외 실제 비즈니스 로직 0줄 (KISS)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 한국어 추가로 JSON gzip > 500KB | Medium | Medium | gzip 사이즈 측정 후 임계 초과 시 (1) 사용 안 함 필드(`level`, `category`) 축소, (2) 향후 부위별 chunked JSON으로 분리. M2 단계에서는 측정만 수행 |
| DetailedEquipment 정규식 누락 — 일부 운동 분류 0건 | High | Medium | (1) `preprocess.ts`에서 분류 누락 시 fail-fast, (2) priority 11 fallback (`equipment` 그대로 사용)로 최소 1개 보장, (3) 분포 표 출력으로 수동 검증 |
| Next.js 15 + React 19 호환성 이슈 (peer deps 등) | Medium | Low | Context7로 공식 문서 확인 후 픽스 버전 사용, 호환성 매트릭스 검증 |
| `output: 'export'`에서 동적 라우트(`[id]`) 사용 시 generateStaticParams 누락 | Medium | Low | M2는 정적 페이지만 작성. 동적 라우트는 M3 이후 도입 시 SSG 대응 |
| Cloudflare Pages 실제 배포 연결 실패 (이번 단계 외) | Low | - | 가이드 문서로 절차만 제공, 사용자 별도 수행 |

---

## 6. Impact Analysis

> 신규 프로젝트라 기존 consumer 없음. 향후 M3 화면 구현이 본 산출물에 의존.

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `data/exercises.json` | Source data (read-only) | preprocess.ts에서 read만 수행, 수정 없음 |
| `data/translations.json` | Source data (read-only) | preprocess.ts에서 read만 수행, 수정 없음 |
| `public/data/exercises-ko.json` | Build artifact (new) | preprocess.ts 산출물 |
| `data/gym-presets.json` | Seed data (new) | PRD §4.5.1 기본 프리셋 1개 |
| `package.json` | Project config (new) | 신규 생성 |
| `src/app/*` | Next.js routes (new) | 신규 생성 |

### 6.2 Current Consumers

신규 프로젝트 — 기존 consumer 없음. 향후 의존 구조:

| Resource | Future Operation | Future Code Path | Impact |
|----------|------------------|------------------|--------|
| `public/data/exercises-ko.json` | READ | M3: `src/app/muscle/[muscle]/page.tsx`, `src/app/exercise/[id]/page.tsx` | 신규 작성 시점 |
| `public/data/exercises-ko.json` | READ | M4: `src/lib/recommend.ts` | 신규 작성 시점 |
| `data/gym-presets.json` | READ | M4: `src/lib/preset.ts` (LocalStorage seeding) | 신규 작성 시점 |

### 6.3 Verification

- [ ] preprocess.ts가 원본을 변경하지 않음 (read-only)
- [ ] 빌드 결과물(`exercises-ko.json`)의 스키마가 PRD §4.3 `EnrichedExercise`와 일치
- [ ] `data/gym-presets.json`이 PRD §4.5.1 20개 항목과 일치

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure (`components/`, `lib/`, `types/`) | Static sites, portfolios, landing pages | ✅ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend | ☐ |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems | ☐ |

**선정 사유**: PRD §1.4 Non-Goals — 백엔드/DB/auth/계정/AI 전부 배제. 정적 JSON + LocalStorage만 사용. 단일 사용자.

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js / Vite + React / Astro | **Next.js 15 App Router** | PRD §7.1 명시. `output: 'export'` 정적 빌드 지원. |
| State Management | Context / Zustand / Redux | **None (RSC + LocalStorage)** | PRD §7.1 — 글로벌 상태 라이브러리 불필요 |
| API Client | fetch / axios / react-query | **None** | 백엔드 없음. 정적 JSON `import` |
| Styling | Tailwind / CSS Modules | **Tailwind CSS 4.x** | PRD §7.1 — 모바일 퍼스트 |
| Testing | Jest / Vitest / Playwright | **None (M1-M2)** | YAGNI. Check 단계에서 필요 시 도입 검토 |
| Backend | BaaS / Custom / Serverless | **None** | PRD §1.4 명시적 배제 |
| Schema validation | zod / yup / 직접 assert | **직접 assert (빌드 타임만)** | 사용자 결정 — KISS, 런타임 검증 불필요 |
| Script runner | tsx / ts-node / node --import | **tsx** | 0-config TS 실행, devDependency만 |

### 7.3 Clean Architecture Approach

```
Selected Level: Starter

Folder Structure:
gym-alt-app/
├── data/                       # 원본 + 시드 데이터
│   ├── exercises.json          # 원본 (read-only)
│   ├── translations.json       # M0 산출물 (read-only)
│   └── gym-presets.json        # 신규 — 기본 풀 헬스장 시드
├── public/
│   └── data/
│       └── exercises-ko.json   # 빌드 산출물 (preprocess.ts 출력)
├── scripts/
│   ├── preprocess.ts           # 머지 + 분류 + 검증
│   └── lib/
│       ├── types.ts            # EnrichedExercise 등
│       └── detailed-equipment.ts  # 정규식 분류기
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # placeholder Home
│   │   └── globals.css
│   └── lib/
│       ├── types.ts            # scripts/lib/types.ts에서 재사용 (re-export)
│       └── i18n.ts             # MUSCLE_KO 등 매핑
├── docs/
│   ├── PRD.md
│   ├── DEPLOY.md               # 신규 — Cloudflare Pages 가이드
│   └── 01-plan/features/m1-m2-foundation.plan.md  # 본 문서
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── .gitignore
└── README.md
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

신규 프로젝트 — 컨벤션 미정의. 본 단계에서 최소한만 정립:

- [ ] `CLAUDE.md` — **차후 작성** (M3 전 또는 본 단계 산출물에 포함)
- [ ] ESLint — Next.js 기본 (`eslint-config-next`) 사용
- [ ] Prettier — Tailwind 플러그인만 추가, 그 외 기본
- [ ] `tsconfig.json` — Next.js 기본 + `"strict": true`

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | missing | 파일·디렉토리 kebab-case, 함수·변수 camelCase, 타입·컴포넌트 PascalCase | High |
| **Folder structure** | missing | `src/app/`(라우팅), `src/lib/`(공용), `scripts/`(빌드), `data/`(원본), `public/data/`(산출) | High |
| **Import order** | missing | external → `@/` → relative — Prettier import-sort 후순위 | Low |
| **Environment variables** | missing | M1-M2에서는 0개. M3+에서 필요 시 정의 | Low |
| **Error handling** | missing | preprocess.ts: fail-fast (process.exit(1) + console.error) | Medium |

### 8.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| (없음) | M1-M2 단계에선 환경변수 불필요 | - | ☐ |

### 8.4 Pipeline Integration

본 프로젝트는 9-phase Development Pipeline을 사용하지 않음 (Starter 레벨). PDCA 사이클만 적용.

---

## 9. Implementation Strategy (옵션 A — KISS)

### 9.1 단계 구성

| 단계 | 산출물 | 담당 |
|------|--------|------|
| **Plan** | 본 문서 | CTO 직접 ✅ |
| **Design** | `docs/02-design/features/m1-m2-foundation.design.md` (디렉토리 구조, 파일 의존성, 빌드 파이프라인) | `frontend-architect` Task() 1회 |
| **Do** | scripts + Next.js 골격 코드 | CTO 직접 |
| **Check** | gap-detector + code-analyzer 병렬 호출 | Task() 2회 (병렬) |
| **Act** | (조건부) Match Rate < 90% 시 수정 | 필요 시 |
| **Report** | 사용자에게 한국어 요약 + M3 진입 준비 보고 | CTO 직접 |

### 9.2 병렬화 분석

- **순차 의존**: Plan → Design → Do (각 단계는 이전 산출물에 의존)
- **병렬 가능**:
  - Do 단계 내부: `scripts/preprocess.ts` 작성과 Next.js 골격 작성은 **독립적** → 병렬 작성 가능
  - Check 단계: gap-detector와 code-analyzer는 **독립적** → 1회 호출에 병렬 Task 2개

**예상 효율**: Check 단계에서 병렬 호출로 약 50% 시간 절감.

### 9.3 사용자 추가 확인 메모 (Design 단계 진입 시 frontend-architect에게 전달)

다음 사항은 frontend-architect 판단에 위임하되, 결정이 모호한 경우 메모로 남기고 진행:

1. **`scripts/lib/types.ts`와 `src/lib/types.ts`의 관계**: 단일 source of truth로 할지(`src/lib/types.ts`만 두고 scripts에서 import), 분리할지. 권장은 단일 source.
2. **MUSCLE_KO 위치**: `src/lib/i18n.ts` (UI 사용) vs `scripts/lib/`에서도 필요한지. 현재 M1-M2에선 UI에서 미사용이므로 `src/lib/i18n.ts`만 두고 추후 필요 시 scripts에서 import.
3. **`tsx` vs `ts-node` vs Node v22 native**: 빌드 시간·DX 기준으로 frontend-architect 결정.

---

## 10. Next Steps

1. [x] Plan 작성 (본 문서)
2. [ ] frontend-architect Task() 1회 호출 → Design 문서 작성
3. [ ] CTO 직접 구현 (scripts + Next.js 골격) — Do 단계
4. [ ] gap-detector + code-analyzer 병렬 호출 — Check 단계
5. [ ] 사용자에게 결과 요약 보고 + M3 진입 준비 상태 안내

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-30 | 초안 작성 (옵션 A KISS 진행, 부가 결정 3개 반영) | jiinbae |
