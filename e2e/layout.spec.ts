import { expect, type Page, test } from '@playwright/test'
import { adminSessionCookie, PREFIX, seedMeeting } from './db'

// 글자 크기·고정 폭 요소가 바뀌어도 화면이 깨지지 않는지: 모든 화면·모달에서 말줄임·잘림·화면 밖 넘침 검사
// 390 이하는 rem이 비례 축소되지만 44px 최소 터치 타깃은 안 줄어 좁은 폭일수록 빠듯함
const WIDTHS = [320, 360, 390, 500]
const HOUR = 3_600_000

// 가장 긴 날짜 표기(12월 30일), 아바타가 꽉 차는 득표, 긴 이름
const BUSY = {
  dates: ['2027-11-20', '2027-11-21', '2027-12-25', '2027-12-30'],
  votes: [
    ['가나다라마바사아', [0, 1, 3]],
    ['라마', [0, 3]],
    ['바사아자', [0, 2, 3]],
    ['차카', [0, 3]],
    ['타파하', [1]],
  ] as [string, number[]][],
  description: '집들이에 초대합니다\n편하게 오세요',
}
// 줄바꿈되는 긴 제목 (말줄임 아닌 줄바꿈이 의도)
const LONG_TITLE = '[E2E] 2027년 연말 고등학교 동창 송년회 겸 집들이 모임'

/** 잘린 텍스트(말줄임·line-clamp·overflow 잘림)와 화면 밖으로 나간 요소를 찾아 사람이 읽을 수 있게 반환 */
async function findBreaks(page: Page) {
  // 등장 모션 중엔 위치·크기가 달라 오탐: 끝나는 모션만 기다림 (무한 반복 제외)
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    ),
  )
  return page.evaluate((allowed) => {
    const breaks: string[] = []
    const doc = document.documentElement
    const vw = doc.clientWidth
    if (doc.scrollWidth > vw) breaks.push(`가로 스크롤 ${doc.scrollWidth} > ${vw}`)
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      if (!el.checkVisibility({ visibilityProperty: true, opacityProperty: true })) continue
      // sr-only(1px 잘라 숨김)는 화면에 안 보임
      if (el.getBoundingClientRect().width <= 1) continue
      const s = getComputedStyle(el)
      const label = `<${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : ''}> "${el.textContent?.trim().slice(0, 30)}"`
      const clipsX = ['hidden', 'clip'].includes(s.overflowX)
      // 운영자가 입력한 긴 제목의 말줄임은 의도
      const allowedCut = !!el.textContent?.trim().startsWith(allowed)
      if (s.textOverflow === 'ellipsis') {
        if (el.scrollWidth > el.clientWidth && !allowedCut) breaks.push(`말줄임 ${label}`)
      } else if (clipsX && el.scrollWidth > el.clientWidth + 1 && el.textContent?.trim()) breaks.push(`가로 잘림 ${label}`)
      // 글자가 안쪽 여백까지 먹음 (nowrap 알약 뱃지는 둥근 끝 밖으로 삐져나와 보임): 자기 글자를 가진 블록 요소만
      const text = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
      // 말줄임 요소는 위에서 따로 검사
      if (text.length && s.display !== 'inline' && s.textOverflow !== 'ellipsis') {
        const range = document.createRange()
        range.setStartBefore(text[0])
        range.setEndAfter(text.at(-1)!)
        const inner = el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)
        if (range.getBoundingClientRect().width > inner + 0.5) breaks.push(`여백 침범 ${label}`)
      }
      if (s.webkitLineClamp !== 'none' && el.scrollHeight > el.clientHeight) breaks.push(`줄 잘림 ${label}`)
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0 && (r.left < -1 || r.right > vw + 1) && el.closest('[aria-hidden="true"]') === null)
        breaks.push(`화면 밖 ${label} (${Math.round(r.left)}~${Math.round(r.right)})`)
    }
    return breaks
  }, LONG_TITLE)
}

const expectIntact = async (page: Page, where: string) => expect(await findBreaks(page), where).toEqual([])

/** 모달을 열고(이미 떠 있으면 그대로) 깨짐 검사 후 Esc로 닫음 */
async function checkModal(page: Page, name: string | RegExp, open?: () => Promise<void>) {
  await open?.()
  const dialog = page.getByRole('dialog', { name }).or(page.getByRole('alertdialog', { name }))
  await expect(dialog).toBeVisible()
  await expectIntact(page, `모달: ${name}`)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
}

