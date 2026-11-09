# MOIM

지인 모임 날짜 투표. 기능 명세는 `docs/PRD.md`, 제품 맥락은 `PRODUCT.md`.

## 시작

```bash
pnpm install
cp .env.example .env.local   # 값 채우기
pnpm db:generate && pnpm db:migrate
pnpm dev
```

- Google OAuth 리디렉션 URI: `{origin}/api/auth/callback/google`
- Cloudinary: signed 업로드 (서명은 서버 액션 `signUploadParams`)

## 검사

```bash
pnpm typecheck && pnpm lint && pnpm lint:fsd && pnpm test && pnpm build
```

## 구조 메모

- 서버 전용 조회는 `entities/*/index.server.ts`로 노출 (클라이언트 번들 분리, steiger 공개 API 규칙 준수).
- Auth.js 설정은 `src/shared/auth` (features의 `requireAdmin()`이 import해야 하므로 FSD 규칙상 app 레이어에 둘 수 없음).
- 썸네일은 CldImage 대신 Cloudinary URL + srcset을 서버에서 생성 (투표 페이지 JS 예산).
- 폰트: Pretendard Variable을 KS X 1001 한글 2,350자 + ASCII로 서브셋한 `src/app/fonts/PretendardVariable.subset.woff2`.
