# 투표 기간·상태 정책 정비 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모임 상태가 버튼(조기 마감·투표 재개)으로만 바뀌도록 기간 변경 규칙을 서버·폼에 적용하고, 재개 모달 버그 8건을 고친 뒤 코드 전체를 전수 검사한다.

**Architecture:** 기간 규칙은 순수 함수 `periodErrors`(`entities/meeting/model/period.ts`) 하나에 모으고 `upsertMeeting`이 이를 호출해 `fieldErrors`로 돌려준다. 폼은 서버가 넘긴 현재 상태로 입력을 잠그고(readOnly), 조기 마감은 서버에서 열린 모임만 허용한다.

**Tech Stack:** Next.js 16 서버 액션, Drizzle, react-hook-form, Vitest(단위), Playwright(E2E)

**Spec:** `docs/superpowers/specs/2026-11-15-period-policy-design.md`

## Global Constraints

- 문구 고정:
  - `CLOSED_LOCK` = `마감된 모임은 기간을 바꿀 수 없어요. 투표 재개를 이용해 주세요`
  - `START_LOCK` = `시작된 모임은 시작 시각을 바꿀 수 없어요`
  - `END_PAST` = `종료는 지금 이후여야 해요`
  - 재개 시 시작 이전 값: `시작 시각 이후로 입력해 주세요`
  - 예정 모임 조기 마감 거부: `시작 전에는 마감할 수 없어요`, 이미 마감: `이미 마감됐어요`
- 시각 비교는 분 단위 KST 문자열(`toKstInput`)로 "바뀌었는지"를 판단, "지금 이후" 판단은 `fromKstInput(v) > now`
- 상태 계산은 기존 `getMeetingStatus`(`src/entities/meeting/model/status.ts`) 재사용. 상태 저장 방식은 바꾸지 않음
- 폼 잠금은 `readOnly`(react-hook-form에서 `disabled`는 제출값이 빠짐)
- 커밋은 사용자 요청 시에만 (이번 세션 규칙). 각 Task 끝의 커밋 단계는 건너뛰고 ledger에 기록

## Review Focus

- 분 단위 반올림: DB 값에 초가 있어도 같은 분이면 "안 바뀜"으로 봐야 함 → Task 1 테스트 `초가 달라도 같은 분이면 변경 아님`
- 예정 모임의 시작을 과거로 옮겨 바로 진행 중이 되는 건 허용 → Task 1 테스트
- 편집 화면을 연 사이에 상태가 바뀐 경우(진행 중이던 모임이 시간 지나 마감) 서버가 최신 상태로 거부 → Task 1 규칙이 `now`로 계산하므로 Task 2 서버 호출에서 보장
- 종료가 지나 마감된 모임을 상세에서 열어 둔 채 재개 → 서버 거부 시 모달이 열려 오류 표시 (Task 3 E2E)
- 조기 마감 두 번 → 두 번째는 `이미 마감됐어요`, closedAt 덮어쓰지 않음 (Task 2)

---

### Task 1: 기간 규칙 순수 함수

**Files:**
- Create: `src/entities/meeting/model/period.ts`, `src/entities/meeting/model/period.test.ts`
- Modify: `src/entities/meeting/model/index.ts` (export)

**Interfaces:**
- Produces: `periodErrors(current: { startsAt: Date; endsAt: Date; closedAt: Date | null } | null, next: { startsAt: string; endsAt: string }, now: Date): { startsAt?: string; endsAt?: string }` — 빈 객체면 통과. `current=null`은 생성
- Produces: 문구 상수 `PERIOD_MESSAGES = { CLOSED_LOCK, START_LOCK, END_PAST }`

- [ ] **Step 1: 실패하는 단위 테스트** (`now = 2026-12-05T12:00+09:00`)
  - 생성: 종료가 지금 이전 → `{ endsAt: END_PAST }`, 시작 과거·종료 미래 → `{}`
  - 마감(closedAt 있음): 시작 변경 → `{ startsAt: CLOSED_LOCK }`, 종료 변경 → `{ endsAt: CLOSED_LOCK }`, 둘 다 그대로 → `{}`
  - 마감(종료 지남, closedAt 없음): 종료를 미래로 변경 → `{ endsAt: CLOSED_LOCK }`
  - 진행 중: 시작 변경 → `{ startsAt: START_LOCK }`, 종료를 과거로 → `{ endsAt: END_PAST }`, 종료를 더 미래로 → `{}`
  - 예정: 시작을 과거로 옮김 → `{}`, 종료를 과거로 → `{ endsAt: END_PAST }`
  - `초가 달라도 같은 분이면 변경 아님`: current.endsAt에 초 30을 넣고 next.endsAt은 같은 분 → `{}`

- [ ] **Step 2:** `pnpm vitest run src/entities/meeting/model/period.test.ts` → FAIL (모듈 없음)
- [ ] **Step 3:** 구현. `getMeetingStatus(current, now)`로 상태, `toKstInput(current.x) !== next.x`로 변경 여부
- [ ] **Step 4:** 같은 명령 → PASS, `pnpm test` 전체 통과

### Task 2: 서버 정책 적용

**Files:**
- Modify: `src/features/meeting-upsert/api/upsert-meeting.action.ts`, `src/features/meeting-close-reopen/api/close-reopen.action.ts`
- Test: `e2e/admin.spec.ts`

**Interfaces:**
- Consumes: Task 1 `periodErrors`
- Produces: `closeMeeting(id)`가 존재·상태 검사 후 `where(and(eq(id), isNull(closedAt)))`로만 기록

