# MOIM — 제품 요구사항 문서 (PRD)

- 버전: 1.0 / 작성일: 2026-11-09
- 용도: Claude Code 디자인·구현 핸드오프

## 1. 개요
운영자(1인)가 모임을 만들고 후보 날짜를 지정하면, 참여자는 공유 링크로 들어와 로그인 없이 참석 가능 날짜에 투표한다. 투표 기간이 끝나면 자동 마감되고, 운영자가 최종 날짜를 확정한다.

### 사용자
| 역할 | 인증 | 접근 범위 |
|---|---|---|
| 운영자 | Google OAuth, `ADMIN_EMAIL` 일치 시만 허용 | `/dashboard/**` 전체 |
| 투표자 | 없음 (httpOnly 쿠키 voterToken) | `/m/[id]` |

### 범위 밖 (v1)
실시간 갱신, 알림/이메일, 다중 운영자, 참석 정원, 시간대(슬롯) 투표, i18n.

## 2. 기능 요구사항

### 2.1 모임 생성/수정 (운영자)
| 필드 | 타입/규칙 | 필수 |
|---|---|---|
| 썸네일 | Cloudinary 업로드 (signed, 서명은 서버 액션 발급), public_id 저장 | 선택 |
| 제목 | 1~80자 | O |
| 모임장 | 1~30자 | O |
| 설명 | ~500자, 갤러리에 2줄 말줄임 노출 | 선택 |
| 장소 | ~100자 | 선택 |
| 후보 날짜 | 달력에서 탭으로 다중 선택(`react-day-picker` multiple), 1개 이상, 중복 불가 | O |
| 익명/기명 | 토글 | O (기본 기명) |
| 복수 선택 허용 | 토글. off면 정확히 1개 선택 | O (기본 on) |
| 결과 공개 시점 | `always` / `after_vote` / `after_close` | O (기본 always) |
| 투표 시작/종료 | datetime, 종료 > 시작. 기본: 지금 ~ 7일 후 | O |

- 생성 즉시 발행(공유 링크 `/m/{id}`, id는 nanoid 10자). 링크 복사 버튼 제공.
- 수정 시 투표가 있는 상태에서:
  - 후보일 삭제: 경고 AlertDialog 후 허용, 해당 날짜 선택만 제거(cascade).
  - 기명→익명: 경고 후 허용, 이름 데이터는 보존하고 표시만 숨김.
  - 익명→기명: 경고 후 허용, 기존 표는 "(이름 없음)"으로 표시.
- 삭제: 확인 다이얼로그 후 모임/후보일/투표 모두 삭제.

### 2.2 상태와 마감
상태는 저장하지 않고 조회 시 계산 (cron 불필요):
```
getMeetingStatus(m, now):
  m.closedAt 있음      -> 'closed'
  now < m.startsAt     -> 'scheduled'
  now >= m.endsAt      -> 'closed'
  그 외                -> 'open'
```
- 수동 조기 마감: `closedAt = now`.
- 재개: `closedAt = null`. `endsAt`이 지났으면 새 `endsAt` 입력 필수.
- 최종 날짜 확정: 마감 후 후보일 중 하나 선택 → `confirmedOptionId`. 확정 취소/변경 가능.

### 2.3 대시보드 (운영자)
- 카드 갤러리: 썸네일, 제목, 설명 2줄, 기간, 상태 배지(예정/진행/마감/확정), 응답 수.
- 상태 필터 탭: 전체/진행/예정/마감. 최신 생성순.
- 그리드: 앱 컨테이너 폭 기준 컨테이너 쿼리. 30rem 미만 1열, 이상 2열(최대 2열). `+ 새 모임`은 모든 환경에서 하단 FAB.
- 빈 상태: 첫 모임 만들기 CTA.

### 2.4 모임 상세 (운영자)
- 날짜별 결과 표: 일자순(후보 날짜는 모든 화면에서 항상 일자순), 기명이면 이름 목록. 최다 득표 강조.
- 액션: 링크 복사, 수정, 조기 마감/재개, 날짜 확정, 삭제.
- 운영자는 공개 정책과 무관하게 항상 결과를 본다.