for (const width of WIDTHS) {
  test.describe(`레이아웃 ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } })
    // 개발 모드 전용 Next.js 도구 버튼이 좁은 폭에서 하단 버튼을 가림
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() =>
        document.addEventListener('DOMContentLoaded', () => {
          const style = document.createElement('style')
          style.textContent = 'nextjs-portal { display: none !important; }'
          document.head.append(style)
        }),
      )
    })
    const key = (name: string) => `${PREFIX}layout-${name}-${width}`

    test('로그인·없는 모임', async ({ page }) => {
      await page.goto('/login')
      await expect(page.getByRole('button', { name: 'Google로 계속하기' })).toBeVisible()
      await expectIntact(page, '로그인')
      await page.goto('/login?error=AccessDenied')
      await expect(page.getByRole('alert').filter({ hasText: '운영자' })).toBeVisible()
      await expectIntact(page, '로그인 거부')
      await page.goto('/m/none-such-meeting')
      await expect(page.getByText(/찾을 수 없|없는/).first()).toBeVisible()
      await expectIntact(page, '없는 모임')
    })

    test('투표 페이지: 상태별', async ({ page }) => {
      const now = Date.now()
      const cases: [string, Parameters<typeof seedMeeting>[0], string | RegExp][] = [
        ['진행 중 기명 복수', { id: key('open'), title: LONG_TITLE, ...BUSY }, '언제 시간 되세요?'],
        ['진행 중 익명', { id: key('anon'), anonymous: true, ...BUSY }, '언제 시간 되세요?'],
        ['진행 중 한 날짜', { id: key('single'), multiple: false, ...BUSY, votes: BUSY.votes.map(([n, p]) => [n, [p[0]]]) }, '한 날짜만 선택'],
        ['투표 없음', { id: key('empty'), dates: BUSY.dates }, '아직 아무도 투표하지 않았어요'],
        ['시작 전', { id: key('sched'), startsAt: new Date(now + HOUR), endsAt: new Date(now + 48 * HOUR), dates: BUSY.dates }, '아직 투표 전이에요'],
        ['마감 미확정', { id: key('closed'), closed: true, ...BUSY }, '투표가 마감됐어요'],
        ['마감 확정', { id: key('conf'), closed: true, confirmed: 3, ...BUSY }, '최종 날짜가 정해졌어요'],
      ]
      for (const [name, seed, marker] of cases) {
        await seedMeeting(seed)
        await page.goto(`/m/${seed.id}`)
        await expect(page.getByText(marker).first()).toBeVisible()
        await expectIntact(page, name)
      }
      // 확정 안내를 닫은 뒤 페이지 (확정 속성 줄)
      await page.getByRole('button', { name: /닫기|확인/ }).first().click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expectIntact(page, '마감 확정: 안내 닫은 뒤')
    })

    test('투표 페이지 모달', async ({ page, context }) => {
      const id = key('modal')
      const { voterToken } = await seedMeeting({ id, ...BUSY })

      // 처음 온 사람: 이름 입력 → 투표 완료
      await page.goto(`/m/${id}`)
      const dates = page.getByRole('group', { name: /참석 가능한 날짜/ }).getByRole('checkbox')
      await checkModal(page, '이름을 알려주세요', () => dates.first().click())
      await dates.first().click()
      await page.getByRole('textbox', { name: '이름' }).fill('가나다라마바사아자')
      await page.getByRole('button', { name: '확인' }).click()
      await expectIntact(page, '이름 입력 후 (이름 변경 줄)')
      await page.getByRole('switch', { name: '모든 날짜 참석 가능해요' }).click()
      await expectIntact(page, '전체 선택 후 (하단 버튼 문구)')
      await page.getByRole('button', { name: /투표하기/ }).click()
      await checkModal(page, '투표했어요')
      await expectIntact(page, '투표 후 (취소·수정 하단 바)')
      await checkModal(page, '어떤 앱으로 장소를 볼까요?', () => page.getByRole('button', { name: '강남역' }).click())
      await checkModal(page, /· \d+명/, () => page.getByRole('button', { name: /투표자 \d+명 보기/ }).first().click())
      await checkModal(page, '투표를 취소할까요?', () => page.getByRole('button', { name: '투표 취소' }).click())

      // 이미 투표한 사람이 다시 옴
      await context.addCookies([{ name: 'voterToken', value: voterToken(0), domain: 'localhost', path: '/' }])
      await page.goto(`/m/${id}`)
      await checkModal(page, '가나다라마바사아님은 이미 투표했어요')
    })

    test.describe('운영자', () => {
      test.beforeEach(async ({ context }) => {
        await context.addCookies([await adminSessionCookie()])
      })

      test('대시보드 목록·필터', async ({ page }) => {
        const now = Date.now()
        await seedMeeting({ id: key('dash-open'), title: LONG_TITLE, ...BUSY })
        await seedMeeting({ id: key('dash-sched'), startsAt: new Date(now + HOUR), endsAt: new Date(now + 48 * HOUR) })
        await seedMeeting({ id: key('dash-closed'), closed: true, ...BUSY })
        await seedMeeting({ id: key('dash-conf'), closed: true, confirmed: 0, ...BUSY })
        await page.goto('/dashboard')
        await expect(page.getByRole('link', { name: /\[E2E\]/ }).first()).toBeVisible()
        await expectIntact(page, '대시보드 전체')
        for (const status of ['open', 'scheduled', 'closed']) {
          await page.goto(`/dashboard?status=${status}`)
          await expect(page.getByRole('link', { name: /\[E2E\]/ }).first()).toBeVisible()
          await expectIntact(page, `대시보드 필터 ${status}`)
        }
      })

      test('모임 상세: 상태별', async ({ page }) => {
        const now = Date.now()
        const cases: [string, Parameters<typeof seedMeeting>[0]][] = [
          ['진행 중', { id: key('d-open'), title: LONG_TITLE, ...BUSY }],
          ['익명', { id: key('d-anon'), anonymous: true, ...BUSY }],
          ['시작 전', { id: key('d-sched'), startsAt: new Date(now + HOUR), endsAt: new Date(now + 48 * HOUR), dates: BUSY.dates }],
          ['마감 미확정', { id: key('d-closed'), closed: true, ...BUSY }],
          ['마감 확정', { id: key('d-conf'), closed: true, confirmed: 3, ...BUSY }],
          ['투표 없음', { id: key('d-empty'), dates: BUSY.dates }],
        ]
        for (const [name, seed] of cases) {
          await seedMeeting(seed)
          await page.goto(`/dashboard/${seed.id}`)
          await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible()
          await expectIntact(page, `상세 ${name}`)
        }
      })

      test('모임 만들기·수정 폼', async ({ page }) => {
        await page.goto('/dashboard/new')
        await expect(page.getByLabel('여러 날짜 선택')).toBeVisible()
        await expectIntact(page, '만들기 폼')
        // 빈 폼 제출: 오류 문구가 붙은 상태
        await page.getByRole('button', { name: '모임 만들기' }).click()
        await expectIntact(page, '만들기 폼 오류')

        const id = key('edit')
        await seedMeeting({ id, title: LONG_TITLE, ...BUSY })
        await page.goto(`/dashboard/${id}/edit`)
        await expect(page.getByLabel('여러 날짜 선택')).toBeVisible()
        await expectIntact(page, '수정 폼')
      })

      test('운영자 모달', async ({ page }) => {
        const id = key('amodal')
        await seedMeeting({ id, closed: true, ...BUSY })
        await page.goto(`/dashboard/${id}`)
        await checkModal(page, /· \d+명/, () => page.getByRole('button', { name: /투표자 \d+명 보기/ }).first().click())
        // 투표 삭제는 투표자 시트 안에서
        await page.getByRole('button', { name: /투표자 \d+명 보기/ }).first().click()
        await page.getByRole('button', { name: '가나다라마바사아 투표 삭제' }).click()
        const remove = page.getByRole('alertdialog', { name: '가나다라마바사아님의 투표를 지울까요?' })
        await expect(remove).toBeVisible()
        await expectIntact(page, '모달: 투표 삭제')
        await page.keyboard.press('Escape')
        await expect(remove).toBeHidden()
        await page.keyboard.press('Escape')
        await expect(page.getByRole('dialog')).toHaveCount(0)
        await checkModal(page, '모임을 삭제할까요?', () => page.getByRole('button', { name: '모임 삭제' }).click())

        // 마감 시각이 지난 모임을 재개하면 새 마감 시각을 묻는 모달
        const past = key('reopen')
        await seedMeeting({ id: past, closed: true, endsAt: new Date(Date.now() - 60_000), startsAt: new Date(Date.now() - 48 * HOUR) })
        await page.goto(`/dashboard/${past}`)
        await checkModal(page, '투표 재개', () => page.getByRole('button', { name: '투표 재개' }).click())

        // 투표가 있는 모임을 익명으로 바꾸면 경고 모달
        await page.goto(`/dashboard/${id}/edit`)
        await page.locator('#isAnonymous').click()
        await checkModal(page, '이미 투표가 있어요', () => page.getByRole('button', { name: '수정하기' }).click())
      })
    })
  })
}
