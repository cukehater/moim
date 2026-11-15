# 운영자 투표 삭제 (기명 모임) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기명 모임 상세 화면의 날짜별 결과에서 투표자 시트를 열어 특정 투표자의 투표를 통째로 삭제한다.

**Architecture:** 운영자 전용 쿼리 `getVoteRecords`가 투표자별(투표 id·이름·순번·시각·선택 옵션) 목록을 만들고, 상세 페이지가 기명 모임일 때만 이를 결과 표 위젯에 넘긴다. 위젯의 날짜 줄 아바타를 누르면 시트가 열리고, 시트 줄의 [삭제]가 `features/vote-remove`의 확인 창 → 서버 액션 `removeVote`를 호출한다.

**Tech Stack:** Next.js 16 App Router(서버 액션), Drizzle + Neon, radix Dialog/AlertDialog(`shared/ui`), Playwright E2E

**Spec:** `docs/superpowers/specs/2026-11-15-admin-remove-vote-design.md`

## Global Constraints

- 기명 모임만. 익명 모임은 아바타·시트·삭제 모두 없음, 액션도 거부
- 공개 쿼리 `getTallies`(`src/entities/vote/api/queries.ts`)는 바꾸지 않음. 투표 id는 운영자 화면에만
- 확인 창 문구: `{이름}님의 투표를 지울까요?` / 설명 `{날짜들} 선택이 모두 지워지고 되돌릴 수 없어요.` 마감된 모임이면 설명 끝에 ` 확정 날짜가 바뀔 수 있어요.`
- 성공 토스트 `투표를 지웠어요`. 날짜 표기는 `dayParts`(`@/shared/lib`)의 `label`(예: `1월 9일`)을 `·`로 이어 붙임
- 마감 전후 모두 삭제 허용. FSD 레이어 규칙(`pnpm lint:fsd`) 통과
- 커밋 메시지는 한국어 제목 한 줄, 명사형 끝 (예: `feat: 운영자 투표 삭제 추가`)

## Review Focus

- 다른 모임의 voteId를 넘기면 아무것도 지워지지 않아야 함 → `where id = voteId and meetingId = meetingId` (Task 1 Step 3)
- 익명 모임 id로 액션을 호출하면 `{ ok: false }` → 액션 첫머리 가드 (Task 1 Step 3), 익명 모임 화면에 아바타 버튼 없음 (Task 2 테스트)
- 한 날짜의 마지막 투표자를 지우면 그 줄이 `0명`, 아바타 버튼 사라짐 (Task 1 테스트 마지막 단언)
- [삭제] 연타 → pending 동안 버튼 비활성 (Task 1 Step 3)
- 마감된 모임 삭제 시 확정 날짜 변동 경고 문구 (Task 2 테스트)

---

### Task 1: 기명 모임 투표 삭제 흐름

**Files:**
- Modify: `src/entities/vote/api/queries.ts`, `src/entities/vote/api/index.ts` (export)
- Create: `src/features/vote-remove/api/remove-vote.action.ts`, `src/features/vote-remove/ui/remove-vote-button.tsx`, `src/features/vote-remove/index.ts`
- Create: `src/widgets/meeting-result-table/ui/vote-records-sheet.tsx`
- Modify: `src/widgets/meeting-result-table/ui/meeting-result-table.tsx`, `src/views/meeting-detail/ui/meeting-detail-page.tsx`
- Test: `e2e/admin.spec.ts`

**Interfaces:**
- Produces:
  - `type VoteRecord = { id: string; name: string; order: number; createdAt: Date; optionIds: string[] }` (`entities/vote/api/queries.ts`, `index.server`로 export)
  - `getVoteRecords(meetingId: string): Promise<VoteRecord[]>` — createdAt 오름차순, `order`는 그 순번(0부터, `getTallies`와 같은 규칙)
  - `removeVote(meetingId: string, voteId: string): Promise<ActionResult>` (`'use server'`)
  - `RemoveVoteButton({ meetingId, voteId, name, dates, isClosed }: { meetingId: string; voteId: string; name: string; dates: string[]; isClosed: boolean })` (`features/vote-remove` 공개)
  - `MeetingResultTable` props 추가: `records?: VoteRecord[]` (undefined = 익명), `isClosed: boolean`

- [ ] **Step 1: 실패하는 E2E 작성** (`e2e/admin.spec.ts`의 `운영자` describe 안)

```ts
test('기명 모임: 투표자 시트에서 투표 삭제', async ({ page }) => {
  const id = `${PREFIX}rm1`
  await seedMeeting({ id, votes: [['철수', [0, 1]], ['영희', [0]]] })
  await page.goto(`/dashboard/${id}`)

  await page.getByRole('button', { name: /1월 10일.*투표자 1명 보기/ }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet).toContainText('철수')
  await expect(sheet).toContainText('1월 9일 · 1월 10일')
  await sheet.getByRole('button', { name: '철수 투표 삭제' }).click()

  const confirm = page.getByRole('alertdialog')
  await expect(confirm).toContainText('철수님의 투표를 지울까요?')
  await expect(confirm).toContainText('1월 9일 · 1월 10일 선택이 모두 지워지고 되돌릴 수 없어요.')
  await confirm.getByRole('button', { name: '삭제' }).click()
  await expect(page.getByText('투표를 지웠어요')).toBeVisible()

  await expect(page.getByText('응답 1명')).toBeVisible()
  await expect(page.getByRole('button', { name: /1월 10일.*투표자/ })).toHaveCount(0)
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx playwright test e2e/admin.spec.ts -g "투표자 시트에서 투표 삭제"`
Expected: FAIL (`1월 10일 … 투표자 1명 보기` 버튼 없음)