### 2.5 투표 페이지 `/m/[id]` (공개)
- 헤더: 썸네일, 제목, 모임장, 장소, 설명, 남은 시간.
- 후보일 카드 리스트(세로, 터치 타깃 390px 기준 48px·최소 44px): 날짜+요일, 인원 수, 기명이면 이름 칩(공개 정책 허용 시).
- 선택: 단일 모드는 라디오 동작, 복수 모드는 토글.
- **기명**: 첫 날짜 탭 시 이름 입력 팝오버 → 이름 검증(trim 후 1~20자, 모임 내 중복 불가) → 이후 같은 voterToken은 재질문 없음. 이름 변경은 팝오버 재오픈 버튼으로.
- **익명**: 팝오버 없음.
- 하단 고정 `투표하기` 버튼으로 제출. 재방문 시 내 선택이 미리 체크되고 `수정하기`/`투표 취소` 제공.
- **예정(scheduled)**: 딤 + 닫을 수 없는 팝오버 "M/D(요일) HH:mm에 투표가 시작돼요".
- **마감(closed)**: 딤 + 닫을 수 없는 팝오버.
  - 확정됨: "최종 날짜 12/20(토)" + 장소.
  - 미확정: "투표가 마감됐어요. 날짜 확정을 기다리고 있어요."
  - 배경 결과는 공개 정책 허용 시에만 렌더.
- 없는 id: 404.
- 결과 공개 정책은 **서버에서 필터**해 응답에 포함하지 않음:
  - `always`: 항상 / `after_vote`: 해당 voterToken 투표 존재 시 / `after_close`: closed일 때.

### 2.6 에러/피드백
- 서버 액션 결과: `{ ok: true, data } | { ok: false, fieldErrors?, message? }`.
- 필드 에러는 인라인, 그 외는 `sonner` 토스트.
- 투표 도중 마감된 경우: "투표가 마감됐어요" 토스트 + 마감 오버레이로 전환.

## 3. 기술 스택
| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js 16 (App Router), TypeScript, React 19 |
| 스타일 | Tailwind CSS 4, shadcn/ui (Radix), lucide-react |
| 폼/검증 | react-hook-form, @hookform/resolvers, zod, drizzle-zod |
| 인증 | Auth.js (Google provider, JWT 세션, signIn 콜백에서 ADMIN_EMAIL 검사) |
| DB | Neon Postgres (serverless HTTP 드라이버) + Drizzle ORM + drizzle-kit |
| 이미지 | Cloudinary + next-cloudinary (CldUploadWidget, CldImage) |
| 날짜 | react-day-picker(운영자 폼 전용), date-fns + ko locale, 표시 시간대 Asia/Seoul |
| UI 보조 | sonner(토스트), nanoid |
| 배포 | Vercel |
| 품질 | Vitest, Playwright, Lighthouse CI, @feature-sliced/steiger, ESLint |

## 4. 데이터 모델 (Drizzle / Postgres)
```
meetings
  id                text pk               -- nanoid(10)
  title             varchar(80)  not null
  host              varchar(30)  not null
  description       varchar(500)
  location          varchar(100)
  thumbnail_id      text                  -- Cloudinary public_id
  is_anonymous      boolean      not null
  allow_multiple    boolean      not null
  result_visibility enum('always','after_vote','after_close') not null
  starts_at         timestamptz  not null
  ends_at           timestamptz  not null  -- check(ends_at > starts_at)
  closed_at         timestamptz
  confirmed_option_id text fk -> date_options.id on delete set null
  created_at, updated_at timestamptz

date_options
  id text pk, meeting_id fk cascade, date date not null
  unique(meeting_id, date)

votes
  id text pk, meeting_id fk cascade,
  voter_token text not null, name varchar(20),
  unique(meeting_id, voter_token), unique(meeting_id, name)
  created_at, updated_at

vote_selections
  vote_id fk cascade, option_id fk cascade, pk(vote_id, option_id)
```
- 투표 저장은 트랜잭션: votes upsert → selections 전량 교체.

## 5. 아키텍처 (FSD)
```
app/                           # Next 라우팅 전용. page.tsx는 views re-export만
  login/page.tsx
  dashboard/page.tsx, new/page.tsx, [id]/page.tsx, [id]/edit/page.tsx
  m/[id]/page.tsx
  api/auth/[...nextauth]/route.ts   # 유일한 route handler
proxy.ts                       # /dashboard 보호
src/
  app/       providers, globals.css, auth.ts
  views/     login, dashboard, meeting-form, meeting-detail, vote   # FSD pages 레이어
  widgets/   meeting-gallery, vote-board, meeting-result-table, status-overlay
  features/  meeting-upsert, meeting-delete, meeting-close-reopen, meeting-confirm-date,
             vote-submit(이름 팝오버 포함), vote-cancel, thumbnail-upload
  entities/  meeting (model: zod, getMeetingStatus, 공개정책 필터 / api: 조회 / ui: MeetingCard, StatusBadge)
             vote    (model / api: 집계 조회)
  shared/    db(client, schema), ui(shadcn), lib(date, cn, id), config(env zod 검증)
```
규칙:
- page.tsx는 `export { XPage as default } from '@/views/x'` 수준으로 얇게.
- 읽기: Server Component가 `entities/*/api`(`import 'server-only'`) 직접 호출. 브라우저 fetch/API 호출 금지.
- 쓰기: `features/*/api/*.action.ts` (`'use server'`), 클라이언트는 `useActionState`/`useTransition`/`useOptimistic`.
- 운영자 액션 첫 줄 `requireAdmin()` (proxy와 이중 보호).
- 투표 액션은 서버에서 상태(open), 단일/복수 규칙, 이름 중복을 재검증.
- voterToken: 서버 액션에서 `cookies()`로 읽고 없으면 발급 (httpOnly, secure, sameSite=lax, 1년).
- 변경 후 `revalidatePath`로 `/m/[id]`, `/dashboard` 갱신.
- 레이어 규칙은 steiger로 강제(CI).

