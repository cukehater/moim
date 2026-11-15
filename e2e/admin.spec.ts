import { expect, test } from '@playwright/test'
import { adminSessionCookie, getMeetingRow, PREFIX, seedMeeting } from './db'

test.describe('로그인', () => {
  test('비로그인으로 대시보드에 오면 로그인 화면으로', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('button', { name: 'Google로 계속하기' })).toBeVisible()
  })

  test('운영자가 아닌 계정은 거부 안내', async ({ page }) => {
    await page.goto('/login?error=AccessDenied')
    await expect(page.getByRole('alert')).toHaveText('운영자 계정만 로그인할 수 있어요')
  })
})

test.describe('운영자', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([await adminSessionCookie()])
  })

  test('대시보드: 기간 표기와 상태 필터', async ({ page }) => {
    const id = `${PREFIX}dash1`
    await seedMeeting({ id, title: '[E2E] 대시보드 모임' })
    await page.goto('/dashboard')

    const row = page.getByRole('link', { name: /\[E2E\] 대시보드 모임/ })
    await expect(row).toContainText(/\d{4}\.\d{2}\.\d{2} \d{2}:\d{2} ~ \d{4}\.\d{2}\.\d{2} \d{2}:\d{2}/)
    await expect(row).toContainText('진행 중')

    await page.getByRole('link', { name: '마감', exact: true }).click()
    await expect(page).toHaveURL(/status=closed/)
    await expect(page.getByRole('link', { name: /\[E2E\] 대시보드 모임/ })).toHaveCount(0)
  })

  test('새 모임 만들기', async ({ page }) => {
    await page.goto('/dashboard/new')
    await page.getByPlaceholder('제목 (필수)').fill('[E2E] 새 모임')
    await page.getByPlaceholder('모임장 (필수)').fill('테스터')
    await page.getByPlaceholder('장소').fill('강남역')

    // 다음 달 10일·11일 (지난 날짜는 고를 수 없음)
    await page.locator('.rdp-button_next').click()
    await page.getByRole('button', { name: /년 \d+월 10일/ }).click()
    await page.getByRole('button', { name: /년 \d+월 11일/ }).click()
    await expect(page.getByText('2개 골랐어요')).toBeVisible()

    await page.getByRole('button', { name: '모임 만들기' }).click()
    await expect(page.getByText('모임을 만들었어요')).toBeVisible()
    await expect(page).toHaveURL(/\/dashboard\/[\w-]{10}$/)
    await expect(page.getByRole('heading', { name: '[E2E] 새 모임', level: 2 })).toBeVisible()
  })

  test('기명 → 익명 전환은 저장되고, 투표가 있으면 익명 → 기명은 막힘', async ({ page }) => {
    const id = `${PREFIX}anon1`
    await seedMeeting({ id, votes: [['영희', [0]]] })

    await page.goto(`/dashboard/${id}/edit`)
    await page.locator('#isAnonymous').click()
    await page.getByRole('button', { name: '수정하기' }).click()
    await page.getByRole('button', { name: '그래도 저장' }).click()
    await expect(page).toHaveURL(new RegExp(`/dashboard/${id}$`))
    await expect(page.getByText(/^익명 · /)).toBeVisible()
    expect((await getMeetingRow(id)).is_anonymous).toBe(true)
    await page.goto(`/m/${id}`)
    await expect(page.getByRole('button', { name: /투표자/ })).toHaveCount(0)

    await page.goto(`/dashboard/${id}/edit`)
    await expect(page.locator('#isAnonymous')).toBeDisabled()
    await expect(page.getByText('익명으로 투표가 들어와서 기명으로 바꿀 수 없어요.')).toBeVisible()
  })

  test('투표가 없으면 익명 → 기명 전환 가능', async ({ page }) => {
    const id = `${PREFIX}anon2`
    await seedMeeting({ id, anonymous: true })
    await page.goto(`/dashboard/${id}/edit`)
    await page.locator('#isAnonymous').click()
    await page.getByRole('button', { name: '수정하기' }).click()
    await expect(page).toHaveURL(new RegExp(`/dashboard/${id}$`))
    expect((await getMeetingRow(id)).is_anonymous).toBe(false)
  })

  test('동점이면 운영자가 확정, 단독 최다는 자동 확정', async ({ page }) => {
    const tie = `${PREFIX}tie1`
    await seedMeeting({ id: tie, closed: true, votes: [['영희', [0]], ['민수', [1]]] })
    await page.goto(`/dashboard/${tie}`)
    await expect(page.getByText('동점이에요. 최종 날짜를 골라 주세요.')).toBeVisible()
    await expect(page.getByRole('button', { name: '이 날짜로 확정' })).toHaveCount(2)
    await page.getByRole('button', { name: '이 날짜로 확정' }).first().click()
    await expect(page.getByText('날짜를 확정했어요')).toBeVisible()
    await expect(page.getByRole('button', { name: '확정 취소' })).toBeVisible()

    const single = `${PREFIX}auto1`
    await seedMeeting({ id: single, closed: true, votes: [['영희', [0, 1]], ['민수', [1]]] })
    await page.goto(`/dashboard/${single}`)
    await expect(page.getByText('자동 확정')).toBeVisible()
    await expect(page.getByRole('button', { name: '이 날짜로 확정' })).toHaveCount(0)
  })

  test('조기 마감 후 재개하면 확정이 풀림', async ({ page }) => {
    const id = `${PREFIX}reopen1`
    await seedMeeting({ id, votes: [['영희', [0]], ['민수', [1]]] })
    await page.goto(`/dashboard/${id}`)
    await expect(page.getByRole('link', { name: '투표 페이지 열기' })).toHaveAttribute('href', `/m/${id}`)

    await page.getByRole('button', { name: '조기 마감' }).click()
    await expect(page.getByText('투표를 마감했어요')).toBeVisible()
    await page.getByRole('button', { name: '이 날짜로 확정' }).first().click()
    await expect(page.getByText('날짜를 확정했어요')).toBeVisible()
    expect((await getMeetingRow(id)).confirmed_option_id).not.toBeNull()

    await page.getByRole('button', { name: '투표 재개' }).click()
    await expect(page.getByText('투표를 다시 열었어요')).toBeVisible()
    const row = await getMeetingRow(id)
    expect(row.closed_at).toBeNull()
    expect(row.confirmed_option_id).toBeNull()
  })

  test('기명 모임: 투표자 시트에서 투표 삭제', async ({ page }) => {
    const id = `${PREFIX}rm1`
    await seedMeeting({ id, votes: [['철수', [0, 1]], ['영희', [0]]] })
    await page.goto(`/dashboard/${id}`)

    await page.getByRole('button', { name: /1월 10일.*투표자 1명 보기/ }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet).toContainText('철수')
    await sheet.getByRole('button', { name: '철수 투표 삭제' }).click()

    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toContainText('철수님의 투표를 지울까요?')
    await expect(confirm.getByRole('list', { name: '고른 날짜' }).getByRole('listitem')).toHaveText(['1월 9일(토)', '1월 10일(일)'])
    await expect(confirm).toContainText('고른 날짜가 모두 지워지고 되돌릴 수 없어요.')
    await confirm.getByRole('button', { name: '삭제' }).click()
    await expect(page.getByText('투표를 지웠어요')).toBeVisible()

    await expect(page.getByText('응답 1명')).toBeVisible()
    // 시트가 열려 있으면 나머지 페이지가 aria-hidden이라 닫고 확인
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /1월 10일.*투표자/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /1월 9일.*투표자 1명 보기/ })).toBeVisible()
  })

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
})
