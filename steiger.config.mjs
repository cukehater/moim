import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      // 슬라이스 구성은 PRD 5장이 정의. views는 루트 app/에서만 참조돼 오탐
      'fsd/insignificant-slice': 'off',
    },
  },
])