- [ ] **Step 3: 구현**
  - `getVoteRecords`: `votes` leftJoin `voteSelections`, `meetingId`로 필터, `asc(votes.createdAt)`. 행을 vote id로 묶음. `name ?? '(이름 없음)'`
  - `removeVote`: `requireAdmin()` → `getMeeting` 없으면 `모임을 찾을 수 없어요` → `isAnonymous`면 `익명 모임은 투표를 지울 수 없어요` → `db.delete(votes).where(and(eq(votes.id, voteId), eq(votes.meetingId, meetingId)))` → `revalidateMeeting(meetingId)` → `{ ok: true, data: undefined }`. 구조는 `src/features/vote-cancel/api/cancel-vote.action.ts`와 같게
  - `RemoveVoteButton`: `src/features/meeting-delete/ui/delete-meeting-button.tsx` 패턴(AlertDialog + useTransition). 트리거는 `Button variant="ghost" size="sm"`, 글자 `삭제`, `aria-label={`${name} 투표 삭제`}`, pending 중 disabled. 성공 시 `toast.success('투표를 지웠어요')`, 실패 시 `toast.error(message)`. 문구는 Global Constraints
  - `VoteRecordsSheet({ meetingId, dateLabel, records, labelOf, isClosed })`: 트리거 모양은 `src/widgets/vote-board/ui/voters-sheet.tsx`(아바타 3개 + `+N` + ›, `VoterAvatar` 재사용). sr-only 텍스트 `{dateLabel} 투표자 {n}명 보기`. 시트 줄: `VoterAvatar` · 이름 · `formatDateTime(createdAt)` · 고른 날짜들 · `RemoveVoteButton`. `labelOf(optionId) → '1월 9일'`
  - `MeetingResultTable`: `records`가 있으면 각 줄 끝에 그 날짜를 고른 records로 `VoteRecordsSheet`(0명이면 렌더 안 함)
  - 상세 페이지: `meeting.isAnonymous ? undefined : await getVoteRecords(id)`를 `records`로, `isClosed={status === 'closed'}`

- [ ] **Step 4: 통과 확인**

Run: `npx playwright test e2e/admin.spec.ts -g "투표자 시트에서 투표 삭제" && pnpm typecheck && pnpm lint && pnpm lint:fsd`
Expected: 1 passed, 나머지 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add src/entities/vote src/features/vote-remove src/widgets/meeting-result-table src/views/meeting-detail e2e/admin.spec.ts
git commit -m "feat: 기명 모임 운영자 투표 삭제 추가"
```

### Task 2: 익명·마감 경계

**Files:**
- Test: `e2e/admin.spec.ts`
- Modify (테스트가 실패할 때만): Task 1의 파일들

**Interfaces:**
- Consumes: Task 1의 `MeetingResultTable({ records, isClosed })`, `RemoveVoteButton`

- [ ] **Step 1: 실패 여부를 보는 E2E 두 개 작성**

```ts
test('익명 모임엔 투표자 삭제가 없음', async ({ page }) => {
  const id = `${PREFIX}rm2`
  await seedMeeting({ id, anonymous: true, votes: [['a', [0]]] })
  await page.goto(`/dashboard/${id}`)
  await expect(page.getByText('응답 1명')).toBeVisible()
  await expect(page.getByRole('button', { name: /투표자 \d+명 보기/ })).toHaveCount(0)
})

test('마감된 모임 삭제 확인 창은 확정 변동을 알림', async ({ page }) => {
  const id = `${PREFIX}rm3`
  await seedMeeting({ id, closed: true, votes: [['철수', [0]]] })
  await page.goto(`/dashboard/${id}`)
  await page.getByRole('button', { name: /1월 9일.*투표자 1명 보기/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: '철수 투표 삭제' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('확정 날짜가 바뀔 수 있어요.')
})
```

- [ ] **Step 2: 실행**

Run: `npx playwright test e2e/admin.spec.ts -g "익명 모임엔 투표자 삭제|확정 변동"`
Expected: Task 1이 Global Constraints대로 됐다면 PASS. 실패하면 해당 분기만 고쳐 PASS

- [ ] **Step 3: 전체 회귀**

Run: `pnpm test && npx playwright test`
Expected: 모두 통과

- [ ] **Step 4: 커밋**

```bash
# 작업 트리에 이 기능과 무관한 미커밋 변경(모션·버튼)이 있으니 src 통째로 add 금지
git add e2e/admin.spec.ts src/entities/vote src/features/vote-remove src/widgets/meeting-result-table src/views/meeting-detail
git commit -m "test: 투표 삭제 익명·마감 경계 E2E 추가"
```
