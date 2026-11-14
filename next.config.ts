import type { NextConfig } from "next";
import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // 카카오톡·네이버 미리보기 크롤러는 JS를 실행하지 않아 메타데이터를 <head>에 바로 받아야 함 (기본 목록에 없음)
  htmlLimitedBots: new RegExp(`${HTML_LIMITED_BOT_UA_RE.source}|kakaotalk-scrap|Daum`, "i"),
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