- [ ] **Step 1: 실패하는 E2E**
  - `마감된 모임은 편집에서 종료 시각을 바꿀 수 없음`: seed closed → `/dashboard/{id}/edit` → `#endsAt`의 값을 미래로 바꾸려 해도 readOnly(`toHaveAttribute('readonly')`) 이고 안내 문구 `CLOSED_LOCK` 보임
  - `예정 모임에는 조기 마감이 없음`: seed 후 starts_at을 내일로 update → 상세에 `조기 마감` 버튼 0개
- [ ] **Step 2:** `npx playwright test e2e/admin.spec.ts -g "편집에서 종료|조기 마감이 없음"` → FAIL
- [ ] **Step 3: 서버**
  - `upsertMeeting`: 파싱 후 `periodErrors(id ? meeting : null, { startsAt, endsAt }, new Date())`가 비어 있지 않으면 `{ ok:false, fieldErrors }` (생성 경로는 meeting 조회 전에 null로 검사)
  - `closeMeeting`: `getMeeting` 없으면 `모임을 찾을 수 없어요`, `getMeetingStatus`가 scheduled면 `시작 전에는 마감할 수 없어요`, closed면 `이미 마감됐어요`, update에 `isNull(meetings.closedAt)` 조건
  - `reopenMeeting`: `endsAt <= meeting.startsAt`이면 `시작 시각 이후로 입력해 주세요` (지금 이전 문구와 분리)
- [ ] **Step 4: UI는 Task 3에서** — 이 Task의 E2E는 Task 3 후 통과. Step 2의 FAIL만 기록

### Task 3: 폼 잠금·조기 마감 숨김·재개 모달 버그

**Files:**
- Modify: `src/features/meeting-upsert/ui/meeting-form.tsx`, `src/views/meeting-form/ui/meeting-form-page.tsx`, `src/views/meeting-form/ui/meeting-form-client.tsx`(props 통과만), `src/views/meeting-detail/ui/meeting-detail-page.tsx`, `src/features/meeting-close-reopen/ui/close-reopen-button.tsx`
- Test: `e2e/admin.spec.ts`

**Interfaces:**
- `MeetingForm` props 추가: `status: MeetingStatus | null` (생성은 null)

- [ ] **Step 1: 재개 모달 E2E 추가** `종료 지난 모임 재개: 지난 값은 거부되고 고치면 오류가 사라짐`: seed closed + ends_at 과거 → [투표 재개] → 모달 → 입력 `min` 속성이 있음 → 과거 값 입력·제출 → `지금 이후로 입력해 주세요` → 미래 값 입력 시 오류 문구 사라짐 → 닫고 다시 열면 입력 비어 있음
- [ ] **Step 2:** 실행 → FAIL
- [ ] **Step 3: 구현**
  - 편집 페이지가 `getMeetingStatus(meeting, new Date())`를 `status`로 넘김
  - 폼: closed면 시작·종료 `readOnly` + 그룹 footer `CLOSED_LOCK`, open이면 시작만 `readOnly` + footer `START_LOCK`. 종료 입력에 `min={toKstInput(now)}`(잠기지 않았을 때). readOnly 입력은 `text-gray-500` 정도로 구분
  - 상세: `status === 'scheduled'`면 `CloseReopenButton` 렌더 안 함
  - 재개 모달: `onOpenChange`에서 닫힐 때 `setEndsAt('')`·`setError(undefined)` / `onChange`에서 `setError(undefined)` / `fieldErrors.endsAt` 실패면 `setDialogOpen(true)` / 입력 `min={toKstInput(new Date())}` / 제출 버튼 `{pending ? '여는 중…' : '재개하기'}` / 입력 클래스에서 `min-h-10` 제거하고 주석을 "기본 모양·가운데 정렬 제거"로
- [ ] **Step 4:** `npx playwright test e2e/admin.spec.ts && pnpm test && pnpm typecheck && pnpm lint && pnpm lint:fsd` → 모두 통과 (Task 2 E2E 포함)

### Task 4: 코드 전체 전수 검사

- [ ] **Step 1:** 새 검토자(subagent, 가장 강한 모델)에게 저장소 전체 리뷰 의뢰: 서버 액션 권한·검증, 상태 경계, 데이터 무결성, 클라이언트 상태 버그, 접근성. Critical/Important/Minor + 실패 시나리오, "정책 판단 필요" 목록 별도
- [ ] **Step 2:** Critical·Important 버그는 재현 테스트 RED → 수정 → GREEN, 정책 판단 건은 고치지 않고 사용자에게 한 번에 질문
- [ ] **Step 3:** `pnpm test && npx playwright test && pnpm typecheck && pnpm lint && pnpm lint:fsd` 전부 통과

### Task 5: 상세 날짜별 결과 줄을 투표 페이지와 같은 배치로

**Files:**
- Modify: `src/widgets/meeting-result-table/ui/meeting-result-table.tsx`, `src/widgets/meeting-result-table/ui/vote-records-sheet.tsx`

- [ ] 줄 배치를 투표 페이지 `OptionCard`(`src/widgets/vote-board/ui/option-card.tsx`)와 맞춤: `min-h-12` · 날짜 `1월 9일` + `(토)` 요일 색 · 오른쪽 막대 `h-1 w-8` · 인원 `w-7 text-right` · 투표자 아바타 칸 고정 폭(`VOTER_SLOT` 재사용, 투표자 없으면 같은 폭 빈칸)
- [ ] 확정 표시: `자동 확정`·`확정` 글자 뱃지 대신 날짜 옆 작은 브랜드색 체크 원 하나 (`aria-label`로 `자동 확정`/`확정` 유지)
- [ ] 동점 확정 버튼(`ConfirmDateButton`)은 줄 아래 그대로
- [ ] E2E 중 `자동 확정` 텍스트를 보던 단언은 접근 가능한 이름으로 바꿈. 390px 스크린샷으로 투표 페이지와 나란히 비교
