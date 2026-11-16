/** 운영자가 넣은 지도 링크, 없으면 장소명으로 각 지도 검색 (링크는 둘 다 있거나 둘 다 없음) */
export const mapHrefs = (location: string, naverMapUrl: string | null, kakaoMapUrl: string | null) => ({
  naver: naverMapUrl ?? `https://map.naver.com/p/search/${encodeURIComponent(location)}`,
  kakao: kakaoMapUrl ?? `https://map.kakao.com/?q=${encodeURIComponent(location)}`,
})
