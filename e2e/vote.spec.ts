import { expect, test } from '@playwright/test'
import { PREFIX, seedMeeting } from './db'

const voterCookie = (value: string) => ({ name: 'voterToken', value, domain: 'localhost', path: '/' })

test.describe('투표 페이지', () => {
  test('처음 온 사람: 날짜 탭 → 이름 입력 → 투표, 새로고침해도 선택 유지', async ({ page }) => {
    const id = `${PREFIX}vote1`
    await seedMeeting({ id })
    await page.goto(`/m/${id}`)

    await expect(page.getByText('아직 아무도 투표하지 않았어요')).toBeVisible()
    await page.getByRole('checkbox', { name: /1월 9일/ }).click()
    await page.getByRole('textbox', { name: '이름' }).fill('테스터')
    await page.getByRole('button', { name: '확인' }).click()
    await page.getByRole('checkbox', { name: /1월 16일/ }).click()

    await page.getByRole('button', { name: '2개 날짜로 투표하기' }).click()
    const done = page.getByRole('dialog', { name: '투표했어요' })
    await expect(done.getByText('1월 9일(토)')).toBeVisible()
    await done.getByRole('button', { name: '확인' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // 다시 들어오면 이미 투표했다는 안내
    await page.reload()
    const again = page.getByRole('dialog', { name: '테스터님은 이미 투표했어요' })
    await expect(again.getByText('1월 16일(토)')).toBeVisible()
    await again.getByRole('button', { name: '수정할래요' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('checkbox', { name: /1월 9일/ })).toBeChecked()
    await expect(page.getByRole('checkbox', { name: /1월 16일/ })).toBeChecked()
    await expect(page.getByRole('button', { name: '수정하기' })).toBeDisabled()
    await expect(page.getByText('테스터님으로 투표해요')).toBeVisible()
  })

  test('이미 있는 이름은 막고, 투표한 사람의 이름 변경은 바로 저장', async ({ page, context }) => {
    const id = `${PREFIX}vote2`
    const seed = await seedMeeting({ id, votes: [['영희', [0]], ['민수', [1]]] })
    await context.addCookies([voterCookie(seed.voterToken(0))])
    await page.goto(`/m/${id}`)
    await page.getByRole('button', { name: '그대로 둘게요' }).click()

    await page.getByRole('button', { name: '이름 변경' }).click()
    await page.getByRole('textbox', { name: '이름' }).fill('민수')
    await page.getByRole('button', { name: '확인' }).click()
    await expect(page.getByText('이미 사용 중인 이름이에요')).toBeVisible()

    await page.getByRole('textbox', { name: '이름' }).fill('영희2')
    await page.getByRole('button', { name: '확인' }).click()
    await expect(page.getByText('이름을 바꿨어요')).toBeVisible()

    await page.reload()
    await expect(page.getByText('영희2님으로 투표해요')).toBeVisible()
  })

  test('투표자 시트에 날짜별 투표자 이름', async ({ page }) => {
    const id = `${PREFIX}vote3`
    await seedMeeting({ id, votes: [['영희', [0, 1]], ['민수', [1]], ['지은', [1]]] })
    await page.goto(`/m/${id}`)

    await page.getByRole('button', { name: /1월 10일.*투표자 3명 보기/ }).click()
    const sheet = page.getByRole('dialog')
    for (const name of ['영희', '민수', '지은']) await expect(sheet.getByText(name)).toBeVisible()
  })

  test('익명 모임은 이름을 묻지 않고 투표자도 보여주지 않음', async ({ page }) => {
    const id = `${PREFIX}vote4`
    await seedMeeting({ id, anonymous: true, votes: [['', [0]]] })
    await page.goto(`/m/${id}`)

    await expect(page.getByRole('button', { name: /투표자/ })).toHaveCount(0)
    await page.getByRole('checkbox', { name: /1월 10일/ }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('button', { name: '1개 날짜로 투표하기' }).click()
    await expect(page.getByRole('dialog', { name: '투표했어요' })).toBeVisible()
  })

  test('마감 + 단독 최다 득표면 자동 확정 안내', async ({ page }) => {
    const id = `${PREFIX}vote5`
    await seedMeeting({ id, closed: true, votes: [['영희', [0, 1]], ['민수', [1]]] })
    await page.goto(`/m/${id}`)

    const notice = page.getByRole('dialog')
    await expect(notice.getByText('최종 날짜가 정해졌어요')).toBeVisible()
    await expect(notice.getByText('1월 10일 일요일')).toBeVisible()
    await expect(notice.getByText(/^D-\d+$/)).toBeVisible()

    // 확정 안내는 닫을 수 있고, 닫아도 속성 목록에 확정 날짜가 남음
    await notice.getByRole('button', { name: '확인' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByText('1월 10일 일요일')).toBeVisible()
  })

  test('마감 + 동점이면 확정 대기 안내', async ({ page }) => {
    const id = `${PREFIX}vote6`
    await seedMeeting({ id, closed: true, votes: [['영희', [0]], ['민수', [1]]] })
    await page.goto(`/m/${id}`)
    await expect(page.getByRole('dialog').getByText('날짜 확정을 기다리고 있어요.')).toBeVisible()
    // 확정 전 마감 안내는 닫을 수 없음
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog').getByRole('button', { name: '닫기' })).toHaveCount(0)
  })

  test('다시 들어와 투표 취소 후 다시 투표하면 성공 모달만', async ({ page }) => {
    const id = `${PREFIX}vote9`
    await seedMeeting({ id, anonymous: true })
    await page.goto(`/m/${id}`)
    await page.getByRole('checkbox').first().click()
    await page.getByRole('button', { name: /투표하기/ }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    // 재방문: 이미 투표했어요 안내를 닫고 취소
    await page.reload()
    await page.getByRole('button', { name: '그대로 둘게요' }).click()
    await page.getByRole('button', { name: '투표 취소' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: '투표 취소' }).click()
    await expect(page.getByRole('button', { name: '날짜를 골라 주세요' })).toBeVisible()

    await page.getByRole('checkbox').first().click()
    await page.getByRole('button', { name: /투표하기/ }).click()
    await expect(page.getByRole('dialog')).toContainText('투표했어요')
    // 투표 후 서버 갱신(revalidate)이 도착한 뒤에도 안내가 새로 뜨지 않아야 함
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await expect(page.getByRole('dialog')).toHaveCount(1)
    await expect(page.getByText(/이미 투표했어요/)).toHaveCount(0)
  })

  test('공유 미리보기 메타데이터는 모임 정보', async ({ request }) => {
    const id = `${PREFIX}vote7`
    await seedMeeting({ id, title: '[E2E] 공유 모임' })
    const html = await (await request.get(`/m/${id}`, { headers: { 'user-agent': 'kakaotalk-scrap/1.0' } })).text()
    const head = html.slice(0, html.indexOf('</head>'))
    expect(head).toContain('<meta property="og:title" content="[E2E] 공유 모임"/>')
    expect(head).toMatch(/og:description" content="모임장님의 모임 · 강남역 · .+ 마감"/)
    expect(head).toContain('og:image')
  })

  test('모임 설명이 있으면 공유 미리보기 설명은 모임 설명', async ({ request }) => {
    const id = `${PREFIX}vote8`
    await seedMeeting({ id, description: '집들이에 초대합니다\n\n편하게 오세요' })
    const html = await (await request.get(`/m/${id}`, { headers: { 'user-agent': 'kakaotalk-scrap/1.0' } })).text()
    const head = html.slice(0, html.indexOf('</head>'))
    expect(head).toContain('<meta property="og:description" content="집들이에 초대합니다 편하게 오세요"/>')
    expect(head).toContain('<meta name="twitter:description" content="집들이에 초대합니다 편하게 오세요"/>')
  })

  // 스트리밍 중(Suspense 안) notFound라 상태 코드는 200, 대신 not-found 화면 + noindex
  test('없는 모임은 not-found 화면', async ({ page }) => {
    await page.goto(`/m/${PREFIX}nope`)
    await expect(page.getByText('모임을 찾을 수 없어요')).toBeVisible()
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached()
  })
})
