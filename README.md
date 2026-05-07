# gym-alt-app

헬스장에서 사용하려던 기구가 점유되었거나 헬스장에 없을 때, **30초 안에 대체 운동을 찾는** 모바일 웹앱.

- **데이터**: [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) (Unlicense, Public Domain)
- **운동 수**: 873개 (모두 한국어 번역 완료)
- **호스팅**: Cloudflare Pages (정적 사이트)
- **상태**: M1-M2 (골격) 완료, M3 화면 구현 시작 예정

## 빠른 시작

```bash
# 1) 의존성 설치
npm install

# 2) 데이터 전처리 (873개 운동 한국어 머지 + DetailedEquipment 분류)
npm run preprocess

# 3) 개발 서버
npm run dev

# 4) 정적 빌드 (preprocess 자동 실행 후 next build)
npm run build
# → out/ 디렉토리에 정적 파일 생성
```

## 디렉토리 구조

```
gym-alt-app/
├── data/                       # 원본 + 시드 데이터 (커밋됨)
│   ├── exercises.json          # Free Exercise DB 873개 원본
│   ├── translations.json       # 한국어 번역 (M0 산출물)
│   └── gym-presets.json        # 기본 헬스장 프리셋 시드
├── public/
│   └── data/
│       └── exercises-ko.json   # 빌드 산출물 (gitignore — preprocess 재생성)
├── scripts/
│   ├── preprocess.ts           # 머지 + 분류 + 검증
│   └── lib/
│       └── detailed-equipment.ts
├── src/
│   ├── app/                    # Next.js App Router
│   └── lib/
│       ├── types.ts            # 도메인 타입 (single source of truth)
│       └── i18n.ts             # 한국어 매핑 (MUSCLE_KO 등)
└── docs/
    ├── PRD.md
    ├── DEPLOY.md
    ├── 01-plan/features/
    └── 02-design/features/
```

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run preprocess` | 데이터 머지·검증·산출 (1회 실행 권장) |
| `npm run dev` | Next.js 개발 서버 (`http://localhost:3000`) |
| `npm run build` | preprocess + next build (CI/CD에서 사용) |
| `npm run typecheck` | TypeScript 전체 타입 체크 |
| `npm run lint` | ESLint |

## 마일스톤 진행 상황

| 단계 | 상태 |
|------|:----:|
| M0 — 한국어 번역 (873개) | ✅ |
| M1 — 데이터 전처리 파이프라인 | ✅ |
| M2 — Next.js + Tailwind 골격 | ✅ |
| M3 — 부위 → 목록 → 상세 화면 | ⏳ |
| M4 — 대체 추천 + 가용 기구 필터 | ⏳ |
| M5 — YouTube 딥링크 + 근육 다이어그램 | ⏳ |
| M6 — 모바일 반응형·UX | ⏳ |
| M7 (옵션) — 검색 / 즐겨찾기 / PWA | ⏳ |

## 라이선스

- 코드: 별도 명시 전까지 비공개
- 데이터: Free Exercise DB (Unlicense)

## 참고

- [PRD](docs/PRD.md)
- [Cloudflare Pages 배포 가이드](docs/DEPLOY.md)
