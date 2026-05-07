# 배포 가이드 — Cloudflare Pages

본 프로젝트는 정적 사이트(`output: 'export'`)이므로 Cloudflare Pages 무료 플랜으로 배포 가능합니다.

> **현재 상태 (2026-05-07)**: GitHub repo 초기화 완료 — `https://github.com/danji1126/gym-alt-app` (private). 남은 단계는 Cloudflare Pages 연결뿐.

## 외부 의존성 (배포 후 가용성 영향)

운동 시연 이미지는 빌드 산출물에 포함되지 않고 런타임에 외부에서 로드됩니다.

- **출처**: `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/`
- **라이선스**: Unlicense (퍼블릭 도메인)
- **위험**:
  - GitHub raw가 일시 다운되거나 원본 저장소 master 브랜치가 변경되면 이미지 깨짐. 앱 동작 자체에는 영향 0 (이미지 외 모든 데이터는 빌드 산출물).
  - 원본 저장자 계정 탈취 시 악성 이미지 교체 가능 — 단, JS 실행 0이라 XSS 불가. CSP의 `img-src https://raw.githubusercontent.com`로 도메인 한정.
- **장기 대응 (선택)**: 빌드 시 이미지 다운로드 → `public/exercise-images/`에 동봉. 873 운동 × 2 이미지 ≈ 100-300 MB 추가. Cloudflare Pages 25 MB/asset 한도 OK이나 첫 로드 시간 영향. 현재는 외부 의존 유지가 KISS.

`public/_headers`에 CSP가 설정되어 있어 외부 이미지 도메인은 `raw.githubusercontent.com`만 허용됩니다.

---

## 사전 준비

- [x] 로컬에서 `npm run build` 성공 확인 (`out/` 생성)
- [x] GitHub 계정 (`danji1126`)
- [x] GitHub repo 생성 + push 완료 (`gym-alt-app`, private)
- [ ] Cloudflare 계정 (무료)

---

## 1. GitHub repo 생성 ✅ 완료

`https://github.com/danji1126/gym-alt-app` (private) — `gh repo create … --private --push`로 자동 생성·push.

이후 추가 변경 시:

```bash
cd /Users/jiinbae/dev/myProject/gym-alt-app
git add <변경파일>
git commit -m "feat: <설명>"
git push  # → main 푸시 → Cloudflare Pages 자동 재배포
```

> `public/data/exercises-ko.json`은 `.gitignore`에 포함되어 있습니다 — Cloudflare Pages 빌드 시 `npm run build`가 `npm run preprocess`를 자동 실행하여 재생성합니다.

---

## 2. Cloudflare Pages 연결 (👉 다음 단계)

1. https://dash.cloudflare.com/ 로그인 (없으면 무료 가입)
2. 좌측 메뉴 **Workers & Pages** → **Create application** → **Pages** 탭
3. **Connect to Git** 선택
4. GitHub 인증 → **Configure GitHub App** → `danji1126/gym-alt-app` 권한 부여 (private repo이므로 명시적 권한 필요)
5. repo `gym-alt-app` 선택 → **Begin setup**

### Build settings

| 항목 | 값 |
|------|------|
| **Project name** | `gym-alt-app` (자동 발급되는 서브도메인이 됨: `gym-alt-app.pages.dev`) |
| **Production branch** | `main` |
| **Framework preset** | `Next.js (Static HTML Export)` |
| **Build command** | `npm run build` |
| **Build output directory** | `out` |
| **Root directory** | (비워둠) |
| **Node.js version** | `20` 또는 `22` (Environment variables에 `NODE_VERSION=22` 추가) |

5. **Save and Deploy** 클릭
6. 첫 배포 완료까지 약 2-5분 소요
7. 완료 시 `https://gym-alt-app.pages.dev` 에서 확인

---

## 3. 자동 배포 동작

- `main` 브랜치에 push → 프로덕션 자동 재배포
- 다른 브랜치 push → 프리뷰 URL 자동 생성

---

## 4. 환경 변수

본 프로젝트는 환경 변수를 사용하지 않습니다 (PRD §1.4 — 백엔드/auth 0).

향후 필요 시 Cloudflare Pages 대시보드 → 프로젝트 → **Settings → Environment variables** 에서 추가.

---

## 5. 커스텀 도메인 (옵션)

PRD §9.1 Q-7 결정: `*.pages.dev` 무료 서브도메인 사용. 커스텀 도메인은 추가하지 않음.

필요 시 Cloudflare Pages 대시보드 → **Custom domains** → 도메인 추가.

---

## 6. 빌드 실패 시 디버깅

| 증상 | 원인 / 조치 |
|------|------------|
| `preprocess` 단계에서 `ERR_MISSING_TRANSLATION` 등 fail-fast | `data/translations.json`과 `data/exercises.json` ID가 어긋남. 로컬에서 `npm run preprocess` 재현 후 수정. |
| `next build` 실패 | 로컬 `npm run build`로 재현. TypeScript 에러나 import 경로 문제일 가능성 높음. |
| Node version 관련 에러 | Cloudflare Pages **Settings → Environment variables → Production**에서 `NODE_VERSION=22` 추가. |
| 빌드는 성공하나 페이지가 깨짐 | `next.config.ts`의 `trailingSlash: true` 확인. 정적 export 시 라우팅 충돌 없는지 점검. |

---

## 7. 로컬 프리뷰

```bash
npm run build
npx serve out
# → http://localhost:3000 (정확한 포트는 출력 메시지 확인)
```

`out/` 디렉토리는 **모든 정적 파일**(`index.html`, `_next/`, `data/`)을 포함하므로, 어떤 정적 호스팅에서도 동작.