## 6. 비기능 요구사항

### 6.1 모바일 성능 예산 (Lighthouse 모바일 프리셋, Slow 4G)
| 페이지 | LCP | INP | CLS | 초기 JS(gzip) |
|---|---|---|---|---|
| `/m/[id]` | ≤2.5s | ≤200ms | ≤0.1 | ≤120KB |
| `/dashboard` | ≤2.5s | ≤200ms | ≤0.1 | — |

수단: 투표 페이지 RSC 위주(클라이언트 섬은 vote-board·이름 팝오버만), CldImage f_auto/q_auto/sizes + LCP 이미지 priority, react-day-picker는 운영자 폼에만, next/font Pretendard 서브셋, date-fns 개별 import. `'use cache'`는 v1 미사용(집계가 동적).

### 6.2 레이아웃 (모바일 전용)
- 앱 셸: `width: 100%; max-width: 500px; margin-inline: auto`. PC에서는 셸 밖 배경만 보이고, 셸 안은 모바일 레이아웃 그대로.
- 디자인 기준 폭: **390px** (시안은 390px 프레임, 1rem = 16px 기준으로 작성).
- 비례 축소: 모든 치수(폰트, 간격, 반경, 아이콘)는 `rem`으로 작성하고, 루트 폰트 크기를 화면 폭에 연동함.
  `html { font-size: min(calc(100vw / 390 * 16), 16px); }`  // = min(4.1026vw, 16px)
  - 390px 이하: 화면 폭에 정비례 축소 (360px 14.8px, 320px 13.1px). 390 시안과 동일한 비율로 보임.
  - 390~500px: 16px 고정, 레이아웃 폭만 넓어짐(확대하지 않음).
  - 500px 이상: 앱 셸 500px 고정, 가운데 정렬.
- 레이아웃 분기는 뷰포트 미디어 쿼리 대신 앱 셸 기준 컨테이너 쿼리(`@container`, Tailwind 4 `@container`/`@sm:` 등) 사용.
- 하단 고정 요소(투표 버튼, FAB, 토스트)도 셸 폭 안에 위치(`position: fixed` + 셸과 같은 max-width/가운데 정렬, 또는 셸 내부 sticky).
- 고정 하한(rem 축소 영향을 받지 않음): 터치 타깃 `min-height: max(44px, 3rem)`(390px에서 48px, 320px에서도 44px 유지), 인풋 `font-size: max(16px, 1rem)`(iOS 줌 방지).

### 6.3 접근성/모바일
- 터치 타깃 390px 기준 48px·최소 44px, 하단 고정 버튼은 safe-area-inset 반영.
- 팝오버 포커스 트랩, 키보드 조작, 인풋 font-size ≥16px(iOS 줌 방지).
- 상태는 색 + 텍스트 병기.

### 6.4 보안
- 모든 서버 액션 입력 zod 검증. 운영자 액션 `requireAdmin()`.
- Cloudinary 업로드 서명은 서버에서만, API secret 클라이언트 노출 금지.
- env는 `shared/config`에서 zod 검증 (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID/SECRET`, `ADMIN_EMAIL`, `CLOUDINARY_*`).

## 7. 검증
- Vitest: getMeetingStatus, zod 스키마(이름·기간·단일/복수), 공개 정책 필터.
- Playwright (Pixel 7 뷰포트): 모임 생성 → 기명 투표(이름 검증 에러 포함) → 재방문 수정 → 조기 마감 → 마감 오버레이 → 날짜 확정 표시.
- Lighthouse CI: `/m/[id]` 성능 예산 assert.
- `tsc --noEmit`, ESLint, steiger.

## 8. 화면 목록 (디자인 핸드오프)
1. 로그인
2. 대시보드 갤러리 (빈 상태 / 필터 탭)
3. 모임 생성·수정 폼 (달력 다중 선택, 썸네일 업로드, 경고 다이얼로그)
4. 모임 상세 (결과 표, 액션, 날짜 확정)
5. 투표 페이지: 익명 / 기명 / 이름 팝오버 / 투표 완료·수정
6. 투표 페이지 오버레이: 예정 / 마감(미확정) / 마감(확정)
7. 404
